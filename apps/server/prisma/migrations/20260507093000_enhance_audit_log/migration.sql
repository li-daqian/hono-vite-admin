-- AlterTable
ALTER TABLE "audit_log"
ADD COLUMN "result" TEXT,
ADD COLUMN "failure_reason" TEXT;

-- Backfill metadata from existing structured snapshots when available.
UPDATE "audit_log"
SET
  "result" = NULLIF("request_snapshot"->>'result', ''),
  "failure_reason" = NULLIF("request_snapshot"->>'reason', '')
WHERE jsonb_typeof("request_snapshot") = 'object';

-- CreateIndex
CREATE INDEX "audit_log_result_created_at_idx" ON "audit_log"("result", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_failure_reason_idx" ON "audit_log"("failure_reason");
