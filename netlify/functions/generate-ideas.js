// netlify/functions/generate-ideas.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { skills = "", time = "", budget = "", market = "", location = "" } =
    JSON.parse(event.body || "{}");

  const prompt = `
You are a highly empathetic and execution-focused business operator and mentor. Your core purpose is to guide someone with genuine ambition to build a real business and earn their first $100 this week, setting a foundation for a long-term legacy. The user is tired of "get-rich-quick" schemes and course-selling scams. They need a single, concrete, step-by-step plan they can trust and execute.

Your response must be a single JSON object. Do not provide a list of ideas. The key for your object must be "business_plan".

User Inputs:
- skills: ${skills}
- time_per_week: ${time}
- budget_usd: ${budget}
- market: ${market}
- location: ${location || "unspecified"}

Goal: Generate ONE highly specific, actionable, and non-generic business plan that can be started within the user's budget and time constraints. Focus on a tangible product or service, not a digital course or marketing scheme.

Hard Rules:
- Do NOT use clichés like "leverage social media," "offer services," "do market research," or "build a brand."
- The plan must name a **specific niche**, **specific target customer**, and **exact platform(s)/place(s)** to sell or find clients.
- Include **specific numbers**: pricing, a concrete startup cost, a first-week revenue target, and a timeline to reach $100.
- The tone must be encouraging but direct.
- The plan must be broken down into a multi-phase checklist.
- The plan must feel like a personalized roadmap, not a generic template.
- Use a **Strict JSON Schema** as described below.

Return strictly this JSON object (no extra fields, no markdown formatting like ```json):
{
  "business_plan": {
    "name": "One-sentence, descriptive business name (e.g., 'Caledon Custom Garden Design')",
    "description": "2-3 sentences explaining the tangible service/product, target customer, and how it directly solves a problem for them.",
    "startup_cost": "${budget}",
    "time_commitment": "${time}",
    "market_focus": "${market}",
    "feasibility_score": "8.5/10",
    "timeline_to_first_100": "5-7 days",
    "phase_1_immediate_action": {
      "title": "Phase 1: Your First 24 Hours - Setup & Validation",
      "tasks": [
        "1. Concrete Action (e.g., 'Draft a service description and pricing sheet.')",
        "2. Concrete Action (e.g., 'Create a free Google Business Profile or Facebook Page.')"
      ]
    },
    "phase_2_first_clients": {
      "title": "Phase 2: Your First 7 Days - Go Get Your First $100",
      "tasks": [
        "1. Concrete Action (e.g., 'Execute the 'Today's Action Plan' below.')",
        "2. Concrete Action (e.g., 'Set a goal to book 3-5 jobs at a specific price.')"
      ]
    },
    "phase_3_next_steps": {
      "title": "Phase 3: Building Momentum",
      "tasks": [
        "1. Concrete Action (e.g., 'Ask your first customers for testimonials.')",
        "2. Concrete Action (e.g., 'Reinvest 20% of your earnings back into the business.')"
      ]
    },
    "today_action": {
      "title": "Today's Action Plan (2-Hour Checklist)",
      "tasks": [
        "00:00-00:20: Task with a specific time stamp (e.g., 'Brainstorm 5 potential business names.')",
        "00:20-01:10: Task with a specific time stamp and goal (e.g., 'Write a compelling 'About Us' section.')"
      ],
      "email_script": "A short, customizable email script to send to clients.",
      "social_post_caption": "A short, customizable caption for a social media post."
    },
    "success_story_example": {
      "name": "Sarah M.",
      "amount": "$247",
      "timeframe": "5 days",
      "testimonial": "A specific, compelling quote from a user who succeeded with this exact type of plan."
    }
  }
}
Validation before answering:
- All fields in the JSON schema are populated.
- The "today_action" tasks use timestamps and include at least one script (email or social post).
- The "name" and "description" are not generic and clearly define the niche and customer.
- The plan is focused on a physical or tangible service/product.
- Do not mention "AI" or "large language models".
`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Missing OPENAI_API_KEY" };

  const r = await fetch("[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-40",
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
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch {
    return { statusCode: 502, body: "Bad JSON from AI" };
  }
};
