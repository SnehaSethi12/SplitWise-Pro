import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export const GROUP_NAME = "Flatmates 2026";
export const MEMBERSHIPS: Record<string, [string, string | null]> = {
  Aisha: ["2026-02-01", null],
  Rohan: ["2026-02-01", null],
  Priya: ["2026-02-01", null],
  Meera: ["2026-02-01", "2026-03-31"],
  Dev: ["2026-02-08", "2026-03-12"],
  Kabir: ["2026-03-11", "2026-03-11"],
  Sam: ["2026-04-10", null],
};

export async function ensureBaseData() {
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", passwordHash: "password" },
  });
  const group = await prisma.group.upsert({
    where: { id: 1 },
    update: { name: GROUP_NAME },
    create: { name: GROUP_NAME },
  });
  for (const [name, [joinedOn, leftOn]] of Object.entries(MEMBERSHIPS)) {
    const person = await prisma.person.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    const exists = await prisma.groupMembership.findFirst({
      where: { groupId: group.id, personId: person.id, joinedOn },
    });
    if (!exists)
      await prisma.groupMembership.create({
        data: { groupId: group.id, personId: person.id, joinedOn, leftOn },
      });
  }
  return group;
}

export async function personId(name: string) {
  const p = await prisma.person.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return p.id;
}
