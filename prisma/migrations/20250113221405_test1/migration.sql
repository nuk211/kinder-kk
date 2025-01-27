-- CreateTable
CREATE TABLE "AdminProtection" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProtection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminProtection_page_key" ON "AdminProtection"("page");
