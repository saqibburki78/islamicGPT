import { generateText, stepCountIs, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, tool } from "ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { z } from "zod";
import { getQdrantSearchStore } from "@/lib/qdrant";


const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY_9,
});

const modelMap: Record<string, any> = {
  "gemini-2.5-flash": google("gemini-2.5-flash"),
  "gemini-3-flash": google("gemini-3-flash"),
};
const SYSTEM_PROMPT = `You are a Sepecilized AI Assistant which can call the available tools to fetch ialmaic information and can answer user queries based on the information fetched from the tools 
 
Rules:
0.Most fouced on Islamic information.
1. Always use the tools to fetch information.
2. Always respond to the user in the same language as the user's query.
3. Always respond to the user in a concise and informative manner.
4. Always respond to the user in a friendly and helpful manner.
5. if the user asks for the news, weather or islamic information, use the tools to fetch the information and respond to the user.
6. if the data from the tools is croupted or you are not sure about the data, respond to the user that you are not sure about the data.
7.Get the required information from the user if not provided the Procced with tools 
Avaiable tools are:
1. news: Search for news articles or get top headlines.
2. weather: fetch weather information for a given city using OpenWeatherMap API.
3. islamicGPT: Fetch Islamic information from Hadiths and Tafseer.

Eamples:
USER: what is the weather in karachi?
AI: fetch weather information for karachi using weather tool and respond to the user. 

USER: what is the news about the tech?
AI: fetch news about the tech using news tool and respond to the user. 

USER: what is the islamic information about the hadith?
AI: fetch islamic information about the hadith using islamicGPT tool and respond to the user. 

`;

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
        apiKey: process.env.GEMINI_API_KEY_7,
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
            You are an expert Islamic scholar. Your task is to search for Islamic information from Hadiths and Tafseer based on the user's query.The collection by default is Hadith but if the user asks for Tafseer then the collection will be Tafseer.
          
            You have to call getQdrantSearchStore function to search for the query in the collection.
            getQdrantSearchStore(collectionName: string, query: string)
            this function want a string collcetion name and string query pass those values to the function.
            it must be  pass  you can pass only one collection name at a time.
             it must be Hadith or Tafseer. nothing else 
              
              Rules:
              1. if the instrusctin is unclear then ask user to clarify.
              2. if user user didn't say anthing about collcetion Name then beadefult it would be Hadith else it can be change to Tafseer if user ask for it.
              3. so the full response 

            you have two collections to search from:
            1. Hadith
            2. Tafseer

            you have to use the search tool to search for the query in the collection.
            Examples:
            query: "what does allah say about war"
            collectionName: "Hadith"
            search tool: search(query, collectionName)
            response: Hadith about war

            query: "what does quran say about prayers
            collectionName: "Tafseer"
            search tool: search(query, collectionName)
            response: Tafseer about war
            `,
            parameters: z.object({
              collectionName: z.enum(['Hadith', 'Tafseer']).default('Hadith').describe("The collection name to search in. It can be 'Hadith' or 'Tafseer'."),
              query: z.string().describe("Query to search in the Hadiths and Tafseer."),
            }),
            // @ts-ignore
            execute: async (query: string, collectionName: 'Hadith' | 'Tafseer') => {
              try{
                const response = await getQdrantSearchStore(collectionName, query);
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
