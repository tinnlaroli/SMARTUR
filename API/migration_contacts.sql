-- Contact subscription: add reason and message fields
ALTER TABLE contact_subscription ADD COLUMN IF NOT EXISTS reason VARCHAR(100) NULL;
ALTER TABLE contact_subscription ADD COLUMN IF NOT EXISTS message TEXT NULL;
