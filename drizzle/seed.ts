
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

const main = async () => {
  console.log('🌱 Running seed script after migration...');

  try {
    // We will seed data for a user with a known username.
    // This is more robust than relying on ID=1.
    const SEED_USER_USERNAME = 'user';

    const user = await db.query.users.findFirst({
      where: eq(schema.users.username, SEED_USER_USERNAME),
    });

    if (!user) {
      console.log(`- Seed user "${SEED_USER_USERNAME}" not found. Skipping team seeding.`);
      // Optionally, you could create the seed user here if they don't exist.
      // For now, we'll just exit gracefully.
      return;
    }

    console.log(`- Seeding data for user: ${user.username} (ID: ${user.id})`);

    // We check if the user already has teams to avoid re-seeding duplicates.
    const existingTeams = await db.query.teams.findMany({
      where: eq(schema.teams.userId, user.id),
      limit: 1,
    });

    if (existingTeams.length > 0) {
      console.log('- User already has teams. Seeding is not required.');
      return;
    }

    const teamsToCreate = [
      {
        name: 'تیم فنی',
        members: [
          { name: 'علی رضایی', avatarUrl: 'https://placehold.co/40x40.png?text=A' },
          { name: 'سارا محمدی', avatarUrl: 'https://placehold.co/40x40.png?text=S' },
          { name: 'رضا قاسمی', avatarUrl: 'https://placehold.co/40x40.png?text=R' },
        ],
      },
      {
        name: 'تیم محصول',
        members: [
          { name: 'مریم احمدی', avatarUrl: 'https://placehold.co/40x40.png?text=M' },
          { name: 'نیما کریمی', avatarUrl: 'https://placehold.co/40x40.png?text=N' },
        ],
      },
    ];

    await db.transaction(async (tx) => {
      for (const teamData of teamsToCreate) {
        console.log(`- Creating team: "${teamData.name}"`);
        const [newTeam] = await tx
          .insert(schema.teams)
          .values({ name: teamData.name, userId: user.id })
          .returning();

        if (teamData.members.length > 0) {
          console.log(`  - Adding ${teamData.members.length} members...`);
          await tx.insert(schema.members).values(
            teamData.members.map((member) => ({
              teamId: newTeam.id,
              name: member.name,
              avatarUrl: member.avatarUrl,
            }))
          );
        }
      }
    });

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ An error occurred during seeding:', error);
    process.exit(1);
  } finally {
    // It's important to end the pool connection, otherwise the script will hang.
    await pool.end();
  }
};

main();
