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
    <div className="internal-page-bg">
      <div className="internal-shell py-6 sm:py-8">
        <Card className="internal-surface mb-6 overflow-hidden border-transparent p-5 shadow-none sm:p-6">
          <div className="internal-ornament-band -mx-5 -mt-5 mb-5 h-8 border-b border-[var(--color-border)] sm:-mx-6 sm:-mt-6" />
          <div className="flex flex-col gap-4">
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
                  Seluruh halaman internal terintegrasi ke backend CKAN yang sama dengan portal publik,
                  sehingga perubahan publikasi akan tercermin pada katalog publik setelah sinkronisasi data.
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


