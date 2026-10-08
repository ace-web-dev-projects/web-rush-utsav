-- Track the current score for each team.
ALTER TABLE "Team" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;
