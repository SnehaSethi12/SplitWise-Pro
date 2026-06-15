import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { prisma, MEMBERSHIPS } from "@/lib/db";
function isActive(name: string, date: string) {
  const m = MEMBERSHIPS[name];
  return !!m && date >= m[0] && (!m[1] || date <= m[1]);
}
export default async function Members({
  searchParams,
}: {
  searchParams: { person?: string; date?: string };
}) {
  await requireUser();
  const memberships = await prisma.groupMembership.findMany({
    include: { person: true },
    orderBy: [{ joinedOn: "asc" }],
  });
  const person = searchParams.person ?? "Sam",
    date = searchParams.date ?? "2026-03-18",
    active = isActive(person, date);
  return (
    <Shell title="People">
      <section id="summary" className="grid grid-3">
        {memberships.map((m) => (
          <Link
            className="card"
            style={{ textDecoration: "none" }}
            href={`/person?name=${m.person.name}`}
            key={m.id}
          >
            <div className="person">
              <span className="avatar">{m.person.name[0]}</span>
              <b>{m.person.name}</b>
            </div>
            <p className="subtle">
              Joined {m.joinedOn} · Left {m.leftOn ?? "present"}
            </p>
          </Link>
        ))}
      </section>
      <section id="visuals" className="grid grid-2">
        <div className="card">
          <h2>Membership checker</h2>
          <p className="subtle">Try Sam in March or Meera after March.</p>
          <form
            className="form-row"
            style={{ gridTemplateColumns: "1fr 1fr auto" }}
          >
            <label>
              <span className="subtle">Person</span>
              <select name="person" defaultValue={person}>
                {memberships.map((m) => (
                  <option key={m.id}>{m.person.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="subtle">Date</span>
              <input name="date" defaultValue={date} />
            </label>
            <button>Check</button>
          </form>
        </div>
        <div className="stat">
          <div className="stat-label">Membership check</div>
          <div className={`stat-value ${active ? "pos" : "neg"}`}>
            {active ? "Active" : "Not active"}
          </div>
          <p className="subtle">
            {person} on {date}
          </p>
        </div>
      </section>
      <div id="details" className="card">
        <h2>Membership timeline</h2>
        {memberships.map((m) => (
          <div className="timeline-row" key={m.id}>
            <div className="person">
              <span className="avatar">{m.person.name[0]}</span>
              <b>{m.person.name}</b>
            </div>
            <span className="badge ok">Joined {m.joinedOn}</span>
            <span className={`badge ${m.leftOn ? "warn" : "ok"}`}>
              {m.leftOn ?? "present"}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
}
