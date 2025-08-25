exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  
  const { skills = "", time = "", budget = "", market = "" } = JSON.parse(event.body);
  
const prompt = `
Return valid JSON only. No commentary.
Generate 5 startup ideas under $${budget} for ${skills} skills, ${time} available, ${market} market.

For each idea:
- name (creative business name)
- description (2-3 sentences) 
- startup_cost (like "$47")
- difficulty ("⭐⭐")
- feasibility_score ("8.5/10")
- timeline ("5-8 days")
- today_action (specific 2-hour action plan with exact steps, no research tasks, include copy-paste templates and specific websites)
- success_example (one sentence with name and earnings)

Make today_action very specific with actual templates and exact instructions.

Return: {"ideas": [...]}
`;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Missing OPENAI_API_KEY" };
  
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert business consultant who creates detailed, actionable startup plans with specific steps and compelling copy." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8
    })
  });
  
  if (!r.ok) return { statusCode: 502, body: "AI error" };
  const data = await r.json();
  let txt = data.choices?.[0]?.message?.content?.trim() || "{}";
// Remove markdown code blocks if present
if (txt.startsWith('```json')) {
  txt = txt.replace(/```json\n?/g, '').replace(/\n?```$/g, '');
};
  console.log("OpenAI returned:", txt);
  
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
