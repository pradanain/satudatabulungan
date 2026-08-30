import Image from "next/image";
import Link from "next/link";
import { Braces, Database, FileText, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";

export function IntegrationBanner() {
  return (
    <section aria-label="Interoperabilitas data">
      <Card className="relative overflow-hidden rounded-[28px] border-0 bg-linear-to-br from-[#2c2323] to-[#265fc3] p-6 text-white shadow-[0_12px_30px_rgba(29,40,57,0.16)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Interoperabilitas Data
            </h2>
            <p className="mb-0 mt-4 max-w-none text-sm leading-relaxed text-white/92 sm:text-base lg:max-w-275">
              Satu Data Kabupaten Bulungan disediakan agar data sektoral dapat diakses, dimanfaatkan, dan diintegrasikan secara aman dan
              terstandar untuk mendukung layanan publik, inovasi daerah, perencanaan pembangunan, serta pengambilan
              keputusan berbasis data.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dataset"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/95 px-4 text-sm font-semibold text-[#1f3359] transition hover:bg-white"
              >
                <Database className="size-4" />
                Dataset
              </Link>
              <Link
                href="/layanan-data/permintaan-data"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/95 px-4 text-sm font-semibold text-[#1f3359] transition hover:bg-white"
              >
                <FileText className="size-4" />
                Permintaan Data
              </Link>
              <Link
                href="/api"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/95 px-4 text-sm font-semibold text-[#1f3359] transition hover:bg-white"
              >
                <Braces className="size-4" />
                API
              </Link>
              <Link
                href="/publikasi-regulasi"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/95 px-4 text-sm font-semibold text-[#1f3359] transition hover:bg-white"
              >
                <Scale className="size-4" />
                Regulasi
              </Link>
            </div>
          </div>
          <Image
            src="/assets/brand/landmarks/perahu-naga.png"
            alt="Perahu Naga Festival Sungai Kayan"
            width={420}
            height={180}
            sizes="(min-width: 640px) 20rem, 18rem"
            className="h-auto w-72 justify-self-end opacity-95 sm:w-80"
          />
        </div>
      </Card>
    </section>
  );
}
