export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { skills = "", time = "", budget = "", market = "" } = await req.json();

  const prompt = `
Return strictly valid JSON. No commentary.
Generate 5 startup ideas under $${budget}.
User skills: ${skills}. Available hours this week: ${time}. Market: ${market}.
For each idea include:
- name
- description
- startup_cost (like "$47")
- difficulty ("⭐" to "⭐⭐⭐⭐")
- feasibility_score ("X.X/10")
- timeline ("5-8 days")
- today_action
- week_plan (array of 4-6 steps)
- tools_needed (array of {name,cost})
- success_example (one sentence)
Return: {"ideas":[ ... ]}.
`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response("Missing OPENAI_API_KEY", { status: 500 });

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    })
  });

  if (!r.ok) return new Response("AI error", { status: 502 });
  const data = await r.json();
  const txt = data.choices?.[0]?.message?.content?.trim() || "{}";

  try {
    const parsed = JSON.parse(txt);
    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response("Bad JSON from AI", { status: 502 });
  }
};
