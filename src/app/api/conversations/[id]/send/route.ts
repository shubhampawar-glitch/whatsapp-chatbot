import { NextResponse } from "next/server";
import { addMessage, getConversation } from "@/lib/store";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const conversation = getConversation(params.id);
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    // Send via Meta WhatsApp Cloud API
    const sentMessage = await sendWhatsAppMessage(conversation.phone, content);

    const message = addMessage({
      conversation_id: params.id,
      role: "assistant",
      sender_type: "owner",
      content,
      whatsapp_msg_id: sentMessage.id,
    });

    return NextResponse.json(message);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
