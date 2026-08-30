import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpenCheck, ExternalLink, HelpCircle, FileSearch } from "lucide-react";
import { FaqInteractiveSection } from "@/components/portal/faq-interactive-section";
import { PortalHeroCard } from "@/components/portal/portal-hero-card";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { layananFaqSections, layananReferenceLinks } from "@/lib/data/layanan-data";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ Layanan Data",
  description:
    "FAQ lengkap layanan data publik: permintaan data, lisensi, metadata, penggunaan API, keamanan, dan troubleshooting integrasi.",
  path: "/layanan-data/faq",
  keywords: ["FAQ layanan data", "panduan data publik", "lisensi data", "keamanan API"],
});

export default function LayananDataFaqPage() {
  const totalItems = layananFaqSections.reduce((acc, section) => acc + section.items.length, 0);

  return (
    <PortalPageShell activeMenu="layanan-data">
      <div className="space-y-12 pb-20">
        {/* Institutional FAQ Hero */}
        <section>
          <PortalHeroCard
            eyebrow="PORTAL SATU DATA"
            title={
              <>
                FAQ Layanan <span className="text-(--color-primary)">Data</span>
              </>
            }
            description="Temukan jawaban cepat atas pertanyaan umum seputar lisensi data, format file, penggunaan portal, dan tata kelola data."
            decoration={
              <>
                <div className="absolute left-6 top-6 z-10 rounded-2xl border border-[#d5dbe7] bg-white/95 px-5 py-3 shadow-[0_12px_24px_rgba(33,41,52,0.12)]">
                  <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em] text-(--color-primary)">
                    REFERENSI RESMI
                  </p>
                  <p className="m-0 mt-1 flex items-center gap-2 font-(family-name:--font-heading) text-3xl font-semibold text-(--color-text)">
                    <HelpCircle className="size-5 text-(--color-primary)" />
                    {layananReferenceLinks.length} Dokumen
                  </p>
                </div>

                <div className="absolute bottom-[clamp(0.5rem,1.5vw,1.25rem)] right-[clamp(1rem,5vw,3rem)] z-2 flex items-end gap-0">
                  <Image
                    src="/assets/brand/illustrations/bulungan-laki-laki.png"
                    alt="Maskot Bulungan Laki-laki"
                    width={360}
                    height={520}
                    className="h-[clamp(12rem,22vw,15.5rem)] w-auto object-contain object-bottom drop-shadow-[0_12px_24px_rgba(40,46,56,0.15)] transition-transform hover:translate-y-[-5px]"
                  />
                  <Image
                    src="/assets/brand/illustrations/bulungan-perempuan.png"
                    alt="Maskot Bulungan Perempuan"
                    width={340}
                    height={500}
                    className="relative -ml-[24%] h-[clamp(9rem,16vw,11rem)] w-auto object-contain object-bottom drop-shadow-[0_12px_24px_rgba(40,46,56,0.15)] transition-transform hover:translate-y-[-5px]"
                  />
                </div>
              </>
            }
          />
        </section>

        {/* Interactive FAQ Section */}
        <section>
          <FaqInteractiveSection sections={layananFaqSections} />
        </section>

      </div>
    </PortalPageShell>
  );
}
