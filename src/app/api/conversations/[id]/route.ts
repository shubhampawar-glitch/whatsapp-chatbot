import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("conversation_id", params.id)
      .order("created_at", { ascending: true });

    if (error) {
      return new NextResponse("Database error", { status: 500 });
    }

    return NextResponse.json(messages);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { mode } = body;

    if (!["agent", "human"].includes(mode)) {
      return new NextResponse("Invalid mode", { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("conversations")
      .update({ mode })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return new NextResponse("Database error", { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
