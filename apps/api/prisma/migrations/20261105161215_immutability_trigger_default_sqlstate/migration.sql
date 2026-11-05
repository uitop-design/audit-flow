-- Raise the immutability error with the default SQLSTATE P0001 (raise_exception).
-- The original 23001 (restrict_violation) belongs to the integrity-constraint class, which Prisma
-- reports as "Foreign key constraint violated", hiding the real reason.
CREATE OR REPLACE FUNCTION "audit_events_reject_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only: % is not allowed', TG_OP;
END;
$$;
