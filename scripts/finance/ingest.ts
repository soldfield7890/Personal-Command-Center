import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type Row = Record<string, any>;

function normalizeKey(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[_-]+/g, " ");
}

function pick<T extends Row>(row: T, keys: string[]) {
  const map = new Map<string, any>();
  for (const [k, v] of Object.entries(row)) map.set(normalizeKey(k), v);
  for (const key of keys) {
    const v = map.get(normalizeKey(key));
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function toNumber(v: any): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/[$,]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toDecimal(v: any): Prisma.Decimal | null {
  const n = toNumber(v);
  if (n === null) return null;
  return new Prisma.Decimal(n);
}

function inferSecurityType(ticker: string) {
  const t = ticker.trim().toUpperCase();
  if (/^[A-Z.\-]{1,10}$/.test(t)) return "STOCK" as const;
  return "OTHER" as const;
}

function chooseSheets(sheetNames: string[]) {
  const lower = sheetNames.map((s) => s.toLowerCase());
  const portfolioIdx = lower.findIndex((s) => s.includes("portfolio") || s.includes("positions") || s.includes("holdings"));
  const watchIdx = lower.findIndex((s) => s.includes("watch"));

  const portfolioSheet = portfolioIdx >= 0 ? sheetNames[portfolioIdx] : sheetNames[0];
  const watchSheet =
    watchIdx >= 0
      ? sheetNames[watchIdx]
      : sheetNames.length > 1
        ? sheetNames.find((s) => s !== portfolioSheet) ?? sheetNames[0]
        : null;

  return { portfolioSheet, watchSheet };
}

async function main() {
  const xlsxPath = process.env.FINANCE_XLSX_PATH;
  const accountName = process.env.FINANCE_ACCOUNT_NAME || "Primary Portfolio";
  const sourceRef =
    process.env.FINANCE_SOURCE_REF ||
    (xlsxPath ? path.basename(xlsxPath) : "finance:unknown");

  if (!xlsxPath) {
    throw new Error(
      "FINANCE_XLSX_PATH is missing. Set it in your .env (recommended) or inline when running the command."
    );
  }
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Excel file not found at FINANCE_XLSX_PATH: ${xlsxPath}`);
  }

  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheetNames = wb.SheetNames;

  if (!sheetNames.length) {
    throw new Error("Excel workbook has no sheets.");
  }

  const { portfolioSheet, watchSheet } = chooseSheets(sheetNames);

  console.log("✅ Workbook:", xlsxPath);
  console.log("✅ Sheets:", sheetNames);
  console.log("➡️  Portfolio sheet:", portfolioSheet);
  console.log("➡️  Watchlist sheet:", watchSheet ?? "NONE");

  const asOf = new Date();

  // Ensure account exists (upsert by unique name)
  const account = await prisma.financeAccount.upsert({
    where: { name: accountName },
    update: {
      institution: null,
      accountType: null,
      sourceSystem: "IMPORTED_FIXTURE",
      sourceRef,
      asOf,
      confidence: "HIGH",
    },
    create: {
      name: accountName,
      institution: null,
      accountType: null,
      sourceSystem: "IMPORTED_FIXTURE",
      sourceRef,
      asOf,
      confidence: "HIGH",
    },
  });

  // Load rows
  const portfolioRows: Row[] = XLSX.utils.sheet_to_json(wb.Sheets[portfolioSheet], { defval: "" });
  const watchRows: Row[] =
    watchSheet && wb.Sheets[watchSheet]
      ? XLSX.utils.sheet_to_json(wb.Sheets[watchSheet], { defval: "" })
      : [];

  // Minimal, conservative mapping:
  // ticker/symbol required for security
  // quantity required for position; otherwise row is skipped (with WARN)
  let insertedPositions = 0;
  let insertedWatch = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];

  // For idempotency on re-run: remove prior snapshot positions for this same sourceRef + account
  await prisma.financePosition.deleteMany({
    where: { accountId: account.id, sourceSystem: "IMPORTED_FIXTURE", sourceRef },
  });

  // Ingest portfolio positions
  for (const r of portfolioRows) {
    const tickerRaw = pick(r, ["ticker", "symbol", "security", "asset", "instrument"]);
    const ticker = tickerRaw ? String(tickerRaw).trim().toUpperCase() : "";

    if (!ticker) {
      skipped++;
      skippedReasons.push("portfolio: missing ticker/symbol");
      continue;
    }

    const qty = toDecimal(pick(r, ["quantity", "qty", "shares", "share count", "units"]));
    if (!qty || qty.equals(0)) {
      skipped++;
      skippedReasons.push(`portfolio: ${ticker} missing/zero quantity`);
      continue;
    }

    const nameRaw = pick(r, ["name", "security name", "description", "company"]);
    const name = nameRaw ? String(nameRaw).trim() : ticker;

    const avgCost = toDecimal(pick(r, ["avg cost", "average cost", "cost basis", "avg price", "purchase price"]));
    const marketValue = toDecimal(pick(r, ["market value", "value", "current value"]));

    const securityType = inferSecurityType(ticker);

    // Upsert security by unique ticker
    const security = await prisma.financeSecurity.upsert({
      where: { ticker },
      update: {
        name,
        securityType,
        currency: "USD",
        sourceSystem: "IMPORTED_FIXTURE",
        sourceRef,
        asOf,
        confidence: "HIGH",
      },
      create: {
        ticker,
        name,
        securityType,
        currency: "USD",
        sourceSystem: "IMPORTED_FIXTURE",
        sourceRef,
        asOf,
        confidence: "HIGH",
      },
    });

    await prisma.financePosition.create({
      data: {
        securityId: security.id,
        accountId: account.id,
        quantity: qty,
        avgCost,
        marketValue,
        asOf,
        sourceSystem: "IMPORTED_FIXTURE",
        sourceRef,
        ingestedAt: new Date(),
        confidence: "HIGH",
      },
    });

    insertedPositions++;
  }

  // Ingest watchlist securities (no positions)
  for (const r of watchRows) {
    const tickerRaw = pick(r, ["ticker", "symbol", "security", "instrument"]);
    const ticker = tickerRaw ? String(tickerRaw).trim().toUpperCase() : "";
    if (!ticker) {
      skipped++;
      skippedReasons.push("watchlist: missing ticker/symbol");
      continue;
    }

    const nameRaw = pick(r, ["name", "security name", "description", "company"]);
    const name = nameRaw ? String(nameRaw).trim() : ticker;
    const securityType = inferSecurityType(ticker);

    await prisma.financeSecurity.upsert({
      where: { ticker },
      update: {
        name,
        securityType,
        currency: "USD",
        sourceSystem: "IMPORTED_FIXTURE",
        sourceRef,
        asOf,
        confidence: "HIGH",
      },
      create: {
        ticker,
        name,
        securityType,
        currency: "USD",
        sourceSystem: "IMPORTED_FIXTURE",
        sourceRef,
        asOf,
        confidence: "HIGH",
      },
    });

    insertedWatch++;
  }

  const status = skipped > 0 ? "WARN" : "OK";
  const message =
    skipped > 0
      ? `Ingested positions=${insertedPositions}, watchlist=${insertedWatch}, skipped=${skipped} (see logs)`
      : `Ingested positions=${insertedPositions}, watchlist=${insertedWatch}`;

  await prisma.sourceManifest.create({
    data: {
      domain: "FINANCE",
      sourceRef,
      asOf,
      ingestedAt: new Date(),
      rowCount: insertedPositions + insertedWatch,
      status,
      message,
    },
  });

  console.log("✅ Finance ingest complete");
  console.log({ account: account.name, insertedPositions, insertedWatch, skipped, status });
  if (skippedReasons.length) {
    console.log("⚠️  Skipped reasons (first 25):");
    for (const s of skippedReasons.slice(0, 25)) console.log(" -", s);
  }
}

main()
  .catch((e) => {
    console.error("❌ Finance ingest failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
