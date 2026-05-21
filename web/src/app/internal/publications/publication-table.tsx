"use client";

import { useMemo } from "react";
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
  digital_publication: "Buku Digital",
  infographic: "Infografis",
  regulation: "Regulasi",
  technical_guide: "Petunjuk Teknis",
};

function getContentBaseUrl(type: string): string {
  switch (type) {
    case "news": return "/internal/berita";
    case "digital_publication": return "/internal/buku-digital";
    case "infographic": return "/internal/infografis";
    default: return "/internal/publications";
  }
}

export function PublicationTable({
  publications,
  session,
}: {
  publications: InternalPublication[];
  session: InternalSession;
}) {
  const columns: ColumnDef<InternalPublication>[] = [
    {
      key: "title",
      header: "Judul",
      render: (pub) => (
        <div className="min-w-[220px]">
          <Link
            href={`${getContentBaseUrl(pub.type)}/${pub.slug}`}
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
        const canEdit =
          hasPermission(session, "content.manage_all") ||
          (hasPermission(session, "content.edit_own_draft") && pub.createdByUserId === session.userId);

        const baseUrl = getContentBaseUrl(pub.type);

        return (
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
              >
                <Link href={`${baseUrl}/${pub.slug}/edit`} title="Edit Konten">
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
              <Link href={`${baseUrl}/${pub.slug}`} title="Lihat Detail">
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
      <ClientDataTable
        data={publications}
        columns={columns}
        searchable={true}
        searchPlaceholder="Cari konten..."
        searchFn={(pub, query) =>
          pub.title.toLowerCase().includes(query.toLowerCase()) ||
          (pub.organizationName || "").toLowerCase().includes(query.toLowerCase())
        }
        emptyMessage="Belum ada konten."
      />
    </div>
  );
}
