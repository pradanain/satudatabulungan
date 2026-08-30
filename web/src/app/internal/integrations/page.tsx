import Link from "next/link";
import { CheckCircle2, Eye, ExternalLink, Globe, Inbox, Lock, Server } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getActiveConfig } from "@/lib/services/dataset-service";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

// API endpoint registry - real endpoints from the portal
const apiEndpoints = [
  {
    id: "ckan-package-search",
    name: "Dataset Search API",
    description: "Pencarian dan listing dataset publik via CKAN Action API.",
    endpoint: "/api/3/action/package_search",
    method: "POST",
    visibility: "Publik" as const,
    status: "Aktif" as const,
  },
  {
    id: "ckan-package-show",
    name: "Dataset Detail API",
    description: "Menampilkan detail metadata dan resource dari satu dataset.",
    endpoint: "/api/3/action/package_show",
    method: "POST",
    visibility: "Publik" as const,
    status: "Aktif" as const,
  },
  {
    id: "ckan-org-list",
    name: "Organization List API",
    description: "Daftar organisasi/OPD yang terdaftar di portal.",
    endpoint: "/api/3/action/organization_list",
    method: "POST",
    visibility: "Publik" as const,
    status: "Aktif" as const,
  },
  {
    id: "ckan-org-show",
    name: "Organization Detail API",
    description: "Detail informasi organisasi beserta kontak dan metadata.",
    endpoint: "/api/3/action/organization_show",
    method: "POST",
    visibility: "Publik" as const,
    status: "Aktif" as const,
  },
  {
    id: "internal-workflow",
    name: "Workflow Transition API",
    description: "API transisi status dataset (submit, review, approve, dll).",
    endpoint: "/api/internal/workflow/transition",
    method: "POST",
    visibility: "Internal" as const,
    status: "Aktif" as const,
  },
  {
    id: "internal-draft",
    name: "Dataset Draft API",
    description: "API pembuatan dan pengelolaan draft dataset.",
    endpoint: "/api/internal/workflow/draft",
    method: "POST",
    visibility: "Internal" as const,
    status: "Aktif" as const,
  },
  {
    id: "internal-notes",
    name: "Dataset Notes API",
    description: "API catatan dan rekomendasi pada dataset.",
    endpoint: "/api/internal/datasets/[slug]/notes",
    method: "POST",
    visibility: "Internal" as const,
    status: "Aktif" as const,
  },
];

export default async function InternalIntegrationsPage() {
  const session = await requireInternalSession("integrations");
  const config = getActiveConfig();

  const publicEndpoints = apiEndpoints.filter(e => e.visibility === "Publik");
  const internalEndpoints = apiEndpoints.filter(e => e.visibility === "Internal");

  return (
    <InternalShell session={session} activeKey="integrations">
      <InternalPageHeader
        title="Integrasi & API"
        description="Kelola endpoint API publik dan internal, serta status koneksi backend CKAN."
      />

      {/* Connection Status */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-5 shadow-sm border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Server className="size-5" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-text)]">Backend CKAN</p>
              <p className="text-xs text-[var(--color-muted)]">Sumber data utama portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-3 mr-1" /> Terhubung
            </Badge>
            <span className="text-xs text-[var(--color-muted)] truncate">{config.ckanBaseUrl}</span>
          </div>
        </Card>

        <Card className="p-5 shadow-sm border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Globe className="size-5" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-text)]">Portal Publik</p>
              <p className="text-xs text-[var(--color-muted)]">Frontend portal Satu Data</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-3 mr-1" /> Aktif
            </Badge>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-[var(--color-primary)]">
              <Link href="/dataset">
                <ExternalLink className="size-3" /> Buka Portal
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* API Endpoints */}
      <Card className="flex flex-col shadow-sm border-[var(--color-border)] overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-base font-bold">Endpoint API</h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">Daftar endpoint yang tersedia di portal</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-surface-soft)]/50 text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <tr>
                <th className="px-5 py-3 font-bold">Nama API</th>
                <th className="px-5 py-3 font-bold">Endpoint</th>
                <th className="px-5 py-3 font-bold">Deskripsi</th>
                <th className="px-5 py-3 font-bold">Visibility</th>
                <th className="px-5 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {apiEndpoints.map((api) => (
                <tr key={api.id} className="hover:bg-[var(--color-surface-soft)]/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-bold text-[var(--color-text)]">{api.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-700">
                      {api.endpoint}
                    </code>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-muted)] max-w-[250px]">
                    {api.description}
                  </td>
                  <td className="px-5 py-3">
                    {api.visibility === "Publik" ? (
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap gap-1">
                        <Globe className="size-3" /> Publik
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 whitespace-nowrap gap-1">
                        <Lock className="size-3" /> Internal
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap">
                      {api.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </InternalShell>
  );
}
