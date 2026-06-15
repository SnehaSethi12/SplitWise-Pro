"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { readFile } from "fs/promises";
import { importCsv } from "@/lib/importer";
import { ensureBaseData, personId, prisma } from "@/lib/db";
import { moneyToCents } from "@/lib/format";

export async function loginAction(form: FormData) {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  await ensureBaseData();

  if (email === "admin@example.com" && password === "password") {
    cookies().set("splitwise_session", email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // keep user logged in for 7 days
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    redirect("/");
  }

  redirect("/login?error=1");
}

export async function importBundledAction() {
  const text = await readFile("data/expenses_export.csv", "utf8");

  await importCsv(text, "data/expenses_export.csv");

  redirect("/import");
}

export async function importUploadAction(form: FormData) {
  const file = form.get("csvfile") as File | null;

  if (file) {
    await importCsv(await file.text(), file.name);
  }

  redirect("/import");
}

export async function createGroupAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();

  if (name) {
    await prisma.group.create({
      data: { name },
    });
  }

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

  revalidatePath("/groups");
  revalidatePath("/members");
  redirect("/groups");
}

export async function recordSettlementAction(form: FormData) {
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

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/analytics");

  redirect("/");
}
