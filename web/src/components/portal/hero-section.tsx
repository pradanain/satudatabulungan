import Image from "next/image";
import Link from "next/link";
import { Code2, Database, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface HeroSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  slogan?: string;
  highlights?: string[];
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function HeroSection({
  eyebrow,
  title,
  description,
  slogan,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: HeroSectionProps) {
  return (
    <section>
      <Card className="relative overflow-hidden rounded-[28px] border-[var(--color-border)] bg-white p-0 shadow-[0_12px_28px_rgba(33,41,52,0.08)]">
        <div className="grid min-h-[320px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div className="relative z-[2] flex flex-col justify-center bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.99)_62%,rgba(249,245,227,0.82)_86%,rgba(249,245,227,0.18)_100%)] px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="w-fit border-transparent bg-transparent px-0 py-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] shadow-none"
              >
                {eyebrow}
              </Badge>
              <h1 className="m-0 max-w-xl font-[family-name:var(--font-heading)] text-4xl font-semibold leading-[0.98] tracking-tight text-[#09090b] sm:text-5xl lg:text-[4.35rem]">
                {title}
              </h1>
              <p className="m-0 max-w-lg text-base leading-relaxed text-[#5f5957] sm:text-[1.08rem]">
                {description}
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {actionHref && actionLabel ? (
                <Button asChild size="lg" className="rounded-2xl px-6 text-base">
                  <Link href={actionHref} className="inline-flex items-center gap-2">
                    <Database className="size-4.5" />
                    {actionLabel}
                  </Link>
                </Button>
              ) : null}
              {secondaryHref && secondaryLabel ? (
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="rounded-2xl border-[#cfd4df] bg-white px-6 text-base text-[#3f3a39]"
                >
                  <Link href={secondaryHref} className="inline-flex items-center gap-2">
                    <Code2 className="size-4.5" />
                    {secondaryLabel}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <aside
            className="relative min-h-[280px] overflow-hidden bg-[#f7f5ef] sm:min-h-[320px]"
            aria-label="Aksen visual Bulungan"
          >
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#f7f5f2_0%,#f7f5f2_12%,#e8e7e6_12%,#dbdbdb_33%,#ece7b1_33%,#f3efc8_72%,#f0e5dc_72%,#f0e5dc_100%)]" />
              <div className="absolute inset-y-0 left-0 w-[34%] bg-[linear-gradient(90deg,rgba(248,245,236,0.96)_0%,rgba(248,245,236,0.72)_42%,rgba(248,245,236,0.2)_76%,rgba(248,245,236,0)_100%)]" />

              <div
                className="absolute inset-y-0 left-[14%] hidden w-[24%] opacity-[0.18] md:block"
                aria-hidden="true"
                style={{
                  backgroundImage: "url('/assets/brand/motifs/motif-3-suku-optimized.webp')",
                  backgroundRepeat: "repeat-y",
                  backgroundPosition: "center top",
                  backgroundSize: "100% auto",
                }}
              />

              <div
                className="absolute inset-y-0 left-[49%] hidden w-[18%] opacity-[0.2] md:block"
                aria-hidden="true"
                style={{
                  backgroundImage: "url('/assets/brand/motifs/motif-3-suku-optimized.webp')",
                  backgroundRepeat: "repeat-y",
                  backgroundPosition: "center top",
                  backgroundSize: "100% auto",
                }}
              />

              <div
                className="absolute inset-y-0 right-0 hidden w-[28%] opacity-[0.18] md:block"
                aria-hidden="true"
                style={{
                  backgroundImage: "url('/assets/brand/motifs/motif-3-suku-alt-optimized.webp')",
                  backgroundRepeat: "repeat",
                  backgroundPosition: "center top",
                  backgroundSize: "320px auto",
                }}
              />
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-[46%] z-[1] w-[clamp(110px,24%,230px)] -translate-x-1/2 bg-[linear-gradient(90deg,rgba(236,230,167,0.05)_0%,rgba(243,238,189,0.26)_50%,rgba(236,230,167,0.05)_100%)] lg:left-[45%] xl:left-[44%]" />

            <Image
              src="/assets/brand/landmarks/tugu-cinta-damai.png"
              alt="Tugu Cinta Damai"
              width={2877}
              height={7000}
              sizes="(min-width: 1536px) 11.5rem, (min-width: 1280px) 10rem, (min-width: 1024px) 8.5rem, (min-width: 640px) 7.5rem, 6.5rem"
              className="absolute bottom-0 left-[46%] z-[2] h-auto w-[6.5rem] -translate-x-1/2 drop-shadow-[0_20px_42px_rgba(52,38,22,0.18)] sm:w-[7.5rem] lg:left-[45%] lg:w-[8.5rem] xl:left-[44%] xl:w-[10rem] 2xl:w-[11.5rem]"
            />

            {slogan ? (
              <div className="absolute inset-x-4 top-[10%] z-[3] mx-auto max-w-[360px] rounded-[32px] border border-white/80 bg-white/92 p-5 shadow-[0_18px_36px_rgba(33,41,52,0.14)] sm:inset-x-auto sm:right-[6%] sm:mx-0 sm:w-[min(34%,360px)] sm:p-6">
                <Quote className="size-8 text-[#4a4646] opacity-80 sm:size-10" />
                <p className="mb-0 mt-2 font-[family-name:var(--font-heading)] text-[clamp(2rem,2.8vw,3rem)] font-medium italic leading-snug text-[#2f2525]">
                  {slogan}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </Card>
    </section>
  );
}
