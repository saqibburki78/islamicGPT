import { generateText, stepCountIs, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, tool } from "ai";
import { z } from "zod";
import { getQdrantSearchStore } from "@/lib/qdrant";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";


const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY_5,
});

const modelMap: Record<string, any> = {
  "gemini-2.5-flash": google("gemini-2.5-flash"),
  "gemini-3-flash": google("gemini-3-flash"),
};

export default async function Chat(
  messages: any,
  model: string = "gemini-2.5-flash"
) {
  const GEMINI_KEYS = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
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
    throw new Error("No Gemini API keys found");
  }

  for (const currentKey of GEMINI_KEYS) {
    try {
      const googleConfig = createGoogleGenerativeAI({
        apiKey: currentKey,
      });

      const modelMapFallback: Record<string, any> = {
        "gemini-2.5-flash": googleConfig("gemini-2.5-flash"),
        "gemini-3-flash": googleConfig("gemini-3-flash"),
      };

      const selectedModel = modelMapFallback[model] || modelMapFallback["gemini-2.5-flash"];

      const result = streamText({
        model: selectedModel,
        messages: messages,
        system: SYSTEM_PROMPT,
        tools: {
          news: tool({
            description: `Search for news articles or get top headlines. Use 'everything' endpoint for general search queries (e.g., "tech news", "bitcoin"). Use 'top-headlines' endpoint for breaking news from a specific country.
            the Function parameters are:
            query: The topic, keyword, or phrase to search for. Required if endpoint is 'everything'.
            endpoint: The API endpoint. Defaults to 'everything'.
            country: The 2-letter ISO 3166-1 country code (e.g., 'us', 'in'). Default is 'us'.

            apiKey: process.env.NEWS_API_KEY
            baseUrl: https://newsapi.org/v2/
            this are the two endpoints:
            1. everything
            2. top-headlines

            use everything endpoint for general search queries  like (e.g., "tech news", "bitcoin").
            use top-headlines endpoint for breaking news from a specific country or just top headlines.
            Examples:[
            query: "tech"
            endpoint: "everything"
            country: "us"
            apiKey: process.env.NEWS_API_KEY
            https://newsapi.org/v2/everything?q={query}&apiKey={process.env.NEWS_API_KEY}

            response: Now it will return tech realated news articles.

            endpoint: "top-headlines"
            country: "us"
            apiKey: process.env.NEWS_API_KEY
            https://newsapi.org/v2/top-headlines?country={country}&apiKey={process.env.NEWS_API_KEY}
            response: Now it will return tech realated news articles from the US.
            ]`,
            parameters: z.object({
              query: z.string().optional().describe("The topic, keyword, or phrase to search for."),
              endpoint: z.enum(['everything', 'top-headlines']).default('everything').describe("The API endpoint. Defaults to 'everything'."),
              country: z.string().optional().default('us').describe("The 2-letter ISO 3166-1 country code (e.g., 'us', 'in')."),
            }),
            // @ts-ignore
            execute: async (args: any) => {
              const { query, endpoint, country } = args;
              try {
                const params = new URLSearchParams();
                // API Key is always required
                params.append('apiKey', process.env.NEWS_API_KEY || '');

                // Add optional parameters if they exist
                if (query) {
                  params.append('q', query);
                }
                if (country) {
                  params.append('country', country);
                }

                const url = `https://newsapi.org/v2/${endpoint}?${params.toString()}`;

                const response = await fetch(url);
                const data = await response.json();
                return data;
              } catch (error: any) {

                return `Error fetching news: ${error.message}`;
              }
            },
          }),
          // @ts-ignore
          islamicGPT: tool({
            description: `
            You are an Ai agent the make similaritysearch in qdrant db with getQdrantSearchStore. Your task is to search for Islamic information from Hadiths and Tafseer based on the user's query.The collection by default is Hadith but if the user asks for Tafseer then the collection will be Tafseer.
              this is the syntax to call a function
              it required two params of collectionName  where you should pass either Hadith or Tafseer
              it required second param of query where you should pass the user query
              getQdrantSearchStore(collectionName,query)
              getQdrantSearchStore("Tafseer","what does allah say about jews in Quran")
              getQdrantSearchStore("Hadith","what does allah say about jihhad")
              RULES:
              just pass one value Hadith or Tafseer in CollectionName nothing else 
                just pass the query which the user want in qUery
            `,
            parameters: z.object({
              collectionName: z.enum(['Hadith', 'Tafseer']).default('Hadith').describe("The collection name to search in. It can be 'Hadith' or 'Tafseer'."),
              query: z.string().describe("the user Query to search in the Hadiths and Tafseer."),
            }),
            // @ts-ignore
            execute: async (args: any) => {
              try{
                const response = await getQdrantSearchStore(args.collectionName,args.query);
                console.log('collectionName form openai',args.collectionName)
                console.log('query form openai',args.query)
                return response;
              }catch(error: any){
                console.warn(`API key validation failed: ${error.message}`);
                if (
                  error.message?.includes("429") ||
                  error.message?.includes("quota") ||
                  error.message?.includes("key not valid")
                ) {
                  console.log("Rotating to next key...");
                }
                throw error;
              }
            }
          }),
        },
        stopWhen: stepCountIs(5),
      });
      return result;
    } catch (error: any) {
      console.warn(`API key validation failed: ${error.message}`);
      if (
        error.message?.includes("429") ||
        error.message?.includes("quota") ||
        error.message?.includes("key not valid")
      ) {
        console.log("Rotating to next key...");
        continue;
      }
      throw error;
    }
  }

  return "Error fetching information: All API keys exhausted. Please try again later.";
}
