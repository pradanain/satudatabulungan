"use client";

import { useState } from "react";
import { Check, X, Plus, ChevronDown, ChevronRight, ShieldCheck, SlidersHorizontal, CornerDownRight, BadgeInfo } from "lucide-react";
import { UserTable } from "./user-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { internalRoleLabels, hasPermission } from "@/lib/utils/internal-auth";
import { cn } from "@/lib/utils/cn";
import type { PortalAccount } from "@/lib/services/ckan-portal-api";
import type { InternalRole } from "@/lib/types/internal";

type UserRolesTabsProps = {
  accounts: PortalAccount[];
};

type PermissionMatrixRow = {
  label: string;
  check: (role: InternalRole) => "full" | "view" | "own" | "recommend" | false;
};

type PermissionGroup = {
  groupLabel: string;
  rows: PermissionMatrixRow[];
};

const permissionGroups: PermissionGroup[] = [
  {
    groupLabel: "Dataset",
    rows: [
      { label: "Lihat seluruh dataset", check: (r) => hasPermission(r, "dataset.view_all") ? "view" : hasPermission(r, "dataset.view_own_opd") ? "own" : false },
      { label: "Buat draft dataset OPD", check: (r) => hasPermission(r, "dataset.create_own_opd") ? "full" : false },
      { label: "Edit draft dataset OPD", check: (r) => hasPermission(r, "dataset.edit_draft_own_opd") ? "full" : false },
      { label: "Upload file resource", check: (r) => hasPermission(r, "dataset.upload_file") ? "full" : false },
      { label: "Edit metadata", check: (r) => hasPermission(r, "dataset.edit_metadata") ? "full" : false },
      { label: "Submit dataset", check: (r) => hasPermission(r, "dataset.submit") ? "full" : false },
    ],
  },
  {
    groupLabel: "Review & Validasi",
    rows: [
      { label: "Review dataset", check: (r) => hasPermission(r, "dataset.review") ? "full" : false },
      { label: "Tambah catatan review", check: (r) => hasPermission(r, "dataset.add_review_note") ? "full" : false },
      { label: "Minta revisi", check: (r) => hasPermission(r, "dataset.request_revision") ? "full" : false },
      { label: "Approve dataset", check: (r) => hasPermission(r, "dataset.approve") ? "full" : false },
    ],
  },
  {
    groupLabel: "Publikasi",
    rows: [
      { label: "Publish dataset", check: (r) => hasPermission(r, "dataset.publish") ? "full" : false },
      { label: "Unpublish dataset", check: (r) => hasPermission(r, "dataset.unpublish") ? "full" : false },
      { label: "Arsip dataset", check: (r) => hasPermission(r, "dataset.archive") ? "full" : false },
      { label: "Pulihkan dari arsip", check: (r) => hasPermission(r, "dataset.restore_from_archive") ? "full" : false },
    ],
  },
  {
    groupLabel: "Monitoring & Evaluasi",
    rows: [
      { label: "Lihat monitoring", check: (r) => hasPermission(r, "monitoring.view_all") ? "view" : hasPermission(r, "monitoring.view_own_opd") ? "own" : false },
      { label: "Buat catatan evaluasi", check: (r) => hasPermission(r, "monitoring.create_evaluation_note") ? "full" : false },
      { label: "Tugaskan tindak lanjut", check: (r) => hasPermission(r, "monitoring.assign_follow_up") ? "full" : false },
    ],
  },
  {
    groupLabel: "Master Data & Portal",
    rows: [
      { label: "Kelola topik", check: (r) => hasPermission(r, "master_data.manage_topics") ? "full" : hasPermission(r, "master_data.view_topics") ? "view" : false },
      { label: "Kelola organisasi", check: (r) => hasPermission(r, "master_data.manage_organizations") ? "full" : hasPermission(r, "master_data.view_organizations") ? "view" : false },
      { label: "Kelola pengguna", check: (r) => hasPermission(r, "portal.manage_users") ? "full" : false },
      { label: "Kelola integrasi", check: (r) => hasPermission(r, "portal.manage_integrations") ? "full" : false },
    ],
  },
];

