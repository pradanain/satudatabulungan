"use client";

import { useState, useMemo } from "react";
import { Search, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FaqAccordion } from "./faq-accordion";
import type { LayananFaqSection } from "@/lib/data/layanan-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FaqInteractiveSectionProps {
  sections: LayananFaqSection[];
}

export function FaqInteractiveSection({ sections }: FaqInteractiveSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(sections[0]?.id || "");

  const isSearching = searchQuery.trim().length > 0;

  const filteredSections = useMemo(() => {
    if (!isSearching) return sections;

    const query = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query) ||
            (item.details && item.details.some((d) => d.toLowerCase().includes(query)))
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, searchQuery, isSearching]);

  const activeSection = sections.find((s) => s.id === activeTab) || sections[0];
  const totalResults = filteredSections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div className="space-y-12">
      {/* 100% Consistent Institutional Search Bar */}
      <div className="relative z-10">
        <div className="grid items-stretch gap-2 rounded-[24px] border border-(--color-border) bg-white p-2 shadow-[0_10px_24px_rgba(33,41,52,0.08)] sm:grid-cols-[1fr_auto] transition-all duration-200 focus-within:border-(--color-primary) focus-within:ring-4 focus-within:ring-(--color-primary)/5">
          <div className="relative flex items-center">
            <Search className="absolute left-4 size-5 text-(--color-muted)" />
            <Input
              type="text"
              placeholder="Cari pertanyaan, panduan, atau kata kunci bantuan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 border-0 bg-transparent pl-12 pr-4 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 flex size-6 items-center justify-center rounded-full bg-(--color-surface-soft) text-(--color-muted) hover:text-(--color-primary) transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Button 
            className="h-12 rounded-xl bg-(--color-primary) px-8 text-base font-bold text-white shadow-lg shadow-(--color-primary)/20 transition-all hover:bg-(--color-primary)/90 hover:scale-[1.02] active:scale-[0.98] border-none"
            onClick={() => {}}
          >
            Cari
          </Button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sidebar (Matching FilterPanel Style) */}
        <aside className="space-y-4">
          <Card className="sticky top-44 p-6 border-(--color-border) shadow-sm">
            <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-tight text-(--color-text)">
              Filter Bantuan
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
              Gunakan filter topik untuk mempermudah pencarian jawaban yang Anda butuhkan.
            </p>
            
            <div className="mt-6 space-y-1">
              <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-(--color-primary)">Topik Bantuan</p>
              {sections.map((section) => {
                const isActive = activeTab === section.id && !isSearching;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveTab(section.id);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all duration-200 group",
                      isActive 
                        ? "bg-(--color-primary) text-white shadow-lg shadow-(--color-primary)/20" 
                        : "text-(--color-muted) hover:bg-(--color-surface-soft) hover:text-(--color-text)"
                    )}
                  >
                    <span className="font-bold text-[0.9rem] leading-tight pr-3">{section.title}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md min-w-6 text-center transition-colors",
                      isActive ? "bg-white/20 text-white" : "bg-(--color-surface-soft) text-(--color-muted) group-hover:bg-white"
                    )}>
                      {section.items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </aside>

        {/* Content Area (Matching Results Card Style) */}
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 border-(--color-border) shadow-sm bg-white">
            {isSearching ? (
              /* Search Results Header */
              <div className="space-y-10">
                <div className="flex flex-col gap-2">
                  <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold text-(--color-text)">
                    Hasil Pencarian
                  </h2>
                  <p className="m-0 text-base text-(--color-muted)">
                    {totalResults > 0 
                      ? `Menampilkan ${totalResults} hasil untuk kata kunci "${searchQuery}"`
                      : `Tidak ada hasil yang ditemukan untuk "${searchQuery}"`}
                  </p>
                </div>

                {totalResults > 0 ? (
                  <div className="space-y-12">
                    {filteredSections.map(section => (
                      <div key={section.id} className="space-y-6">
                        <div className="flex items-center gap-4">
                           <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-(--color-primary) shrink-0">{section.title}</h3>
                           <div className="h-px bg-(--color-border) w-full opacity-50" />
                        </div>
                        <FaqAccordion sections={[section]} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="size-20 bg-(--color-surface-soft) rounded-full flex items-center justify-center mx-auto text-(--color-muted)/20">
                      <Search className="size-10" />
                    </div>
                    <h3 className="text-xl font-bold text-(--color-text)">Belum Ada Jawaban</h3>
                    <p className="text-(--color-muted) max-w-md mx-auto text-sm">
                      Maaf, kami tidak menemukan hasil yang cocok. Coba kata kunci lain atau gunakan kategori bantuan.
                    </p>
                    <Button variant="secondary" size="sm" className="rounded-full px-8" onClick={() => setSearchQuery("")}>
                      Reset Pencarian
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Standard Tab View Header */
              <div className="space-y-8">
                <div className="pb-8 border-b border-(--color-border)">
                  <h2 className="m-0 font-(family-name:--font-heading) text-4xl font-bold tracking-tight text-(--color-text)">
                    {activeSection.title}
                  </h2>
                  <p className="mt-3 text-[1.05rem] text-(--color-muted) leading-relaxed">
                    {activeSection.description}
                  </p>
                </div>
                
                <FaqAccordion sections={[activeSection]} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
