
import { pgTable, serial, text, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 256 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const objectives = pgTable('objectives', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // teamId can be added here if teams table is implemented
});

export const keyResults = pgTable('key_results', {
    id: serial('id').primaryKey(),
    objectiveId: integer('objective_id').notNull().references(() => objectives.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    progress: integer('progress').default(0).notNull(),
    confidenceLevel: varchar('confidence_level', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
    id: serial('id').primaryKey(),
    initiativeId: integer('initiative_id').notNull().references(() => initiatives.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    completed: boolean('completed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const initiatives = pgTable('initiatives', {
    id: serial('id').primaryKey(),
    keyResultId: integer('key_result_id').notNull().references(() => keyResults.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teams = pgTable('teams', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const members = pgTable('members', {
    id: serial('id').primaryKey(),
    teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
});

// Relationships can be defined here with drizzle-orm relations if needed for complex queries
