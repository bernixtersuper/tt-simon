import Nav from '@/components/Nav';
import SimonGame from '@/components/SimonGame';
import { db } from '@/db';
import { leaderboard } from '@/db/schema';
import type { LbEntry } from '@/components/Leaderboard';
import { desc } from 'drizzle-orm';

export const revalidate = 0;

export default async function Page() {
  let initialLeaderboard: LbEntry[] = [];
  try {
    initialLeaderboard = await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.score), leaderboard.createdAt)
      .limit(20);
  } catch {
    // DB not configured yet
  }

  return (
    <>
      <Nav />
      <SimonGame initialLeaderboard={initialLeaderboard} />
    </>
  );
}
