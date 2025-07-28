import {
  integer,
  primaryKey,
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import type { AdapterAccount } from '@auth/core/adapters';

// Users and Auth
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  username: varchar('username', { length: 50 }).notNull().unique(),
  hashedPassword: text('hashedPassword').notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);


// OKR-specific tables
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const roleEnum = pgEnum('role', ['admin', 'member']);

export const teamMemberships = pgTable('team_memberships', {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    invitedBy: text('invited_by').references(() => users.id), // User ID of the inviter
    invitationMedium: text('invitation_medium'), // e.g., 'TEAMINVITATION'
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.userId, table.teamId] }),
    }
});


export const objectives = pgTable('objectives', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const confidenceLevelEnum = pgEnum('confidence_level', ['زیاد', 'متوسط', 'کم', 'در معرض خطر']);
export const initiativeStatusEnum = pgEnum('initiative_status', ['شروع نشده', 'در حال انجام', 'تکمیل شده', 'مسدود شده']);
export const riskStatusEnum = pgEnum('risk_status', ['فعال', 'در حال بررسی', 'حل شده']);

export const keyResults = pgTable('key_results', {
  id: serial('id').primaryKey(),
  objectiveId: integer('objective_id')
    .notNull()
    .references(() => objectives.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  progress: integer('progress').notNull().default(0),
  confidenceLevel: confidenceLevelEnum('confidence_level').notNull().default('متوسط'),
});

export const initiatives = pgTable('initiatives', {
  id: serial('id').primaryKey(),
  keyResultId: integer('key_result_id')
    .notNull()
    .references(() => keyResults.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  status: initiativeStatusEnum('initiative_status').notNull().default('شروع نشده'),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  initiativeId: integer('initiative_id')
    .notNull()
    .references(() => initiatives.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  completed: boolean('completed').notNull().default(false),
});

export const risks = pgTable('risks', {
    id: serial('id').primaryKey(),
    keyResultId: integer('key_result_id').notNull().references(() => keyResults.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    correctiveAction: text('corrective_action').notNull(),
    status: riskStatusEnum('risk_status').notNull().default('فعال'),
});

export const keyResultAssignments = pgTable('key_result_assignments', {
    keyResultId: integer('key_result_id').notNull().references(() => keyResults.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.keyResultId, table.userId] }),
    }
});

export const invitationLinks = pgTable('invitation_links', {
    id: serial('id').primaryKey(),
    teamId: integer('team_id').notNull().unique().references(() => teams.id, { onDelete: 'cascade' }),
    link: text('link').notNull().unique(),
    creatorId: text('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
