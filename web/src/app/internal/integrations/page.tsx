import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getActiveConfig, getDatasets } from "@/lib/services/dataset-service";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function InternalIntegrationsPage() {
  const session = await requireInternalSession("integrations");
  const config = getActiveConfig();
  const datasets = await getDatasets({ sort: "terbaru" });
  const sample = datasets[0];
  const packageShowPath = sample
    ? `/api/3/action/package_show?id=${encodeURIComponent(sample.slug)}`
    : "/api/3/action/package_show?id=<slug-dataset>";
  const packageSearchPath = "/api/3/action/package_search?rows=10&start=0";

  return (
    <InternalShell session={session} activeKey="integrations">
      <InternalPageHeader
        title="Status Integrasi Internal"
        description="Informasi mode data, endpoint aktif, dan ringkasan sinkronisasi ditampilkan khusus untuk penggunaan internal."
        badges={
          <>
            <Badge variant="outline">Internal Only</Badge>
            <Badge variant="outline">{datasets.length.toLocaleString("id-ID")} dataset terbaca</Badge>
          </>
        }
      />

      <section>
        <Card className="internal-surface border-transparent p-5 shadow-none sm:p-6">
          <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold">Ringkasan Integrasi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <h3 className="m-0 text-sm text-[var(--color-muted)]">Sumber Data Aktif</h3>
              <p className="mt-1 font-semibold">{config.dataSourceMode.toUpperCase()}</p>
            </article>
            <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <h3 className="m-0 text-sm text-[var(--color-muted)]">Base URL CKAN</h3>
              <p className="mt-1 break-all font-semibold">{config.ckanBaseUrl}</p>
            </article>
            <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <h3 className="m-0 text-sm text-[var(--color-muted)]">Total Dataset Terbaca</h3>
              <p className="mt-1 font-semibold">{datasets.length.toLocaleString("id-ID")}</p>
            </article>
          </div>
        </Card>
      </section>

      <section>
        <Card className="internal-surface border-transparent p-5 shadow-none sm:p-6">
          <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold">Endpoint Aktif</h2>
          <div className="mt-4 grid gap-3">
            <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
              <h3 className="m-0 text-base font-semibold">package_search</h3>
              <code className="mt-2 inline-block break-all rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                {`${config.ckanBaseUrl}${packageSearchPath}`}
              </code>
            </article>
            <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
              <h3 className="m-0 text-base font-semibold">package_show</h3>
              <code className="mt-2 inline-block break-all rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                {`${config.ckanBaseUrl}${packageShowPath}`}
              </code>
            </article>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <a href={`${config.ckanBaseUrl}${packageSearchPath}`} target="_blank" rel="noreferrer">
                Coba package_search
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <a href={`${config.ckanBaseUrl}${packageShowPath}`} target="_blank" rel="noreferrer">
                Coba package_show
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <Link href="/internal/workflow">Kembali ke Workflow</Link>
            </Button>
          </div>
        </Card>
      </section>
    </InternalShell>
  );
}


