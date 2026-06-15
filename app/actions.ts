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
}););
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
  if (file) await importCsv(await file.text(), file.name);
  redirect("/import");
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
