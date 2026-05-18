import type { Metadata } from "next";
import "./styles/globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Deploy to Dokploy | Monolithic Void",
  description:
    "Configure a Dokploy deployment inside the Gori Lab control plane.",
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
