import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const site = process.env.SITE_URL || "https://YOUR-SITE.netlify.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "Complete Starter Pack (5 ideas + PDF)" },
        unit_amount: 900
      },
      quantity: 1
    }],
    success_url: `${site}/?success=true`,
    cancel_url: `${site}/?canceled=true`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" }
  });
};
