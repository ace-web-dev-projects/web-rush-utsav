-- Store a one-way password hash for teams that register after authentication is enabled.
-- Nullable to keep existing team rows valid until an explicit credential setup flow exists.
ALTER TABLE "Team" ADD COLUMN "passwordHash" TEXT;
