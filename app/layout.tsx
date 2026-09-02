import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "pipsy.pl";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og-v2.jpg`;
  const title = "Kalkulator negocjacji kursów walut i ranking kantorów — pipsy.pl";
  const description = "Policz koszt całkowity wymiany walut w PLN, porównaj typy kantorów i banków oraz przygotuj konkretny cel negocjacyjny.";

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "pl_PL", images: [{ url: imageUrl, width: 1734, height: 907, alt: "pipsy.pl — nie porównuj kursów, porównuj koszt" }] },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pl"><body>{children}</body></html>;
}
