import Image from "next/image";
import type { ComponentType } from "react";
import { Globe, Mail, MapPin } from "lucide-react";

const bappedaContact = {
  address:
    "Jalan Jelarai Raya, Tanjung Selor Hilir, Kecamatan Tanjung Selor, Kabupaten Bulungan, Kalimantan Utara",
  email: "bappeda@bulungan.go.id",
  website: "https://bappeda.bulungan.go.id/",
  facebook: "https://www.facebook.com/bappeda.litbang.kab.bulungan?mibextid=ZbWKwL",
  instagram: "https://www.instagram.com/bappedalitbangkabbulungan/",
  youtube: "https://youtube.com/%40bappedalitbangkabupatenbulunga?si=X1oX9uNimpMAx9AL",
};

type FooterActionLink = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type RelatedLogoLink = {
  label: string;
  href: string;
  logoSrc: string;
  logoAlt: string;
  imageClassName?: string;
};

function FacebookBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14.2 22v-8h2.7l.5-3.4h-3.2V8.5c0-1 .4-1.8 1.9-1.8h1.4V3.8c-.8-.1-1.6-.2-2.4-.2-2.4 0-4 1.5-4 4.2v2.8H8.4V14h2.7v8h3.1Z" />
    </svg>
  );
}

function InstagramBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M21.3 7.2a2.7 2.7 0 0 0-1.9-1.9C17.7 5 12 5 12 5s-5.7 0-7.4.3a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 2.3 12c0 1.6.1 3.2.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.3 7.4.3 7.4.3s5.7 0 7.4-.3a2.7 2.7 0 0 0 1.9-1.9c.3-1.6.4-3.2.4-4.8 0-1.6-.1-3.2-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

const socialLinks: FooterActionLink[] = [
  {
    label: "Email",
    href: `mailto:${bappedaContact.email}`,
    icon: Mail,
  },
  {
    label: "Website",
    href: bappedaContact.website,
    icon: Globe,
  },
  {
    label: "Facebook",
    href: bappedaContact.facebook,
    icon: FacebookBrandIcon,
  },
  {
    label: "Instagram",
    href: bappedaContact.instagram,
    icon: InstagramBrandIcon,
  },
  {
    label: "YouTube",
    href: bappedaContact.youtube,
    icon: YouTubeBrandIcon,
  },
];

const relatedLinks: RelatedLogoLink[] = [
  {
    label: "BPS Kabupaten Bulungan",
    href: "https://bulungankab.bps.go.id/",
    logoSrc: "/assets/partners/logo-bps.png",
    logoAlt: "Logo BPS Kabupaten Bulungan",
    imageClassName: "max-w-[88%] sm:max-w-[90%]",
  },
  {
    label: "Dataku Kalimantan Utara",
    href: "https://data.kaltaraprov.go.id/",
    logoSrc: "/assets/partners/logo-edataku.png",
    logoAlt: "Logo Dataku Kaltara",
    imageClassName: "max-w-[90%] sm:max-w-[92%]",
  },
  {
    label: "Satu Data Indonesia",
    href: "https://data.go.id/",
    logoSrc: "/assets/partners/logo-sdi.png",
    logoAlt: "Logo Satu Data Indonesia",
    imageClassName: "max-w-[82%] sm:max-w-[86%]",
  },
];

