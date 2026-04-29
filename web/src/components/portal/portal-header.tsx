"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type ActiveMenu =
  | "beranda"
  | "dataset"
  | "topik"
  | "organisasi"
  | "visualisasi"
  | "publikasi"
  | "layanan-data"
  | "tentang"
  | "none";

interface PortalHeaderProps {
  activeMenu?: ActiveMenu;
}

type MenuItem = {
  key: Exclude<ActiveMenu, "none">;
  label: string;
  href: string;
  children?: ReadonlyArray<{
    label: string;
    href: string;
  }>;
};

const menuItems: readonly MenuItem[] = [
  { key: "beranda", label: "Beranda", href: "/" },
  { key: "dataset", label: "Dataset", href: "/dataset" },
  {
    key: "publikasi",
    label: "Publikasi",
    href: "/publikasi",
    children: [
      { label: "Berita", href: "/publikasi#berita" },
      { label: "Buku Digital", href: "/publikasi#buku-digital" },
      { label: "Infografis", href: "/publikasi/infografis" },
      { label: "Regulasi", href: "/publikasi#regulasi" },
      { label: "Petunjuk Teknis", href: "/publikasi#petunjuk-teknis" },
    ],
  },
  {
    key: "layanan-data",
    label: "Layanan Data",
    href: "/layanan-data",
    children: [
      { label: "Permintaan Data", href: "/layanan-data#permintaan-data" },
      { label: "API", href: "/api" },
      { label: "FAQ", href: "/layanan-data#faq" },
    ],
  },
  {
    key: "tentang",
    label: "Tentang",
    href: "/tentang/profil-sdi",
    children: [
      { label: "Organisasi", href: "/organisasi" },
      { label: "Profil Satu Data", href: "/tentang/profil-sdi" },
    ],
  },
];

