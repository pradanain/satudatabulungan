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
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <header>
            <h2 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold text-(--color-text) sm:text-3xl">
              {section.title}
            </h2>
            <p className="mb-0 mt-2 text-sm leading-relaxed text-(--color-muted) sm:text-base">
              {section.description}
            </p>
          </header>

          <div className="space-y-2.5">
            {section.items.map((item) => {
              const isOpen = openItemId === item.id;

              return (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-[#d7deea] bg-white">
                  <h3 className="m-0">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-[#f8fafd] sm:px-5 sm:py-4"
                      onClick={() => {
                        setOpenItemId((current) => (current === item.id ? null : item.id));
                      }}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${item.id}`}
                    >
                      <span className="font-semibold text-(--color-text)">{item.question}</span>
                      <ChevronDown className={cn("mt-0.5 size-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
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
                      <div className="border-t border-[#e7edf7] px-4 py-3 sm:px-5 sm:py-4">
                        <p className="m-0 text-sm leading-relaxed text-(--color-muted) sm:text-base">{item.answer}</p>
                        {item.details?.length ? (
                          <ul className="mb-0 mt-2 space-y-1.5 pl-5 text-sm leading-relaxed text-(--color-muted) sm:text-base">
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
        </section>
      ))}
    </div>
  );
}
