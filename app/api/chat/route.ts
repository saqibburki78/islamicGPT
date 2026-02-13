import { NextResponse } from 'next/server';
import Chat from "@/Actions/openai";
import { getQdrantVectorStore } from "@/lib/qdrant";
export async function GET() {
    // We cannot return the vectorStore object directly as it is not serializable
    const vectorStore = await getQdrantVectorStore();
    console.log("Vector Store:", vectorStore);
    return NextResponse.json({ status: "Qdrant Vector Store is ready" });
}
export async function POST(request: Request) {
    try {
        const { messages } = await request.json();
        const coreMessages = messages.map((m: any) => ({
            role: m.role,
            content: m.content || m.parts.map((p: any) => p.text).join('')
        }));
        const result = await Chat(coreMessages, "gemini-2.5-flash");
        console.log("API Result:", result);
        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process request" },
        );
    }
}