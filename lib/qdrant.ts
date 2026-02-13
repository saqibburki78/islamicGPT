import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { VectorStore } from "@langchain/core/vectorstores";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from "path";
import fs from "fs";

export async function getQdrantVectorStore(): Promise<VectorStore> {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "embedding-001",
    apiKey: process.env.GEMINI_API_KEY,
  });

  const collectionName = "Hadith";

  try {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      collectionName: collectionName,
      apiKey: process.env.QDRANT_API_KEY,
    });

    // Check if collection exists and has data
    try {
      const collectionInfo = await vectorStore.client.getCollection(collectionName);
      if (collectionInfo.points_count === 0) {
        console.log(`Collection '${collectionName}' exists but is empty. Ingesting...`);
        await ingestTafseer(embeddings);
      }
    } catch (e) {
      // If getCollection fails, it might not exist or connection error
      console.log(`Error checking collection status. Attempting ingestion...`);
      await ingestTafseer(embeddings);
    }

    return vectorStore;
  } catch (err) {
    console.log(`Collection '${collectionName}' not found or connection error. Creating and ingesting...`);

    await ingestTafseer(embeddings);

    return await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      collectionName: collectionName,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }
}

// Optimized ingestion: Process book by book to avoid Out of Memory errors
async function ingestTafseer(embeddings: GoogleGenerativeAIEmbeddings) {
  const baseDir = path.join(process.cwd(), "Islamic_Books", "Hadith");
  console.log(`Scanning PDFs in: ${baseDir}`);

  if (!fs.existsSync(baseDir)) {
    console.error(`Directory ${baseDir} does not exist.`);
    return;
  }

  // Get all items in the directory
  const items = fs.readdirSync(baseDir, { withFileTypes: true });

  // Separate into direct PDF files and Subdirectories (Books)
  const pdfFiles = items.filter(item => item.isFile() && item.name.toLowerCase().endsWith('.pdf'));
  const subDirs = items.filter(item => item.isDirectory());

  console.log(`Found ${pdfFiles.length} root PDFs and ${subDirs.length} book folders.`);

  // 1. Process root PDFs
  if (pdfFiles.length > 0) {
    console.log("Processing root PDF files...");
    for (const file of pdfFiles) {
      await processSingleFile(path.join(baseDir, file.name), "General Tafseer", embeddings);
    }
  }

  // 2. Process each book folder individually (Memory Safe)
  for (const dir of subDirs) {
    const bookPath = path.join(baseDir, dir.name);
    console.log(`\n--- Processing Book: ${dir.name} ---`);

    const bookFiles = fs.readdirSync(bookPath).filter(f => f.toLowerCase().endsWith('.pdf'));

    for (const file of bookFiles) {
      await processSingleFile(path.join(bookPath, file), dir.name, embeddings);
    }
  }
}

async function processSingleFile(filePath: string, sourceName: string, embeddings: GoogleGenerativeAIEmbeddings) {
  try {
    console.log(`Loading: ${path.basename(filePath)}`);
    const loader = new PDFLoader(filePath, { splitPages: false });
    const docs = await loader.load();

    if (docs.length === 0) return;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    // Add minimal metadata
    splitDocs.forEach(doc => {
      doc.metadata = {
        ...doc.metadata,
        source: sourceName,
        filename: path.basename(filePath)
      };
    });

    console.log(`Uploading ${splitDocs.length} chunks to Qdrant...`);


    await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
      url: process.env.QDRANT_URL,
      collectionName: "Tafseer",
      apiKey: process.env.QDRANT_API_KEY,
    });
    // Explicitly clear references to free up memory
    docs.length = 0;
    splitDocs.length = 0;
  } catch (e) {
    console.error(`Failed to process ${path.basename(filePath)}:`, e);
  }
}
