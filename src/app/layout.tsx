import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asistencia — Taller Remotto",
  description: "Registro de asistencia del taller de vibe coding de Remotto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <footer className="mt-auto border-t border-border py-5 text-center text-sm text-muted">
          <a
            href="https://remotto.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Remotto
          </a>{" "}
          ·{" "}
          <a href="/admin" className="hover:text-foreground transition-colors">
            Taller Vibe Coding
          </a>
        </footer>
      </body>
    </html>
  );
}