export function PortalHeader({ activeMenu = "none" }: PortalHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileDropdownKey, setOpenMobileDropdownKey] = useState<Exclude<ActiveMenu, "none"> | null>(null);
  const [openDesktopDropdownKey, setOpenDesktopDropdownKey] = useState<Exclude<ActiveMenu, "none"> | null>(null);

  const handleMobileMenuChange = (nextOpen: boolean) => {
    setIsMobileMenuOpen(nextOpen);
    if (!nextOpen) {
      setOpenMobileDropdownKey(null);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setOpenMobileDropdownKey(null);
  };

  const closeDesktopDropdown = () => {
    setOpenDesktopDropdownKey(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-(--color-bg)">
      <div
        className="portal-shell-bleed overflow-visible border border-t-0 border-(--color-border) bg-white"
        style={{ width: "100vw", marginInline: "calc(50% - 50vw)" }}
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="order-1 flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={handleMobileMenuChange}>
              <SheetTrigger
                type="button"
                aria-label="Buka menu navigasi"
                className={cn(buttonVariants({ variant: "secondary", size: "icon" }), "rounded-full md:hidden")}
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="content-start bg-(--color-bg) px-5 pb-6 pt-5 sm:max-w-sm"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu Navigasi</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex h-full min-h-0 flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <SheetClose asChild>
                      <Link href="/" aria-label="Kembali ke beranda" className="inline-flex w-fit max-w-[calc(100%-2.75rem)]">
                        <Image
                          src="/assets/brand/logos/bulungan-bisa-logo.png"
                          alt="Bulungan Bisa"
                          width={200}
                          height={52}
                          sizes="200px"
                          className="h-auto w-auto max-h-11"
                        />
                      </Link>
                    </SheetClose>

                    <nav aria-label="Navigasi mobile" className="mt-4 flex flex-col gap-1 border-t border-(--color-border) pt-4">
                      {menuItems.map((item) =>
                        item.children ? (
                          <div key={`mobile-${item.key}`} className="py-1">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMobileDropdownKey((current) => (current === item.key ? null : item.key))
                              }
                              className={cn(
                                "flex w-full items-center justify-between gap-1 rounded-lg px-3 py-2 text-left text-[15px] font-semibold text-(--color-muted) transition-colors hover:bg-white hover:text-(--color-primary)",
                                activeMenu === item.key && "bg-white text-(--color-primary) shadow-sm",
                              )}
                              aria-label={`Buka submenu ${item.label}`}
                              aria-expanded={openMobileDropdownKey === item.key}
                              aria-controls={`mobile-submenu-${item.key}`}
                            >
                              <span>{item.label}</span>
                              <ChevronDown
                                className={cn(
                                  "size-4 transition-transform",
                                  openMobileDropdownKey === item.key && "rotate-180",
                                )}
                              />
                            </button>
                            {openMobileDropdownKey === item.key ? (
                              <div id={`mobile-submenu-${item.key}`} className="mt-1 ml-4 grid gap-1 border-l border-(--color-border) pl-3">
                                {item.children.map((child) => (
                                  <SheetClose asChild key={`mobile-${item.key}-${child.label}`}>
                                    <Link
                                      href={child.href}
                                      onClick={closeMobileMenu}
                                      className="rounded-lg px-2 py-2 text-sm font-semibold text-(--color-muted) transition-colors hover:bg-white hover:text-(--color-primary)"
                                    >
                                      {child.label}
                                    </Link>
                                  </SheetClose>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <SheetClose asChild key={`mobile-${item.key}`}>
                            <Link
                              href={item.href}
                              onClick={closeMobileMenu}
                              className={cn(
                                "rounded-lg px-3 py-2 text-[15px] font-semibold text-(--color-muted) transition-colors hover:bg-white hover:text-(--color-primary)",
                                activeMenu === item.key && "bg-white text-(--color-primary) shadow-sm",
                              )}
                            >
                              {item.label}
                            </Link>
                          </SheetClose>
                        ),
                      )}
                    </nav>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[rgba(134,30,26,0.12)] bg-white px-4 py-3 text-center shadow-[0_12px_24px_rgba(33,41,52,0.08)]">
                    <p className="m-0 text-xs font-bold uppercase tracking-[0.24em] text-(--color-primary)">
                      SATU DATA BULUNGAN
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" aria-label="Kembali ke beranda" className="shrink-0 lg:ml-2 xl:ml-3">
              <Image
                src="/assets/brand/logos/lambang-bulungan.png"
                alt="Lambang Kabupaten Bulungan"
                width={42}
                height={50}
                sizes="42px"
                className="h-auto w-auto max-h-10 md:hidden"
                priority
              />
              <Image
                src="/assets/brand/logos/bulungan-bisa-logo.png"
                alt="Bulungan Bisa"
                width={220}
                height={56}
                sizes="220px"
                className="hidden h-auto w-auto max-h-11 md:block md:max-h-14.5"
                priority
              />
            </Link>
          </div>

          <nav
            aria-label="Navigasi utama"
            className="order-3 hidden w-full min-w-0 gap-1 overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface-soft) p-1 text-[15px] font-semibold text-(--color-muted) md:order-2 md:flex md:w-auto md:flex-1 md:justify-center md:overflow-visible md:border-0 md:bg-transparent md:p-0 lg:text-base"
          >
            {menuItems.map((item) => {
              const baseClass = cn(
                "shrink-0 rounded-lg px-3 py-2 transition-colors hover:text-(--color-primary) md:px-2 md:py-1.5 lg:px-3",
                activeMenu === item.key &&
                  "bg-white text-(--color-primary) shadow-sm md:border-b-2 md:border-(--color-primary) md:bg-transparent md:shadow-none",
              );

              if (!item.children) {
                return (
                  <Link key={item.label} href={item.href} onClick={closeDesktopDropdown} className={baseClass}>
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={item.label} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDesktopDropdownKey((current) => (current === item.key ? null : item.key))
                    }
                    className={cn(baseClass, "inline-flex items-center gap-1")}
                    aria-label={`Buka submenu ${item.label}`}
                    aria-expanded={openDesktopDropdownKey === item.key}
                    aria-controls={`desktop-submenu-${item.key}`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        openDesktopDropdownKey === item.key && "rotate-180",
                      )}
                    />
                  </button>

                  <div
                    id={`desktop-submenu-${item.key}`}
                    className={cn(
                      "absolute left-0 top-full z-20 pt-2 transition-all duration-150",
                      openDesktopDropdownKey === item.key
                        ? "pointer-events-auto visible opacity-100"
                        : "pointer-events-none invisible opacity-0",
                    )}
                  >
                    <div className="min-w-55 rounded-xl border border-(--color-border) bg-white p-1 shadow-[0_18px_32px_rgba(33,41,52,0.16)]">
                      {item.children.map((child) => (
                        <Link
                          key={`${item.key}-${child.label}`}
                          href={child.href}
                          onClick={closeDesktopDropdown}
                          className="block rounded-lg px-3 py-2 text-sm font-semibold text-(--color-muted) transition-colors hover:bg-(--color-surface-soft) hover:text-(--color-primary)"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="order-2 ml-auto flex items-center md:order-3 md:ml-0 lg:mr-2 xl:mr-3">
            <Button asChild className="h-10 rounded-full px-5 text-[15px] font-semibold md:text-base">
              <Link href="/internal">Login</Link>
            </Button>
          </div>
        </div>

        <div className="portal-ornament-band h-9 border-t border-(--color-border)" />
      </div>
    </header>
  );
}
