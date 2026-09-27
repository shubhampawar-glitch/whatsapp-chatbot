import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
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

    // Get conversation phone number
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("phone")
      .eq("id", params.id)
      .single();

    if (convError || !conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    // Send via Meta WhatsApp Cloud API
    const sentMessage = await sendWhatsAppMessage(conversation.phone, content);

    // Save to DB
    const { data: message, error: msgError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: params.id,
        role: "assistant", // Agent or Human, it's from our side
        content,
        whatsapp_msg_id: sentMessage.id,
      })
      .select()
      .single();

    if (msgError) {
      return new NextResponse("Failed to save message", { status: 500 });
    }

    // Update conversation updated_at
    await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", params.id);

    return NextResponse.json(message);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
