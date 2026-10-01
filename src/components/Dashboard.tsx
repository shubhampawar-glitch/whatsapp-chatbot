"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type SenderType = "customer" | "ai" | "owner";
type Conversation = {
  id: string; phone: string; name: string | null; mode: "agent" | "human";
  updated_at: string; created_at: string; unreadCount: number; messageCount: number;
  lastMessage?: { content: string; created_at: string; role: string; sender_type?: SenderType } | null;
};
type Message = { id: string; role: "user" | "assistant"; sender_type?: SenderType; content: string; created_at: string };

const iconPaths: Record<string, string> = {
  search: "M21 21l-4.35-4.35m2.1-5.4a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z",
  send: "M22 2L11 13m11-11l-7 20-4-9-9-4 20-7z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.33 1.78.62 2.63a2 2 0 01-.45 2.11L8 9.73a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0122 16.92z",
  video: "M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z",
  chevron: "M6 9l6 6 6-6",
  spark: "M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3zm7 12l.6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15z",
  user: "M20 21a8 8 0 00-16 0m12-11a4 4 0 11-8 0 4 4 0 018 0z",
  inbox: "M4 4h16v16H4zM4 13h4l2 3h4l2-3h4",
  settings: "M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.7 1.7 0 00.34 1.88l.06.06-1.5 1.5-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.04 1.56V20h-2.1v-.4a1.7 1.7 0 00-1.04-1.56 1.7 1.7 0 00-1.88.34l-.06.06-1.5-1.5.06-.06A1.7 1.7 0 009.6 15a1.7 1.7 0 00-1.56-1.04H7.6v-2.1h.44A1.7 1.7 0 009.6 10.8a1.7 1.7 0 00-.34-1.88L9.2 8.86l1.5-1.5.06.06a1.7 1.7 0 001.88.34A1.7 1.7 0 0013.68 6.2V6h2.1v.2a1.7 1.7 0 001.04 1.56 1.7 1.7 0 001.88-.34l.06-.06 1.5 1.5-.06.06a1.7 1.7 0 00-.34 1.88 1.7 1.7 0 001.56 1.04h.2v2.1h-.2A1.7 1.7 0 0019.4 15z",
  help: "M9.1 9a3 3 0 115.5 1.6c-.9 1.1-2.6 1.4-2.6 3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  menu: "M4 6h16M4 12h16M4 18h16",
  check: "M5 12l4 4L19 6",
};
function Icon({ name }: { name: keyof typeof iconPaths }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="icon"><path d={iconPaths[name]} /></svg>;
}
function initials(name: string | null, phone: string) {
  return name ? name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : phone.slice(-2);
}
function time(value?: string) { return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; }
function date(value: string) { return new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); }
function Avatar({ conversation, large = false }: { conversation: Conversation; large?: boolean }) {
  return <div className={`avatar ${large ? "avatar-large" : ""}`}>{initials(conversation.name, conversation.phone)}{large && <span className="online-dot" />}</div>;
}

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConv = conversations.find((item) => item.id === selectedConvId) || null;
  const unreadTotal = conversations.reduce((total, item) => total + item.unreadCount, 0);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((item) => (!query || (item.name || "").toLowerCase().includes(query) || item.phone.includes(query)) && (filter === "all" || item.unreadCount > 0));
  }, [conversations, filter, search]);

  useEffect(() => {
    void fetchConversations();
    const interval = window.setInterval(() => void fetchConversations(), 3000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!selectedConvId) { setMessages([]); return; }
    void fetchMessages(selectedConvId);
    const interval = window.setInterval(() => void fetchMessages(selectedConvId), 3000);
    return () => window.clearInterval(interval);
  }, [selectedConvId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function fetchConversations() {
    try {
      const response = await fetch("/api/conversations");
      if (!response.ok) throw new Error("Unable to load conversations");
      setConversations(await response.json());
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }
  async function fetchMessages(id: string) {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) throw new Error("Unable to load messages");
      setMessages(await response.json());
      setConversations((current) => current.map((item) => item.id === id ? { ...item, unreadCount: 0 } : item));
    } catch (error) { console.error(error); }
  }
  async function toggleMode() {
    if (!selectedConv) return;
    const mode = selectedConv.mode === "agent" ? "human" : "agent";
    setConversations((current) => current.map((item) => item.id === selectedConv.id ? { ...item, mode } : item));
    const response = await fetch(`/api/conversations/${selectedConv.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
    if (!response.ok) void fetchConversations();
  }
  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || !selectedConvId || sending) return;
    const content = input.trim();
    setInput(""); setSending(true);
    const optimistic: Message = { id: `optimistic-${Date.now()}`, role: "assistant", sender_type: "owner", content, created_at: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]);
    try {
      const response = await fetch(`/api/conversations/${selectedConvId}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      if (!response.ok) throw new Error(await response.text());
      const saved = await response.json();
      setMessages((current) => current.map((message) => message.id === optimistic.id ? saved : message));
      void fetchConversations();
    } catch (error) { console.error(error); setMessages((current) => current.filter((message) => message.id !== optimistic.id)); setInput(content); }
    finally { setSending(false); }
  }

  return <div className="dashboard-shell">
    <aside className="app-nav">
      <div className="brand-mark">S</div>
      <nav className="nav-links" aria-label="Primary navigation">
        <button className="nav-link nav-link-active"><Icon name="inbox" /><span>Inbox</span>{unreadTotal > 0 && <b>{unreadTotal}</b>}</button>
        <button className="nav-link"><Icon name="user" /><span>Customers</span></button>
        <button className="nav-link"><Icon name="settings" /><span>Settings</span></button>
      </nav>
      <div className="nav-bottom"><button className="nav-link"><Icon name="help" /><span>Help center</span></button><div className="owner-chip"><div className="owner-avatar">AM</div><div><strong>Aria Morgan</strong><small>Law firm owner</small></div><Icon name="chevron" /></div></div>
    </aside>
    <main className="inbox-layout">
      <section className="conversation-panel">
        <header className="panel-header"><div><p className="eyebrow">LAW FIRM INBOX</p><h1>Conversations <span>{conversations.length}</span></h1></div><button className="icon-button mobile-menu"><Icon name="menu" /></button></header>
        <div className="search-wrap"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers..." aria-label="Search customers" /></div>
        <div className="filter-row"><button className={filter === "all" ? "filter-active" : ""} onClick={() => setFilter("all")}>All inbox <span>{conversations.length}</span></button><button className={filter === "unread" ? "filter-active" : ""} onClick={() => setFilter("unread")}>Unread <span>{unreadTotal}</span></button></div>
        <div className="conversation-list">{loading ? <div className="empty-state">Loading conversations...</div> : filtered.length === 0 ? <div className="empty-state"><div className="empty-icon"><Icon name="search" /></div><strong>No conversations found</strong><p>Try a different search or filter.</p></div> : filtered.map((conversation) => <button className={`conversation-row ${conversation.id === selectedConvId ? "conversation-selected" : ""}`} key={conversation.id} onClick={() => setSelectedConvId(conversation.id)}><Avatar conversation={conversation} /><div className="conversation-copy"><div className="conversation-name"><strong>{conversation.name || conversation.phone}</strong><time>{time(conversation.lastMessage?.created_at || conversation.updated_at)}</time></div><div className="conversation-preview"><span>{conversation.lastMessage?.content || "No messages yet"}</span>{conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}</div></div></button>)}</div>
      </section>
      <section className="chat-panel">{selectedConv ? <>
        <header className="chat-header"><div className="chat-contact"><Avatar conversation={selectedConv} large /><div><h2>{selectedConv.name || selectedConv.phone}</h2><p><span className="status-dot" /> Active on WhatsApp <em>·</em> {selectedConv.phone}</p></div></div><div className="chat-actions"><button className="icon-button"><Icon name="phone" /></button><button className="icon-button"><Icon name="video" /></button><button className="icon-button"><Icon name="more" /></button></div></header>
        <div className="mode-banner"><div><span className={`mode-indicator ${selectedConv.mode}`} />{selectedConv.mode === "agent" ? <><strong>AI assistant is active</strong><span> Replies are being generated automatically.</span></> : <><strong>Human mode is active</strong><span> You are replying manually.</span></>}</div><button onClick={toggleMode}>{selectedConv.mode === "agent" ? "Take over" : "Enable AI"} <Icon name="chevron" /></button></div>
        <div className="message-stream"><div className="date-divider"><span>Today</span></div>{messages.map((message) => { const sender = message.sender_type || (message.role === "user" ? "customer" : "ai"); const customer = sender === "customer"; return <div className={`message-line ${customer ? "incoming" : "outgoing"}`} key={message.id}><div className={`message-bubble ${sender}`}>{!customer && <div className="message-author">{sender === "ai" ? <><span className="ai-badge"><Icon name="spark" /></span> AI assistant</> : "You"} <span className="message-check"><Icon name="check" /></span></div>}<p>{message.content}</p><time>{time(message.created_at)}</time></div></div>; })}{messages.length === 0 && <div className="empty-chat">No messages in this conversation yet.</div>}<div ref={messagesEndRef} /></div>
        <div className="composer-wrap"><form className="composer" onSubmit={sendMessage}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Write a message..." aria-label="Write a message" /><button type="submit" disabled={!input.trim() || sending}><Icon name="send" /></button></form><p className="composer-note">Messages are sent securely through the WhatsApp Cloud API</p></div>
      </> : <div className="no-selection"><div className="welcome-mark"><Icon name="inbox" /></div><h2>Welcome to your inbox</h2><p>Select a conversation to view messages and reply to customers.</p></div>}</section>
      {selectedConv && <aside className="customer-panel"><div className="customer-heading"><h3>Customer details</h3><button className="icon-button"><Icon name="more" /></button></div><div className="customer-profile"><Avatar conversation={selectedConv} large /><h2>{selectedConv.name || "WhatsApp customer"}</h2><p>{selectedConv.phone}</p><span className="customer-tag">WhatsApp contact</span></div><div className="detail-section"><p className="detail-label">Contact information</p><div className="detail-row"><span>Phone number</span><strong>{selectedConv.phone}</strong></div><div className="detail-row"><span>Customer since</span><strong>{date(selectedConv.created_at)}</strong></div></div><div className="detail-section"><p className="detail-label">Conversation</p><div className="detail-row"><span>Total messages</span><strong>{selectedConv.messageCount}</strong></div><div className="detail-row"><span>Current mode</span><strong className="capitalize">{selectedConv.mode === "agent" ? "AI assistant" : "Human"}</strong></div></div><div className="profile-note"><Icon name="spark" /><p>AI replies use your law firm&apos;s configured services and tone of voice.</p></div></aside>}
    </main>
  </div>;
}
