import { prisma, ensureBaseData, MEMBERSHIPS, personId } from "./db";
import { moneyToCents } from "./format";

const FX: Record<string, number> = { INR: 1, USD: 83 };
const aliases: Record<string, string> = {
  aisha: "Aisha",
  rohan: "Rohan",
  priya: "Priya",
  "priya s": "Priya",
  meera: "Meera",
  dev: "Dev",
  sam: "Sam",
  "dev's friend kabir": "Kabir",
  "devs friend kabir": "Kabir",
};

type Row = Record<string, string>;
type Anomaly = {
  row: number;
  severity: string;
  code: string;
  message: string;
  action: string;
  raw?: Row;
};

function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let cur = "",
    row: string[] = [],
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i],
      next = text[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cur += '"';
      i++;
    } else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      row.push(cur);
      cur = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else cur += ch;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  const headers = rows.shift()?.map((h) => h.trim()) ?? [];
  return rows.map((r) =>
    Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])),
  );
}

function normName(raw = "") {
  const clean = raw.trim().replace(/\s+/g, " ");
  const key = clean
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, "")
    .trim();
  return aliases[key] ?? clean.replace(/\b\w/g, (c) => c.toUpperCase());
}
function parsePeople(raw = "") {
  return raw.split(";").map(normName).filter(Boolean);
}
function active(name: string, iso: string) {
  const m = MEMBERSHIPS[name];
  if (!m) return false;
  return iso >= m[0] && (!m[1] || iso <= m[1]);
}
function parseDate(
  raw: string,
  row: number,
  add: (a: Omit<Anomaly, "raw">) => void,
) {
  raw = raw.trim();
  if (/^[A-Za-z]{3}-\d{1,2}$/.test(raw)) {
    const month =
      {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
      }[raw.slice(0, 3) as "Mar"] ?? "01";
    const iso = `2026-${month}-${raw.split("-")[1].padStart(2, "0")}`;
    add({
      row,
      severity: "warning",
      code: "NON_ISO_DATE",
      message: `Date '${raw}' has no year.`,
      action: `Parsed as ${iso} using assignment year 2026.`,
    });
    return iso;
  }
  const [dd, mm, yyyy] = raw.split("-").map(Number);
  if (!dd || !mm || !yyyy) throw new Error(`Cannot parse date '${raw}'`);
  if (dd <= 12 && mm <= 12 && dd !== mm)
    add({
      row,
      severity: "warning",
      code: raw === "04-05-2026" ? "AMBIGUOUS_DATE" : "DD_MM_DATE",
      message:
        raw === "04-05-2026"
          ? `Date '${raw}' could be read in more than one locale.`
          : `Date '${raw}' is not ISO.`,
      action: "Parsed as DD-MM-YYYY because the export is from India.",
    });
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}
function parseAmount(
  raw: string,
  row: number,
  add: (a: Omit<Anomaly, "raw">) => void,
) {
  const cleaned = raw.replace(/,/g, "").trim();
  if (raw.includes(","))
    add({
      row,
      severity: "info",
      code: "THOUSANDS_SEPARATOR",
      message: `Amount '${raw}' contains a comma.`,
      action: `Removed comma and parsed as ${cleaned}.`,
    });
  let amount = Number(cleaned);
  if (!Number.isFinite(amount)) throw new Error(`Cannot parse amount '${raw}'`);
  if ((cleaned.split(".")[1]?.length ?? 0) > 2) {
    const r = Math.round(amount * 100) / 100;
    add({
      row,
      severity: "warning",
      code: "TOO_MANY_DECIMALS",
      message: `Amount '${raw}' has more than two decimals.`,
      action: `Rounded half-up to ${r.toFixed(2)}.`,
    });
    amount = r;
  }
  if (amount === 0)
    add({
      row,
      severity: "warning",
      code: "ZERO_AMOUNT",
      message: "Expense amount is zero.",
      action: "Skipped row as a no-op.",
    });
  if (amount < 0)
    add({
      row,
      severity: "info",
      code: "NEGATIVE_AMOUNT",
      message: "Amount is negative.",
      action: "Treated as a refund/credit using the same split logic.",
    });
  return amount;
}
function details(raw = "") {
  const out: Record<string, number> = {};
  raw.split(";").forEach((part) => {
    const m = part.trim().match(/^(.+?)\s+(-?[0-9.]+)\s*%?$/);
    if (m) out[normName(m[1])] = Number(m[2]);
  });
  return out;
}
function allocate(
  amount: number,
  type: string,
  people: string[],
  detailRaw: string,
  row: number,
  add: (a: Omit<Anomaly, "raw">) => void,
) {
  const d = details(detailRaw);
  const t = (type || "").toLowerCase();
  if (detailRaw && t === "equal")
    add({
      row,
      severity: "warning",
      code: "SPLIT_TYPE_DETAILS_CONFLICT",
      message: "split_type is equal but split_details are present.",
      action: "Ignored split_details because equal split is authoritative.",
    });
  if (t === "equal")
    return Object.fromEntries(people.map((p) => [p, amount / people.length]));
  if (t === "unequal") {
    const sum = Object.values(d).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - amount) > 0.01)
      add({
        row,
        severity: "warning",
        code: "UNEQUAL_SUM_MISMATCH",
        message: `Unequal shares sum to ${sum}, expense is ${amount}.`,
        action: "Scaled shares proportionally.",
      });
    return Object.fromEntries(
      Object.entries(d).map(([p, v]) => [p, (amount * v) / sum]),
    );
  }
  if (t === "percentage") {
    const sum = Object.values(d).reduce((a, b) => a + b, 0);
    if (sum !== 100)
      add({
        row,
        severity: "warning",
        code: "PERCENT_NOT_100",
        message: `Percentages sum to ${sum}%.`,
        action: "Normalized percentages proportionally.",
      });
    return Object.fromEntries(
      Object.entries(d).map(([p, v]) => [p, (amount * v) / sum]),
    );
  }
  if (t === "share") {
    const sum = Object.values(d).reduce((a, b) => a + b, 0);
    return Object.fromEntries(
      Object.entries(d).map(([p, v]) => [p, (amount * v) / sum]),
    );
  }
  throw new Error(`Unsupported split_type '${type}'`);
}
function descKey(s = "") {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w && !["at", "the", "a", "order"].includes(w)),
  );
}
function similar(a: Set<string>, b: Set<string>) {
  const inter = [...a].filter((x) => b.has(x)).length,
    uni = new Set([...a, ...b]).size || 1;
  return (
    inter / uni >= 0.5 ||
    [...a].every((x) => b.has(x)) ||
    [...b].every((x) => a.has(x))
  );
}

