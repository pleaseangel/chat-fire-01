exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  
  const { skills = "", time = "", budget = "", market = "" } = JSON.parse(event.body);
  
  const prompt = `
Return strictly valid JSON. No commentary.
Generate 5 startup ideas under $${budget} for someone with ${skills} skills, ${time} available, targeting ${market} market.

CRITICAL: Make today_action EXTREMELY specific with ready-to-use copy-paste content. No research tasks, no "figure out" instructions. Give them exactly what to do, say, and where to go.

FORMATTING: Structure today_action with clear time blocks and line breaks using \\n for readability.

For each idea include:
- name (creative, specific business name)  
- description (compelling 3-4 sentences)
- startup_cost (like "$47")
- difficulty ("⭐" to "⭐⭐⭐⭐")
- feasibility_score ("X.X/10") 
- timeline ("5-8 days")
- today_action (SPECIFIC 2-hour action plan formatted with \\n line breaks. Include EXACT copy-paste templates, specific websites, exact messages to send, precise pricing recommendations. Structure as: TIME: ACTION with ready-to-use content. NO research tasks - provide the actual content they need.)
- success_example (specific, unique story with name, amount earned, and timeframe)

Example formatting for today_action:
"🕙 10:00 AM - 10:30 AM: Sign up at fiverr.com\\n• Create gig: 'I will write compelling product descriptions that sell'\\n• Set price: $15\\n• Use this exact description: 'Get product descriptions that convert browsers into buyers. I write compelling copy that highlights benefits and triggers purchases. 24-hour delivery guaranteed.'\\n\\n🕙 10:30 AM - 11:30 AM: Contact potential clients\\n• Send this message to 10 Etsy shop owners: 'Hi [Name]! Love your [product type] but noticed your descriptions could be more compelling. I write product copy that increases sales. Would you like a free sample rewrite of one product description? No strings attached - just want to show you what's possible!'\\n\\nExpected result: 2-3 interested responses within 24 hours."

Return: {"ideas":[ ... ]}.
`;
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
