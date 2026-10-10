ALTER TABLE "Team" ALTER COLUMN "points" TYPE DOUBLE PRECISION USING "points"::DOUBLE PRECISION;

CREATE TABLE "Round2QuestionProgress" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" TIMESTAMP(3),
    "pointsAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "Round2QuestionProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Round2QuestionProgress_teamId_questionId_key"
ON "Round2QuestionProgress"("teamId", "questionId");

ALTER TABLE "Round2QuestionProgress"
ADD CONSTRAINT "Round2QuestionProgress_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
