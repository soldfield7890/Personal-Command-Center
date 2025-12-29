import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Check your .env file in the repo root."
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1) Household (idempotent via upsert by name)
  const household = await prisma.household.upsert({
    where: { name: "Oldfield Household" },
    update: {},
    create: {
      name: "Oldfield Household",
      timezone: "America/New_York",
    },
  });

  // 2) Minimal System Health manifest row
  await prisma.sourceManifest.create({
    data: {
      domain: "SYSTEM",
      sourceRef: "seed:init_v1",
      asOf: new Date(),
      rowCount: 0,
      status: "OK",
      message: `Seeded household=${household.id}`,
    },
  });

  console.log("✅ Seed complete:", { householdId: household.id });
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
