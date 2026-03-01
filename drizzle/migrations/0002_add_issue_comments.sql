-- Migration: Add issue_comments table + comment_count
-- Author: Dana (Database Engineer) | Date: 2026-02-28 | Ticket: MC-20

ALTER TABLE issues ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0 NOT NULL;
CREATE INDEX IF NOT EXISTS idx_issues_comment_count ON issues(comment_count)
  WHERE deleted_at IS NULL AND comment_count > 0;

CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES members(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_body_not_empty CHECK (LENGTH(TRIM(body)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issue_comments_author_id ON issue_comments(author_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issue_comments_created_at ON issue_comments(issue_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER update_issue_comments_updated_at BEFORE UPDATE ON issue_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION increment_issue_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE issues SET comment_count = comment_count + 1 WHERE id = NEW.issue_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_comment_count AFTER INSERT ON issue_comments
  FOR EACH ROW EXECUTE FUNCTION increment_issue_comment_count();

CREATE OR REPLACE FUNCTION decrement_issue_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE issues SET comment_count = comment_count - 1 WHERE id = OLD.issue_id;
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE issues SET comment_count = comment_count + 1 WHERE id = OLD.issue_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_comment_count AFTER UPDATE OF deleted_at ON issue_comments
  FOR EACH ROW EXECUTE FUNCTION decrement_issue_comment_count();
