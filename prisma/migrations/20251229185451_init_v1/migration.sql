-- CreateEnum
CREATE TYPE "SourceSystem" AS ENUM ('DRIVE', 'MANUAL', 'IMPORTED_FIXTURE');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('FINANCE', 'HEALTH', 'HOME', 'VEHICLES', 'GARDEN', 'HUNTING', 'WORK', 'LIFE_ADMIN', 'SYSTEM', 'PEOPLE', 'GROCERY', 'TASKS');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('HOME', 'VEHICLE', 'EQUIPMENT', 'PROPERTY', 'ACCOUNT', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'SOLD', 'RETIRED');

-- CreateEnum
CREATE TYPE "SecurityType" AS ENUM ('STOCK', 'ETF', 'MUTUAL_FUND', 'CRYPTO', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "FinanceActionLabel" AS ENUM ('BUY', 'HOLD', 'WATCH', 'AVOID');

-- CreateEnum
CREATE TYPE "ManifestStatus" AS ENUM ('OK', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "role" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "email" TEXT,
    "phone" TEXT,
    "sourceSystem" "SourceSystem" NOT NULL,
    "sourceRef" TEXT,
    "asOf" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "sourceSystem" "SourceSystem" NOT NULL,
    "sourceRef" TEXT,
    "asOf" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "domain" "Domain" NOT NULL,
    "driveFileId" TEXT,
    "drivePath" TEXT,
    "mimeType" TEXT,
    "sourceSystem" "SourceSystem" NOT NULL,
    "sourceRef" TEXT,
    "asOf" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceManifest" (
    "id" TEXT NOT NULL,
    "domain" "Domain" NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "asOf" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ManifestStatus" NOT NULL DEFAULT 'OK',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceManifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceSecurity" (
    "id" TEXT NOT NULL,
    "ticker" TEXT,
    "name" TEXT NOT NULL,
    "securityType" "SecurityType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "sourceSystem" "SourceSystem" NOT NULL,
    "sourceRef" TEXT,
    "asOf" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceSecurity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "accountType" TEXT,
    "sourceSystem" "SourceSystem" NOT NULL,
    "sourceRef" TEXT,
    "asOf" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancePosition" (
    "id" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "accountId" TEXT,
    "quantity" DECIMAL(18,6) NOT NULL,
    "avgCost" DECIMAL(18,6),
    "marketValue" DECIMAL(18,2),
    "asOf" TIMESTAMP(3),
    "sourceSystem" "SourceSystem" NOT NULL,
    "sourceRef" TEXT,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceScoreRun" (
    "id" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceManifestId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceScoreRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceSecurityScore" (
    "id" TEXT NOT NULL,
    "scoreRunId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "componentScores" JSONB NOT NULL,
    "finalScore" DECIMAL(6,2) NOT NULL,
    "actionLabel" "FinanceActionLabel" NOT NULL,
    "buyUnderPrice" DECIMAL(18,4),
    "valuationBandLow" DECIMAL(18,4),
    "valuationBandBase" DECIMAL(18,4),
    "valuationBandHigh" DECIMAL(18,4),
    "expectedValue" DECIMAL(18,4),
    "guardrailFlags" JSONB NOT NULL,
    "unknownCount" INTEGER NOT NULL DEFAULT 0,
    "unknownPenaltyApplied" BOOLEAN NOT NULL DEFAULT false,
    "sourceSystem" "SourceSystem" NOT NULL,
    "sourceRef" TEXT,
    "asOf" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceSecurityScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceSecurityScore_scoreRunId_securityId_key" ON "FinanceSecurityScore"("scoreRunId", "securityId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePosition" ADD CONSTRAINT "FinancePosition_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "FinanceSecurity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePosition" ADD CONSTRAINT "FinancePosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinanceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSecurityScore" ADD CONSTRAINT "FinanceSecurityScore_scoreRunId_fkey" FOREIGN KEY ("scoreRunId") REFERENCES "FinanceScoreRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSecurityScore" ADD CONSTRAINT "FinanceSecurityScore_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "FinanceSecurity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
