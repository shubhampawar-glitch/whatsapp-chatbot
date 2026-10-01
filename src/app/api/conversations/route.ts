import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: conversations, error } = await supabaseAdmin
      .from("conversations")
      .select(`
        *,
        messages (
          content,
          created_at,
          role,
          sender_type,
          read_at
        )
      `)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      return new NextResponse("Database error", { status: 500 });
    }

    // Process to just include the last message for the list
    const processed = conversations.map((conv: any) => {
      const sortedMessages = conv.messages?.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        ...conv,
        lastMessage: sortedMessages?.[0] || null,
        unreadCount: sortedMessages?.filter(
          (message: any) => message.sender_type === "customer" && !message.read_at
        ).length || 0,
        messageCount: sortedMessages?.length || 0,
        messages: undefined, // remove full history
      };
    });

    return NextResponse.json(processed);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
