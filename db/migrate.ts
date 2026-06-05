import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(20) NOT NULL,
      email      VARCHAR(255),
      score      INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS leaderboard_score_idx
    ON leaderboard (score DESC, created_at ASC)
  `;

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
