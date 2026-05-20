"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientDataTable, ColumnDef } from "@/components/internal/client-data-table";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { InternalDataset } from "@/lib/types/internal";

export function DatasetTable({ datasets }: { datasets: InternalDataset[] }) {
  const columns: ColumnDef<InternalDataset>[] = [
    {
      key: "title",
      header: "Nama Dataset",
      render: (dataset) => (
        <div className="min-w-[220px]">
          <Link href={`/internal/datasets/${dataset.slug}`} className="font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
            {dataset.title}
          </Link>
        </div>
      ),
    },
    {
      key: "organization",
      header: "OPD",
      render: (dataset) => (
        <div className="min-w-[140px]">
          <p className="font-medium text-[var(--color-text)] truncate">{dataset.organization}</p>
        </div>
      ),
    },
    {
      key: "topic",
      header: "Topik",
      render: (dataset) => (
        <div className="whitespace-nowrap">
          <span className="text-sm text-[var(--color-muted)]">{dataset.topic}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (dataset) => (
        <div className="whitespace-nowrap">
          <InternalStatusBadge status={dataset.status} />
        </div>
      ),
    },
    {
      key: "lastUpdated",
      header: "Terakhir Diperbarui",
      render: (dataset) => (
        <div className="whitespace-nowrap text-[var(--color-muted)] font-medium">
          {formatIndonesianDate(dataset.lastUpdated)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      sortable: false,
      className: "text-right",
      render: (dataset) => (
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-muted)] hover:text-[var(--color-primary)]">
          <Link href={`/internal/datasets/${dataset.slug}`} title="Lihat Detail">
            <Eye className="size-4" />
            <span className="sr-only">Lihat Detail</span>
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <ClientDataTable
      data={datasets}
      columns={columns}
      searchable={true}
      searchPlaceholder="Cari dataset..."
      searchFn={(dataset, query) => 
        dataset.title.toLowerCase().includes(query.toLowerCase()) || 
        (dataset.organization || "").toLowerCase().includes(query.toLowerCase()) ||
        (dataset.topic || "").toLowerCase().includes(query.toLowerCase())
      }
      emptyMessage="Belum ada dataset. Dataset akan muncul setelah Anda atau OPD mulai menambahkan data."
    />
  );
}
