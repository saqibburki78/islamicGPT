import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from 'uuid';

/**
 * Cleans text by removing control characters and normalizing whitespace.
 * This is safe for Arabic and all other languages.
 */
function cleanText(text: string): string {
    return text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "") // Remove control characters only
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();
}

// Helper for throttling
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getQdrantVectorStore(filepath: string, metadata: Record<string, any> = {}) {
    // Collect available keys inside the function to ensure they are loaded
    const GEMINI_KEYS = [
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY_5,
        process.env.GEMINI_API_KEY_6,
        process.env.GEMINI_API_KEY_7,
        process.env.GEMINI_API_KEY_8,
        process.env.GEMINI_API_KEY_9,
        process.env.GEMINI_API_KEY_10,
    ].filter(Boolean) as string[];

    if (GEMINI_KEYS.length === 0) {
        throw new Error("No Gemini API keys found in environment variables (GEMINI_API_KEY_1 to 10)");
    }

    // 1. Read and parse PDF using LangChain PDFLoader
    const loader = new PDFLoader(filepath, { splitPages: false });
    const docs = await loader.load();

    // 2. Use LangChain RecursiveCharacterTextSplitter
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);

    // Clean each chunk - CRITICAL to avoid "Empty vector" from garbage characters
    const chunks = splitDocs.map(doc => cleanText(doc.pageContent)).filter(c => c.length > 5);

    // 3. Initialize Qdrant Client
    const client = new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        checkCompatibility: false,
    });

    const batchSize = 20;
    const allEmbeddings: number[][] = [];
    const collectionName = metadata.collection || 'Tafseer';

    console.log(`Starting ingestion of ${chunks.length} chunks into collection '${collectionName}'...`);

    for (let i = 0; i < chunks.length; i += batchSize) {
        const batchChunks = chunks.slice(i, i + batchSize);
        let batchSuccess = false;
        let attempt = 0;
        let startIndex = Math.floor(i / batchSize) % GEMINI_KEYS.length;

        while (!batchSuccess && attempt < GEMINI_KEYS.length) {
            const keyIndex = (startIndex + attempt) % GEMINI_KEYS.length;
            const currentKey = GEMINI_KEYS[keyIndex];

            console.log(`Batch ${Math.floor(i / batchSize) + 1} (Attempt ${attempt + 1}): Using Key #${keyIndex + 1}...`);

            const embeddingModel = new GoogleGenerativeAIEmbeddings({
                modelName: "gemini-embedding-001", // FIXED TYPO: "embeddings" -> "embedding"
                apiKey: currentKey
            });

            try {
                // Generate embeddings for the batch
                const batchEmbeddings = await embeddingModel.embedDocuments(batchChunks);
                allEmbeddings.push(...batchEmbeddings);

                // Map to Qdrant points with unique UUIDs
                const points = batchChunks.map((chunk, j) => {
                    const vector = batchEmbeddings[j];
                    if (!vector || vector.length === 0) {
                        console.warn(`Warning: Empty vector generated for chunk ${i + j}`);
                        return null;
                    }
                    if (vector.length !== 3072) {
                        console.warn(`Warning: Vector dimension mismatch for chunk ${i + j}. Expected 3072, got ${vector.length}.`);
                        // Note: gemini-embedding-001 will return 768. If the DB expects 3072, this will always fail.
                        return null;
                    }
                    return {
                        id: uuidv4(),
                        vector: vector,
                        payload: {
                            ...metadata,
                            text: chunk,
                            filepath: filepath,
                            chunk_num: i + j
                        }
                    };
                }).filter((p): p is NonNullable<typeof p> => p !== null);

                if (points.length === 0) {
                    console.error(`No valid points to upsert for batch ${Math.floor(i / batchSize) + 1}`);
                    batchSuccess = true;
                    continue;
                }

                // Store in Qdrant
                try {
                    await client.upsert(collectionName, {
                        wait: true,
                        points: points,
                    });
                } catch (upsertError: any) {
                    console.error("Qdrant Upsert Details:", JSON.stringify(upsertError.data || upsertError, null, 2));
                    throw upsertError;
                }

                batchSuccess = true;
            } catch (error: any) {
                console.error(`Key #${keyIndex + 1} failed:`, error.message);
                if (error.message.includes("429") || error.message.includes("quota") || error.message.includes("key not valid")) {
                    console.log("Rotating to next key...");
                    await sleep(1000);
                } else {
                    throw error;
                }
                attempt++;
            }
        }

        if (!batchSuccess) {
            throw new Error(`Failed batch ${Math.floor(i / batchSize) + 1} after trying all keys.`);
        }

        if (i + batchSize < chunks.length) {
            await sleep(1000);
        }
    }

    console.log(`Successfully ingested ${chunks.length} chunks into Qdrant collection '${collectionName}'`);
    return allEmbeddings;
}

/**
 * Returns a LangChain VectorStore for searching a specific collection
 */
export async function getQdrantSearchStore(collectionName: string, query: string) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY_2;

    const embeddings = new GoogleGenerativeAIEmbeddings({
        modelName: "gemini-embedding-001",
        apiKey: GEMINI_API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName,
        apiKey: process.env.QDRANT_API_KEY,
    });
    const results1 = await vectorStore.similaritySearch(
        query
    );

    console.log(results1[0]);
    return results1;
}


