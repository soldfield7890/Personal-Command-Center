import { prisma } from "@/lib/db/prisma";

export type ManifestRow = {
  id: string;
  domain: string;
  sourceRef: string;
  status: string;
  asOf: Date | null;
  ingestedAt: Date;
  rowCount: number;
  message: string | null;
  updatedAt: Date;
  freshness: "FRESH" | "STALE" | "UNKNOWN";
  ageHours: number | null;
};

const STALE_AFTER_HOURS_BY_DOMAIN: Record<string, number> = {
  SYSTEM: 24,
  FINANCE: 24,
  HEALTH: 168, // 7 days
  GROCERY: 168,
  TASKS: 24,
  HOME: 168,
  VEHICLES: 168,
  GARDEN: 168,
  HUNTING: 24,
  LIFE_ADMIN: 168,
  PEOPLE: 720, // 30 days
};

function calcAgeHours(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10; // 1 decimal
}

export async function getLatestManifests(): Promise<ManifestRow[]> {
  const rows = await prisma.sourceManifest.findMany({
    orderBy: [{ domain: "asc" }, { ingestedAt: "desc" }],
    take: 200,
  });

  const latestByDomain = new Map<string, typeof rows[number]>();
  for (const r of rows) {
    if (!latestByDomain.has(r.domain)) latestByDomain.set(r.domain, r);
  }

  const now = new Date();

  return Array.from(latestByDomain.values()).map((r) => {
    const threshold = STALE_AFTER_HOURS_BY_DOMAIN[r.domain] ?? 168;

    // prefer asOf for “data freshness”, fallback to ingestedAt
    const basis = r.asOf ?? r.ingestedAt ?? null;

    let ageHours: number | null = null;
    let freshness: "FRESH" | "STALE" | "UNKNOWN" = "UNKNOWN";

    if (basis) {
      ageHours = calcAgeHours(basis, now);
      freshness = ageHours > threshold ? "STALE" : "FRESH";
    }

    return {
      id: r.id,
      domain: r.domain,
      sourceRef: r.sourceRef,
      status: r.status,
      asOf: r.asOf,
      ingestedAt: r.ingestedAt,
      rowCount: r.rowCount,
      message: r.message,
      updatedAt: r.updatedAt,
      freshness,
      ageHours,
    };
  });
}
