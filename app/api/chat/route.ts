import { NextResponse } from 'next/server';
import Chat from "@/Actions/openai";
import { getQdrantVectorStore } from "@/lib/qdrant";

export async function GET() {
    const response = await getQdrantVectorStore(
        "C:/Users/fool/Desktop/lillith/Islamic_Books/Hadith/sunan abu dawud/Sunan Abu Dawud Vol. 5 - 4351-5274.pdf",
        {
            title: "Sunan Abu Dawud Vol. 5",
            author: "Imam Abu Dawud",
            category: "Hadith",
            collection: "Books",
            authanticity: "Authentic",
        }
    );
    console.log(response);
    return NextResponse.json({ status: "Reload the page to ingest the next book. response: " });
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