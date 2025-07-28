import type { Metadata } from "next";
import Header from "./components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "AjudaDeBerco",
  description: "Aplicação de assistência e apoio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
