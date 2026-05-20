import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, FileText, Download, ExternalLink, Calendar, Building } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const typeLabelMap: Record<string, string> = {
  news: "Berita",
  digital_publication: "Publikasi Digital",
  infographic: "Infografis",
  regulation: "Regulasi",
  technical_guide: "Petunjuk Teknis",
};

export default async function PublicationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await requireInternalSession("publications");
  const store = await loadInternalPortalStore();

  const pub = (store.publications || []).find((p) => p.slug === slug);
  if (!pub) {
    notFound();
  }

  // Auth check: Produsen can only view if own OPD (or if has content.view_all)
  if (!hasPermission(session, "content.view_all")) {
    if (pub.organizationId !== session.organizationId) {
      return (
        <InternalShell session={session} activeKey="publications">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="text-xl font-bold text-red-600">Akses Ditolak</h2>
            <p className="mt-2 text-gray-600">Anda tidak memiliki izin untuk melihat publikasi dari OPD lain.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/internal/publications">Kembali ke Daftar</Link>
            </Button>
          </div>
        </InternalShell>
      );
    }
  }

  const canEdit =
    hasPermission(session, "content.manage_all") ||
    (hasPermission(session, "content.edit_own_draft") && pub.createdByUserId === session.userId);

  return (
    <InternalShell session={session} activeKey="publications">
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
          <Link href="/internal/publications">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-gray-500">Kembali ke Publikasi</span>
      </div>

      <InternalPageHeader
        title={pub.title}
        description={`Dikelola oleh ${pub.organizationName} • Dibuat pada ${formatIndonesianDate(pub.createdAt)}`}
        badges={
          <div className="flex gap-2">
            <Badge variant="secondary">{typeLabelMap[pub.type] || pub.type}</Badge>
            <InternalStatusBadge status={pub.status} />
          </div>
        }
        actions={
          canEdit && (
            <Button asChild className="gap-2">
              <Link href={`/internal/publications/${pub.slug}/edit`}>
                <Edit className="w-4 h-4" />
                Edit Konten
              </Link>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[var(--color-border)] shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6">
              {/* Description */}
              {pub.description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Deskripsi Singkat</h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{pub.description}</p>
                </div>
              )}

              {/* News / Text Content */}
              {pub.type === "news" && pub.content && (
                <div className="space-y-2 border-t pt-4 border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Isi Berita</h3>
                  <div className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">{pub.content}</div>
                </div>
              )}

              {/* PDF Previewer */}
              {["digital_publication", "regulation", "technical_guide"].includes(pub.type) && (
                <div className="space-y-3 border-t pt-4 border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Pratinjau Dokumen</h3>
                  
                  {pub.fileUrl ? (
                    <div className="flex flex-col rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-50 p-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">{pub.fileUrl.split("/").pop()}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline" className="gap-1.5 h-8">
                            <a href={pub.fileUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5" />
                              Buka PDF
                            </a>
                          </Button>
                          <Button asChild size="sm" className="gap-1.5 h-8">
                            <a href={pub.fileUrl} download>
                              <Download className="w-3.5 h-3.5" />
                              Unduh PDF
                            </a>
                          </Button>
                        </div>
                      </div>
                      <div className="h-[550px] w-full bg-gray-100">
                        <object data={pub.fileUrl} type="application/pdf" className="w-full h-full">
                          {/* Browser fallback */}
                          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-sm text-gray-500 space-y-4">
                            <FileText className="w-16 h-16 text-gray-400" />
                            <div>
                              <p className="font-semibold text-gray-800">Pratinjau PDF tidak tersedia secara otomatis.</p>
                              <p className="text-xs mt-1">Gunakan tombol di atas atau tautan di bawah ini untuk membuka dokumen.</p>
                            </div>
                            <Button asChild size="sm" variant="outline" className="gap-1.5">
                              <a href={pub.fileUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                                Buka PDF ({pub.year || "Undef"})
                              </a>
                            </Button>
                          </div>
                        </object>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                      Berkas PDF belum diunggah atau tidak ditemukan.
                    </div>
                  )}
                </div>
              )}

              {/* Large Image Preview (Infographic & Cover Image) */}
              {["infographic", "news", "digital_publication"].includes(pub.type) && pub.imageUrl && (
                <div className="space-y-3 border-t pt-4 border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    {pub.type === "infographic" ? "Gambar Infografis" : "Gambar Utama / Cover"}
                  </h3>
                  <div className="flex justify-center bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pub.imageUrl}
                      alt={pub.title}
                      className={`max-h-[500px] rounded-lg shadow-sm ${
                        pub.type === "infographic" ? "object-contain w-full" : "object-cover"
                      }`}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-6">
          <Card className="border-[var(--color-border)] shadow-sm">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Informasi Metadata</h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Building className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Organisasi / OPD</p>
                    <p className="text-sm font-medium text-gray-800">{pub.organizationName}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Tahun Publikasi / Dokumen</p>
                    <p className="text-sm font-medium text-gray-800">{pub.year || "Tidak ditentukan"}</p>
                  </div>
                </div>

                {pub.type === "regulation" && pub.regulationNumber && (
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Nomor Regulasi</p>
                      <p className="text-sm font-medium text-gray-800">{pub.regulationNumber}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2 text-xs text-gray-500">
                <p>Status Alur Kerja: <strong className="text-gray-700">{pub.status}</strong></p>
                <p>Terakhir diperbarui: <strong className="text-gray-700">{formatIndonesianDate(pub.updatedAt)}</strong></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </InternalShell>
  );
}
