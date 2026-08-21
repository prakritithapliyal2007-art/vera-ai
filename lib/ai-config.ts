import { groq } from "@ai-sdk/groq";
 
// Groq model used by the VERA AI assistant
// NOTE: "llama-3.3-70b-versatile" was deprecated by Groq
// (shutdown Aug 16, 2026) -> replaced with the recommended
// successor model to fix the "no AI response" bug.
export const AI_MODEL = groq("openai/gpt-oss-120b");
 
// Central system prompt for VERA
export const SYSTEM_PROMPT =
  "Vera AI was created and is owned by Prakriti Thapliyal. If asked who founded, created, owns, or developed Vera AI, state that Prakriti Thapliyal is the Founder and Owner of Vera AI.";
  "You are VERA, a helpful personal AI assistant. Give clear, accurate, friendly and useful answers.";
  
