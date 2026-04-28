CREATE TABLE "user_department" (
    "user_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,

    CONSTRAINT "user_department_pkey" PRIMARY KEY ("user_id","department_id")
);

INSERT INTO "user_department" ("user_id", "department_id")
SELECT "id", "department_id"
FROM "user"
WHERE "department_id" IS NOT NULL;

CREATE INDEX "user_department_department_id_idx" ON "user_department"("department_id");

DROP INDEX IF EXISTS "user_department_id_idx";

ALTER TABLE "user" DROP COLUMN IF EXISTS "department_id";
