import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/sonner";
import { StoreHydration } from "@/components/store-hydration";
import "./global.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Rento",
  description: "Run your PG without chasing rent.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        {children}
        <StoreHydration />
        <Toaster />
      </body>
    </html>
  );
}
