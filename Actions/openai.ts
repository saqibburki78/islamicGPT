import { generateText, stepCountIs, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, tool } from "ai";
import { z } from "zod";
import { getQdrantVectorStore } from "@/lib/qdrant";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY_6,
});

const modelMap: Record<string, any> = {
  "gemini-2.5-flash": google("gemini-2.5-flash"),
  "gemini-3-flash": google("gemini-3-flash"),
};
const SYSTEM_PROMPT = "You are a helpful assistant which give user answers and use tools to fetch real time information when needed.";

export default async function Chat(
  messages: any,
  model: string = "gemini-2.5-flash"
) {
  try {
    const selectedModel = modelMap[model] || modelMap["gemini-2.5-flash"];

    const result = await streamText({
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
            endpoint: z.enum(['everything', 'top-headlines']).optional().default('everything').describe("The API endpoint. Defaults to 'everything'."),
            country: z.string().optional().describe("The 2-letter ISO 3166-1 country code (e.g., 'us', 'in')."),
          }),
          execute: async ({ query, endpoint, country }: { query?: string; endpoint?: 'everything' | 'top-headlines'; country?: string }) => {
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
              console.error("Error in news tool:", error.message);
              return `Error fetching news: ${error.message}`;
            }
          },
        }),
        weather: tool({
          description: `fetch weather information for a given city using OpenWeatherMap API.`,
          parameters: z.object({
            city: z.string().describe('Get the city name From the user to fetch weather information of that particular city'),
          }),
          execute: async (city: { city: string }) => {
            try {
              const params = new URLSearchParams()
              const cityName = city.city;
              params.append("appid", process.env.WEATHER_API_KEY || "")
              if (!cityName) {
                return
              } else {
                params.append("q", cityName)
              }
              console.log("params", params.toString())
              const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params.toString()}&units=metric`);
              const data = await response.json();
              return data;
            } catch (error: any) {
              console.log("error in weather tool:", error)
            }
          }
        }),
        islamicGPT: tool({
          description: "Fetch Islamic information from Hadiths and Tafseer.",
          parameters: z.object({
            query: z.string().describe("search query for Islamic information."),
            category: z.enum(['Hadith', 'Tafseer', 'All']).optional().default('All').describe("Optional category to narrow down the search. Defaults to searching both.")
          }),
          execute: async ({ query, category = 'All' }: { query: string, category?: 'Hadith' | 'Tafseer' | 'All' }) => {
            if (!query) {
              return "Please provide a search query for Islamic information.";
            }
            try {
              let results: any[] = [];

              if (category === 'Hadith' || category === 'All') {
                const hadithStore = await getQdrantVectorStore("Hadith");
                // const hadithResults = await hadithStore.similaritySearch(query, 5);
                // results = [...results, ...hadithResults.map((r: any) => ({ ...r, source_type: 'Hadith' }))];
              }

              if (category === 'Tafseer' || category === 'All') {
                const tafseerStore = await getQdrantVectorStore("Tafseer");
                // const tafseerResults = await getQdrantVectorStore.similaritySearch(query, 5);
                // results = [...results, ...tafseerResults.map((r: any) => ({ ...r, source_type: 'Tafseer' }))];
              }

              console.log(`Found ${results.length} results for query: "${query}" in category: ${category}`);
              return results;
            } catch (error: any) {
              console.error("Error in islamicGPT tool:", error);
              return `Error fetching Islamic information: ${error.message}`;
            }
          }
        }),
      },
      stopWhen: stepCountIs(5),
    });
    return result;
  } catch (error: any) {
    console.error(`Error in openai.ts file ${error?.message}`);
    throw error;
  }
}
