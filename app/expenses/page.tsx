import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToMoney } from "@/lib/format";

export default async function Expenses({
  searchParams,
}: {
  searchParams: { q?: string; person?: string; split?: string };
}) {
  await requireUser();
  const q = (searchParams.q ?? "").toLowerCase();
  const people = await prisma.person.findMany({ orderBy: { name: "asc" } });
  const all = await prisma.expense.findMany({
    include: { paidBy: true, shares: { include: { person: true } } },
    orderBy: [{ expenseDate: "asc" }, { rowNumber: "asc" }],
  });
  const rows = all.filter(
    (e) =>
      (!q ||
        e.description.toLowerCase().includes(q) ||
        e.paidBy.name.toLowerCase().includes(q)) &&
      (!searchParams.person ||
        e.paidBy.name === searchParams.person ||
        e.shares.some((s) => s.person.name === searchParams.person)) &&
      (!searchParams.split || e.splitType === searchParams.split),
  );
  const total = rows.reduce((a, e) => a + e.amountInrCents, 0);
  return (
    <Shell title="Expenses">
      <section id="summary" className="grid grid-3">
        <div className="stat">
          <div className="stat-label">Matched</div>
          <div className="stat-value">{rows.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total</div>
          <div className="stat-value">{centsToMoney(total)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Mode</div>
          <div className="stat-value">Live</div>
        </div>
      </section>
      <div id="actions" className="card">
        <h2>Search and filter</h2>
        <form className="form-row">
          <label>
            <span className="subtle">Search</span>
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="rent, Goa, Rohan..."
            />
          </label>
          <label>
            <span className="subtle">Person</span>
            <select name="person" defaultValue={searchParams.person}>
              <option value="">All</option>
              {people.map((p) => (
                <option key={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="subtle">Split</span>
            <select name="split" defaultValue={searchParams.split}>
              <option value="">All</option>
              {["equal", "unequal", "percentage", "share"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button>Apply</button>
        </form>
      </div>
      <div id="details" className="card">
        <h2>Expense trace</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Row</th>
                <th>Date</th>
                <th>Description</th>
                <th>Paid by</th>
                <th>Amount</th>
                <th>Split</th>
                <th>Shares</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>#{e.rowNumber}</td>
                  <td>{e.expenseDate}</td>
                  <td>
                    <b>{e.description}</b>
                  </td>
                  <td>
                    <Link
                      className="person"
                      href={`/person?name=${e.paidBy.name}`}
                    >
                      <span className="avatar">{e.paidBy.name[0]}</span>
                      {e.paidBy.name}
                    </Link>
                  </td>
                  <td>{centsToMoney(e.amountInrCents)}</td>
                  <td>
                    <span className="badge">{e.splitType}</span>
                  </td>
                  <td>
                    {e.shares.map((s) => (
                      <span className="badge" key={s.id}>
                        {s.person.name}: {centsToMoney(s.shareInrCents)}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
