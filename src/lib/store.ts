export type ConversationMode = "agent" | "human";
export type SenderType = "customer" | "ai" | "owner";

export type Conversation = {
  id: string;
  phone: string;
  name: string | null;
  mode: ConversationMode;
  updated_at: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  sender_type: SenderType;
  content: string;
  whatsapp_msg_id: string | null;
  read_at: string | null;
  created_at: string;
};

type Store = {
  conversations: Map<string, Conversation>;
  conversationsByPhone: Map<string, string>;
  messages: Map<string, Message>;
};

declare global {
  // Keep data available across Next.js route module reloads in development.
  var whatsappStore: Store | undefined;
}

const store: Store =
  globalThis.whatsappStore ??
  (globalThis.whatsappStore = {
    conversations: new Map(),
    conversationsByPhone: new Map(),
    messages: new Map(),
  });

export function findConversationByPhone(phone: string) {
  const id = store.conversationsByPhone.get(phone);
  return id ? store.conversations.get(id) ?? null : null;
}

export function getConversation(id: string) {
  return store.conversations.get(id) ?? null;
}

export function createConversation(phone: string, name: string | null) {
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    phone,
    name,
    mode: "agent",
    updated_at: now,
    created_at: now,
  };

  store.conversations.set(conversation.id, conversation);
  store.conversationsByPhone.set(phone, conversation.id);
  return conversation;
}

export function updateConversation(
  id: string,
  updates: Partial<Pick<Conversation, "name" | "mode" | "updated_at">>
) {
  const conversation = getConversation(id);
  if (!conversation) return null;

  Object.assign(conversation, updates);
  return conversation;
}

export function findMessageByWhatsAppId(whatsappMsgId: string) {
  for (const message of Array.from(store.messages.values())) {
    if (message.whatsapp_msg_id === whatsappMsgId) return message;
  }
  return null;
}

export function addMessage(input: {
  conversation_id: string;
  role: Message["role"];
  sender_type: SenderType;
  content: string;
  whatsapp_msg_id?: string | null;
}) {
  const message: Message = {
    id: crypto.randomUUID(),
    conversation_id: input.conversation_id,
    role: input.role,
    sender_type: input.sender_type,
    content: input.content,
    whatsapp_msg_id: input.whatsapp_msg_id ?? null,
    read_at: null,
    created_at: new Date().toISOString(),
  };

  store.messages.set(message.id, message);
  updateConversation(message.conversation_id, { updated_at: message.created_at });
  return message;
}

export function getMessages(conversationId: string, markCustomerMessagesRead = false) {
  const messages = Array.from(store.messages.values())
    .filter((message) => message.conversation_id === conversationId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  if (markCustomerMessagesRead) {
    const readAt = new Date().toISOString();
    messages.forEach((message) => {
      if (message.sender_type === "customer" && !message.read_at) {
        message.read_at = readAt;
      }
    });
  }

  return messages;
}

export function listConversations() {
  return Array.from(store.conversations.values())
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((conversation) => {
      const messages = getMessages(conversation.id);
      const lastMessage = messages[messages.length - 1] ?? null;

      return {
        ...conversation,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              role: lastMessage.role,
              sender_type: lastMessage.sender_type,
            }
          : null,
        unreadCount: messages.filter(
          (message) => message.sender_type === "customer" && !message.read_at
        ).length,
        messageCount: messages.length,
      };
    });
}
