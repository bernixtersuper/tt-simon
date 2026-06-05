import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leaderboard } from '@/db/schema';
import { desc, gt, and, eq, lt, count, or } from 'drizzle-orm';

export async function GET() {
  try {
    const entries = await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.score), leaderboard.createdAt)
      .limit(20);
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim().slice(0, 20);
    const email = body.email ? String(body.email).trim().slice(0, 255) : null;
    const score = Math.max(0, Math.floor(Number(body.score) || 0));

    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const [inserted] = await db
      .insert(leaderboard)
      .values({ name, email, score })
      .returning();

    // Position = exact row in leaderboard (score > mine OR same score inserted earlier)
    const [{ pos }] = await db
      .select({ pos: count() })
      .from(leaderboard)
      .where(
        or(
          gt(leaderboard.score, inserted.score),
          and(
            eq(leaderboard.score, inserted.score),
            lt(leaderboard.createdAt, inserted.createdAt!)
          )
        )
      );

    const position = Number(pos) + 1;

    const entries = await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.score), leaderboard.createdAt)
      .limit(20);

    return NextResponse.json({ id: inserted.id, position, entries });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
