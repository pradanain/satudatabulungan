import type { Metadata } from "next";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";
import opdDirectory from "@/lib/data/opd-directory.json";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { buildDatasetQuery } from "@/lib/utils/query";

type DirectoryEntry = {
  no: number;
  name: string;
  websiteListed: string;
  website: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  twitter: string;
  status: string;
  inspection: string;
  notes: string;
  sourceUrl: string;
};

const directoryEntries = opdDirectory as DirectoryEntry[];

export const metadata: Metadata = buildPageMetadata({
  title: "Direktori Organisasi OPD",
  description:
    "Lihat direktori OPD Kabupaten Bulungan beserta kontak, kanal resmi, dan akses cepat ke dataset tiap organisasi.",
  path: "/organisasi",
  keywords: ["OPD Bulungan", "direktori organisasi", "kontak OPD", "dataset OPD"],
});

export const dynamic = "force-dynamic";

function toSocialLinks(entry: DirectoryEntry) {
  return [
    { label: "Facebook", url: entry.facebook },
    { label: "Instagram", url: entry.instagram },
    { label: "YouTube", url: entry.youtube },
    { label: "TikTok", url: entry.tiktok },
    { label: "X/Twitter", url: entry.twitter },
  ].filter((item) => Boolean(item.url));
}

export default function OrganisasiPage() {
  const withWebsiteCount = directoryEntries.filter((item) => item.website).length;
  const withContactCount = directoryEntries.filter(
    (item) => item.address || item.phone || item.email || item.whatsapp,
  ).length;

  return (
    <PortalPageShell activeMenu="tentang">
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Organisasi / OPD"
            description="Direktori perangkat daerah Kabupaten Bulungan berisi informasi profil OPD, tautan situs, kontak, dan kanal media sosial yang tersedia."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">{directoryEntries.length} OPD</Badge>
            <Badge variant="outline">{withWebsiteCount} punya website</Badge>
            <Badge variant="outline">{withContactCount} ada kontak dasar</Badge>
          </div>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        {directoryEntries.map((entry) => {
          const socialLinks = toSocialLinks(entry);

          return (
            <Card key={`${entry.no}-${entry.name}`} className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold leading-tight">
                  {entry.name}
                </h2>
                <Badge variant="secondary">OPD #{entry.no}</Badge>
              </div>

              <p className="m-0 text-sm text-[var(--color-muted)]">{entry.status}</p>

              {entry.website ? (
                <p className="m-0 text-sm leading-relaxed text-[#5f5957]">
                  <strong className="text-[#3b3533]">Website:</strong>{" "}
                  <a
                    href={entry.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-[var(--color-accent-blue)] underline underline-offset-2"
                  >
                    {entry.website}
                  </a>
                </p>
              ) : (
                <p className="m-0 text-sm leading-relaxed text-[#5f5957]">
                  <strong className="text-[#3b3533]">Website:</strong> Tidak tersedia pada daftar
                  sumber
                </p>
              )}

              {entry.address ? (
                <p className="m-0 text-sm leading-relaxed text-[#5f5957]">
                  <strong className="text-[#3b3533]">Alamat:</strong> {entry.address}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {entry.phone ? <Badge variant="outline">Telp: {entry.phone}</Badge> : null}
                {entry.email ? <Badge variant="outline">Email: {entry.email}</Badge> : null}
                {entry.whatsapp ? <Badge variant="outline">WA: {entry.whatsapp}</Badge> : null}
              </div>

              {socialLinks.length ? (
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((social) => (
                    <Button
                      key={`${entry.name}-${social.label}`}
                      asChild
                      variant="secondary"
                      size="sm"
                      className="rounded-full"
                    >
                      <a href={social.url} target="_blank" rel="noopener noreferrer">
                        {social.label}
                      </a>
                    </Button>
                  ))}
                </div>
              ) : null}

              <p className="m-0 text-sm leading-relaxed text-[var(--color-muted)]">
                {entry.notes || "Belum ada catatan tambahan."}
              </p>

              <Button asChild variant="secondary" className="mt-auto w-fit rounded-lg">
                <Link href={`/dataset${buildDatasetQuery({ organization: entry.name, sort: "terbaru" })}`}>
                  Lihat Dataset Dari OPD Ini
                </Link>
              </Button>
            </Card>
          );
        })}
      </section>
    </PortalPageShell>
  );
}
