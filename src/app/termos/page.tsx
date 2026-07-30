import Link from "next/link";

export const metadata = {
  title: "Termos de uso — Dentyvo",
};

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="font-sans text-xl font-bold text-foreground">Dentyvo</p>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Termos de uso
      </h1>
      <p className="mt-4 text-sm leading-[22px] text-muted-foreground" role="status">
        Em elaboração. O conteúdo jurídico ainda não foi definido.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
