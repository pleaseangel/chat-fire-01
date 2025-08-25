exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  
  const { skills = "", time = "", budget = "", market = "" } = JSON.parse(event.body);
  
  const prompt = `
You are an expert entrepreneur and business coach.
Generate ${5} detailed business playbooks under $${budget} for someone with ${skills} skills, ${time} available, targeting ${market} market.

Return strictly valid JSON format with no commentary.

For each business idea, create a complete playbook with:
- name (creative business name)
- description (2-3 sentences explaining the business)  
- startup_cost (like "$47")
- difficulty ("⭐" to "⭐⭐⭐⭐")
- feasibility_score ("X.X/10")
- timeline ("5-8 days to first $100")
- business_overview (target audience, problem solved, revenue model, why it fits their skills/time/budget)
- step_by_step_playbook (numbered checklist of specific actions with free/affordable tools)
- first_30_days (week-by-week action plan matching their ${time} time commitment)
- budget_breakdown (exact spending plan under $${budget})
- first_sales_strategy (specific steps to earn first $100 with templates and scripts)
- scaling_roadmap (steps to grow from $100 to $1000+)
- mistakes_to_avoid (common beginner traps for this business type)
- success_example (specific story with name, amount earned, timeframe)

Keep everything in short, clear, checklist format for beginners.
No vague advice - only specific actionable steps.
Return: {"ideas":[ ... ]}.
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
}
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
