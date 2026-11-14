# NovaMindUltra

NovaMindUltra is a responsive AI coding workspace built with Next.js, Clerk, Stripe Checkout, and the Groq API.

## Setup

1. Use Node.js 20 or newer and install packages with `npm install`.
2. Create `.env.local` (never commit it) and configure these values:

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   GROQ_API_KEY=your_new_rotated_groq_key
   GROQ_MODEL=llama-3.3-70b-versatile
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PRICE_ID=price_your_subscription_price
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. In Clerk, enable your preferred sign-in methods and set the sign-in and sign-up URLs to `/sign-in` and `/sign-up`.
4. In Stripe, create a recurring subscription Price and use its `price_...` ID for `STRIPE_PRICE_ID`. Add the production domain in Stripe and use the Vercel URL as `NEXT_PUBLIC_APP_URL` after deploying.
5. Run `npm run dev` and open `http://localhost:3000`.

## Deploy on Vercel

Import this repository and add all variables above in **Project Settings → Environment Variables**. Set `NEXT_PUBLIC_APP_URL` to your production origin, such as `https://novamindultra.top`, then redeploy. Connect the domain through **Project Settings → Domains** and apply the DNS records Vercel provides.

## Included features and current boundaries

- Clerk sign-in/sign-up and authenticated chat API.
- Stripe subscription Checkout and customer billing portal. Configure Stripe and verify the subscription/webhook flow before treating paid status as an access entitlement; this starter does not yet enforce plan limits or sync subscription status into a database.
- Saved chats persist in the current browser using localStorage. They are not yet synced between devices or tied to a user account. Do not use shared/public devices for private conversations.
- Recent chat context is limited to 12 messages per AI request to keep requests smaller and quicker. Code is displayed in Markdown blocks; generated code is not executed.
- Add rate limiting and a durable database before a public launch.

Never expose secrets in client-side code or commit `.env.local`. The Groq key previously pasted into chat should be revoked and replaced; only place a fresh key in Vercel Environment Variables.
