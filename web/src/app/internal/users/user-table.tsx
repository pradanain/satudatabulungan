"use client";

import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientDataTable, ColumnDef } from "@/components/internal/client-data-table";
import { internalRoleLabels } from "@/lib/utils/internal-auth";
import { cn } from "@/lib/utils/cn";
import { PortalAccount } from "@/lib/services/ckan-portal-api";

export function UserTable({
  accounts,
  actionButton,
}: {
  accounts: PortalAccount[];
  actionButton?: React.ReactNode;
}) {
  const columns: ColumnDef<PortalAccount>[] = [
    {
      key: "name",
      header: "Nama",
      render: (user) => (
        <div className="min-w-[140px]">
          <p className="font-bold text-[var(--color-text)]">{user.name}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (user) => (
        <div className="min-w-[160px]">
          <p className="text-sm text-[var(--color-muted)] truncate">{user.email || user.username}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "WhatsApp/No HP",
      render: (user) => (
        <span className="text-sm text-[var(--color-muted)]">{user.phone || "-"}</span>
      ),
    },
    {
      key: "organizationName",
      header: "OPD",
      render: (user) => (
        <div className="text-[var(--color-text)] font-medium truncate max-w-[180px]">
          {user.organizationName || "-"}
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge variant="secondary" className={cn(
          user.role === "sekretariat" && "bg-purple-100 text-purple-700 hover:bg-purple-200",
          user.role === "pembina" && "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
          user.role === "walidata" && "bg-blue-100 text-blue-700 hover:bg-blue-200",
          user.role === "produsen" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        )}>
          {internalRoleLabels[user.role]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        user.status === "Aktif" ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap">Aktif</Badge>
        ) : (
          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 whitespace-nowrap">{user.status}</Badge>
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
      data={accounts}
      columns={columns}
      searchable={true}
      actionButton={actionButton}
      searchPlaceholder="Cari akun..."
      searchFn={(user, query) => 
        user.name.toLowerCase().includes(query.toLowerCase()) || 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        (user.organizationName || "").toLowerCase().includes(query.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(query.toLowerCase())
      }
      emptyMessage="Belum ada akun tersinkron."
    />
  );
}
