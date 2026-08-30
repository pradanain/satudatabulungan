import Link from "next/link";
import { ArchiveRestore, FileText, History, MoreVertical } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { DataToolbar } from "@/components/internal/data-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getScopedDatasets, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalArchivePage() {
  const session = await requireInternalSession("archive");
  const store = await loadInternalPortalStore();
  const datasets = getScopedDatasets(store, session).filter(item => item.status === "Archived");

  return (
    <InternalShell session={session} activeKey="archive">
      <InternalPageHeader
        title="Arsip Dataset"
        description={
          session.role === "walidata"
            ? "Lihat dataset yang diarsipkan. Anda dapat memulihkan dataset jika diperlukan."
            : "Lihat daftar dataset yang ditarik dari publikasi beserta alasannya."
        }
        badges={
          <>
            <Badge variant="outline">{datasets.length} dataset diarsipkan</Badge>
          </>
        }
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        <div className="border-b border-[var(--color-border)] px-4">
          <DataToolbar 
            searchPlaceholder="Cari dataset yang diarsipkan..."
            filters={
              <>
                <Badge variant="secondary" className="font-normal cursor-pointer hover:bg-[var(--color-border)]">OPD</Badge>
                <Badge variant="secondary" className="font-normal cursor-pointer hover:bg-[var(--color-border)]">Tanggal Arsip</Badge>
                <Badge variant="secondary" className="font-normal cursor-pointer hover:bg-[var(--color-border)]">Alasan</Badge>
                <Badge variant="secondary" className="font-normal cursor-pointer hover:bg-[var(--color-border)]">Diarsipkan Oleh</Badge>
              </>
            }
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-surface-soft)]/50 text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <tr>
                <th className="px-5 py-3 font-bold">Dataset</th>
                <th className="px-5 py-3 font-bold">OPD</th>
                <th className="px-5 py-3 font-bold">Status Sebelum</th>
                <th className="px-5 py-3 font-bold">Tanggal Arsip</th>
                <th className="px-5 py-3 font-bold">Diarsipkan Oleh</th>
                <th className="px-5 py-3 font-bold">Alasan</th>
                <th className="px-5 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {datasets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[var(--color-muted)]">
                    Tidak ada arsip dataset.
                  </td>
                </tr>
              ) : (
                datasets.map((dataset) => (
                  <tr key={dataset.slug} className="hover:bg-[var(--color-surface-soft)]/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-[var(--color-text)]">{dataset.title}</p>
                    </td>
                    <td className="px-5 py-4 text-[var(--color-muted)] font-medium truncate max-w-[200px]">
                      {dataset.organization}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className="text-[10px] bg-white">Published</Badge>
                    </td>
                    <td className="px-5 py-4 text-[var(--color-muted)]">
                      {formatIndonesianDate(dataset.lastUpdated)}
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text)] font-medium">
                      Admin Portal
                    </td>
                    <td className="px-5 py-4 text-[var(--color-muted)] truncate max-w-[150px]">
                      Pembaruan data tahunan selesai
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Aksi Arsip</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/internal/datasets/${dataset.slug}`}><FileText className="mr-2 size-4" /> Buka Detail</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/internal/workflow-history?dataset=${dataset.slug}`}><History className="mr-2 size-4" /> Lihat Riwayat</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                            <ArchiveRestore className="mr-2 size-4" /> Pulihkan Dataset
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </InternalShell>
  );
}
