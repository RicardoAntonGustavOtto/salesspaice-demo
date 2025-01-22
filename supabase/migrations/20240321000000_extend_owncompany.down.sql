-- Drop trigger and function
DROP TRIGGER IF EXISTS validate_competitor_knowledge_trigger ON owncompany;
DROP FUNCTION IF EXISTS validate_competitor_knowledge();

-- Remove columns from owncompany table
ALTER TABLE owncompany
DROP COLUMN IF EXISTS competitor_knowledge,
DROP COLUMN IF EXISTS sample_emails,
DROP COLUMN IF EXISTS correction_words; 