export function PortalFooter() {
  return (
    <footer
      className="portal-shell-bleed mt-auto shrink-0 bg-(--color-footer-bg)"
      style={{ width: "100vw", marginInline: "calc(50% - 50vw)" }}
    >
      <div className="relative overflow-hidden rounded-[28px] border border-[#3c3a3a] bg-[radial-gradient(circle_at_top,#142752_0%,#0d1733_44%,#0a132b_100%)]">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-[4.5%] opacity-[0.22] md:block"
          style={{
            backgroundImage: "url('/assets/brand/motifs/motif-3-suku-alt-soft.webp')",
            backgroundRepeat: "repeat-y",
            backgroundPosition: "left center",
            backgroundSize: "100% auto",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[4.5%] opacity-[0.22] md:block"
          style={{
            backgroundImage: "url('/assets/brand/motifs/motif-3-suku-alt-soft.webp')",
            backgroundRepeat: "repeat-y",
            backgroundPosition: "right center",
            backgroundSize: "100% auto",
          }}
        />

        <div className="relative z-10 px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.4fr)_minmax(0,0.95fr)] lg:gap-8 xl:gap-10">
            <div className="space-y-8 lg:border-r lg:border-(--color-accent-gold)/45 lg:pr-8 xl:pr-10">
              <div className="flex items-start gap-4 sm:gap-5 lg:gap-3">
                <Image
                  src="/assets/brand/logos/lambang-bulungan.png"
                  alt="Lambang Kabupaten Bulungan"
                  width={90}
                  height={108}
                  className="h-auto w-16 shrink-0 sm:w-20 lg:w-18 xl:w-22"
                />

                <div className="pt-1">
                  <p className="m-0 font-(family-name:--font-heading) text-base font-semibold uppercase leading-tight tracking-[0.08em] text-(--color-accent-gold) sm:text-xl lg:text-lg xl:text-2xl">
                    Pemerintah Kabupaten
                  </p>
                  <h2 className="mt-1 font-(family-name:--font-heading) text-4xl font-semibold uppercase leading-[0.92] tracking-tight text-white sm:text-5xl lg:text-[2.55rem] xl:text-[3.15rem] 2xl:text-6xl">
                    Bulungan
                  </h2>
                </div>
              </div>

              <div className="rounded-3xl border border-white/20 bg-white/6 p-5 sm:p-6">
                <div className="flex items-start gap-5">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/8 text-(--color-accent-gold)">
                    <MapPin className="size-7" />
                  </div>

                  <div className="max-w-3xl pt-1">
                    <h3 className="font-(family-name:--font-heading) text-2xl font-semibold leading-tight text-white">
                      Alamat
                    </h3>
                    <div className="mt-2 h-px w-full bg-[linear-gradient(90deg,#bfa354_0%,#bfa354_44%,rgba(191,163,84,0)_100%)]" />
                    <p className="mt-3 text-lg leading-9 text-white/80">
                      {bappedaContact.address}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-5 rounded-full bg-[url('/assets/brand/motifs/motif-3-suku-band.webp')] bg-[length:auto_100%] bg-repeat-x bg-center opacity-[0.28]" />
              </div>
            </div>

            <div className="space-y-6 lg:border-r lg:border-(--color-accent-gold)/45 lg:px-6 lg:pt-2">
              <div className="max-w-fit">
                <h3 className="font-(family-name:--font-heading) text-2xl font-semibold leading-tight text-white">
                  Media Sosial
                </h3>
                <div className="mt-4 h-2 w-16 rounded-full bg-(--color-accent-gold)" />
              </div>

              <div className="space-y-3 pt-1">
                {socialLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-xl text-white/92 transition hover:text-white"
                      aria-label={item.label}
                      title={item.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="inline-flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition group-hover:bg-white group-hover:text-[#0f1e43]">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-base font-medium leading-none tracking-tight sm:text-lg">{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="lg:pl-2 lg:pt-2 xl:pl-4 xl:pt-4">
              <div className="max-w-fit">
                <h3 className="font-(family-name:--font-heading) text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  Tautan Terkait
                </h3>
                <div className="mt-4 h-2 w-16 rounded-full bg-(--color-accent-gold)" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-3">
                {relatedLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group flex min-h-24 items-center justify-center overflow-hidden rounded-3xl bg-white px-4 py-3 shadow-[0_18px_34px_rgba(0,0,0,0.15)] transition duration-200 hover:-translate-y-1 sm:min-h-26 sm:px-5 sm:py-3 lg:min-h-22 lg:px-4 lg:py-2.5 xl:min-h-24 xl:px-5 xl:py-3 2xl:min-h-30 2xl:px-6 2xl:py-4"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    title={item.label}
                  >
                    <div className="relative flex h-10 w-full items-center justify-center sm:h-11 lg:h-10 xl:h-11 2xl:h-14">
                      <Image
                        src={item.logoSrc}
                        alt={item.logoAlt}
                        width={320}
                        height={160}
                        className={`h-full w-auto ${item.imageClassName ?? "max-w-[90%]"} object-contain`}
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-(--color-accent-gold)/45 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 text-center text-sm text-white/74 sm:px-8 sm:text-base lg:px-12">
          <p className="m-0">&copy; 2026 Pemerintah Kabupaten Bulungan</p>
        </div>
      </div>
    </footer>
  );
}
