import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { importBundledAction, importUploadAction } from "../actions";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: {
    severity?: string;
    imported?: string;
  };
}) {
  await requireUser();

  const report = await prisma.importReport.findFirst({
    orderBy: { id: "desc" },
  });

  const where = report
    ? {
        reportId: report.id,
        ...(searchParams.severity
          ? {
              severity: searchParams.severity,
            }
          : {}),
      }
    : undefined;

  const anomalies = report
    ? await prisma.anomaly.findMany({
        where,
        orderBy: [{ rowNumber: "asc" }, { id: "asc" }],
      })
    : [];

  return (
    <Shell title="Import">
      {searchParams.imported && (
        <div className="card">
          <h2>Import completed</h2>
          <p className="subtle">
            The CSV was imported again from scratch. Previous imported expenses,
            settlements, expense shares, anomalies, and import reports were
            cleared before this report was generated.
          </p>
        </div>
      )}

      <section className="grid grid-2">
        <div className="card">
          <h2>Upload CSV</h2>
          <p className="subtle">
            Upload the file exactly as provided. The importer detects anomalies
            and documents every action.
          </p>

          <div className="upload-box">
            <form
              action={importUploadAction}
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <input type="file" name="csvfile" accept=".csv" />
              <button>Upload and audit</button>
            </form>
          </div>
        </div>

        <div className="card">
          <h2>Quick demo import</h2>
          <p className="subtle">
            Use the bundled original CSV from the assignment. Importing again
            clears the previous imported expenses, settlements, expense shares,
            anomalies, and import report, then regenerates a fresh report from
            the original file.
          </p>

          <form action={importBundledAction}>
            <button>Import bundled expenses_export.csv</button>
          </form>
        </div>
      </section>

      {report && (
        <>
          <section className="grid grid-4">
            <div className="stat">
              <div className="stat-label">Rows</div>
              <div className="stat-value">{report.rowsSeen}</div>
            </div>

            <div className="stat">
              <div className="stat-label">Expenses</div>
              <div className="stat-value">{report.expensesImported}</div>
            </div>

            <div className="stat">
              <div className="stat-label">Settlements</div>
              <div className="stat-value">{report.settlementsImported}</div>
            </div>

            <div className="stat">
              <div className="stat-label">Skipped</div>
              <div className="stat-value">{report.rowsSkipped}</div>
            </div>
          </section>

          <div id="details" className="card">
            <h2>Audit report</h2>

            <p className="subtle">
              Every detected issue is visible below with the policy applied by
              the importer. You can safely import again at any time; each import
              starts from a clean imported-data state.
            </p>

            <p>
              <a className="btn ghost" href="/import">
                All
              </a>{" "}
              <a className="btn ghost" href="/import?severity=error">
                Errors
              </a>{" "}
              <a className="btn ghost" href="/import?severity=warning">
                Warnings
              </a>{" "}
              <a className="btn ghost" href="/import?severity=info">
                Info
              </a>
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Severity</th>
                    <th>Code</th>
                    <th>Problem</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {anomalies.map((a) => (
                    <tr key={a.id}>
                      <td>#{a.rowNumber}</td>

                      <td>
                        <span
                          className={`pill ${
                            a.severity === "error"
                              ? "err"
                              : a.severity === "warning"
                                ? "warn"
                                : "ok"
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>

                      <td>
                        <span className="badge">{a.code}</span>
                      </td>

                      <td>{a.message}</td>

                      <td>{a.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
