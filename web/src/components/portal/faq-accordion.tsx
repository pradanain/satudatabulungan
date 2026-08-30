"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { LayananFaqSection } from "@/lib/data/layanan-data";

interface FaqAccordionProps {
  sections: LayananFaqSection[];
}

export function FaqAccordion({ sections }: FaqAccordionProps) {
  const firstItemId = useMemo(() => sections[0]?.items[0]?.id ?? null, [sections]);
  const [openItemId, setOpenItemId] = useState<string | null>(firstItemId);

  return (
    <div className="space-y-2.5">
      {sections.map((section) => (
        <div key={section.id} className="space-y-2.5">
          {section.items.map((item) => {
              const isOpen = openItemId === item.id;

              return (
                <article key={item.id} className="group overflow-hidden rounded-2xl border border-[#d2d9e4] bg-white transition hover:border-[#bcc7d8] hover:shadow-[0_8px_24px_rgba(25,35,52,0.08)]">
                  <h3 className="m-0">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#f8fafd] sm:px-6 sm:py-5"
                      onClick={() => {
                        setOpenItemId((current) => (current === item.id ? null : item.id));
                      }}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${item.id}`}
                    >
                      <span className="font-semibold text-(--color-text) transition group-hover:text-(--color-primary) text-lg sm:text-xl">{item.question}</span>
                      <ChevronDown className={cn("mt-1 size-5 shrink-0 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${item.id}`}
                    className={cn(
                      "grid transition-all duration-200 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-[#e7edf7] px-5 py-4 sm:px-6 sm:py-5">
                        <p className="m-0 text-base leading-relaxed text-[#5f5957] sm:text-[1.05rem]">{item.answer}</p>
                        {item.details?.length ? (
                          <ul className="mb-0 mt-3 space-y-2 pl-5 text-base leading-relaxed text-[#5f5957] sm:text-[1.05rem]">
                            {item.details.map((detail, index) => (
                              <li key={`${item.id}-${index + 1}`}>{detail}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      ))}
    </div>
  );
}
