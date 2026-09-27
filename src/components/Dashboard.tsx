"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type Conversation = {
  id: string;
  phone: string;
  name: string;
  mode: "agent" | "human";
  updated_at: string;
  lastMessage?: { content: string; created_at: string; role: string };
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to conversations changes
    const channel = supabase
      .channel("public:conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);

      // Subscribe to messages changes
      const channel = supabase
        .channel(`public:messages:conversation_id=eq.${selectedConvId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConvId}` }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          fetchConversations(); // Update last message
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setMessages([]);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConversations(data);
  };

  const fetchMessages = async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    setMessages(data);
  };

  const toggleMode = async () => {
    if (!selectedConv) return;
    const newMode = selectedConv.mode === "agent" ? "human" : "agent";
    
    // Optimistic update
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, mode: newMode } : c));
    
    await fetch(`/api/conversations/${selectedConv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConvId) return;

    const messageText = input.trim();
    setInput("");

    // Optimistic UI for message
    const tempId = Math.random().toString();
    setMessages((prev) => [...prev, { id: tempId, role: "assistant", content: messageText, created_at: new Date().toISOString() }]);

    await fetch(`/api/conversations/${selectedConvId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: messageText }),
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">WhatsApp Agent</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConvId === conv.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-900">{conv.name || conv.phone}</span>
                <span className="text-xs text-gray-500">
                  {conv.lastMessage?.created_at
                    ? new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate mr-2">
                  {conv.lastMessage?.content || "No messages yet"}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    conv.mode === "agent" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {conv.mode}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">{selectedConv.name} ({selectedConv.phone})</h2>
              <button
                onClick={toggleMode}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedConv.mode === "agent"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                Mode: {selectedConv.mode === "agent" ? "AI Agent" : "Human"}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isUser ? "bg-white text-gray-800 shadow-sm border border-gray-100" : "bg-blue-500 text-white shadow-sm"
                      }`}
                    >
                      <div className="text-[15px]">{msg.content}</div>
                      <div className={`text-[11px] mt-1 text-right ${isUser ? "text-gray-400" : "text-blue-100"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
