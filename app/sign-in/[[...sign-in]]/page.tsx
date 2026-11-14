import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <main className="auth-page"><a className="auth-brand" href="/">✦ NovaMindUltra</a><SignIn /></main>;
}
