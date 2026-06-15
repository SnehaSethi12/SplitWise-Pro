import { Shell } from "@/components/Shell";
import { BarChart, DonutChart, HorizontalChart } from "@/components/Charts";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToMoney } from "@/lib/format";

function category(desc: string) {
  const d = desc.toLowerCase();
  if (/rent|villa|booking/.test(d)) return "Rent & stays";
  if (/grocer|bigbasket|dmart/.test(d)) return "Groceries";
  if (/dinner|pizza|brunch|lunch|drinks|snacks|cake|swiggy|shack/.test(d))
    return "Food & fun";
  if (/wifi|electricity|cylinder/.test(d)) return "Utilities";
  if (/maid|cleaning/.test(d)) return "Home services";
  if (/flight|cab|scooter|parasailing/.test(d)) return "Trip & travel";
  return "Other";
}
export default async function Analytics() {
  await requireUser();
  const expenses = await prisma.expense.findMany({
    include: { paidBy: true },
    orderBy: { expenseDate: "asc" },
  });
  const byMonth: Record<string, number> = {},
    byCat: Record<string, number> = {},
    byPayer: Record<string, number> = {};
  for (const e of expenses) {
    const m = e.expenseDate.slice(0, 7);
    byMonth[m] = (byMonth[m] ?? 0) + e.amountInrCents;
    const c = category(e.description);
    byCat[c] = (byCat[c] ?? 0) + e.amountInrCents;
    byPayer[e.paidBy.name] = (byPayer[e.paidBy.name] ?? 0) + e.amountInrCents;
  }
  const usd = await prisma.expense.count({
    where: { originalCurrency: "USD" },
  });
  return (
    <Shell title="Insights">
      <section id="summary" className="grid grid-3">
        <div className="stat">
          <div className="stat-label">Months</div>
          <div className="stat-value">{Object.keys(byMonth).length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{Object.keys(byCat).length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">USD rows converted</div>
          <div className="stat-value">{usd}</div>
        </div>
      </section>
      <section id="visuals" className="grid grid-2">
        <div className="card">
          <h2>Monthly spend chart</h2>
          <BarChart data={byMonth} />
        </div>
        <div className="card">
          <h2>Category mix</h2>
          <DonutChart data={byCat} />
        </div>
      </section>
      <section className="grid grid-2">
        <div className="card">
          <h2>Who paid most</h2>
          <HorizontalChart data={byPayer} />
        </div>
        <div className="card">
          <h2>Category totals</h2>
          <div className="table-wrap">
            <table>
              <tbody>
                {Object.entries(byCat)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>{centsToMoney(v)}</td>
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
