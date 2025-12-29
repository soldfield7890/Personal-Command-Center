/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `FinanceAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ticker]` on the table `FinanceSecurity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FinanceAccount_name_key" ON "FinanceAccount"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceSecurity_ticker_key" ON "FinanceSecurity"("ticker");
