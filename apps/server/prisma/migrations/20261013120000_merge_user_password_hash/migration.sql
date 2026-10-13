ALTER TABLE "user" RENAME COLUMN "password" TO "password_hash";

ALTER TABLE "user" DROP COLUMN "salt";
