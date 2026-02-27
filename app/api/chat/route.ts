import { NextResponse } from 'next/server';
import Chat from "@/Actions/openai";
import { getQdrantSearchStore, getQdrantVectorStore } from "@/lib/qdrant";

export async function GET() {
    const response = await getQdrantVectorStore(
        "C:\\Users\\fool\\Desktop\\lillith\\Islamic_Books\\Tafseer\\al qurtubi\\Tafsir al-Qurtubi Vol. 4.pdf",
        {
            title: "Tafsir al-Qurtubi vol 4",
            author: "al-Qurtubi",
            category: "Tafseer",
            collection: "Tafseer",
            authanticity: "Authentic",
        }
    );
    console.log(response);
    // const response = await getQdrantSearchStore("Tafseer", "Tafsīr al-Qurṭubī")
    // console.log(response);
    return  NextResponse.json({ message: "Reload to ingest data into qdrant, then check console for results" });
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