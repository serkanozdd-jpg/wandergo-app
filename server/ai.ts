import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access
// without requiring your own API key. Charges are billed to your Replit credits.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export async function generatePlaceArticle(
  placeName: string,
  city: string,
  country: string,
  category: string,
  description?: string
): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable travel guide writer. Write engaging, informative mini-articles about tourist destinations. 
Keep articles concise (150-250 words) but informative. Include:
- Brief historical background
- Cultural significance
- Interesting facts
- Best visiting tips (time of day, photo spots, what to wear, etc.)
Write in a friendly, enthusiastic tone that makes readers excited to visit.`,
        },
        {
          role: "user",
          content: `Write a mini travel article about "${placeName}" located in ${city}, ${country}. 
Category: ${category}
${description ? `Additional info: ${description}` : ""}

Write an engaging article that would help a traveler understand why this place is worth visiting and what to expect.`,
        },
      ],
      max_completion_tokens: 500,
    });

    return response.choices[0]?.message?.content || "Article generation failed.";
  } catch (error) {
    console.error("Error generating article:", error);
    return "Unable to generate article at this time.";
  }
}

export async function generateDailyItinerary(
  places: Array<{ name: string; category: string; visitDuration?: string | null }>,
  routeType: string,
  availableHours: number = 8
): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a travel planning assistant. Create optimized daily itineraries that consider travel time between locations, opening hours, and visitor experience. 
Format your response as a structured schedule with:
- Time slots
- Place names
- Brief activity descriptions
- Travel tips between stops
Keep it practical and enjoyable.`,
        },
        {
          role: "user",
          content: `Create a ${availableHours}-hour daily itinerary for the following places using ${routeType} as transport mode:

${places.map((p, i) => `${i + 1}. ${p.name} (${p.category})${p.visitDuration ? ` - Est. visit: ${p.visitDuration}` : ""}`).join("\n")}

Provide a realistic schedule with travel time estimates and tips for making the most of the day.`,
        },
      ],
      max_completion_tokens: 800,
    });

    return response.choices[0]?.message?.content || "Itinerary generation failed.";
  } catch (error) {
    console.error("Error generating itinerary:", error);
    return "Unable to generate itinerary at this time.";
  }
}
