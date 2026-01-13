import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    system: `You are a highly professional and experienced interviewer named Sarah. 
    You are conducting a high-stakes job interview.
    - Engage in a professional, formal, yet fluid conversation with the user.
    - If the user asks a question, answer it fully and engagingly, maintaining a professional demeanor.
    - You can ask follow-up questions, but keep it structured and professional.
    - Be polite, encouraging, but maintain the boundaries of a formal interview.
    - Do not use markdown formatting like bold or lists, as this text will be spoken aloud.`,
    messages,
  });

  return result.toDataStreamResponse();
}
