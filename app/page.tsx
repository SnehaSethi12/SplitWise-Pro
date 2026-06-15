import Link from "next/link";
import { Shell } from "@/components/Shell";
import { HorizontalChart } from "@/components/Charts";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateBalances } from "@/lib/balances";
import { centsToMoney } from "@/lib/format";
import { recordSettlementAction } from "./actions";

export default async function Overview() {
  await requireUser();
  const { net, plan } = await calculateBalances();
  const report = await prisma.importReport.findFirst({
    orderBy: { id: "desc" },
  });
  const total = await prisma.expense.aggregate({
    _sum: { amountInrCents: true },
  });
  const anomalies = await prisma.anomaly.count();
  const people = await prisma.person.findMany({ orderBy: { name: "asc" } });
  const owed = Object.values(net)
    .filter((v) => v > 0)
    .reduce((a, b) => a + b, 0);
  return (
    <Shell title="Overview">
      <section id="summary" className="grid grid-4">
        <div className="stat">
          <div className="stat-label">Total spend</div>
          <div className="stat-value">
            {centsToMoney(total._sum.amountInrCents ?? 0)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">People</div>
          <div className="stat-value">{Object.keys(net).length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Data issues found</div>
          <div className="stat-value">{anomalies}</div>
        </div>
        <div className="stat">
          <div className="stat-label">To settle</div>
          <div className="stat-value">{centsToMoney(owed)}</div>
        </div>
      </section>
      <section id="visuals" className="grid grid-2">
        <div className="card">
          <h2>Balance chart</h2>
          <p className="subtle">
            Positive means the person should receive money; negative means they
            owe.
          </p>
          <HorizontalChart data={net} />
        </div>
        <div className="card">
          <h2>Suggested settlements</h2>
          <p className="subtle">
            A compact payment plan that clears all balances.
          </p>
          {plan.map((p) => (
            <div
              className="settlement"
              key={`${p.payer}-${p.payee}-${p.amount}`}
            >
              <div className="person">
                <span className="avatar">{p.payer[0]}</span>
                <b>{p.payer}</b>
              </div>
              <span>→</span>
              <div className="person">
                <span className="avatar">{p.payee[0]}</span>
                <b>{p.payee}</b>
              </div>
              <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                <b>{centsToMoney(p.amount)}</b>
                <form action={recordSettlementAction}>
                  <input type="hidden" name="payer" value={p.payer} />
                  <input type="hidden" name="payee" value={p.payee} />
                  <input
                    type="hidden"
                    name="amount"
                    value={String(p.amount / 100)}
                  />
                  <button
                    className="btn light"
                    style={{ padding: "6px 10px", fontSize: 12 }}
                  >
                    Settle up
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid grid-2">
        <div className="card">
          <h2>Balance summary</h2>
          {report ? (
            <p className="subtle">
              <span className="badge ok">Imported</span> Last import:{" "}
              {report.filename} · {report.expensesImported} expenses ·{" "}
              {report.settlementsImported} settlements · {report.rowsSkipped}{" "}
              skipped.
            </p>
          ) : (
            <p className="badge warn">No import yet</p>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Net</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(net).map(([name, cents]) => (
                  <tr key={name}>
                    <td>
                      <Link
                        className="person"
                        style={{ textDecoration: "none" }}
                        href={`/person?name=${name}`}
                      >
                        <span className="avatar">{name[0]}</span>
                        <b>{name}</b>
                      </Link>
                    </td>
                    <td className={cents >= 0 ? "pos" : "neg"}>
                      {centsToMoney(cents)}
                    </td>
                    <td>
                      <span className={`badge ${cents >= 0 ? "ok" : "err"}`}>
                        {cents >= 0 ? "is owed" : "owes"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div id="actions" className="card">
          <h2>Record a payment</h2>
          <p className="subtle">
            When someone pays someone back, record it here and the dashboard
            updates instantly.
          </p>
          <form action={recordSettlementAction} className="form-row">
            <label>
              <span className="subtle">Payer</span>
              <select name="payer" defaultValue={people[0]?.name}>
                {people.map((p) => (
                  <option key={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="subtle">Receiver</span>
              <select name="payee" defaultValue={people[1]?.name}>
                {people.map((p) => (
                  <option key={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="subtle">Amount ₹</span>
              <input name="amount" placeholder="2500" />
            </label>
            <button>Record</button>
          </form>
          <p className="subtle">
            <Link className="btn ghost" href="/analytics">
              View charts
            </Link>{" "}
            <Link className="btn ghost" href="/expenses">
              Trace rows
            </Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}
