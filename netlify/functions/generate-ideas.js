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
- Every idea names at least one exact platform (e.g., "Etsy", "Facebook Marketplace Canada", "Nextdoor Caledon", "Pinterest")
- Description includes at least two numbers
- "today_action" uses timestamps and includes at least one script

Return strictly this JSON:
{
  "ideas": [{
    "name": "Specific business name",
    "description": "3-4 sentences explaining what you create/sell, who buys it, where you sell it, include 2-3 specific numbers",
    "startup_cost": "$XX",
    "difficulty": "⭐ to ⭐⭐⭐⭐",
    "feasibility_score": "X.X/10", 
    "timeline": "5-8 days to first sale",
    "today_action": "Basic 2-hour starter plan with timestamps, include one simple outreach message and one social post example - enough to get started but obviously needing more comprehensive templates and strategies for consistent success",
    "success_example": "Brief story with realistic first name (use names like Emma, Michael, Jessica, Candy, Sandy, Roy, Tayeshawn, Kai, Ashley, Vlad, Krys, etc.), specific timeframe, realistic earnings"
  }]
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
