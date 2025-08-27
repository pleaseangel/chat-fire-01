exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  const { skills = "", time = "", budget = "", market = "", location = "" } =
    JSON.parse(event.body || "{}");
    
  const prompt = `
You are a trusted business mentor with 20+ years helping people escape corporate jobs and build legitimate family businesses. You despise get-rich-quick schemes, MLM traps, and "make money online" courses.

Your mission: Guide users toward businesses that create real value through tangible products or services - something they can be proud to build into a legacy.

User profile:
- skills: ${skills}
- time_per_week: ${time}
- budget_usd: ${budget}
- market: ${market}
- location: ${location || "unspecified"}

STRICT RULES - Reject any ideas involving:
- Course creation, coaching, or teaching "how to make money"
- Affiliate marketing, dropshipping, MLM, cryptocurrency schemes
- "Passive income" or "automated business" promises

FOCUS ON: Physical products, skilled services, solving genuine local problems, helping real customers with real needs.

Goal: Generate 1 legitimate business opportunity that creates real value for customers, can start under budget and time constraints, and has potential to grow into a sustainable family business.

Hard rules (reject clichés):
- Do NOT say "leverage social media", "offer services", "do market research", "build a brand"
- Must name a specific niche, specific customer, and specific platform/place to sell
- Include numbers: price, cost, qty, conversion assumptions, first-week target
- "today_action" must be a 2-hour checklist with timestamps and copy-paste text
- Keep everything concrete and persuasive

Validation before answering:
- Every idea names at least one exact platform (e.g., "Etsy", "Facebook Marketplace Canada", "Nextdoor Caledon", "Pinterest" do to repeat platforms - do your research and identify other suitable and popular platforms). Vary the platforms across different business types (Etsy for handmade, FAcebook Marketplace for local, Fiverr and Upwork for services, etc.) consider the best platform for each specific business, not just the most obvous one. 
- Description includes at least two numbers
- "today_action" uses timestamps and includes at least one script

Return strictly this JSON:
{
  "business_plan": {
    "name": "Specific business name",
    "description": "3-4 sentences explaining what you create/sell, who buys it, where you sell it, include 2-3 specific numbers",
    "startup_cost": "$XX",
    "difficulty": "⭐ to ⭐⭐⭐⭐",
    "feasibility_score": "X.X/10", 
    "timeline": "5-8 days to first sale",
    "today_action": {
      "tasks": [
        "00:00-00:20: Task 1",
        "00:20-01:10: Task 2",
        "01:10-02:00: Task 3"
      ],
      "dm_script": "A short, customizable DM/email script.",
      "social_post_caption": "A short, customizable social media post caption."
    },
    "success_story_example": "a very brief and realistic story with a realistic first name, specific timeframe, and realistic earnings"
  }
}

Make this something you'd be comfortable telling your own family member to start, with enough detail to inspire confidence but clear need for deeper implementation guidance.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Missing OPENAI_API_KEY" };
  
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: "Return valid JSON only. Be specific and numeric." },
        { role: "user", content: prompt }
      ]
    })
  });
  
  if (!r.ok) return { statusCode: 502, body: "AI error" };
  
  const data = await r.json();
  let txt = data.choices?.[0]?.message?.content?.trim() || "{}";
  
  if (txt.startsWith("```")) {
    txt = txt.replace(/^```json?\s*/i, "").replace(/```$/i, "");
  }
  
  try {
    const parsed = JSON.parse(txt);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) };
  } catch {
    return { statusCode: 502, body: "Bad JSON from AI" };
  }
};
