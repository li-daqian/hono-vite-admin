-- CreateEnum
CREATE TYPE "dict_status" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "dict_type" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "dict_status" NOT NULL DEFAULT 'ACTIVE',
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dict_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dict_item" (
    "id" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "dict_status" NOT NULL DEFAULT 'ACTIVE',
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dict_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dict_type_code_key" ON "dict_type"("code");

-- CreateIndex
CREATE INDEX "dict_type_status_idx" ON "dict_type"("status");

-- CreateIndex
CREATE INDEX "dict_type_order_idx" ON "dict_type"("order");

-- CreateIndex
CREATE UNIQUE INDEX "dict_item_type_id_value_key" ON "dict_item"("type_id", "value");

-- CreateIndex
CREATE INDEX "dict_item_type_id_status_order_idx" ON "dict_item"("type_id", "status", "order");

-- CreateIndex
CREATE INDEX "dict_item_type_id_order_idx" ON "dict_item"("type_id", "order");

-- CreateIndex
CREATE INDEX "dict_item_status_idx" ON "dict_item"("status");
