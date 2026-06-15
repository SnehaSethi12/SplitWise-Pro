"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { readFile } from "fs/promises";
import { importCsv } from "@/lib/importer";
import { ensureBaseData, personId, prisma } from "@/lib/db";
import { moneyToCents } from "@/lib/format";

function refreshDemoSession() {
  cookies().set("splitwise_session", "admin@example.com", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });
}

function revalidateMainPages() {
  revalidatePath("/");
  revalidatePath("/import");
  revalidatePath("/expenses");
  revalidatePath("/analytics");
  revalidatePath("/members");
  revalidatePath("/groups");
}

export async function loginAction(form: FormData) {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  await ensureBaseData();

  if (email === "admin@example.com" && password === "password") {
    refreshDemoSession();
    redirect("/");
  }

  redirect("/login?error=1");
}

export async function importBundledAction() {
  await ensureBaseData();

  const text = await readFile("data/expenses_export.csv", "utf8");

  await importCsv(text, "data/expenses_export.csv");

  refreshDemoSession();
  revalidateMainPages();

  redirect("/import?imported=1");
}

export async function importUploadAction(form: FormData) {
  await ensureBaseData();

  const file = form.get("csvfile") as File | null;

  if (file && file.size > 0) {
    await importCsv(await file.text(), file.name);
  }

  refreshDemoSession();
  revalidateMainPages();

  redirect("/import?imported=1");
}

export async function resetImportedDataAction() {
  await prisma.anomaly.deleteMany();
  await prisma.importReport.deleteMany();
  await prisma.expenseShare.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.settlement.deleteMany();

  refreshDemoSession();
  revalidateMainPages();

  redirect("/import?reset=1");
}

export async function createGroupAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();

  if (name) {
    await prisma.group.create({
      data: { name },
    });
  }

  refreshDemoSession();
  revalidatePath("/groups");

  redirect("/groups");
}

export async function addMembershipAction(form: FormData) {
  const groupId = Number(form.get("groupId"));
  const name = String(form.get("name") ?? "").trim();
  const joinedOn = String(form.get("joinedOn") ?? "").trim();
  const leftOnRaw = String(form.get("leftOn") ?? "").trim();

  if (groupId && name && joinedOn) {
    const pid = await personId(name);

    await prisma.groupMembership.create({
      data: {
        groupId,
        personId: pid,
        joinedOn,
        leftOn: leftOnRaw || null,
      },
    });
  }

  refreshDemoSession();
  revalidatePath("/groups");
  revalidatePath("/members");

  redirect("/groups");
}

export async function updateMembershipAction(form: FormData) {
  const id = Number(form.get("membershipId"));
  const leftOnRaw = String(form.get("leftOn") ?? "").trim();

  if (id) {
    await prisma.groupMembership.update({
      where: { id },
      data: {
        leftOn: leftOnRaw || null,
      },
    });
  }

  refreshDemoSession();
  revalidatePath("/groups");
  revalidatePath("/members");

  redirect("/groups");
}

export async function recordSettlementAction(form: FormData) {
  await ensureBaseData();

  const payer = String(form.get("payer") ?? "");
  const payee = String(form.get("payee") ?? "");
  const amount = Number(String(form.get("amount") ?? "0").replace(/,/g, ""));

  if (payer && payee && payer !== payee && amount > 0) {
    const group = await ensureBaseData();

    await prisma.settlement.create({
      data: {
        groupId: group.id,
        settlementDate: new Date().toISOString().slice(0, 10),
        payerId: await personId(payer),
        payeeId: await personId(payee),
        amountInrCents: moneyToCents(amount),
        note: "Manual payment recorded in app",
      },
    });
  }

  refreshDemoSession();
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/analytics");
  revalidatePath("/person");

  redirect("/");
}
