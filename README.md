# NovaMindUltra

NovaMindUltra is a responsive AI coding assistant built with Next.js and the Groq API. It can help explain code, draft snippets, and reason through debugging questions. It does not execute user code.

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add a **newly generated** Groq API key:

   ```env
   GROQ_API_KEY=your_new_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

4. Start the development server: `npm run dev`
5. Open `http://localhost:3000`.

Never put the Groq key in a `NEXT_PUBLIC_*` variable or in client-side code. The key is used only by the server API route at `/api/chat`.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. In **Project Settings → Environment Variables**, add `GROQ_API_KEY` and its value. Optionally add `GROQ_MODEL` if you want to use another model available to your Groq account.
3. Redeploy after adding or changing environment variables.
4. In Vercel, add `novamindultra.top` under **Project Settings → Domains**, then follow the DNS instructions Vercel shows for your domain registrar.

## Before inviting users

The chat API is publicly callable when the site is public. Add authentication, rate limiting, and usage limits before offering it broadly, and monitor provider usage to prevent unexpected costs. Review the privacy policy and terms for your service before launch. The UI currently keeps chat history in the page only; conversations are not saved to a database.
