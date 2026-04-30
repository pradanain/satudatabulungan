import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink, Globe, Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SearchBar } from "@/components/portal/search-bar";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import opdDirectory from "@/lib/data/opd-directory.json";
import { cn } from "@/lib/utils/cn";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { buildDatasetQuery } from "@/lib/utils/query";
import { normalizePositiveInteger, pickQueryValue } from "@/lib/utils/publication-query";

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

type OrganisasiPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const directoryEntries = opdDirectory as DirectoryEntry[];
const ORGANISASI_PAGE_SIZE = 9;
const EMPTY_VALUE_PATTERN = /^(?:-|n\/a|na|tidak ada|tidak tersedia|null|belum ada)$/i;

export const metadata: Metadata = buildPageMetadata({
  title: "Direktori Organisasi OPD",
  description:
    "Lihat direktori OPD Kabupaten Bulungan beserta kontak, kanal resmi, dan akses cepat ke dataset tiap organisasi.",
  path: "/organisasi",
  keywords: ["OPD Bulungan", "direktori organisasi", "kontak OPD", "dataset OPD"],
});

export const dynamic = "force-dynamic";

function isMeaningfulValue(value?: string) {
  const normalized = value?.trim();
  return Boolean(normalized && !EMPTY_VALUE_PATTERN.test(normalized));
}

function normalizeUrl(value?: string) {
  if (!isMeaningfulValue(value)) {
    return null;
  }

  const trimmed = value!.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function toDisplayWebsite(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.host.replace(/^www\./i, "");
  } catch {
    return url.replace(/^https?:\/\//i, "");
  }
}

function toSocialLinks(entry: DirectoryEntry) {
  return [
    { label: "Facebook", url: entry.facebook },
    { label: "Instagram", url: entry.instagram },
    { label: "YouTube", url: entry.youtube },
    { label: "TikTok", url: entry.tiktok },
    { label: "X/Twitter", url: entry.twitter },
  ]
    .map((item) => ({ ...item, url: normalizeUrl(item.url) }))
    .filter((item) => Boolean(item.url)) as Array<{ label: string; url: string }>;
}

function buildOrganizationQuery(params: { q?: string; page?: number }) {
  const query = new URLSearchParams();

  if (params.q?.trim()) {
    query.set("q", params.q.trim());
  }

  if (params.page && params.page > 1) {
    query.set("page", `${params.page}`);
  }

  const value = query.toString();
  return value ? `?${value}` : "";
}

function getPages(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("...");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("...");
  }

  pages.push(totalPages);
  return pages;
}

