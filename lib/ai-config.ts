import { anthropic } from "@ai-sdk/anthropic";

// Claude model used by the VERA AI assistant
export const AI_MODEL = anthropic("claude-sonnet-4-20250514");

// Central system prompt for VERA
export const SYSTEM_PROMPT =
  "You are VERA, a helpful personal AI assistant. Give clear, accurate, friendly and useful answers.";