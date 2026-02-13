import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google"; // Luxury Fonts
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lillith - Luxury AI Assistant",
  description: "A sophisticated, premium chatbot interface.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable}`}>
      <body className="antialiased font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
