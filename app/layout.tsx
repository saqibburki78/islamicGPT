import type { Metadata } from "next";
import { Montserrat ,Noto_Nastaliq_Urdu, Roboto,Noto_Kufi_Arabic} from "next/font/google"; // Luxury Fonts
import "./globals.css";

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ["latin"],
  variable: "--font-urdu",
  display: "swap",
  weight: "600",
});
const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["latin"],
  variable: "--font-arabic",
  display: "swap",
  weight: "600",
});

const montserrat = Roboto({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: "400"
});

export const metadata: Metadata = {
  title: "islamicGPT that search Across most authintic Hadith and Tafseer Books",
  description: "It is A RAG Applicatin that search through the most authic islmaic books and give answer from it.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${notoNastaliqUrdu.variable} ${montserrat.variable}`}>
      <body className="antialiased font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
