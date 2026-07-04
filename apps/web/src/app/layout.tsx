import type { Metadata } from "next";
import { Nunito, Fredoka, Geist_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";
import { getAppSettings } from "@/lib/actions/user";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "GiftMind — the perfect gift for anyone in your life";
const DEFAULT_DESCRIPTION =
  "GiftMind turns who someone actually is into specific, thoughtful gift ideas — with the reasoning behind each one. Describe the person, and get gifts that feel like they came from someone who really knows them.";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getAppSettings();
    const title =
      (settings as { metaTitle?: string | null }).metaTitle?.trim() ||
      (settings as { appName?: string }).appName ||
      DEFAULT_TITLE;
    const description =
      (settings as { metaDescription?: string | null }).metaDescription?.trim() ||
      (settings as { appDescription?: string }).appDescription ||
      DEFAULT_DESCRIPTION;
    const appUrl = (settings as { appUrl?: string }).appUrl?.trim();
    let image = (settings as { ogImage?: string | null }).ogImage?.trim();
    if (image && !image.startsWith("http")) {
      const base = appUrl || process.env.NEXT_PUBLIC_APP_URL || "";
      image = base ? `${base.replace(/\/$/, "")}${image.startsWith("/") ? "" : "/"}${image}` : undefined;
    }
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: appUrl || undefined,
        images: image ? [{ url: image }] : undefined,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.variable} ${geistMono.variable} ${fredoka.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
