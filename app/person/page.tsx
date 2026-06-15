import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateBalances } from "@/lib/balances";
import { centsToMoney } from "@/lib/format";
export default async function Person({
  searchParams,
}: {
  searchParams: { name?: string };
}) {
  await requireUser();
  const name = searchParams.name ?? "Aisha";
  const person = await prisma.person.findUnique({ where: { name } });
  if (!person)
    return (
      <Shell title="Person">
        <div className="card">Not found</div>
      </Shell>
    );
  const { net } = await calculateBalances();
  const paid = await prisma.expense.findMany({
    where: { paidById: person.id },
    orderBy: { expenseDate: "asc" },
  });
  const shares = await prisma.expenseShare.findMany({
    where: { personId: person.id },
    include: { expense: { include: { paidBy: true } } },
    orderBy: { expense: { expenseDate: "asc" } },
  });
  const paidTotal = paid.reduce((a, e) => a + e.amountInrCents, 0),
    shareTotal = shares.reduce((a, s) => a + s.shareInrCents, 0);
  return (
    <Shell title={`${name} statement`}>
      <section className="grid grid-3">
        <div className="stat">
          <div className="stat-label">Net balance</div>
          <div
            className={`stat-value ${(net[name] ?? 0) >= 0 ? "pos" : "neg"}`}
          >
            {centsToMoney(net[name] ?? 0)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Paid</div>
          <div className="stat-value">{centsToMoney(paidTotal)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Share charged</div>
          <div className="stat-value">{centsToMoney(shareTotal)}</div>
        </div>
      </section>
      <section className="grid grid-2">
        <div className="card">
          <h2>Expenses paid</h2>
          <div className="table-wrap">
            <table>
              <tbody>
                {paid.map((e) => (
                  <tr key={e.id}>
                    <td>#{e.rowNumber}</td>
                    <td>{e.expenseDate}</td>
                    <td>{e.description}</td>
                    <td>{centsToMoney(e.amountInrCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2>Shares charged</h2>
          <div className="table-wrap">
            <table>
              <tbody>
                {shares.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.expense.rowNumber}</td>
                    <td>{s.expense.expenseDate}</td>
                    <td>{s.expense.description}</td>
                    <td>{s.expense.paidBy.name}</td>
                    <td>{centsToMoney(s.shareInrCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Shell>
  );
}
