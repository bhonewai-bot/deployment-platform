import type { Metadata } from "next";
import "./styles/globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Deplus — Deploy from GitHub to Dokploy",
  description:
    "Connect your GitHub repository, configure environments and secrets, then ship builds to Dokploy with automatic SSL, monitoring, and custom domains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased")}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
