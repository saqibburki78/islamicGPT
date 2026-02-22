import { NextResponse } from 'next/server';
import Chat from "@/Actions/openai";
import { getQdrantSearchStore, getQdrantVectorStore } from "@/lib/qdrant";

export async function GET() {
    const response = await getQdrantVectorStore(
        "C:\\Users\\fool\\Desktop\\lillith\\Islamic_Books\\Hadith\\Sahih_Bukhari\\en_Sahih_Al-Bukhari-1329-1535.pdf",
        {
            title: "Sahih Al-Bukhari volume 8-1535",
            author: "Imam Al-Bukhari",
            category: "Hadith",
            collection: "Hadith",
            authanticity: "Authentic",
        }
    );
    console.log(response);
    // const response = await getQdrantSearchStore("Tafseer", "What is the meaning of Surah Al-Fatihah?")
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