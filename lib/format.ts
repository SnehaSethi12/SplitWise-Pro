export function centsToMoney(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}₹${Math.floor(abs / 100).toLocaleString("en-IN")}.${String(abs % 100).padStart(2, "0")}`;
}

export function moneyToCents(amount: number) {
  return Math.round(amount * 100);
}

export function barPct(value: number, max: number) {
  if (!max) return 0;
  return Math.max(3, Math.min(100, Math.round((value * 100) / max)));
}
