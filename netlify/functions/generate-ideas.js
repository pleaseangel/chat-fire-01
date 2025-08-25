exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { skills = "", time = "", budget = "", market = "", location = "" } = JSON.parse(event.body || "{}");

  const prompt = `
You are an operator. Output only JSON.

User profile:
- skills: ${skills}
- weekly_time: ${time}
- budget_usd: ${budget}
- market: ${market}
- location: ${location || "unspecified"}

Task: Generate 5 **non-generic** business ideas that can start under the budget and fit the weekly time.
Rules to avoid generic output:
- No phrases like "leverage social media", "offer services", "do market research".
- Name a **specific niche** and **specific customer**.
- Name **exact platforms/places** (e.g., "Facebook Marketplace Canada", "Nextdoor Caledon", "Etsy").
- Include **prices**, **quantities**, and **numbers**.

Return strictly:
{
  "ideas": [
    {
      "name": "...",
      "description": "3-4 sentences with niche, customer, platform, and numbers.",
      "startup_cost": "$NN",
      "difficulty": "⭐ to ⭐⭐⭐⭐",
      "feasibility_score": "X.X/10",
      "timeline": "5-8 days",
      "today_action": "A 2-hour checklist with timestamps, copy-paste outreach script, post captions, and where to click.",
      "success_example": "Specific story with name, amount, timeframe."
    }
  ]
}

Validation rubric (must pass before you answer):
- Each idea names a platform and customer segment.
- Each description contains at least two numbers (price, qty, response rates, CPM, leads/day, etc.).
- "today_action" is a checklist with timestamps and a verb at the start of each step.
If any idea fails, fix it and only then return the JSON.
`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Missing OPENAI_API_KEY" };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.25,
      messages: [
        { role: "system", content: "Return valid JSON only." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!r.ok) return { statusCode: 502, body: "AI error" };

  const data = await r.json();
  let txt = data.choices?.[0]?.message?.content?.trim() || "{}";

  // Remove accidental code fences
  if (txt.startsWith("```")) {
    txt = txt.replace(/^```json?\s*/i, "").replace(/```$/,"");
  }

  try {
    const parsed = JSON.parse(txt);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) };
  } catch {
    return { statusCode: 502, body: "Bad JSON from AI" };
  }
};
