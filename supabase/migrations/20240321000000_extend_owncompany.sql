-- Add new columns to owncompany table
ALTER TABLE owncompany
ADD COLUMN IF NOT EXISTS competitor_knowledge JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN IF NOT EXISTS sample_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS correction_words JSONB[] DEFAULT ARRAY[]::JSONB[];

-- Create or replace function to validate competitor_knowledge JSON structure
CREATE OR REPLACE FUNCTION validate_competitor_knowledge()
RETURNS TRIGGER AS $$
DECLARE
  competitor JSONB;
BEGIN
  -- Skip validation if array is null or empty
  IF NEW.competitor_knowledge IS NULL OR array_length(NEW.competitor_knowledge, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if each competitor has required fields
  FOREACH competitor IN ARRAY NEW.competitor_knowledge LOOP
    IF NOT (
      competitor ? 'name' AND
      competitor ? 'description' AND
      competitor->>'name' IS NOT NULL AND
      competitor->>'description' IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Each competitor must have a name and description';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to validate correction_words JSON structure
CREATE OR REPLACE FUNCTION validate_correction_words()
RETURNS TRIGGER AS $$
DECLARE
  word JSONB;
BEGIN
  -- Skip validation if array is null or empty
  IF NEW.correction_words IS NULL OR array_length(NEW.correction_words, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if each correction word has required fields
  FOREACH word IN ARRAY NEW.correction_words LOOP
    IF NOT (
      word ? 'original' AND
      word ? 'correction' AND
      word->>'original' IS NOT NULL AND
      word->>'correction' IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Each correction word must have an original and correction field';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to validate JSON structures before insert or update
DROP TRIGGER IF EXISTS validate_competitor_knowledge_trigger ON owncompany;
DROP TRIGGER IF EXISTS validate_correction_words_trigger ON owncompany;

CREATE TRIGGER validate_competitor_knowledge_trigger
  BEFORE INSERT OR UPDATE ON owncompany
  FOR EACH ROW
  EXECUTE FUNCTION validate_competitor_knowledge();

CREATE TRIGGER validate_correction_words_trigger
  BEFORE INSERT OR UPDATE ON owncompany
  FOR EACH ROW
  EXECUTE FUNCTION validate_correction_words(); 