import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata = {
  title: "Jains Computer LMS",
  description: "Jains Computer Lecture Management System",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrainsMono.variable}`}>
      <body className={`${manrope.className} antialiased bg-[#070606] text-white min-h-screen relative`}>
        {/* Site-wide Ambient Red Glow & Fine Dotted Texture */}
        <div className="ambient" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div className="app min-h-screen relative z-[1]">
          {children}
        </div>
      </body>
    </html>
  );
}
