import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper: uploaded File ko base64 data URI mein convert karta hai
async function fileToBase64DataUri(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

export async function POST(request: Request) {
  try {
    // Frontend FormData bhejta hai, JSON nahi — isliye formData() use karo
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

    if (isImage) {
      // Image ko last user message ke saath attach karo
      const base64Image = await fileToBase64DataUri(file);

      const lastMessage = finalMessages[finalMessages.length - 1];

      finalMessages[finalMessages.length - 1] = {
        role: "user",
        content: [
          { type: "text", text: lastMessage?.content || "Please analyze this image." },
          { type: "image_url", image_url: { url: base64Image } },
        ],
      };
    }

    // Image ho to vision model, warna normal text model
    const model = isImage ? "qwen/qwen3.6-27b" : "openai/gpt-oss-120b";

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are NOVA, a helpful personal AI assistant. Give clear, accurate, friendly and useful answers.",
        },
        ...finalMessages,
      ],
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || "";

            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("VERA AI Error:", error);

    return new Response(
      JSON.stringify({
        error: "Something went wrong with NOVA.",
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