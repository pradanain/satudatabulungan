import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { TAB_TITLE_SUFFIX, getMetadataBase } from "@/lib/utils/metadata";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: TAB_TITLE_SUFFIX,
    template: `%s | ${TAB_TITLE_SUFFIX}`,
  },
  description:
    "Portal data resmi Pemerintah Kabupaten Bulungan untuk penelusuran dataset, metadata, dan layanan API.",
  icons: {
    icon: [{ url: "/assets/brand/logos/lambang-bulungan-icon-square.png", type: "image/png" }],
    shortcut: [{ url: "/assets/brand/logos/lambang-bulungan-icon-square.png", type: "image/png" }],
    apple: [{ url: "/assets/brand/logos/lambang-bulungan-icon-square.png", type: "image/png" }],
  },
  openGraph: {
    title: TAB_TITLE_SUFFIX,
    description:
      "Portal data resmi Pemerintah Kabupaten Bulungan untuk penelusuran dataset, metadata, dan layanan API.",
    siteName: TAB_TITLE_SUFFIX,
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TAB_TITLE_SUFFIX,
    description:
      "Portal data resmi Pemerintah Kabupaten Bulungan untuk penelusuran dataset, metadata, dan layanan API.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${sora.variable}`}>
      <body className="overflow-x-hidden antialiased" style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
