import { AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BlocoErro({
  title,
  mensagem,
}: {
  title: string;
  mensagem: string;
}) {
  return (
    <Card className="border-[hsl(var(--destructive)/0.35)]">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md bg-[hsl(var(--destructive-subtle))] px-3 py-3 text-[13px] leading-5 text-[hsl(var(--destructive-subtle-foreground))]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{mensagem}</p>
        </div>
      </CardContent>
    </Card>
  );
}
