import Link from "next/link";
import { notFound } from "next/navigation";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getWorkflowItemBySlug,
  sortWorkflowAuditTimeline,
} from "@/lib/services/workflow-service";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatIndonesianDate } from "@/lib/utils/formatters";

type AuditPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickSingle(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}

function formatIndonesianDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const dynamic = "force-dynamic";

export default async function WorkflowAuditDetailPage({ params, searchParams }: AuditPageProps) {
  const session = await requireInternalSession("workflowHistory");
  const { slug } = await params;
  const rawQuery = await searchParams;

  const actorFilter = pickSingle(rawQuery.actor);
  const statusFilter = pickSingle(rawQuery.status);
  const dateFromFilter = pickSingle(rawQuery.dateFrom);
  const dateToFilter = pickSingle(rawQuery.dateTo);

  const baseItem = await getWorkflowItemBySlug(slug, session);
  if (!baseItem) {
    notFound();
  }

  const item = sortWorkflowAuditTimeline(baseItem);
  const timeline = item.auditTrail ?? [];

  const dateFromTs = dateFromFilter ? new Date(`${dateFromFilter}T00:00:00`).getTime() : null;
  const dateToTs = dateToFilter ? new Date(`${dateToFilter}T23:59:59.999`).getTime() : null;

  const filteredTimeline = timeline.filter((entry) => {
    const actorPass = !actorFilter || entry.actor.toLowerCase() === actorFilter.toLowerCase();
    const statusPass =
      !statusFilter ||
      entry.toStatus.toLowerCase() === statusFilter.toLowerCase() ||
      entry.fromStatus.toLowerCase() === statusFilter.toLowerCase();

    const entryTs = new Date(entry.at).getTime();
    const fromPass = dateFromTs === null || (!Number.isNaN(entryTs) && entryTs >= dateFromTs);
    const toPass = dateToTs === null || (!Number.isNaN(entryTs) && entryTs <= dateToTs);

    return actorPass && statusPass && fromPass && toPass;
  });

  const actorOptions = [...new Set(timeline.map((entry) => entry.actor))].sort((a, b) =>
    a.localeCompare(b, "id-ID"),
  );
  const statusOptions = [
    ...new Set(timeline.flatMap((entry) => [entry.fromStatus, entry.toStatus]).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "id-ID"));

  const exportParams = new URLSearchParams();
  if (actorFilter) {
    exportParams.set("actor", actorFilter);
  }
  if (statusFilter) {
    exportParams.set("status", statusFilter);
  }
  if (dateFromFilter) {
    exportParams.set("dateFrom", dateFromFilter);
  }
  if (dateToFilter) {
    exportParams.set("dateTo", dateToFilter);
  }

  const exportBasePath = `/api/internal/workflow/${item.slug}/audit/export`;
  const exportJsonHref = `${exportBasePath}?${new URLSearchParams({
    ...Object.fromEntries(exportParams.entries()),
    format: "json",
  }).toString()}`;
  const exportCsvHref = `${exportBasePath}?${new URLSearchParams({
    ...Object.fromEntries(exportParams.entries()),
    format: "csv",
  }).toString()}`;

  return (
    <InternalShell session={session} activeKey="workflowHistory">
      <InternalPageHeader
        title="Audit Trail Dataset"
        description={`Timeline lengkap perubahan status untuk dataset ${item.title}.`}
        badges={
          <>
            <Badge variant="outline">Total event: {timeline.length}</Badge>
            <Badge variant="outline">Terfilter: {filteredTimeline.length}</Badge>
            <Badge variant="outline">Slug: {item.slug}</Badge>
          </>
        }
        actions={
          <Button asChild variant="secondary" className="rounded-full px-5">
            <Link href="/internal/workflow-history">Kembali ke Riwayat Workflow</Link>
          </Button>
        }
      />

      <section>
        <Card className="p-5 sm:p-6">
          <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold">Filter Audit</h2>
          <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">
            Gunakan actor, status, dan rentang tanggal untuk mempersempit event audit.
          </p>

          <form method="GET" className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
              Actor
              <select
                name="actor"
                defaultValue={actorFilter}
                className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)]"
              >
                <option value="">Semua actor</option>
                {actorOptions.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
              Status
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)]"
              >
                <option value="">Semua status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
              Dari tanggal
              <Input type="date" name="dateFrom" defaultValue={dateFromFilter} />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
              Sampai tanggal
              <Input type="date" name="dateTo" defaultValue={dateToFilter} />
            </label>

            <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
              <Button type="submit" className="rounded-xl">
                Terapkan Filter
              </Button>
              <Button asChild variant="secondary" className="rounded-xl">
                <Link href={`/internal/workflow/${item.slug}/audit`}>Reset</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-xl">
                <Link href={exportJsonHref}>Export JSON</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-xl">
                <Link href={exportCsvHref}>Export CSV</Link>
              </Button>
            </div>
          </form>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold">Timeline Audit</h2>
          <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">
            Menampilkan {filteredTimeline.length} dari {timeline.length} event.
          </p>

          {filteredTimeline.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--color-border)] bg-[#fcfdff] p-4">
              <h3 className="m-0 text-base font-semibold">Tidak ada event audit sesuai filter</h3>
              <p className="mb-0 mt-1 text-sm text-[var(--color-muted)]">
                Coba ubah kombinasi filter actor, status, atau rentang tanggal.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {filteredTimeline.map((entry, index) => (
                <article
                  key={`${entry.slug}-${entry.at}-${entry.actor}-${index}`}
                  className="grid gap-2 rounded-xl border border-[var(--color-border)] bg-[#fffef9] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="m-0 text-base font-semibold">
                      {entry.fromStatus} {"->"} {entry.toStatus}
                    </h3>
                    <Badge variant="outline" className="uppercase">
                      {entry.persistedTo}
                    </Badge>
                  </div>
                  <p className="m-0 text-sm text-[#4c4644]">
                    <strong>Actor:</strong> {entry.actor}
                  </p>
                  <p className="m-0 text-sm text-[#4c4644]">
                    <strong>Waktu:</strong> {formatIndonesianDateTime(entry.at)} (
                    {formatIndonesianDate(entry.at)})
                  </p>
                  {entry.reviewNote ? (
                    <p className="m-0 text-sm text-[#4c4644]">
                      <strong>Catatan:</strong> {entry.reviewNote}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Card>
      </section>
    </InternalShell>
  );
}
