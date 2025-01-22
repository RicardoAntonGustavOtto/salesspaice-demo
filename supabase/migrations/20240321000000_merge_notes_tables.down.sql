-- Recreate transcripts table
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    target_company_id UUID REFERENCES targetcompanies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    duration INTERVAL,
    meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Move transcript type notes back to transcripts table
INSERT INTO transcripts (
    target_company_id,
    title,
    content,
    created_by,
    created_at,
    updated_at,
    summary,
    duration,
    meeting_id
)
SELECT 
    target_company_id,
    title,
    content,
    created_by,
    created_at,
    updated_at,
    summary,
    duration,
    meeting_id
FROM notes
WHERE type = 'transcript';

-- Delete transcript type notes from notes table
DELETE FROM notes WHERE type = 'transcript';

-- Remove new columns from notes table
ALTER TABLE notes 
DROP COLUMN type,
DROP COLUMN summary,
DROP COLUMN duration,
DROP COLUMN meeting_id;

-- Drop note_type enum
DROP TYPE note_type;

-- Restore activity_type enum
ALTER TYPE activity_type RENAME TO activity_type_old;
CREATE TYPE activity_type AS ENUM ('note', 'meeting', 'transcript');
ALTER TABLE activities 
    ALTER COLUMN type TYPE activity_type 
    USING (type::text::activity_type);
DROP TYPE activity_type_old;

-- Restore RLS policies and triggers for transcripts
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read transcripts"
    ON transcripts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to create transcripts"
    ON transcripts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update their own transcripts"
    ON transcripts FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Allow users to delete their own transcripts"
    ON transcripts FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

CREATE TRIGGER update_transcripts_updated_at
    BEFORE UPDATE ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER create_transcript_activity
    AFTER INSERT ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION create_activity_entry(); 