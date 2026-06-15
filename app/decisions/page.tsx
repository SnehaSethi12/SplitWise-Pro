import { readFile } from "fs/promises";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
export default async function Decisions() {
  await requireUser();
  let txt = "";
  try {
    txt = await readFile("DECISIONS.md", "utf8");
  } catch {}
  return (
    <Shell title="Decisions">
      <div className="card">
        <pre>{txt}</pre>
      </div>
    </Shell>
  );
}
