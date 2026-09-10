import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import "@/styles/globals.css";

const lora = localFont({
  src: "../fonts/lora/Lora-Variable.woff2",
  variable: "--font-lora",
  display: "swap",
  weight: "400 700",
  style: "normal",
});

export const metadata: Metadata = {
  title: "Foaie — Tu diario visual de lectura",
  description:
    "Foaie es una aplicación web para que cada persona pueda construir y explorar su propio diario visual de lectura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" className={lora.variable}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
