import Link from "next/link";
import { redirect } from "next/navigation";
import { InternalLoginForm } from "@/components/internal/internal-login-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOptionalInternalSession } from "@/lib/utils/internal-auth-server";
import { internalRoleLabels } from "@/lib/utils/internal-auth";

export default async function InternalLandingPage() {
  const session = await getOptionalInternalSession();

  if (session) {
    redirect("/internal/dashboard");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f6fb_0%,#edf1f8_100%)]">
      <div className="shell py-6 sm:py-8">
        <Card className="overflow-hidden border-none bg-transparent shadow-none">
          <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[var(--color-border)] bg-white/94 p-5 shadow-[0_18px_40px_rgba(33,41,52,0.08)] sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="m-0 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  Akses Internal
                </p>
                <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight sm:text-4xl">
                  Login Internal Satu Data Bulungan
                </h1>
                <p className="mb-0 mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
                  Area internal ini dibangun untuk 3 peran utama: Admin, Walidata, dan Operator OPD.
                  Seluruh halaman internal memakai shared data layer yang sama dengan portal publik, jadi
                  perubahan status publikasi akan langsung tercermin pada katalog publik saat dataset
                  dipublikasikan.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(internalRoleLabels).map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" className="rounded-full px-5">
                <Link href="/dataset">Kembali ke Portal Publik</Link>
              </Button>
            </div>
          </div>
        </Card>

        <InternalLoginForm />
      </div>
    </div>
  );
}
