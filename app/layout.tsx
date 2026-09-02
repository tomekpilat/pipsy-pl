import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "pipsy.pl";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  const title = "pipsy.pl — policz, zanim zadzwonisz";
  const description = "Porównaj całkowity koszt ofert walutowych i przygotuj się do negocjacji kursu.";

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "pl_PL", images: [{ url: imageUrl, width: 1730, height: 909, alt: "pipsy.pl — policz, zanim zadzwonisz" }] },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pl"><body>{children}</body></html>;
}
