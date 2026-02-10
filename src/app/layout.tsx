import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "MedScribe - AI Medical Notes",
  description: "HIPAA-compliant AI medical scribe with voice dictation and automatic note generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 ml-64 p-8">{children}</main>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