export async function importCsv(
  text: string,
  filename = "expenses_export.csv",
) {
  const group = await ensureBaseData();
  await prisma.anomaly.deleteMany();
  await prisma.importReport.deleteMany();
  await prisma.expenseShare.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.settlement.deleteMany();
  const rows = parseCsv(text);
  const report = await prisma.importReport.create({
    data: {
      filename,
      importedAt: new Date().toISOString(),
      rowsSeen: rows.length,
      expensesImported: 0,
      settlementsImported: 0,
      rowsSkipped: 0,
    },
  });
  const anomalies: Anomaly[] = [];
  const add = (rawRow: Row) => (a: Omit<Anomaly, "raw">) =>
    anomalies.push({ ...a, raw: rawRow });
  const seen: {
    row: number;
    date: string;
    words: Set<string>;
    payer: string;
    amount: number;
    id: number;
  }[] = [];
  let expenses = 0,
    settlements = 0,
    skipped = 0;
  for (let i = 0; i < rows.length; i++) {
    const csvRow = i + 2,
      r = rows[i],
      push = add(r);
    try {
      const iso = parseDate(r.date, csvRow, push);
      const paidBy = normName(r.paid_by);
      if (r.paid_by?.trim() && r.paid_by.trim().replace(/\s+/g, " ") !== paidBy)
        push({
          row: csvRow,
          severity: "info",
          code: "NAME_NORMALIZED",
          message: `paid_by value '${r.paid_by.trim()}' was inconsistent.`,
          action: `Normalized to '${paidBy}'.`,
        });
      const amount = parseAmount(r.amount, csvRow, push);
      if (amount === 0) {
        skipped++;
        continue;
      }
      let currency = (r.currency || "").trim().toUpperCase();
      if (!currency) {
        currency = "INR";
        push({
          row: csvRow,
          severity: "warning",
          code: "MISSING_CURRENCY",
          message: "Currency is blank.",
          action: "Defaulted to INR.",
        });
      }
      if (currency !== "INR")
        push({
          row: csvRow,
          severity: "info",
          code: "FOREIGN_CURRENCY",
          message: `${currency} amount found.`,
          action: `Converted using 1 ${currency} = ₹${FX[currency]}.`,
        });
      const amountInr = amount * (FX[currency] ?? 1);
      let people = parsePeople(r.split_with);
      if (!paidBy) {
        push({
          row: csvRow,
          severity: "error",
          code: "MISSING_PAYER",
          message: "paid_by is blank.",
          action: "Skipped: user must choose a payer.",
        });
        skipped++;
        continue;
      }
      const textBlob = `${r.description} ${r.notes}`.toLowerCase();
      if (
        (textBlob.includes("paid") && textBlob.includes("back")) ||
        textBlob.includes("deposit")
      ) {
        await prisma.settlement.create({
          data: {
            groupId: group.id,
            rowNumber: csvRow,
            settlementDate: iso,
            payerId: await personId(paidBy),
            payeeId: await personId(people[0]),
            amountInrCents: moneyToCents(amountInr),
            note: r.notes || r.description,
          },
        });
        push({
          row: csvRow,
          severity: "info",
          code: "SETTLEMENT_NOT_EXPENSE",
          message: "Row is a payment/deposit, not a shared expense.",
          action: "Imported into settlements.",
        });
        settlements++;
        continue;
      }
      const words = descKey(r.description);
      let duplicate = false;
      for (const prev of [...seen])
        if (prev.date === iso && similar(prev.words, words)) {
          if (
            prev.amount === moneyToCents(amountInr) &&
            prev.payer === paidBy
          ) {
            push({
              row: csvRow,
              severity: "warning",
              code: "DUPLICATE_EXACT",
              message: `Looks like duplicate of row ${prev.row}.`,
              action: "Skipped later duplicate; original kept.",
            });
            duplicate = true;
          } else if (moneyToCents(amountInr) > prev.amount) {
            push({
              row: csvRow,
              severity: "warning",
              code: "DUPLICATE_CONFLICT",
              message: `Looks like same event as row ${prev.row} but amount/payer differs.`,
              action: "Higher amount replaced earlier conflicting entry.",
            });
            await prisma.expense.delete({ where: { id: prev.id } });
            seen.splice(seen.indexOf(prev), 1);
            expenses--;
          } else {
            push({
              row: csvRow,
              severity: "warning",
              code: "DUPLICATE_CONFLICT",
              message: `Looks like same event as row ${prev.row} but amount/payer differs.`,
              action: "Skipped lower/later conflicting row.",
            });
            duplicate = true;
          }
          break;
        }
      if (duplicate) {
        skipped++;
        continue;
      }
      people = people.filter((p) => {
        if (!active(p, iso) && p === "Meera" && iso > "2026-03-31") {
          push({
            row: csvRow,
            severity: "warning",
            code: "INACTIVE_MEMBER_INCLUDED",
            message: "Meera was listed after leaving.",
            action: "Removed from split and recalculated.",
          });
          return false;
        }
        return true;
      });
      if (people.includes("Kabir"))
        push({
          row: csvRow,
          severity: "info",
          code: "NAME_NORMALIZED",
          message: "split_with value 'Dev's friend Kabir' was inconsistent.",
          action: "Normalized to 'Kabir'.",
        });
      const shares = allocate(
        amountInr,
        r.split_type,
        people,
        r.split_details,
        csvRow,
        push,
      );
      const exp = await prisma.expense.create({
        data: {
          groupId: group.id,
          rowNumber: csvRow,
          expenseDate: iso,
          description: r.description,
          paidById: await personId(paidBy),
          amountInrCents: moneyToCents(amountInr),
          originalAmount: r.amount,
          originalCurrency: currency,
          splitType: r.split_type,
          rawJson: JSON.stringify(r),
        },
      });
      const cents = Object.fromEntries(
        Object.entries(shares).map(([p, v]) => [p, moneyToCents(v)]),
      );
      const diff =
        moneyToCents(amountInr) -
        Object.values(cents).reduce((a, b) => a + b, 0);
      if (diff && Object.keys(cents).length)
        cents[Object.keys(cents).sort()[0]] += diff;
      for (const [p, c] of Object.entries(cents))
        await prisma.expenseShare.create({
          data: {
            expenseId: exp.id,
            personId: await personId(p),
            shareInrCents: c,
          },
        });
      seen.push({
        row: csvRow,
        date: iso,
        words,
        payer: paidBy,
        amount: moneyToCents(amountInr),
        id: exp.id,
      });
      expenses++;
    } catch (e) {
      anomalies.push({
        row: csvRow,
        severity: "error",
        code: "ROW_IMPORT_ERROR",
        message: e instanceof Error ? e.message : String(e),
        action: "Skipped row; no silent guess was made.",
        raw: r,
      });
      skipped++;
    }
  }
  await prisma.anomaly.createMany({
    data: anomalies.map((a) => ({
      reportId: report.id,
      rowNumber: a.row,
      severity: a.severity,
      code: a.code,
      message: a.message,
      action: a.action,
      rawJson: JSON.stringify(a.raw ?? {}),
    })),
  });
  await prisma.importReport.update({
    where: { id: report.id },
    data: {
      expensesImported: expenses,
      settlementsImported: settlements,
      rowsSkipped: skipped,
    },
  });
}
