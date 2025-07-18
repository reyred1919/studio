
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
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
  console.log('🌱 Starting database seeding...');

  try {
    const userIdToSeed = 1; // The ID of the user you want to seed data for

    // 1. Verify the user exists
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userIdToSeed),
    });

    if (!user) {
      console.error(`❌ User with ID ${userIdToSeed} not found. Please create the user first.`);
      process.exit(1);
    }

    console.log(`- Seeding data for user: ${user.username} (ID: ${userIdToSeed})`);

    // 2. Clean up previous seed data for this user to make the script re-runnable
    console.log('- Deleting old team data for this user...');
    await db.delete(schema.teams).where(eq(schema.teams.userId, userIdToSeed));

    // 3. Define seed data
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

    // 4. Insert data in a transaction
    await db.transaction(async (tx) => {
      for (const teamData of teamsToCreate) {
        console.log(`- Creating team: "${teamData.name}"`);
        const [newTeam] = await tx
          .insert(schema.teams)
          .values({ name: teamData.name, userId: userIdToSeed })
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

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ An error occurred during database seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
