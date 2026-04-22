-- CreateEnum
CREATE TYPE "audit_category" AS ENUM ('LOGIN', 'OPERATION');

-- AlterTable
ALTER TABLE "audit_log"
ADD COLUMN "category" "audit_category" NOT NULL DEFAULT 'OPERATION',
ALTER COLUMN "operator_id" DROP NOT NULL;

-- DropIndex
DROP INDEX "audit_log_module_idx";

-- CreateIndex
CREATE INDEX "audit_log_category_created_at_idx" ON "audit_log"("category", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_module_created_at_idx" ON "audit_log"("module", "created_at");
