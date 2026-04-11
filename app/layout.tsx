import type { Metadata } from "next";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "Coploy",
  description:
    "Configure and launch a polished CloudDeploy production deployment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
