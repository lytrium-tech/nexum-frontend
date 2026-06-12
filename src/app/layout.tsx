import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const generalSans = localFont({
  src: [
    {
      path: "./fonts/GeneralSans-Variable.woff2",
      style: "normal",
    },
    {
      path: "./fonts/GeneralSans-VariableItalic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-general-sans",
});

export const metadata: Metadata = {
  title: "Nexum",
  description: "Financial Intelligence Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${generalSans.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-warm-white text-graphite-blue">
        {children}
      </body>
    </html>
  );
}
