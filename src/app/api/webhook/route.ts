import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { aiClient, SYSTEM_PROMPT } from "@/lib/ai";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function GET(request: Request) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!verifyToken) {
    return new NextResponse("Meta WhatsApp verify token is not configured", {
      status: 500,
    });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  let payload: any;

  try {
    payload = await request.json();
  } catch {
    return new NextResponse("Invalid webhook payload", { status: 400 });
  }

  try {
    const change = payload.entry?.[0]?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return new NextResponse("OK", { status: 200 });
    }

    if (
      message.type !== "text" ||
      !message.from ||
      !message.id ||
      !message.text?.body
    ) {
      return new NextResponse("OK", { status: 200 });
    }

    const phone = message.from;
    const text = message.text.body;
    const whatsappMsgId = message.id;
    const name = value.contacts?.[0]?.profile?.name || "Unknown";

    let { data: conversation } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("phone", phone)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabaseAdmin
        .from("conversations")
        .insert({ phone, name })
        .select()
        .single();
      conversation = newConv;
    } else if (conversation.name !== name) {
      await supabaseAdmin
        .from("conversations")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", conversation.id);
    }

    if (!conversation) {
      return new NextResponse("Failed to create conversation", { status: 500 });
    }

    const { data: existingMsg } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("whatsapp_msg_id", whatsappMsgId)
      .single();

    if (existingMsg) {
      return new NextResponse("OK", { status: 200 });
    }

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversation.id,
      role: "user",
      sender_type: "customer",
      content: text,
      whatsapp_msg_id: whatsappMsgId,
    });

    await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation.id);

    if (conversation.mode === "agent") {
      processAgentReply(conversation.id, phone).catch(console.error);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Error in webhook POST:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function processAgentReply(conversationId: string, phone: string) {
  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (!messages) return;

  const chatHistory = messages.map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.content,
  }));

  try {
    const aiResponse = await aiClient.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
      ],
    });

    const replyContent =
      aiResponse.choices[0]?.message?.content ||
      "Sorry, I couldn't process that.";
    const sentMessage = await sendWhatsAppMessage(phone, replyContent);

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      sender_type: "ai",
      content: replyContent,
      whatsapp_msg_id: sentMessage.id,
    });

    await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  } catch (error) {
    console.error("AI or WhatsApp sending error:", error);
  }
}
