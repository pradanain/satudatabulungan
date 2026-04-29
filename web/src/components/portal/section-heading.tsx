import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionHeading({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h2
        className={cn(
          "font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight tracking-tight text-[var(--color-text)] sm:text-4xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn("w-full text-sm leading-relaxed text-[var(--color-muted)] sm:text-base", descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
