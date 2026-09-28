import { pgTable, uuid, text, boolean, integer, numeric, date, timestamp, jsonb, check, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table (linked to Supabase Auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  isAdmin: boolean('is_admin').default(false),
  isTrainer: boolean('is_trainer').default(false),
  specialization: text('specialization'),
  experienceYears: integer('experience_years'),
  bio: text('bio'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('only_one_admin').on(table.isAdmin).where(sql`${table.isAdmin} = true`),
  uniqueIndex('only_one_trainer').on(table.isTrainer).where(sql`${table.isTrainer} = true`),
  check('experience_years_check', sql`${table.experienceYears} >= 0`),
]);

// Clients table
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  age: integer('age'),
  gender: text('gender'),
  goals: text('goals'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_clients_user_id').on(table.userId),
  check('age_check', sql`${table.age} >= 16 AND ${table.age} <= 100`),
  check('gender_check', sql`${table.gender} IN ('male', 'female', 'other')`),
]);

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  sessionDate: date('session_date').notNull(),
  sessionType: text('session_type').notNull(),
  durationMinutes: integer('duration_minutes'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_sessions_client_id').on(table.clientId),
  index('idx_sessions_date').on(table.sessionDate),
  check('duration_minutes_check', sql`${table.durationMinutes} > 0`),
  check('valid_session_date', sql`${table.sessionDate} <= CURRENT_DATE`),
]);

// Progress logs table
export const progressLogs = pgTable('progress_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  logDate: date('log_date').notNull(),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
  heightCm: numeric('height_cm', { precision: 5, scale: 2 }),
  bodyFatPercentage: numeric('body_fat_percentage', { precision: 4, scale: 2 }),
  photoUrl: text('photo_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_progress_logs_client_id').on(table.clientId),
  index('idx_progress_logs_date').on(table.logDate),
  check('weight_kg_check', sql`${table.weightKg} > 0 AND ${table.weightKg} < 500`),
  check('height_cm_check', sql`${table.heightCm} > 0 AND ${table.heightCm} < 300`),
  check('body_fat_percentage_check', sql`${table.bodyFatPercentage} >= 0 AND ${table.bodyFatPercentage} <= 100`),
  check('valid_log_date', sql`${table.logDate} <= CURRENT_DATE`),
]);

// Plans table
export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  planType: text('plan_type'),
  title: text('title').notNull(),
  description: text('description'),
  active: boolean('active').default(true),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_plans_client_id').on(table.clientId),
  check('plan_type_check', sql`${table.planType} IN ('workout', 'nutrition')`),
  check('valid_dates', sql`(${table.startDate} IS NULL AND ${table.endDate} IS NULL) OR (${table.startDate} IS NOT NULL AND ${table.endDate} IS NULL) OR (${table.startDate} IS NOT NULL AND ${table.endDate} IS NOT NULL AND ${table.endDate} >= ${table.startDate})`),
]);

// Diet Charts table
export const dietCharts = pgTable('diet_charts', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  active: boolean('active').default(true),
  meals: jsonb('meals').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_diet_charts_client_id').on(table.clientId),
]);

// Workout Exercises table
export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  planId: uuid('plan_id').references(() => plans.id, { onDelete: 'cascade' }),
  exerciseName: text('exercise_name').notNull(),
  sets: integer('sets'),
  reps: integer('reps'),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
  restSeconds: integer('rest_seconds'),
  dayOfWeek: integer('day_of_week'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_workout_exercises_plan_id').on(table.planId),
  check('sets_check', sql`${table.sets} > 0`),
  check('reps_check', sql`${table.reps} > 0`),
  check('weight_kg_check', sql`${table.weightKg} >= 0`),
  check('rest_seconds_check', sql`${table.restSeconds} >= 0`),
  check('day_of_week_check', sql`${table.dayOfWeek} >= 1 AND ${table.dayOfWeek} <= 7`),
]);

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type ProgressLog = typeof progressLogs.$inferSelect;
export type NewProgressLog = typeof progressLogs.$inferInsert;

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

export type DietChart = typeof dietCharts.$inferSelect;
export type NewDietChart = typeof dietCharts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;
