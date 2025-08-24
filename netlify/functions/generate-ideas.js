export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  
  const { skills = "", time = "", budget = "", market = "" } = await req.json();
  
  const prompt = `
Return strictly valid JSON. No commentary.
Generate 5 startup ideas under $${budget} for someone with ${skills} skills, ${time} available, targeting ${market} market.

For each idea, create a detailed, compelling business plan with:
- name (creative, specific business name)
- description (compelling 3-4 sentences)
- startup_cost (like "$47")
- difficulty ("⭐" to "⭐⭐⭐⭐") 
- feasibility_score ("X.X/10")
- timeline ("5-8 days")
- today_action (return as a formatted STRING, not object - detailed 2-hour action plan with specific 3 to 4 steps, templates, messages, and psychological triggers. Include exact timeframes, specific platforms, copy-paste templates, expected outcomes, and compelling language that motivates action)
- success_example (specific, unique story with name, amount earned, and timeframe)

Make today_action compelling and actionable with specific instructions in how to do it, not generic advice.

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
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert business consultant who creates detailed, actionable startup plans with specific steps and compelling copy." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8
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
