// netlify/functions/generate-ideas.js  — v6-fast
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { skills = "", time = "", budget = "", market = "", location = "" } =
    JSON.parse(event.body || "{}");

  const prompt = `
You are a no-nonsense, execution-focused business coach. Be empathetic to users burned by online scams.
Your job: help people start legitimate, sustainable businesses that can support families long-term.
Never suggest selling courses/MLM/fake scarcity. Focus on tangible products/services and honest value.

User profile:
- skills: ${skills}
- time_per_week: ${time}
- budget_usd: ${budget}
- market: ${market}
- location: ${location || "unspecified"}

GOAL
Produce 5 non-generic ideas that fit budget/time and reach the first $100 fast,
and show a path to durability over 3–6 months.

HARD RULES
- No clichés like “leverage social media”, “do market research”, “build a brand”.
- Each idea MUST name: a specific niche, a specific customer, and a specific platform/place to sell.
- Include concrete NUMBERS: unit_price, unit_cost, startup_cost, fees %, quantities, week-1 targets.
- Immediate action MUST be a 2-hour, timestamped checklist AND include:
  • one copy-paste outreach DM/email script, and
  • one ready-to-post caption/title for the platform.
- Use a different first name per idea from [Ava, Maya, Liam, Noah, Aiden, Zoe, Mateo, Amara, Kingston, Priya]. Do NOT repeat.
- Anchor to location when relevant (e.g., “Nextdoor ${location}”, “Facebook Marketplace ${location}”).
- No course selling. No MLM.

RETURN STRICTLY THIS JSON (no extra fields; numeric fields are numbers):
{
  "debug_version": "v6-fast",
  "ideas": [
    {
      "name": "…",
      "niche": "…",
      "customer": "…",
      "platform": "Etsy | Facebook Marketplace ${location} | Nextdoor ${location} | Pinterest | Teachers Pay Teachers | Fiverr | local fairs …",
      "description": "3–4 sentences with at least two numbers and the exact platform.",
      "unit_price_usd": 0,
      "unit_cost_usd": 0,
      "startup_cost_usd": 0,
      "gross_margin_pct": 0,
      "first_100_math": "e.g., 5 units × $22 = $110 revenue; fees 12% → $96.8; COGS $35 → ~$61.8 net.",
      "difficulty": "⭐ to ⭐⭐⭐⭐",
      "feasibility_score": "X.X/10",
      "timeline": "5-8 days",
      "plan": {
        "immediate_action_2h": "00:00–00:20 …\\n00:20–01:10 …\\n01:10–02:00 …\\nDM script: \"…\"\\nPost caption: \"…\"",
        "first_week": [
          "Day 1: target, quantity, price, outreach count…",
          "Day 2: …",
          "Day 3: …",
          "Day 4: …",
          "Day 5–7: … with numeric targets"
        ],
        "next_steps": [
          "After $100: raise price from $X to $Y, add upsell Z, systemize W."
        ]
      },
      "acquisition": [
        { "channel": "Platform search", "steps": ["…"], "kpis": {"impressions": 0, "clicks": 0, "cr_pct": 0} },
        { "channel": "Outbound DM", "steps": ["…"], "kpis": {"dms": 0, "replies": 0, "cr_pct": 0} }
      ],
      "risks": [
        {"risk": "…", "mitigation": "…"}
      ],
      "legacy_path": "How this becomes a stable, family-supporting business in 3–6 months: milestones with monthly revenue targets.",
      "success_story": "«<RandomName> from <city> sold <qty> in <days>, netting $<profit>.»"
    }
  ]
}

Validator (apply before answering; fix any failures):
- Each idea names a specific platform and customer segment.
- Description includes ≥2 numbers.
- “immediate_action_2h” uses timestamps and includes one DM/email script AND one post caption.
- “first_100_math” shows explicit math to $100 and approximate net after fees/COGS.
- Different name from the list is used in each success_story.
`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Missing OPENAI_API_KEY" };

  // Timeout guard (8.5s) to avoid Netlify 10s hard timeout
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8500);

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.25,
        max_tokens: 900,
        messages: [
          { role: "system", content: "Return valid JSON only. Be specific, numeric, execution-focused, and empathetic." },
          { role: "user", content: prompt }
        ]
      }),
      signal: ctrl.signal
    });

    clearTimeout(timer);

    if (!r.ok) {
      const text = await r.text();
      return { statusCode: 502, body: `AI error: ${text}` };
    }

    let txt = (await r.json()).choices?.[0]?.message?.content?.trim() || "{}";
    if (txt.startsWith("```")) {
      txt = txt.replace(/^```json?\s*/i, "").replace(/```$/i, "");
    }

    const parsed = JSON.parse(txt);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (e) {
    if (e.name === "AbortError") {
      return { statusCode: 504, body: "AI timeout" };
    }
    return { statusCode: 500, body: `Server error: ${e.message}` };
  }
};
