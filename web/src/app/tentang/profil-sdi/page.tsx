import type { Metadata } from "next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Profil SDI",
  description:
    "Ringkasan Satu Data Indonesia sebagai acuan tata kelola data terstandar untuk Portal Satu Data Kabupaten Bulungan.",
  path: "/tentang/profil-sdi",
  keywords: ["Satu Data Indonesia", "profil SDI", "tata kelola data", "standar data"],
});

const sdiPrinciples = [
  "Standar Data",
  "Metadata",
  "Interoperabilitas Data",
  "Kode Referensi dan Data Induk",
] as const;

const sdiRoles = [
  {
    title: "Pembina Data",
    description: "Menyusun norma, standar, prosedur, dan kriteria penyelenggaraan data.",
  },
  {
    title: "Walidata",
    description: "Mengelola, memeriksa, dan menyebarluaskan data sesuai standar yang disepakati.",
  },
  {
    title: "Produsen Data",
    description: "Menghasilkan data sektoral dari setiap OPD secara akurat dan mutakhir.",
  },
] as const;

export default function ProfilSdiPage() {
  return (
    <PortalPageShell activeMenu="tentang">
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Profil Satu Data Indonesia"
            description="Satu Data Indonesia menjadi kerangka kolaborasi lintas instansi agar data pemerintah konsisten, terintegrasi, dan dapat dipakai bersama."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {sdiPrinciples.map((principle) => (
              <Badge key={principle} variant="outline">
                {principle}
              </Badge>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {sdiRoles.map((role) => (
          <Card key={role.title} className="p-5">
            <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold leading-tight">
              {role.title}
            </h2>
            <p className="mt-3 mb-0 text-sm leading-relaxed text-[var(--color-muted)]">
              {role.description}
            </p>
          </Card>
        ))}
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold leading-tight">
            Komitmen Portal Satu Data Bulungan
          </h2>
          <p className="mt-3 mb-0 text-sm leading-relaxed text-[var(--color-muted)]">
            Portal ini mendukung penerapan SDI di Kabupaten Bulungan melalui penyelarasan standar
            metadata, perbaikan kualitas data sektoral, dan publikasi dataset yang lebih terbuka
            untuk perencanaan pembangunan.
          </p>
        </Card>
      </section>
    </PortalPageShell>
  );
}
