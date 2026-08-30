"use client";

import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientDataTable, ColumnDef } from "@/components/internal/client-data-table";
import type { InternalTopicReference, InternalOrganization } from "@/lib/types/internal";

type TopicsTableProps = {
  topics: InternalTopicReference[];
  organizations: InternalOrganization[];
  actionButton?: React.ReactNode;
};

export function TopicsTable({ topics, organizations, actionButton }: TopicsTableProps) {
  const orgById = new Map(organizations.map(o => [o.id, o]));

  const columns: ColumnDef<InternalTopicReference>[] = [
    {
      key: "name",
      header: "Topik",
      render: (topic) => (
        <div className="min-w-[180px]">
          <p className="font-bold text-[var(--color-text)]">{topic.name}</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)] truncate max-w-[250px]">{topic.description}</p>
        </div>
      ),
    },
    {
      key: "code",
      header: "Kode",
      render: (topic) => (
        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-xs whitespace-nowrap border border-gray-200">
          {topic.code}
        </code>
      ),
    },
    {
      key: "recommendedFormat",
      header: "Format",
      render: (topic) => (
        <span className="text-[var(--color-muted)]">{topic.recommendedFormat}</span>
      ),
    },
    {
      key: "defaultFrequency",
      header: "Frekuensi",
      render: (topic) => (
        <span className="text-[var(--color-muted)]">{topic.defaultFrequency}</span>
      ),
    },
    {
      key: "steward",
      header: "Steward",
      render: (topic) => (
        <span className="text-[var(--color-text)] font-medium">
          {orgById.get(topic.stewardOrganizationId)?.shortName || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (topic) => (
        <Badge variant="outline" className={
          topic.status === "Aktif"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap"
            : "border-amber-200 bg-amber-50 text-amber-700 whitespace-nowrap"
        }>
          {topic.status}
        </Badge>
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
      data={topics}
      columns={columns}
      searchable={true}
      actionButton={actionButton}
      searchPlaceholder="Cari topik..."
      searchFn={(topic, query) =>
        topic.name.toLowerCase().includes(query.toLowerCase()) ||
        topic.code.toLowerCase().includes(query.toLowerCase()) ||
        topic.description.toLowerCase().includes(query.toLowerCase())
      }
      emptyMessage="Belum ada topik dataset. Topik akan ditambahkan oleh Walidata."
    />
  );
}
