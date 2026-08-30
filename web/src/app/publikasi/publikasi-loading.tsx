import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Card } from "@/components/ui/card";

export function PublikasiLoadingShell() {
  return (
    <PortalPageShell activeMenu="publikasi">
      <section>
        <Card className="overflow-hidden rounded-[28px] border-(--color-border) bg-white p-0">
          <div className="grid min-h-70 animate-pulse lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-4 bg-[linear-gradient(96deg,#ffffff_0%,#fffefb_44%,#f9f5e9_78%,#f5efdd_100%)] px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div className="h-3 w-32 rounded bg-[#e6eaf2]" />
              <div className="h-10 w-4/5 rounded bg-[#e6eaf2]" />
              <div className="h-5 w-full max-w-2xl rounded bg-[#e6eaf2]" />
              <div className="h-5 w-3/4 rounded bg-[#e6eaf2]" />
            </div>
            <aside className="relative min-h-55 border-t border-(--color-border) bg-[#f3f6fb] lg:min-h-70 lg:border-t-0">
              <div className="absolute left-4 top-4 h-14 w-40 rounded-2xl bg-white/90 sm:left-6 sm:top-6" />
              <div className="absolute bottom-4 right-4 h-36 w-56 rounded-2xl bg-[#e6eaf2]" />
            </aside>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="h-9 w-64 animate-pulse rounded bg-[#e6eaf2]" />
              <div className="h-5 w-80 animate-pulse rounded bg-[#e6eaf2]" />
            </div>
            <div className="h-10 w-44 animate-pulse rounded-xl bg-[#e6eaf2]" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={`loading-card-${index + 1}`} className="overflow-hidden border-[#d2d9e4] bg-white p-0 shadow-none">
                <div className="h-1.5 w-full bg-[#dce4f3]" />
                <div className="h-48 animate-pulse bg-[#e6eaf2]" />
                <div className="space-y-3 p-5">
                  <div className="h-7 w-5/6 rounded bg-[#e6eaf2]" />
                  <div className="h-5 w-full rounded bg-[#e6eaf2]" />
                  <div className="h-4 w-3/5 rounded bg-[#e6eaf2]" />
                  <div className="h-9 w-20 rounded-lg bg-[#e6eaf2]" />
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </section>
    </PortalPageShell>
  );
}
