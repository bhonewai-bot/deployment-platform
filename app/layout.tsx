import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "Deploy to Dokploy | Monolithic Void",
  description:
    "Configure a Dokploy deployment inside the Monolithic Void control plane.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full">
        <Sidebar />
        {children}
      </body>
    </html>
  );
}
