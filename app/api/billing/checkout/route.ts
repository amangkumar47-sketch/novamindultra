import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to choose a plan." }, { status: 401 });
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!secret || !price || !appUrl) return NextResponse.json({ error: "Billing is not configured yet. Add Stripe settings in Vercel." }, { status: 503 });

  try {
    const user = await currentUser();
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: user?.emailAddresses[0]?.emailAddress,
      client_reference_id: userId,
      metadata: { clerkUserId: userId },
      subscription_data: { metadata: { clerkUserId: userId } },
      success_url: `${appUrl}/?billing=success`,
      cancel_url: `${appUrl}/?billing=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
