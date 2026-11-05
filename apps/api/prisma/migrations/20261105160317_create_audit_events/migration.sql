-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "event_type" VARCHAR(64) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(64) NOT NULL,
    "resource_id" VARCHAR(255),
    "actor_id" VARCHAR(255),
    "actor_email" VARCHAR(320),
    "actor_name" VARCHAR(200),
    "description" VARCHAR(1000) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "before" JSONB,
    "after" JSONB,
    "ip_address" INET,
    "user_agent" VARCHAR(512),
    "correlation_id" VARCHAR(128),
    "source" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_created_at_id_idx" ON "audit_events"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "audit_events_event_type_created_at_idx" ON "audit_events"("event_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_action_created_at_idx" ON "audit_events"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_actor_id_created_at_idx" ON "audit_events"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_resource_type_resource_id_idx" ON "audit_events"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_events_correlation_id_idx" ON "audit_events"("correlation_id");

-- ---------------------------------------------------------------------------
-- Hand-written: constraints Prisma cannot express.
-- ---------------------------------------------------------------------------

-- JSON columns hold objects only (never arrays, scalars or JSON null).
ALTER TABLE "audit_events"
  ADD CONSTRAINT "audit_events_metadata_is_object" CHECK (jsonb_typeof("metadata") = 'object'),
  ADD CONSTRAINT "audit_events_before_is_object" CHECK ("before" IS NULL OR jsonb_typeof("before") = 'object'),
  ADD CONSTRAINT "audit_events_after_is_object" CHECK ("after" IS NULL OR jsonb_typeof("after") = 'object');

-- Required text columns may not be blank.
ALTER TABLE "audit_events"
  ADD CONSTRAINT "audit_events_required_text_not_blank" CHECK (
    btrim("event_type") <> ''
    AND btrim("action") <> ''
    AND btrim("resource_type") <> ''
    AND btrim("description") <> ''
    AND btrim("source") <> ''
  );

-- Audit events are immutable: reject UPDATE and DELETE for every role, including the table owner.
-- TRUNCATE is deliberately not blocked; it requires owner privileges and is used only by the
-- development seed reset and test cleanup. Production must run the app with an INSERT/SELECT-only role.
CREATE FUNCTION "audit_events_reject_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER "audit_events_immutable"
  BEFORE UPDATE OR DELETE ON "audit_events"
  FOR EACH ROW EXECUTE FUNCTION "audit_events_reject_mutation"();
