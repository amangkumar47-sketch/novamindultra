import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  try {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) return NextResponse.json({ error: "No email address is associated with this account." }, { status: 400 });
    const stripe = new Stripe(secret);
    const customers = await stripe.customers.list({ email, limit: 10 });
    const customer = customers.data.find((item) => item.metadata.clerkUserId === userId);
    if (!customer) return NextResponse.json({ error: "No billing account was found. Start a subscription first." }, { status: 404 });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) return NextResponse.json({ error: "Billing return URL is not configured." }, { status: 503 });
    const session = await stripe.billingPortal.sessions.create({ customer: customer.id, return_url: appUrl });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not open billing settings." }, { status: 502 });
  }
}
