"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type CodeExample = {
  lang: string;
  label: string;
  code: string;
};

interface ApiCodeTabsProps {
  examples: CodeExample[];
  className?: string;
}

export function ApiCodeTabs({ examples, className }: ApiCodeTabsProps) {
  const [activeTab, setActiveTab] = useState(examples[0].lang);
  const [copied, setCopied] = useState(false);

  const activeExample = examples.find((ex) => ex.lang === activeTab) || examples[0];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeExample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("overflow-hidden rounded-xl bg-[#0a132b] shadow-2xl border border-white/10", className)}>
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {examples.map((ex) => (
            <button
              key={ex.lang}
              onClick={() => setActiveTab(ex.lang)}
              className={cn(
                "px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap",
                activeTab === ex.lang 
                  ? "text-(--color-accent-gold)" 
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {ex.label}
              {activeTab === ex.lang && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--color-accent-gold)" />
              )}
            </button>
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="size-8 text-white/40 hover:text-white hover:bg-white/10"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>

      {/* Code Area */}
      <div className="relative p-4">
        <div className="absolute right-4 top-4 opacity-10">
          <Terminal className="size-5 text-white" />
        </div>
        <pre className="overflow-x-auto text-sm leading-relaxed text-white/80 font-mono scrollbar-thin scrollbar-thumb-white/10">
          <code>{activeExample.code}</code>
        </pre>
      </div>
    </div>
  );
}
