import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/portal/section-heading";

interface TopicChipListProps {
  title: string;
  description: string;
  items: string[];
  hrefBuilder?: (item: string) => string;
}

export function TopicChipList({ title, description, items, hrefBuilder }: TopicChipListProps) {
  return (
    <section>
      <Card className="p-5 sm:p-6">
        <SectionHeading
          title={title}
          description={description}
          titleClassName="text-2xl sm:text-3xl"
          descriptionClassName="text-sm sm:text-base"
        />
        <div className="mt-4 flex flex-wrap gap-2.5" role="list">
          {items.map((item) =>
            hrefBuilder ? (
              <Link key={item} href={hrefBuilder(item)} role="listitem">
                <Badge
                  variant="secondary"
                  className="cursor-pointer rounded-full bg-[#f1f4f9] px-3 py-2 text-sm font-semibold text-[#3b3636] transition hover:bg-[#e4ecff] hover:text-[var(--color-accent-blue)]"
                >
                  {item}
                </Badge>
              </Link>
            ) : (
              <Badge
                key={item}
                variant="secondary"
                className="rounded-full bg-[#f1f4f9] px-3 py-2 text-sm font-semibold text-[#3b3636]"
                role="listitem"
              >
                {item}
              </Badge>
            ),
          )}
        </div>
      </Card>
    </section>
  );
}
