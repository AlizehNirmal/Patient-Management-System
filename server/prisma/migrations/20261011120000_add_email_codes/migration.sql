-- CreateTable
CREATE TABLE "EmailCode" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailCode_email_key" ON "EmailCode"("email");

