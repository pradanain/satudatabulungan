"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import type { InternalRole } from "@/lib/types/internal";
import type { WorkflowItem } from "@/lib/types/workflow";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { ClientDataTable, type ColumnDef } from "@/components/internal/client-data-table";

type InternalReviewBoardProps = {
  items: WorkflowItem[];
  role: InternalRole;
};

const getTabsForRole = (role: InternalRole) => {
  const baseTabs = [
    { id: "semua", label: "Semua", statuses: [] as string[] },
    { id: "submitted", label: "Diajukan", statuses: ["Submitted"] },
    { id: "under-review", label: "Pemeriksaan", statuses: ["Under Review"] },
    { id: "need-revision", label: "Perlu Revisi", statuses: ["Need Revision"] },
    { id: "approved", label: "Layak Publikasi", statuses: ["Approved"] },
    { id: "published", label: "Dipublikasikan", statuses: ["Published"] },
  ];

  if (role === "produsen") {
    return [
      baseTabs[0],
      { id: "draft", label: "Draft", statuses: ["Draft"] },
      ...baseTabs.slice(1),
    ];
  }

  return baseTabs;
};

export function InternalReviewBoard({ items, role }: InternalReviewBoardProps) {
  const [activeTab, setActiveTab] = useState("semua");
  
  const TABS = getTabsForRole(role);
  const activeTabDef = TABS.find(t => t.id === activeTab) || TABS[0];
  
  const filteredItems = items.filter(item => {
    if (activeTabDef.statuses.length > 0 && !activeTabDef.statuses.includes(item.status)) return false;
    return true;
  });

  const columns: ColumnDef<WorkflowItem>[] = [
    {
      key: "title",
      header: "Dataset",
      render: (item) => (
        <div className="min-w-[280px] py-1">
          <Link
            href={`/internal/datasets/${item.slug}`}
            className="font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] text-left hover:underline transition-all block"
          >
            {item.title}
          </Link>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.organization}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <div className="whitespace-nowrap">
          <InternalStatusBadge status={item.status} />
        </div>
      ),
    },
    {
      key: "resourceCount",
      header: "Resource",
      render: (item) => (
        <div className="whitespace-nowrap font-semibold text-slate-700">
          {item.resourceCount} File
        </div>
      ),
    },
    {
      key: "notes",
      header: "Catatan",
      render: (item) => {
        const hasPembina = item.notes?.some(n => n.type === "pembina_recommendation");
        const hasSekretariat = item.notes?.some(n => n.type === "sekretariat_monitoring");
        const hasWalidata = item.notes?.some(n => n.type === "walidata_review");
        const hasUnresolved = item.notes?.some(n => !n.isResolved);

        if (!hasPembina && !hasSekretariat && !hasWalidata) {
          return <span className="text-xs text-[var(--color-muted)]">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
            {hasPembina && (
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 py-0 px-2 font-semibold">
                Pembina
              </Badge>
            )}
            {hasSekretariat && (
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 py-0 px-2 font-semibold">
                Sekretariat
              </Badge>
            )}
            {hasWalidata && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 py-0 px-2 font-semibold">
                Walidata
              </Badge>
            )}
            {hasUnresolved && (
              <Badge className="text-[10px] bg-red-100 text-red-800 border-red-200 py-0 px-2 font-extrabold animate-pulse">
                Ada Tindak Lanjut
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "lastUpdated",
      header: "Tanggal Masuk",
      render: (item) => (
        <div className="whitespace-nowrap text-[var(--color-muted)] font-medium">
          {formatIndonesianDate(item.lastUpdated)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      sortable: false,
      className: "text-right",
      render: (item) => (
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] transition-colors"
          title="Review Detail"
        >
          <Link href={`/internal/datasets/${item.slug}`}>
            <Eye className="size-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex border-b border-[var(--color-border)] overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab.id 
                ? "border-[var(--color-primary)] text-[var(--color-primary)]" 
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="shadow-sm border-[var(--color-border)] overflow-hidden bg-white">
        <ClientDataTable
          data={filteredItems}
          columns={columns}
          searchable={true}
          searchFn={(item, query) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.organization.toLowerCase().includes(query.toLowerCase())
          }
          emptyMessage="Tidak ada antrean review ditemukan."
        />
      </Card>
    </div>
  );
}
