-- A submitted inspection is final: reject every UPDATE on it and its answers.
-- The API has no update routes; this stops anything else (scripts, psql, bugs).
CREATE FUNCTION forbid_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% rows are immutable after submit', TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END $$;--> statement-breakpoint
CREATE TRIGGER inspections_no_update BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION forbid_update();--> statement-breakpoint
CREATE TRIGGER inspection_answers_no_update BEFORE UPDATE ON inspection_answers
  FOR EACH ROW EXECUTE FUNCTION forbid_update();
