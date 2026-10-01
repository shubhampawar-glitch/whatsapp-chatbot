import { NextResponse } from "next/server";
import { getConversation, getMessages, updateConversation } from "@/lib/store";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!getConversation(params.id)) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    return NextResponse.json(getMessages(params.id, true));
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

    const data = updateConversation(params.id, {
      mode,
      updated_at: new Date().toISOString(),
    });

    return data
      ? NextResponse.json(data)
      : new NextResponse("Conversation not found", { status: 404 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