const rolesList: InternalRole[] = ["sekretariat", "pembina", "walidata", "produsen"];

function PermissionIcon({ value }: { value: "full" | "view" | "own" | "recommend" | false }) {
  if (value === "full") return <Check className="mx-auto size-4 text-emerald-500" />;
  if (value === "view") return <span className="mx-auto inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 uppercase tracking-wider">Lihat</span>;
  if (value === "own") return <span className="mx-auto inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">OPD</span>;
  if (value === "recommend") return <span className="mx-auto inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 uppercase tracking-wider">Rek.</span>;
  return <X className="mx-auto size-3.5 text-gray-300" />;
}

export function UserRolesTabs({ accounts }: UserRolesTabsProps) {
  const [activeTab, setActiveTab] = useState<"users" | "permissions">("users");
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));

  const toggleGroup = (index: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(permissionGroups.map((_, i) => i)));
  const collapseAll = () => setExpandedGroups(new Set());

  const getRoleUserCount = (roleName: string) => accounts.filter(a => a.role === roleName).length;

  return (
    <div className="grid gap-6">
      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] overflow-x-auto hide-scrollbar bg-white rounded-xl p-2 shadow-sm">
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "px-5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-lg transition-all",
            activeTab === "users"
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-slate-50"
          )}
        >
          Akun
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={cn(
            "px-5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-lg transition-all",
            activeTab === "permissions"
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-slate-50"
          )}
        >
          Hak Akses
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <Card className="flex flex-col shadow-sm border-[var(--color-border)] overflow-hidden bg-white">
          <div className="flex items-center justify-end px-4 pt-3 sm:px-5">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Tambah Akun
            </Button>
          </div>
          <UserTable accounts={accounts} />
        </Card>
      )}

      {/* Permission Matrix Tab */}
      {activeTab === "permissions" && (
        <Card className="flex flex-col shadow-sm border-[var(--color-border)] p-5 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold">Hak Akses per Role</h3>
              <p className="text-sm text-[var(--color-muted)] mt-0.5">
                Matriks izin berdasarkan <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">internalRolePermissions</code>.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={expandAll}>Buka Semua</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={collapseAll}>Tutup Semua</Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
            <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" /> Diizinkan</span>
            <span className="inline-flex items-center gap-1.5"><X className="size-3.5 text-gray-300" /> Tidak</span>
            <span className="inline-flex items-center gap-1.5 text-sky-600 font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>Lihat <span className="text-[var(--color-muted)] font-normal normal-case tracking-normal text-xs">= Lihat saja</span></span>
            <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>OPD <span className="text-[var(--color-muted)] font-normal normal-case tracking-normal text-xs">= Milik OPD sendiri</span></span>
          </div>

          {/* Collapsible Groups */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[var(--color-border)] rounded-lg overflow-hidden">
              <thead className="bg-[var(--color-surface-soft)] text-[var(--color-muted)] sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-left font-semibold border-b border-[var(--color-border)] min-w-[220px]">Aktivitas</th>
                  {rolesList.map((role) => (
                    <th key={role} className="p-3 text-center font-semibold border-b border-[var(--color-border)] border-l min-w-[100px]">
                      {internalRoleLabels[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionGroups.map((group, gi) => {
                  const isExpanded = expandedGroups.has(gi);
                  return (
                    <tr key={`group-${gi}`} className="contents">
                      <td
                        colSpan={5}
                        className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/5 border-b border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-primary)]/10 transition-colors select-none"
                        onClick={() => toggleGroup(gi)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                          {group.groupLabel}
                          <span className="text-[10px] font-normal text-[var(--color-muted)] normal-case tracking-normal">
                            ({group.rows.length} izin)
                          </span>
                        </div>
                      </td>
                      {isExpanded && group.rows.map((row, ri) => (
                        <tr key={`row-${gi}-${ri}`} className="hover:bg-[var(--color-surface-soft)]/30 border-b border-[var(--color-border)]">
                          <td className="p-3 font-medium text-[var(--color-text)]">{row.label}</td>
                          {rolesList.map((role) => (
                            <td key={role} className="p-3 text-center border-l border-[var(--color-border)]">
                              <PermissionIcon value={row.check(role)} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
