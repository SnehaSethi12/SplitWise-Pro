import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureBaseData } from "./db";

export async function requireUser() {
  await ensureBaseData();
  const session = cookies().get("splitwise_session")?.value;
  if (session !== "admin@example.com") redirect("/login");
  return { email: session };
}
