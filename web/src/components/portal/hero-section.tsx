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
      <Card 
        className="relative overflow-hidden rounded-[28px] border-[var(--color-border)] p-0 shadow-[0_12px_28px_rgba(33,41,52,0.08)]"
        style={{
          background: "linear-gradient(90deg, #ffffff 0%, #ffffff 35%, #f7f5f2 45%, #e8e7e6 55%, #ece7b1 70%, #f3efc8 85%, #f0e5dc 100%)"
        }}
      >
        <div className="grid min-h-[250px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div className="relative z-[2] flex flex-col justify-center bg-transparent px-5 py-5 sm:px-7 sm:py-6 lg:px-8 lg:py-7">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="w-fit border-transparent bg-transparent px-0 py-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] shadow-none"
              >
                {eyebrow}
              </Badge>
              <h1 className="m-0 max-w-xl font-[family-name:var(--font-heading)] text-3xl font-semibold leading-[1.1] tracking-tight text-[#09090b] sm:text-4xl lg:text-5xl xl:text-6xl">
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
            className="relative min-h-[220px] overflow-hidden bg-transparent sm:min-h-[250px]"
            aria-label="Aksen visual Bulungan"
          >
            <div className="absolute inset-0 z-0">

              <div
                className="absolute inset-y-0 left-[14%] w-[24%] opacity-[0.15]"
                aria-hidden="true"
                style={{
                  backgroundImage: "url('/assets/brand/motifs/motif-3-suku-optimized.webp')",
                  backgroundRepeat: "repeat-y",
                  backgroundPosition: "center top",
                  backgroundSize: "100% auto",
                }}
              />

              <div
                className="absolute inset-y-0 left-[49%] w-[18%] opacity-[0.18]"
                aria-hidden="true"
                style={{
                  backgroundImage: "url('/assets/brand/motifs/motif-3-suku-optimized.webp')",
                  backgroundRepeat: "repeat-y",
                  backgroundPosition: "center top",
                  backgroundSize: "100% auto",
                }}
              />

              <div
                className="absolute inset-y-0 right-0 w-[28%] opacity-[0.15]"
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
              sizes="(min-width: 1536px) 9rem, (min-width: 1280px) 8rem, (min-width: 1024px) 7rem, (min-width: 640px) 6rem, 5rem"
              className="absolute bottom-0 left-[46%] z-[2] h-auto w-[5rem] -translate-x-1/2 drop-shadow-[0_20px_42px_rgba(52,38,22,0.18)] sm:w-[6rem] lg:left-[45%] lg:w-[7rem] xl:left-[44%] xl:w-[8rem] 2xl:w-[9rem]"
            />

            {slogan ? (
              <div className="absolute inset-x-4 top-[10%] z-[3] mx-auto max-w-[280px] rounded-[24px] border border-white/80 bg-white/92 p-4 shadow-[0_12px_24px_rgba(33,41,52,0.12)] sm:inset-x-auto sm:right-[6%] sm:mx-0 sm:w-[min(34%,300px)] sm:p-5">
                <Quote className="size-6 text-[#4a4646] opacity-80 sm:size-7" />
                <p className="mb-0 mt-1 font-[family-name:var(--font-heading)] text-[clamp(1.35rem,2.2vw,1.85rem)] font-medium italic leading-snug text-[#2f2525]">
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
