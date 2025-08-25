// netlify/functions/generate-ideas.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { skills = "", time = "", budget = "", market = "", location = "" } =
    JSON.parse(event.body || "{}");

  const prompt = `
You are an execution-focused business operator. Output JSON only.

User:
- skills: ${skills}
- time_per_week: ${time}
- budget_usd: ${budget}
- market: ${market}
- location: ${location || "unspecified"}

Goal: Generate 5 **non-generic** ideas that can start under budget and fit time.

Hard rules (reject clichés):
- Do NOT say "leverage social media", "offer services", "do market research", "build a brand".
- Each idea must name a **specific niche**, **specific customer**, and **specific platform/place** to sell.
- Include **numbers**: price, cost, qty, conversion assumptions, first-week target.
- “today_action” must be a 2-hour checklist with timestamps and copy-paste text (DM/email/post).
- Keep everything concrete and persuasive.

Return strictly this JSON (no extra fields):
{
  "ideas":[
    {
      "name": "…",
      "description": "3–4 sentences. Name niche, customer, platform, and 2–3 numbers.",
      "startup_cost": "$NN",
      "difficulty": "⭐ to ⭐⭐⭐⭐",
      "feasibility_score": "X.X/10",
      "timeline": "5-8 days",
      "today_action": "00:00–00:20 …\\n00:20–01:10 …\\n01:10–02:00 …\\nDM script: “…”\\nPost caption: “…”",
      "success_example": "Specific story with name, amount, timeframe."
    }
  ]
}

Validation before answering:
- Every idea names at least one exact platform (e.g., “Etsy”, “Facebook Marketplace Canada”, “Nextdoor Caledon”, “Pinterest”).
- Description includes at least two numbers.
- “today_action” uses timestamps and includes at least one script.
`;

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


