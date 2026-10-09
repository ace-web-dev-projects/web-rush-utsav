CREATE TABLE "Round1PuzzleProgress" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "guesses" JSONB NOT NULL DEFAULT '[]',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" TIMESTAMP(3),
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Round1PuzzleProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Round1PuzzleProgress_teamId_puzzleId_key"
ON "Round1PuzzleProgress"("teamId", "puzzleId");

ALTER TABLE "Round1PuzzleProgress"
ADD CONSTRAINT "Round1PuzzleProgress_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
