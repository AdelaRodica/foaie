import type { Metadata } from "next";
import type { ReactNode } from "react";

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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
