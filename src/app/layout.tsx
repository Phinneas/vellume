import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vellume - Pixel Art Journaling",
  description: "Convert your journal entries into beautiful pixel art",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
