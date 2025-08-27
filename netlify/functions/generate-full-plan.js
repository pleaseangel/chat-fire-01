exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { businessName, skills, time, budget, market, description } = JSON.parse(event.body || "{}");

  const prompt = `
You are a business implementation strategist creating a comprehensive 30-day business launch system. You are an expert at creating actionable, detailed, and non-generic plans. You must provide a plan for ALL sections requested.

Business: ${businessName}
Skills: ${skills}
Time available: ${time}/week
Budget: $${budget}
Market: ${market}
Base concept: ${description}

Create a complete business-in-a-box implementation guide with these exact sections. The content for each section must be a detailed, formatted string or a structured JSON object. Do not leave any section with "No data provided."

1. BUSINESS ANALYSIS
- Target customer profile with demographics
- Market size and opportunity assessment
- Competitive advantage analysis
- Revenue projections (realistic 30/60/90 day targets)

2. 30-DAY LAUNCH CALENDAR
Week 1: Foundation (setup, legal, initial inventory)
Week 2: Marketing foundation (content creation, platform setup)
Week 3: Customer acquisition (outreach, advertising, networking)
Week 4: Optimization (feedback integration, scaling preparation)

3. EMAIL TEMPLATES LIBRARY
- Initial outreach template
- Follow-up sequence (3 emails)
- Customer service responses
- Upselling/cross-selling scripts
- Refund/complaint handling

4. SOCIAL MEDIA CONTENT PACK
- 20 post ideas with exact copy
- Platform-specific strategies (Instagram/Facebook/TikTok)
- Hashtag research (50+ relevant hashtags)
- Content calendar template

5. PRICING STRATEGY GUIDE
- Cost analysis worksheet
- Competitor pricing research method
- Psychological pricing tactics
- Testing different price points

6. CUSTOMER ACQUISITION SYSTEM
- Lead generation strategies (5 methods)
- Sales funnel design
- Conversion optimization tactics
- Referral program setup

7. SCALING ROADMAP
- Month 2: Process optimization
- Month 3: Team building (first hire)
- Month 6: Product line expansion
- Month 12: $1000+ monthly target

8. TROUBLESHOOTING GUIDE
- Common problems and solutions
- When to pivot vs persist
- Crisis management protocols
- Legal/tax considerations

9. RESOURCE DIRECTORY
- Supplier recommendations
- Tool stack (free and paid options)
- Platform comparisons
- Industry-specific resources

10. SUCCESS METRICS
- KPIs to track weekly
- Milestone checkpoints
- Warning signs to watch
- Growth indicators

Make every section actionable with specific steps, templates, and measurable outcomes. Assume the user is a complete beginner who needs detailed guidance.

Return JSON format: {"sections": {"business_analysis": "...", "launch_calendar": "...", etc}}
`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Missing OPENAI_API_KEY" };

  const r = await fetch("[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 4000,
      messages: [
        { role: "system", content: "You are a business implementation expert. Return comprehensive, actionable business plans in JSON format." },
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
    return { statusCode: 502, body: "Invalid JSON response" };
  }
};
