import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovaMindUltra — Your AI coding partner",
  description: "Think through code, solve bugs, and build better with NovaMindUltra.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
