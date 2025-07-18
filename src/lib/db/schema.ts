
import { pgTable, serial, text, varchar, timestamp, integer, boolean, foreignKey, date, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 256 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teams = pgTable('teams', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const members = pgTable('members', {
    id: serial('id').primaryKey(),
    teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
});

export const objectives = pgTable('objectives', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'restrict' }), // Prevent deleting team if it has objectives
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const keyResults = pgTable('key_results', {
    id: serial('id').primaryKey(),
    objectiveId: integer('objective_id').notNull().references(() => objectives.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    progress: integer('progress').default(0).notNull(),
    confidenceLevel: varchar('confidence_level', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const keyResultAssignees = pgTable('key_result_assignees', {
    keyResultId: integer('key_result_id').notNull().references(() => keyResults.id, { onDelete: 'cascade' }),
    memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.keyResultId, table.memberId] }),
    }
});

export const initiatives = pgTable('initiatives', {
    id: serial('id').primaryKey(),
    keyResultId: integer('key_result_id').notNull().references(() => keyResults.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
    id: serial('id').primaryKey(),
    initiativeId: integer('initiative_id').notNull().references(() => initiatives.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    completed: boolean('completed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const okrCycles = pgTable('okr_cycles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
});

export const calendarSettings = pgTable('calendar_settings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
    frequency: varchar('frequency', { length: 50 }).notNull(),
    checkInDayOfWeek: integer('check_in_day_of_week').notNull(),
    evaluationDate: date('evaluation_date'),
});


// RELATIONS

export const usersRelations = relations(users, ({ many, one }) => ({
  objectives: many(objectives),
  teams: many(teams),
  okrCycle: one(okrCycles, { fields: [users.id], references: [okrCycles.userId] }),
  calendarSettings: one(calendarSettings, { fields: [users.id], references: [calendarSettings.userId] }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
    user: one(users, {
        fields: [teams.userId],
        references: [users.id],
    }),
    members: many(members),
    objectives: many(objectives),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
    team: one(teams, {
        fields: [members.teamId],
        references: [teams.id],
    }),
    keyResultAssignees: many(keyResultAssignees),
}));

export const objectivesRelations = relations(objectives, ({ one, many }) => ({
    user: one(users, {
        fields: [objectives.userId],
        references: [users.id],
    }),
    team: one(teams, {
        fields: [objectives.teamId],
        references: [teams.id],
    }),
    keyResults: many(keyResults),
}));

export const keyResultsRelations = relations(keyResults, ({ one, many }) => ({
    objective: one(objectives, {
        fields: [keyResults.objectiveId],
        references: [objectives.id],
    }),
    initiatives: many(initiatives),
    keyResultAssignees: many(keyResultAssignees),
}));

export const keyResultAssigneesRelations = relations(keyResultAssignees, ({ one }) => ({
    keyResult: one(keyResults, {
        fields: [keyResultAssignees.keyResultId],
        references: [keyResults.id],
    }),
    member: one(members, {
        fields: [keyResultAssignees.memberId],
        references: [members.id],
    }),
}));

export const initiativesRelations = relations(initiatives, ({ one, many }) => ({
    keyResult: one(keyResults, {
        fields: [initiatives.keyResultId],
        references: [keyResults.id],
    }),
    tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
    initiative: one(initiatives, {
        fields: [tasks.initiativeId],
        references: [initiatives.id],
    }),
}));

export const okrCyclesRelations = relations(okrCycles, ({ one }) => ({
    user: one(users, {
        fields: [okrCycles.userId],
        references: [users.id],
    }),
}));

export const calendarSettingsRelations = relations(calendarSettings, ({ one }) => ({
    user: one(users, {
        fields: [calendarSettings.userId],
        references: [users.id],
    }),
}));
