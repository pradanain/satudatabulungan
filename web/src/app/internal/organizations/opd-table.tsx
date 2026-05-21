"use client";

import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientDataTable, ColumnDef } from "@/components/internal/client-data-table";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import type { InternalOrganization } from "@/lib/types/internal";

type OrgWithCount = InternalOrganization & { datasetCount: number };

export function OpdTable({
  organizations,
  actionButton,
}: {
  organizations: OrgWithCount[];
  actionButton?: React.ReactNode;
}) {
  const columns: ColumnDef<OrgWithCount>[] = [
    {
      key: "name",
      header: "OPD",
      render: (org) => (
        <div className="min-w-[200px]">
          <p className="font-bold text-[var(--color-text)]">{org.shortName}</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)] truncate max-w-[250px]">{org.name}</p>
        </div>
      ),
    },
    {
      key: "leadName",
      header: "PIC",
      render: (org) => (
        <div className="min-w-[120px]">
          <p className="font-medium text-[var(--color-text)]">{org.leadName}</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{org.leadTitle}</p>
        </div>
      ),
    },
    {
      key: "datasetCount",
      header: "Jumlah Dataset",
      render: (org) => (
        <div className="whitespace-nowrap">
          <span className="font-bold">{org.datasetCount}</span>
          <span className="text-xs text-[var(--color-muted)] ml-1">Dataset</span>
        </div>
      ),
    },
    {
      key: "lastUpdated",
      header: "Aktivitas Terakhir",
      render: (org) => (
        <span className="whitespace-nowrap text-[var(--color-muted)] font-medium">
          {formatIndonesianDate(org.lastUpdated)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (org) => (
        org.status === "Perlu Tindak Lanjut" ? (
          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 whitespace-nowrap">
            Perlu Tindak Lanjut
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap">
            {org.status}
          </Badge>
        )
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      sortable: false,
      className: "text-right",
      render: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-muted)] hover:text-[var(--color-primary)]" title="Lihat Detail">
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <ClientDataTable
      data={organizations}
      columns={columns}
      searchable={true}
      actionButton={actionButton}
      searchPlaceholder="Cari OPD..."
      searchFn={(org, query) =>
        org.name.toLowerCase().includes(query.toLowerCase()) ||
        org.shortName.toLowerCase().includes(query.toLowerCase()) ||
        org.leadName.toLowerCase().includes(query.toLowerCase())
      }
      emptyMessage="Belum ada OPD terdaftar."
    />
  );
}
