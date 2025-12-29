/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Household` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Household_name_key" ON "Household"("name");
