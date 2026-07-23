-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "birthday" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "user_name" VARCHAR(256),
    "normalized_user_name" VARCHAR(256),
    "email" VARCHAR(256),
    "normalized_email" VARCHAR(256),
    "email_confirmed" BOOLEAN NOT NULL,
    "password_hash" TEXT,
    "security_stamp" TEXT,
    "concurrency_stamp" TEXT,
    "phone_number" TEXT,
    "phone_number_confirmed" BOOLEAN NOT NULL,
    "two_factor_enabled" BOOLEAN NOT NULL,
    "lockout_end" TIMESTAMPTZ,
    "lockout_enabled" BOOLEAN NOT NULL,
    "access_failed_count" INTEGER NOT NULL,
    "stripe_customer_id" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(256),
    "normalized_name" VARCHAR(256),
    "concurrency_stamp" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_claims" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "claim_type" TEXT,
    "claim_value" TEXT,

    CONSTRAINT "role_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_claims" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "claim_type" TEXT,
    "claim_value" TEXT,

    CONSTRAINT "user_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_logins" (
    "login_provider" TEXT NOT NULL,
    "provider_key" TEXT NOT NULL,
    "provider_display_name" TEXT,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "user_logins_pkey" PRIMARY KEY ("login_provider","provider_key")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "user_id" INTEGER NOT NULL,
    "login_provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("user_id","login_provider","name")
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "stable_key" VARCHAR(100) NOT NULL,
    "question_group" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_versions" (
    "id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "published_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "survey_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_versions" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "survey_version_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "prompt" VARCHAR(1000) NOT NULL,
    "question_type" VARCHAR(255) NOT NULL,
    "required" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "survey_version_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_feature_maps" (
    "id" SERIAL NOT NULL,
    "question_version_id" INTEGER NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "transform_json" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "question_feature_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" SERIAL NOT NULL,
    "question_version_id" INTEGER NOT NULL,
    "value" VARCHAR(1000) NOT NULL,
    "display_value" VARCHAR(1000) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" SERIAL NOT NULL,
    "survey_response_id" INTEGER NOT NULL,
    "question_version_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_booleans" (
    "id" INTEGER NOT NULL,
    "value" BOOLEAN NOT NULL,

    CONSTRAINT "answer_booleans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_choices" (
    "id" INTEGER NOT NULL,
    "selected_question_option_id" INTEGER NOT NULL,

    CONSTRAINT "answer_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_numbers" (
    "id" INTEGER NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "answer_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_texts" (
    "id" INTEGER NOT NULL,
    "value" VARCHAR(1000) NOT NULL,

    CONSTRAINT "answer_texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_ideas" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "activity_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "public_id" VARCHAR(10) NOT NULL,
    "narrative" VARCHAR(1000) NOT NULL,
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_activity_ideas" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "activity_idea_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "match_activity_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_users" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "accepted" BOOLEAN,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "match_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "location" VARCHAR(500) NOT NULL,
    "cost_cents" INTEGER NOT NULL,
    "capacity" INTEGER,
    "start_time" TIMESTAMPTZ NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "frequency_type" VARCHAR(50) NOT NULL,
    "frequency_count" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_occurrences" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "event_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "price_paid_cents" INTEGER NOT NULL,
    "stripe_session_id" VARCHAR(255),
    "stripe_payment_intent_id" VARCHAR(255),
    "registered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_user_name_key" ON "users"("normalized_user_name");

-- CreateIndex
CREATE INDEX "EmailIndex" ON "users"("normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_normalized_name_key" ON "roles"("normalized_name");

-- CreateIndex
CREATE INDEX "role_claims_role_id_idx" ON "role_claims"("role_id");

-- CreateIndex
CREATE INDEX "user_claims_user_id_idx" ON "user_claims"("user_id");

-- CreateIndex
CREATE INDEX "user_logins_user_id_idx" ON "user_logins"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_survey_slug" ON "surveys"("slug");

-- CreateIndex
CREATE INDEX "question_versions_question_id_idx" ON "question_versions"("question_id");

-- CreateIndex
CREATE INDEX "question_versions_survey_version_id_idx" ON "question_versions"("survey_version_id");

-- CreateIndex
CREATE INDEX "survey_responses_user_id_idx" ON "survey_responses"("user_id");

-- CreateIndex
CREATE INDEX "survey_responses_survey_version_id_idx" ON "survey_responses"("survey_version_id");

-- CreateIndex
CREATE INDEX "question_feature_maps_question_version_id_idx" ON "question_feature_maps"("question_version_id");

-- CreateIndex
CREATE INDEX "question_feature_maps_feature_id_idx" ON "question_feature_maps"("feature_id");

-- CreateIndex
CREATE INDEX "question_options_question_version_id_idx" ON "question_options"("question_version_id");

-- CreateIndex
CREATE INDEX "answers_survey_response_id_idx" ON "answers"("survey_response_id");

-- CreateIndex
CREATE INDEX "answers_question_version_id_idx" ON "answers"("question_version_id");

-- CreateIndex
CREATE INDEX "answer_choices_selected_question_option_id_idx" ON "answer_choices"("selected_question_option_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_match_public_id" ON "matches"("public_id");

-- CreateIndex
CREATE INDEX "matches_created_by_user_id_idx" ON "matches"("created_by_user_id");

-- CreateIndex
CREATE INDEX "match_activity_ideas_match_id_idx" ON "match_activity_ideas"("match_id");

-- CreateIndex
CREATE INDEX "match_activity_ideas_activity_idea_id_idx" ON "match_activity_ideas"("activity_idea_id");

-- CreateIndex
CREATE INDEX "match_users_match_id_idx" ON "match_users"("match_id");

-- CreateIndex
CREATE INDEX "match_users_user_id_idx" ON "match_users"("user_id");

-- CreateIndex
CREATE INDEX "events_created_by_user_id_idx" ON "events"("created_by_user_id");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "event_occurrences_event_id_idx" ON "event_occurrences"("event_id");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations"("event_id");

-- CreateIndex
CREATE INDEX "event_registrations_user_id_idx" ON "event_registrations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_event_id_user_id_key" ON "event_registrations"("event_id", "user_id");

-- AddForeignKey
ALTER TABLE "role_claims" ADD CONSTRAINT "role_claims_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_claims" ADD CONSTRAINT "user_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_logins" ADD CONSTRAINT "user_logins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_versions" ADD CONSTRAINT "survey_versions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_survey_version_id_fkey" FOREIGN KEY ("survey_version_id") REFERENCES "survey_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_version_id_fkey" FOREIGN KEY ("survey_version_id") REFERENCES "survey_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_feature_maps" ADD CONSTRAINT "question_feature_maps_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_feature_maps" ADD CONSTRAINT "question_feature_maps_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_survey_response_id_fkey" FOREIGN KEY ("survey_response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_booleans" ADD CONSTRAINT "answer_booleans_id_fkey" FOREIGN KEY ("id") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_choices" ADD CONSTRAINT "answer_choices_id_fkey" FOREIGN KEY ("id") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_choices" ADD CONSTRAINT "answer_choices_selected_question_option_id_fkey" FOREIGN KEY ("selected_question_option_id") REFERENCES "question_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_numbers" ADD CONSTRAINT "answer_numbers_id_fkey" FOREIGN KEY ("id") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_texts" ADD CONSTRAINT "answer_texts_id_fkey" FOREIGN KEY ("id") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_activity_ideas" ADD CONSTRAINT "match_activity_ideas_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_activity_ideas" ADD CONSTRAINT "match_activity_ideas_activity_idea_id_fkey" FOREIGN KEY ("activity_idea_id") REFERENCES "activity_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_users" ADD CONSTRAINT "match_users_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_users" ADD CONSTRAINT "match_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
