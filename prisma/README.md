# Prisma migration notes

Prisma is the only active ORM for Onxy Gym. The old Drizzle schema and SQL remain in
`../drizzle/` as read-only migration evidence until existing database data has been
audited.

Before the first production migration, map legacy `is_admin` / `is_trainer` values
to `role`, preserve the existing `diet_charts.meals` JSON in `plan_data`, and add a
partial unique PostgreSQL index ensuring only one `users.role = 'ADMIN'` row.
Do not run `prisma db push` against an existing database as a shortcut.
