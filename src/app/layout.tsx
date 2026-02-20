import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedScribe — AI Medical Notes",
  description: "AI-powered medical documentation with voice recording, live transcription, and intelligent note generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