export default async function OrganisasiPage({ searchParams }: OrganisasiPageProps) {
  const rawParams = await searchParams;
  const searchQuery = pickQueryValue(rawParams.q) ?? "";
  const requestedPage = normalizePositiveInteger(rawParams.page, 1);

  const normalizedKeyword = searchQuery.trim().toLowerCase();
  const filteredEntries = normalizedKeyword
    ? directoryEntries.filter((entry) =>
        [
          entry.name,
          entry.status,
          entry.address,
          entry.phone,
          entry.email,
          entry.whatsapp,
          entry.website,
          entry.websiteListed,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedKeyword),
      )
    : directoryEntries;

  const totalItems = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ORGANISASI_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * ORGANISASI_PAGE_SIZE;
  const pageEntries = filteredEntries.slice(startIndex, startIndex + ORGANISASI_PAGE_SIZE);
  const pages = getPages(currentPage, totalPages);

  const withWebsiteCount = directoryEntries.filter((item) => isMeaningfulValue(item.website)).length;
  const withContactCount = directoryEntries.filter(
    (item) =>
      isMeaningfulValue(item.address) ||
      isMeaningfulValue(item.phone) ||
      isMeaningfulValue(item.email) ||
      isMeaningfulValue(item.whatsapp),
  ).length;

  return (
    <PortalPageShell activeMenu="tentang">
      <section>
        <Card className="overflow-hidden bg-gradient-to-br from-[#f1efe8] to-[#e7effa]">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <SectionHeading
                title="Organisasi / OPD"
                description="Direktori perangkat daerah Kabupaten Bulungan berisi profil OPD, situs resmi, kontak, dan akses cepat menuju dataset."
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">{directoryEntries.length} OPD</Badge>
                <Badge variant="outline">{withWebsiteCount} punya website</Badge>
                <Badge variant="outline">{withContactCount} ada kontak dasar</Badge>
              </div>
            </div>

            <div className="flex w-full max-w-[280px] items-center gap-4 rounded-2xl border border-[#d7d3cb] bg-white/80 p-4 shadow-sm">
              <Image
                src="/assets/brand/logos/lambang-bulungan.png"
                alt="Lambang Pemerintah Kabupaten Bulungan"
                width={80}
                height={96}
                className="h-auto w-14 shrink-0 sm:w-16"
              />
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6967]">Pemerintah Kabupaten</p>
                <p className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold leading-tight text-[#2d2826]">
                  Bulungan
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <SearchBar action="/organisasi" defaultValue={searchQuery} placeholder="Cari nama OPD, website, alamat, email, atau kontak..." />

      <section>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              title="Daftar Organisasi"
              description={`Menampilkan ${pageEntries.length} dari ${totalItems} organisasi${searchQuery ? ` untuk kata kunci "${searchQuery}"` : ""}.`}
              titleClassName="text-2xl sm:text-3xl"
              descriptionClassName="text-sm sm:text-base"
            />

            {searchQuery ? (
              <Button asChild variant="secondary" className="rounded-lg">
                <Link href="/organisasi">Reset Pencarian</Link>
              </Button>
            ) : null}
          </div>

          {pageEntries.length > 0 ? (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pageEntries.map((entry) => {
                  const website = normalizeUrl(entry.website);
                  const sourceUrl = normalizeUrl(entry.sourceUrl);
                  const socialLinks = toSocialLinks(entry);
                  const hasAddress = isMeaningfulValue(entry.address);
                  const hasPhone = isMeaningfulValue(entry.phone);
                  const hasEmail = isMeaningfulValue(entry.email);
                  const hasWhatsapp = isMeaningfulValue(entry.whatsapp);
                  const hasContact = hasAddress || hasPhone || hasEmail || hasWhatsapp;

                  return (
                    <Card key={`${entry.no}-${entry.name}`} className="flex h-full flex-col gap-4 border-[#ddd7cd] p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="m-0 font-[family-name:var(--font-heading)] text-xl font-semibold leading-tight text-[#2d2826]">
                          {entry.name}
                        </h2>
                        <Badge variant="secondary" className="shrink-0">
                          OPD #{entry.no}
                        </Badge>
                      </div>

                      {isMeaningfulValue(entry.status) ? (
                        <p className="m-0 text-xs leading-relaxed text-[var(--color-muted)]">{entry.status}</p>
                      ) : null}

                      {website ? (
                        <div className="rounded-xl border border-[#e5e0d8] bg-[#faf8f4] p-3">
                          <p className="m-0 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#6b6563]">
                            <Globe className="size-3.5" aria-hidden="true" />
                            Website
                          </p>
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 break-all text-sm font-medium text-[var(--color-accent-blue)] underline underline-offset-2"
                          >
                            {toDisplayWebsite(website)}
                            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                          </a>
                        </div>
                      ) : (
                        <p className="m-0 text-sm leading-relaxed text-[var(--color-muted)]">Website belum tersedia pada sumber yang terdaftar.</p>
                      )}

                      {hasContact ? (
                        <div className="grid gap-2 text-sm leading-relaxed text-[#5f5957] sm:grid-cols-2">
                          {hasAddress ? (
                            <p className="m-0 flex gap-2 sm:col-span-2">
                              <MapPin className="mt-0.5 size-4 shrink-0 text-[#6b6563]" aria-hidden="true" />
                              <span>{entry.address}</span>
                            </p>
                          ) : null}
                          {hasPhone ? (
                            <p className="m-0 flex items-center gap-2">
                              <Phone className="size-4 shrink-0 text-[#6b6563]" aria-hidden="true" />
                              <span>{entry.phone}</span>
                            </p>
                          ) : null}
                          {hasEmail ? (
                            <p className="m-0 flex items-center gap-2">
                              <Mail className="size-4 shrink-0 text-[#6b6563]" aria-hidden="true" />
                              <span className="break-all">{entry.email}</span>
                            </p>
                          ) : null}
                          {hasWhatsapp ? (
                            <p className="m-0 flex items-center gap-2">
                              <MessageCircle className="size-4 shrink-0 text-[#6b6563]" aria-hidden="true" />
                              <span>{entry.whatsapp}</span>
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {socialLinks.length ? (
                        <div className="flex flex-wrap gap-2">
                          {socialLinks.map((social) => (
                            <Button
                              key={`${entry.name}-${social.label}`}
                              asChild
                              variant="secondary"
                              size="sm"
                              className="rounded-full px-3"
                            >
                              <a href={social.url} target="_blank" rel="noopener noreferrer">
                                {social.label}
                              </a>
                            </Button>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-auto grid gap-2 pt-1 sm:grid-cols-2">

                        {sourceUrl ? (
                          <Button asChild variant="ghost" className="h-10 w-full rounded-lg text-sm text-[var(--color-muted)]">
                            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                              Sumber Profil
                            </a>
                          </Button>
                        ) : (
                          <div />
                        )}

                        <Button asChild variant="secondary" className="w-full rounded-lg">
                          <Link href={`/dataset${buildDatasetQuery({ organization: entry.name, sort: "terbaru" })}`}>
                            Lihat Dataset OPD
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <nav className="mt-7 border-t border-[var(--color-border)] pt-5" aria-label="Navigasi halaman organisasi">
                  <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#f8fbff] p-3 sm:p-4">
                    <Button
                      asChild
                      variant="secondary"
                      size="icon"
                      className={cn("rounded-full", currentPage === 1 && "pointer-events-none opacity-45")}
                    >
                      <Link
                        href={`/organisasi${buildOrganizationQuery({ q: searchQuery, page: currentPage - 1 })}`}
                        aria-disabled={currentPage === 1}
                        aria-label="Halaman sebelumnya"
                      >
                        <ChevronLeft className="size-5" />
                      </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                      {pages.map((page, index) =>
                        page === "..." ? (
                          <span key={`dots-${index}`} className="px-1 text-sm font-medium text-[var(--color-muted)]">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            asChild
                            variant={page === currentPage ? "default" : "secondary"}
                            size="sm"
                            className="min-w-10 rounded-full px-3"
                          >
                            <Link href={`/organisasi${buildOrganizationQuery({ q: searchQuery, page })}`}>{page}</Link>
                          </Button>
                        ),
                      )}
                    </div>

                    <Button
                      asChild
                      variant="secondary"
                      size="icon"
                      className={cn("rounded-full", currentPage === totalPages && "pointer-events-none opacity-45")}
                    >
                      <Link
                        href={`/organisasi${buildOrganizationQuery({ q: searchQuery, page: currentPage + 1 })}`}
                        aria-disabled={currentPage === totalPages}
                        aria-label="Halaman berikutnya"
                      >
                        <ChevronRight className="size-5" />
                      </Link>
                    </Button>
                  </div>
                </nav>
              ) : null}
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#c9ced8] bg-[#f8fbff] p-5">
              <h3 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold text-[#2d2826]">Organisasi tidak ditemukan</h3>
              <p className="mb-0 mt-2 text-sm text-[var(--color-muted)] sm:text-base">
                Coba kata kunci lain atau reset pencarian untuk melihat seluruh daftar OPD.
              </p>
              <Button asChild variant="secondary" className="mt-4 rounded-lg">
                <Link href="/organisasi">Reset Pencarian</Link>
              </Button>
            </div>
          )}
        </Card>
      </section>
    </PortalPageShell>
  );
}
