"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientDataTable, ColumnDef } from "@/components/internal/client-data-table";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { InternalPublication, InternalSession } from "@/lib/types/internal";
import { hasPermission } from "@/lib/utils/internal-auth";

const typeLabelMap: Record<string, string> = {
  news: "Berita",
  digital_publication: "Publikasi Digital",
  infographic: "Infografis",
  regulation: "Regulasi",
  technical_guide: "Petunjuk Teknis",
};

export function PublicationTable({
  publications,
  session,
}: {
  publications: InternalPublication[];
  session: InternalSession;
}) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const tabs = [
    { id: "all", label: "Semua Konten" },
    { id: "news", label: "Berita" },
    { id: "digital_publication", label: "Publikasi Digital" },
    { id: "infographic", label: "Infografis" },
    { id: "regulation", label: "Regulasi" },
    { id: "technical_guide", label: "Petunjuk Teknis" },
  ];

  const filteredPublications = useMemo(() => {
    if (activeTab === "all") return publications;
    return publications.filter((pub) => pub.type === activeTab);
  }, [publications, activeTab]);

  const columns: ColumnDef<InternalPublication>[] = [
    {
      key: "title",
      header: "Judul",
      render: (pub) => (
        <div className="min-w-[220px]">
          <Link
            href={`/internal/publications/${pub.slug}`}
            className="font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] line-clamp-2"
          >
            {pub.title}
          </Link>
        </div>
      ),
    },
    {
      key: "type",
      header: "Jenis Konten",
      render: (pub) => (
        <div className="whitespace-nowrap">
          <span className="text-sm font-medium text-[var(--color-muted)]">
            {typeLabelMap[pub.type] || pub.type}
          </span>
        </div>
      ),
    },
    {
      key: "organization",
      header: "OPD / Sumber",
      render: (pub) => (
        <div className="min-w-[140px]">
          <p className="font-medium text-[var(--color-text)] truncate">{pub.organizationName}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (pub) => (
        <div className="whitespace-nowrap">
          <InternalStatusBadge status={pub.status} />
        </div>
      ),
    },
    {
      key: "lastUpdated",
      header: "Terakhir Diperbarui",
      render: (pub) => (
        <div className="whitespace-nowrap text-[var(--color-muted)] font-medium">
          {formatIndonesianDate(pub.updatedAt)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      sortable: false,
      className: "text-right",
      render: (pub) => {
        // Can edit if Walidata (manage_all) or Produsen (edit_own_draft AND is owner)
        const canEdit =
          hasPermission(session, "content.manage_all") ||
          (hasPermission(session, "content.edit_own_draft") && pub.createdByUserId === session.userId);

        return (
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
              >
                <Link href={`/internal/publications/${pub.slug}/edit`} title="Edit Konten">
                  <Edit className="size-4" />
                  <span className="sr-only">Edit Konten</span>
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
            >
              <Link href={`/internal/publications/${pub.slug}`} title="Lihat Detail">
                <Eye className="size-4" />
                <span className="sr-only">Lihat Detail</span>
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--color-border)] px-4 sm:px-5">
        <div className="flex gap-4 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <ClientDataTable
        data={filteredPublications}
        columns={columns}
        searchable={true}
        searchPlaceholder="Cari publikasi..."
        searchFn={(pub, query) =>
          pub.title.toLowerCase().includes(query.toLowerCase()) ||
          (pub.organizationName || "").toLowerCase().includes(query.toLowerCase())
        }
        emptyMessage="Belum ada konten publikasi."
      />
    </div>
  );
}
