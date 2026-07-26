export default function HomePage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-lg text-center">
        <p className="brand-gradient-text text-4xl font-semibold tracking-tight sm:text-5xl">
          Dentyvo
        </p>
        <h1 className="mt-4 text-xl font-medium text-foreground sm:text-2xl">
          Scaffold pronto
        </h1>
        <p className="mt-3 text-muted-foreground">
          Base Next.js, Drizzle, BetterAuth e Vitest configurados. Features de
          negócio entram uma a uma via{" "}
          <span className="font-medium text-foreground">specs/features/</span>.
        </p>
      </div>
    </main>
  );
}
