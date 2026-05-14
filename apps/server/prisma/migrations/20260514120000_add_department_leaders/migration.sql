CREATE TABLE "department_leader" (
    "department_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "department_leader_pkey" PRIMARY KEY ("department_id","user_id")
);

WITH display_name_candidates AS (
    SELECT
        "department"."id" AS "department_id",
        "user"."id" AS "user_id",
        count(*) OVER (PARTITION BY "department"."id") AS "match_count"
    FROM "department"
    INNER JOIN "user" ON "user"."display_name" = "department"."leader"
    WHERE "department"."leader" IS NOT NULL
      AND btrim("department"."leader") <> ''
),
matched_leaders AS (
    SELECT
        "department"."id" AS "department_id",
        COALESCE("username_user"."id", "display_name_user"."user_id") AS "user_id"
    FROM "department"
    LEFT JOIN "user" AS "username_user"
        ON "username_user"."username" = "department"."leader"
    LEFT JOIN display_name_candidates AS "display_name_user"
        ON "display_name_user"."department_id" = "department"."id"
       AND "display_name_user"."match_count" = 1
    WHERE "department"."leader" IS NOT NULL
      AND btrim("department"."leader") <> ''
)
INSERT INTO "department_leader" ("department_id", "user_id")
SELECT "department_id", "user_id"
FROM matched_leaders
WHERE "user_id" IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE INDEX "department_leader_user_id_idx" ON "department_leader"("user_id");

ALTER TABLE "department" DROP COLUMN IF EXISTS "leader";
