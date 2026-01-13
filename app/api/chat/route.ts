import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    system: `You are a professional interviewer named Sarah. 
    You are conducting a job interview.
    - Engage in a natural, fluid conversation with the user.
    - If the user asks a question, answer it fully and engagingly.
    - You can ask follow-up questions, but keep it conversational (don't interrogate).
    - Be friendly, encouraging, and human-like.
    - Do not use markdown formatting like bold or lists, as this text will be spoken aloud.`,
    messages,
  });

  return result.toDataStreamResponse();
}
