import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  addMembershipAction,
  createGroupAction,
  updateMembershipAction,
} from "../actions";

export default async function GroupsPage() {
  await requireUser();

  const groups = await prisma.group.findMany({
    include: {
      memberships: {
        include: { person: true },
        orderBy: [{ joinedOn: "asc" }, { id: "asc" }],
      },
      _count: {
        select: {
          expenses: true,
          settlements: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return (
    <Shell title="Groups">
      <section id="summary" className="grid grid-3">
        <div className="stat">
          <div className="stat-label">Groups</div>
          <div className="stat-value">{groups.length}</div>
        </div>

        <div className="stat">
          <div className="stat-label">Membership rows</div>
          <div className="stat-value">
            {groups.reduce((sum, g) => sum + g.memberships.length, 0)}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">Purpose</div>
          <div className="stat-value">Manage</div>
        </div>
      </section>

      <section id="actions" className="grid grid-2">
        <div className="card">
          <h2>Create group</h2>
          <p className="subtle">
            Create another shared-expense group. The assignment group is seeded
            as Flatmates 2026.
          </p>

          <form
            action={createGroupAction}
            className="form-row"
            style={{ gridTemplateColumns: "1fr auto" }}
          >
            <label>
              <span className="subtle">Group name</span>
              <input name="name" placeholder="Weekend Trip" />
            </label>

            <button>Create</button>
          </form>
        </div>

        <div className="card">
          <h2>Add member / membership period</h2>
          <p className="subtle">
            Membership is date-based, so people can join and leave over time.
          </p>

          <form action={addMembershipAction} className="form-row">
            <label>
              <span className="subtle">Group</span>
              <select name="groupId">
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="subtle">Person</span>
              <input name="name" placeholder="New member name" />
            </label>

            <label>
              <span className="subtle">Joined on</span>
              <input name="joinedOn" placeholder="2026-04-10" />
            </label>

            <label>
              <span className="subtle">Left on optional</span>
              <input name="leftOn" placeholder="2026-05-01" />
            </label>

            <button>Add</button>
          </form>
        </div>
      </section>

      <section id="details" className="grid grid-2">
        {groups.map((group) => (
          <div className="card" key={group.id}>
            <h2>{group.name}</h2>

            <p className="subtle">
              {group._count.expenses} expenses · {group._count.settlements}{" "}
              settlements
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Joined</th>
                    <th>Left</th>
                    <th>Update leave date</th>
                  </tr>
                </thead>

                <tbody>
                  {group.memberships.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="person">
                          <span className="avatar">{m.person.name[0]}</span>
                          <b>{m.person.name}</b>
                        </div>
                      </td>

                      <td>{m.joinedOn}</td>

                      <td>
                        <span className={`badge ${m.leftOn ? "warn" : "ok"}`}>
                          {m.leftOn ?? "present"}
                        </span>
                      </td>

                      <td>
                        <form
                          action={updateMembershipAction}
                          className="form-row"
                          style={{ gridTemplateColumns: "1fr auto" }}
                        >
                          <input
                            type="hidden"
                            name="membershipId"
                            value={m.id}
                          />

                          <input
                            name="leftOn"
                            placeholder={m.leftOn ?? "present"}
                          />

                          <button>Save</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </Shell>
  );
}
