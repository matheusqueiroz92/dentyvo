"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

type AgendaSlotCellProps = {
  id: string;
  compacto?: boolean;
  onClickVazio?: () => void;
  children?: React.ReactNode;
};

export function AgendaSlotCell({
  id,
  compacto,
  onClickVazio,
  children,
}: AgendaSlotCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const vazio = !children;

  return (
    <div
      ref={setNodeRef}
      role={vazio && onClickVazio ? "button" : undefined}
      tabIndex={vazio && onClickVazio ? 0 : undefined}
      onClick={() => {
        if (vazio && onClickVazio) onClickVazio();
      }}
      onKeyDown={(e) => {
        if (vazio && onClickVazio && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClickVazio();
        }
      }}
      className={cn(
        "relative border-b border-r border-border/60 bg-background",
        compacto ? "min-h-12 p-0.5" : "min-h-14 p-1",
        isOver && "bg-info/15",
        vazio && onClickVazio && "cursor-pointer hover:bg-muted/40",
      )}
      data-slot-id={id}
    >
      {children}
    </div>
  );
}
