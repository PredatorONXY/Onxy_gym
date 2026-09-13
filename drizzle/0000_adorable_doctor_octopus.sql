CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"age" integer,
	"gender" text,
	"goals" text,
	"joined_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "age_check" CHECK ("clients"."age" >= 16 AND "clients"."age" <= 100),
	CONSTRAINT "gender_check" CHECK ("clients"."gender" IN ('male', 'female', 'other'))
);
--> statement-breakpoint
CREATE TABLE "diet_charts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true,
	"meals" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"plan_type" text,
	"title" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "plan_type_check" CHECK ("plans"."plan_type" IN ('workout', 'nutrition')),
	CONSTRAINT "valid_dates" CHECK (("plans"."start_date" IS NULL AND "plans"."end_date" IS NULL) OR ("plans"."start_date" IS NOT NULL AND "plans"."end_date" IS NULL) OR ("plans"."start_date" IS NOT NULL AND "plans"."end_date" IS NOT NULL AND "plans"."end_date" >= "plans"."start_date"))
);
--> statement-breakpoint
CREATE TABLE "progress_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"log_date" date NOT NULL,
	"weight_kg" numeric(5, 2),
	"height_cm" numeric(5, 2),
	"body_fat_percentage" numeric(4, 2),
	"photo_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "weight_kg_check" CHECK ("progress_logs"."weight_kg" > 0 AND "progress_logs"."weight_kg" < 500),
	CONSTRAINT "height_cm_check" CHECK ("progress_logs"."height_cm" > 0 AND "progress_logs"."height_cm" < 300),
	CONSTRAINT "body_fat_percentage_check" CHECK ("progress_logs"."body_fat_percentage" >= 0 AND "progress_logs"."body_fat_percentage" <= 100),
	CONSTRAINT "valid_log_date" CHECK ("progress_logs"."log_date" <= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"session_date" date NOT NULL,
	"session_type" text NOT NULL,
	"duration_minutes" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "duration_minutes_check" CHECK ("sessions"."duration_minutes" > 0),
	CONSTRAINT "valid_session_date" CHECK ("sessions"."session_date" <= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"is_admin" boolean DEFAULT false,
	"is_trainer" boolean DEFAULT false,
	"specialization" text,
	"experience_years" integer,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "experience_years_check" CHECK ("users"."experience_years" >= 0)
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid,
	"exercise_name" text NOT NULL,
	"sets" integer,
	"reps" integer,
	"weight_kg" numeric(5, 2),
	"rest_seconds" integer,
	"day_of_week" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sets_check" CHECK ("workout_exercises"."sets" > 0),
	CONSTRAINT "reps_check" CHECK ("workout_exercises"."reps" > 0),
	CONSTRAINT "weight_kg_check" CHECK ("workout_exercises"."weight_kg" >= 0),
	CONSTRAINT "rest_seconds_check" CHECK ("workout_exercises"."rest_seconds" >= 0),
	CONSTRAINT "day_of_week_check" CHECK ("workout_exercises"."day_of_week" >= 1 AND "workout_exercises"."day_of_week" <= 7)
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_charts" ADD CONSTRAINT "diet_charts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clients_user_id" ON "clients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_diet_charts_client_id" ON "diet_charts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_plans_client_id" ON "plans" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_progress_logs_client_id" ON "progress_logs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_progress_logs_date" ON "progress_logs" USING btree ("log_date");--> statement-breakpoint
CREATE INDEX "idx_sessions_client_id" ON "sessions" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_date" ON "sessions" USING btree ("session_date");--> statement-breakpoint
CREATE UNIQUE INDEX "only_one_admin" ON "users" USING btree ("is_admin") WHERE "users"."is_admin" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "only_one_trainer" ON "users" USING btree ("is_trainer") WHERE "users"."is_trainer" = true;--> statement-breakpoint
CREATE INDEX "idx_workout_exercises_plan_id" ON "workout_exercises" USING btree ("plan_id");