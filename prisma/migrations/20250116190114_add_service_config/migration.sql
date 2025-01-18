-- CreateTable
CREATE TABLE "ServiceConfig" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastVerified" TIMESTAMP(3),

    CONSTRAINT "ServiceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceConfig_service_key" ON "ServiceConfig"("service");
