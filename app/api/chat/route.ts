import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    system: `You are a professional interviewer named Sarah. 
    You are conducting a job interview.
    - Be professional, polite, and welcoming.
    - Ask one question at a time.
    - Keep your responses concise (spoken conversation style).
    - If the user asks you a question, answer it clearly and concisely, then gently steer back to the interview.
    - If the user has finished their answer, acknowledge it and move to the next relevant topic or question.
    - Do not use markdown formatting like bold or lists, as this text will be spoken aloud.`,
    messages,
  });

  return result.toDataStreamResponse();
}
