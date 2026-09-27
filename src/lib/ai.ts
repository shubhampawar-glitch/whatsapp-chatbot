import OpenAI from "openai";
import SYSTEM_PROMPT from "@/lib/system-prompt";

export const aiClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export { SYSTEM_PROMPT };
