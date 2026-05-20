import Image from "next/image";
import type { ComponentType } from "react";
import { Globe, Mail, MapPin } from "lucide-react";

const bappedaContact = {
  address:
    "Jalan Jelarai Raya, Tanjung Selor Hilir, Kecamatan Tanjung Selor, Kabupaten Bulungan",
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
    <footer className="portal-shell-bleed mt-auto shrink-0 border-t border-[#3c3a3a] bg-[radial-gradient(circle_at_top,#142752_0%,#0d1733_44%,#0a132b_100%)]">
      <div className="relative overflow-hidden">
        {/* Motif Watermarks */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-[4%] opacity-[0.15] md:block"
          style={{
            backgroundImage: "url('/assets/brand/motifs/motif-3-suku-alt-soft.webp')",
            backgroundRepeat: "repeat-y",
            backgroundPosition: "left center",
            backgroundSize: "100% auto",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[4%] opacity-[0.15] md:block"
          style={{
            backgroundImage: "url('/assets/brand/motifs/motif-3-suku-alt-soft.webp')",
            backgroundRepeat: "repeat-y",
            backgroundPosition: "right center",
            backgroundSize: "100% auto",
          }}
        />

        <div className="relative z-10 px-6 py-8 text-white sm:px-8 md:px-16 lg:px-24 xl:px-32 lg:py-10">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Column 1: Identity & Address */}
            <div className="space-y-6 lg:border-r lg:border-white/5 lg:pr-12">
              <div className="flex items-center gap-4">
                <Image
                  src="/assets/brand/logos/lambang-bulungan.png"
                  alt="Lambang Kabupaten Bulungan"
                  width={64}
                  height={76}
                  className="h-auto w-12 shrink-0 sm:w-16 drop-shadow-2xl"
                />
                <div>
                  <p className="m-0 font-(family-name:--font-heading) text-[10px] font-bold uppercase tracking-[0.2em] text-(--color-accent-gold) sm:text-xs">
                    Pemerintah Kabupaten
                  </p>
                  <h2 className="mt-0.5 font-(family-name:--font-heading) text-2xl font-bold uppercase leading-none tracking-tight text-white sm:text-4xl">
                    Bulungan
                  </h2>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-white/70">
                Satu Data Kabupaten Bulungan adalah portal terintegrasi untuk pengelolaan, penyajian, dan berbagi pakai data statistik sektoral dan geospasial di lingkungan Pemerintah Kabupaten Bulungan guna mendukung perencanaan pembangunan yang akurat dan berbasis data.
              </p>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-[2px]">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-(--color-accent-gold) border border-white/5">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="mt-2 text-sm leading-relaxed text-white/60 font-medium">
                      {bappedaContact.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Media Sosial & Tautan Terkait Staked */}
            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                <div className="max-w-fit">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest opacity-90">Media Sosial</h3>
                  <div className="mt-2 h-1 w-8 rounded-full bg-(--color-accent-gold)" />
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  {socialLinks
                    .filter((item) => item.label !== "Website")
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          className="group flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-(--color-accent-gold) hover:text-[#0a132b]"
                          aria-label={item.label}
                          title={item.label}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon className="size-5" />
                        </a>
                      );
                    })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="max-w-fit">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest opacity-90">Tautan Terkait</h3>
                  <div className="mt-2 h-1 w-8 rounded-full bg-(--color-accent-gold)" />
                </div>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {relatedLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="group flex aspect-video items-center justify-center rounded-xl bg-white/95 p-2 transition hover:bg-white hover:-translate-y-0.5"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                    >
                      <Image
                        src={item.logoSrc}
                        alt={item.logoAlt}
                        width={120}
                        height={60}
                        className="h-full w-auto object-contain opacity-80 group-hover:opacity-100"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 px-6 py-5 text-center text-sm font-medium text-white/60">
          <p className="m-0">&copy; {new Date().getFullYear()} Pemerintah Kabupaten Bulungan. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}

