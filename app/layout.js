import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "Study Smart Innovations | Exam Portal",
  description: "Official proctored examination portal for Study Smart Innovations. Secure, standardized, and AI-evaluated testing environment for programming courses.",
  keywords: "Study Smart Innovations, Exam Portal, Programming Exam, Proctored Certification",
  authors: [{ name: "Study Smart Innovations" }],
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
