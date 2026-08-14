"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div
      className="space-y-3 p-6"
      role="status"
      aria-label="Carregando documentação da API"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  ),
});

type Props = {
  spec: object;
};

export function ReactSwagger({ spec }: Props) {
  return <SwaggerUI spec={spec} />;
}
