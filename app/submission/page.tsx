import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const repoBase = "https://github.com/SnehaSethi12/SplitWise-Pro/blob/main";

export default async function SubmissionPage() {
  await requireUser();

  const report = await prisma.importReport.findFirst({
    orderBy: { id: "desc" },
  });

  const anomalyCount = report
    ? await prisma.anomaly.count({
        where: { reportId: report.id },
      })
    : 0;

  return (
    <Shell title="Submission">
      <section id="summary" className="grid grid-4">
        <div className="stat">
          <div className="stat-label">Docs</div>
          <div className="stat-value">Ready</div>
        </div>

        <div className="stat">
          <div className="stat-label">Import Report</div>
          <div className="stat-value">{report ? "Ready" : "Pending"}</div>
        </div>

        <div className="stat">
          <div className="stat-label">Anomalies</div>
          <div className="stat-value">{anomalyCount}</div>
        </div>

        <div className="stat">
          <div className="stat-label">Database</div>
          <div className="stat-value">Relational</div>
        </div>
      </section>

      <section id="actions" className="card">
        <h2>Required deliverables</h2>

        <p className="subtle">
          This page gives quick access to the assignment deliverables. The import
          report is generated inside the app after importing the CSV.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 12,
          }}
        >
          <a className="btn light" href={`${repoBase}/README.md`} target="_blank">
            README
          </a>

          <a className="btn secondary" href={`${repoBase}/SCOPE.md`} target="_blank">
            SCOPE
          </a>

          <a
            className="btn secondary"
            href={`${repoBase}/DECISIONS.md`}
            target="_blank"
          >
            DECISIONS
          </a>

          <a
            className="btn secondary"
            href={`${repoBase}/AI_USAGE.md`}
            target="_blank"
          >
            AI_USAGE
          </a>

          <Link className="btn secondary" href="/import#details">
            Import Report
          </Link>

          <Link className="btn secondary" href="/expenses">
            Expense Trace
          </Link>

          <Link className="btn secondary" href="/groups">
            Groups
          </Link>
        </div>
      </section>

      <section id="visuals" className="grid grid-2">
        <div className="card">
          <h2>Import report status</h2>

          {report ? (
            <>
              <p className="subtle">
                Latest import file: <b>{report.filename}</b>
              </p>

              <p className="subtle">
                Rows seen: <b>{report.rowsSeen}</b>
              </p>

              <p className="subtle">
                Expenses imported: <b>{report.expensesImported}</b>
              </p>

              <p className="subtle">
                Settlements imported: <b>{report.settlementsImported}</b>
              </p>

              <p className="subtle">
                Rows skipped: <b>{report.rowsSkipped}</b>
              </p>

              <p className="subtle">
                Anomalies detected: <b>{anomalyCount}</b>
              </p>

              <Link className="btn light" href="/import#details">
                View Import Report
              </Link>
            </>
          ) : (
            <>
              <p className="subtle">
                No import report exists yet. Go to Import and click the bundled
                CSV import button.
              </p>

              <Link className="btn light" href="/import">
                Go to Import
              </Link>
            </>
          )}
        </div>

        <div className="card">
          <h2>Submission checklist</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Status</th>
                  <th>Where</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Public deployed app URL</td>
                  <td>
                    <span className="badge ok">Done</span>
                  </td>
                  <td>Render deployment URL</td>
                </tr>

                <tr>
                  <td>GitHub repository</td>
                  <td>
                    <span className="badge ok">Done</span>
                  </td>
                  <td>GitHub repo</td>
                </tr>

                <tr>
                  <td>README.md</td>
                  <td>
                    <span className="badge ok">Done</span>
                  </td>
                  <td>
                    <a href={`${repoBase}/README.md`} target="_blank">
                      README.md
                    </a>
                  </td>
                </tr>

                <tr>
                  <td>SCOPE.md</td>
                  <td>
                    <span className="badge ok">Done</span>
                  </td>
                  <td>
                    <a href={`${repoBase}/SCOPE.md`} target="_blank">
                      SCOPE.md
                    </a>
                  </td>
                </tr>

                <tr>
                  <td>DECISIONS.md</td>
                  <td>
                    <span className="badge ok">Done</span>
                  </td>
                  <td>
                    <a href={`${repoBase}/DECISIONS.md`} target="_blank">
                      DECISIONS.md
                    </a>
                  </td>
                </tr>

                <tr>
                  <td>AI_USAGE.md</td>
                  <td>
                    <span className="badge ok">Done</span>
                  </td>
                  <td>
                    <a href={`${repoBase}/AI_USAGE.md`} target="_blank">
                      AI_USAGE.md
                    </a>
                  </td>
                </tr>

                <tr>
                  <td>Import report</td>
                  <td>
                    <span className={report ? "badge ok" : "badge warn"}>
                      {report ? "Generated" : "Pending"}
                    </span>
                  </td>
                  <td>
                    <Link href="/import#details">Import page</Link>
                  </td>
                </tr>

                <tr>
                  <td>Relational DB</td>
                  <td>
                    <span className="badge ok">Done</span>
                  </td>
                  <td>
                    <a href={`${repoBase}/prisma/schema.prisma`} target="_blank">
                      prisma/schema.prisma
                    </a>
                  </td>
                </tr>

                <tr>
                  <td>Create/manage groups</td>
                  <td>
                    <span className="badge ok">Done</span>
                  </td>
                  <td>
                    <Link href="/groups">Groups page</Link>
                  </td>
                </tr>

                <tr>
                  <td>Expense trace</td>
                  <td>
                    <span className="badge ok">Done</span>
                  </td>
                  <td>
                    <Link href="/expenses">Expenses page</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="details" className="card">
        <h2>How evaluator should use this app</h2>

        <ol className="subtle">
          <li>Login with admin@example.com / password.</li>
          <li>Go to Import.</li>
          <li>Click Import bundled expenses_export.csv.</li>
          <li>Review the generated anomaly report.</li>
          <li>Go to Overview for balances and settlements.</li>
          <li>Go to Expenses to trace exact rows.</li>
          <li>Go to Groups or People to check membership dates.</li>
        </ol>
      </section>
    </Shell>
  );
}
