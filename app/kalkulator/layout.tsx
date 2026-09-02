import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator negocjacji kursów walut — pipsy.pl",
  description: "Porównaj całkowity koszt ofert walutowych, policz efektywny kurs i przygotuj konkretną liczbę do negocjacji.",
  openGraph: {
    title: "Kalkulator negocjacji kursów walut — pipsy.pl",
    description: "Porównaj koszt całkowity ofert i przygotuj konkretną liczbę do negocjacji.",
    type: "website",
    locale: "pl_PL",
    images: [{ url: "https://pipsy.pl/og-v2.png", width: 1734, height: 907, alt: "Kalkulator negocjacji kursów walut pipsy.pl" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalkulator negocjacji kursów walut — pipsy.pl",
    description: "Porównaj koszt całkowity ofert i przygotuj konkretną liczbę do negocjacji.",
    images: ["https://pipsy.pl/og-v2.png"],
  },
};

export default function CalculatorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
