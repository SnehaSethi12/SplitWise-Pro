import { prisma } from "./db";

export async function calculateBalances() {
  const net = new Map<string, number>();
  const add = (name: string, cents: number) =>
    net.set(name, (net.get(name) ?? 0) + cents);

  const expenses = await prisma.expense.findMany({
    include: { paidBy: true, shares: { include: { person: true } } },
  });
  for (const e of expenses) {
    add(e.paidBy.name, e.amountInrCents);
    for (const s of e.shares) add(s.person.name, -s.shareInrCents);
  }
  const settlements = await prisma.settlement.findMany({
    include: { payer: true, payee: true },
  });
  for (const s of settlements) {
    add(s.payer.name, s.amountInrCents);
    add(s.payee.name, -s.amountInrCents);
  }

  const creditors = [...net.entries()]
    .filter(([, c]) => c > 0)
    .map(([n, c]) => [n, c] as [string, number])
    .sort((a, b) => b[1] - a[1]);
  const debtors = [...net.entries()]
    .filter(([, c]) => c < 0)
    .map(([n, c]) => [n, -c] as [string, number])
    .sort((a, b) => b[1] - a[1]);
  const plan: { payer: string; payee: string; amount: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i][1], creditors[j][1]);
    if (amt)
      plan.push({ payer: debtors[i][0], payee: creditors[j][0], amount: amt });
    debtors[i][1] -= amt;
    creditors[j][1] -= amt;
    if (debtors[i][1] === 0) i++;
    if (creditors[j][1] === 0) j++;
  }
  return { net: Object.fromEntries([...net.entries()].sort()), plan };
}
