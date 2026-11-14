import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <main className="auth-page"><a className="auth-brand" href="/">✦ NovaMindUltra</a><SignUp /></main>;
}
