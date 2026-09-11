import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "owner_recovery_admissions" (
    "key" text PRIMARY KEY NOT NULL,
    "attempts" integer NOT NULL,
    "window_started_at" timestamp with time zone NOT NULL,
    "last_admitted_at" timestamp with time zone NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    CONSTRAINT "owner_recovery_admissions_key_check" CHECK ("owner_recovery_admissions"."key" = 'global' OR "owner_recovery_admissions"."key" ~ '^r:[a-f0-9]{64}$'),
    CONSTRAINT "owner_recovery_admissions_attempts_check" CHECK ("owner_recovery_admissions"."attempts" BETWEEN 1 AND 30)
  );

  CREATE INDEX "owner_recovery_admissions_expiry_idx" ON "owner_recovery_admissions" USING btree ("expires_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "owner_recovery_admissions" CASCADE;`)
}
