import type { ReactNode } from "react";

/**
 * Seção tipográfica de documentos legais (usada dentro de
 * `PageLegalContainer`).
 */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-8">
      <h2
        id={`${id}-title`}
        className="text-base font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
