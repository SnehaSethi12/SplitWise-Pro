import { cookies } from "next/headers";
import { ensureBaseData } from "./db";

export async function requireUser() {
  await ensureBaseData();

  const session = cookies().get("splitwise_session")?.value;

  return {
    email: session || "admin@example.com",
  };
}
