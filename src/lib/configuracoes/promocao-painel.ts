export function promocaoAindaAtiva(d: {
  precoPromocionalAteIso: string | null;
  migradaParaPrecoCheioEmIso: string | null;
}): boolean {
  return Boolean(d.precoPromocionalAteIso) && !d.migradaParaPrecoCheioEmIso;
}

export function promocaoJaEncerrada(d: {
  migradaParaPrecoCheioEmIso: string | null;
}): boolean {
  return d.migradaParaPrecoCheioEmIso != null;
}
