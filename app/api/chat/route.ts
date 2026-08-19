import { streamText } from "ai";
import { AI_MODEL, SYSTEM_PROMPT } from "@/lib/ai-config";

// Helper: uploaded image ko base64 data URI mein convert karta hai
async function fileToBase64DataUri(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  return `data:${mimeType};base64,${base64}`;
}

export async function POST(request: Request) {
  try {
    // Frontend FormData bhejta hai, JSON nahi
    const formData = await request.formData();

    const messagesRaw = formData.get("messages");
    const file = formData.get("file") as File | null;

    if (typeof messagesRaw !== "string") {
      return new Response("Invalid messages", { status: 400 });
    }

    const messages = JSON.parse(messagesRaw);

    if (!Array.isArray(messages)) {
      return new Response("Invalid messages", { status: 400 });
    }

    const isImage = file && file.type.startsWith("image/");

    const finalMessages = [...messages];

    // Agar image upload hui hai, use last user message ke saath attach karo
    if (isImage) {
      const base64Image = await fileToBase64DataUri(file);

      const lastMessage = finalMessages[finalMessages.length - 1];

      finalMessages[finalMessages.length - 1] = {
        role: "user",
        content: [
          {
            type: "text",
            text: lastMessage?.content || "Please analyze this image.",
          },
          {
            type: "image",
            image: base64Image,
            mediaType: file.type || "image/jpeg",
          },
        ],
      };
    }

    // Claude model
    const result = streamText({
      model: AI_MODEL,
      system: SYSTEM_PROMPT,
      messages: finalMessages,
    });

    // AI SDK ka built-in streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("VERA AI Error:", error);

    return new Response(
      JSON.stringify({
        error: "Something went wrong with VERA.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}