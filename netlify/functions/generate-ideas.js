// netlify/functions/generate-ideas.js — v7-fast-json
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  const { skills = "", time = "", budget = "", market = "", location = "" } =
    JSON.parse(event.body || "{}");

  const prompt = `
You are an execution-focused, empathetic coach. No scams, no courses, no MLM.
Help users start legitimate, sustainable businesses and reach the first $100 fast.

User:
- skills: ${skills}
- time_per_week: ${time}
- budget_usd: ${budget}
- market: ${market}
- location: ${location || "unspecified"}

Create 5 non-generic ideas. Each MUST name a specific niche, customer, and platform/place.
Use numbers (price, cost, quantity, fees %, week-1 targets).
Immediate action = 2-hour timestamped checklist + one DM/email script + one post caption/title.
Use a different name from [Ava, Maya, Liam, Noah, Aiden, Zoe, Mateo, Amara, Kingston, Priya].

Return strictly:
{
  "debug_version": "v7-fast-json",
  "ideas": [{
    "name":"...", "niche":"...", "customer":"...", "platform":"...",
    "description":"3–4 sentences with ≥2 numbers and the exact platform.",
    "unit_price_usd":0, "unit_cost_usd":0, "startup_cost_usd":0, "gross_margin_pct":0,
    "first_100_math":"explicit math to $100 and net",
    "difficulty":"⭐ to ⭐⭐⭐⭐","feasibility_score":"X.X/10","timeline":"5-8 days",
    "plan":{"immediate_action_2h":"00:00–00:20 …\\n00:20–01:10 …\\n01:10–02:00 …\\nDM script: \"…\"\\nPost caption: \"…\"",
            "first_week":["Day 1 …","Day 2 …","Day 3 …","Day 4 …","Day 5–7 …"],
            "next_steps":["After $100 …"]},
    "acquisition":[{"channel":"Platform search","steps":["…"],"kpis":{"impressions":0,"clicks":0,"cr_pct":0}},
                   {"channel":"Outbound DM","steps":["…"],"kpis":{"dms":0,"replies":0,"cr_pct":0}}],
    "risks":[{"risk":"…","mitigation":"…"}],
    "legacy_path":"3–6 month milestones.",
    "success_story":"«<RandomName> from <city> sold <qty> in <days>, netting $<profit>.»"
  }]}
`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: "Missing OPENAI_API_KEY", ideas: [], debug_version: "v7-fast-json" }, 500);

  // 7.5s guard to beat Netlify 10s cap
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7500);

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.25,
        max_tokens: 700,
        messages: [
          { role: "system", content: "Return valid JSON only. Be specific, numeric, execution-focused, empathetic." },
          { role: "user", content: prompt }
        ]
      }),
      signal: ctrl.signal
    });
    clearTimeout(timer);

    if (!r.ok) return json({ error: `AI error: ${await r.text()}`.slice(0,200), ideas: [], debug_version: "v7-fast-json" }, 200);

    let txt = (await r.json()).choices?.[0]?.message?.content?.trim() || "{}";
    if (txt.startsWith("```")) txt = txt.replace(/^```json?\s*/i, "").replace(/```$/i, "");
    return json(JSON.parse(txt), 200);
  } catch (e) {
    const msg = e.name === "AbortError" ? "timeout" : `server:${e.message}`;
    return json({ error: msg, ideas: [], debug_version: "v7-fast-json" }, 200);
  }
};

function json(obj, statusCode) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
