-- Create new note_type enum
CREATE TYPE note_type AS ENUM ('note', 'transcript');

-- Add type column to notes table
ALTER TABLE notes 
ADD COLUMN type note_type NOT NULL DEFAULT 'note',
ADD COLUMN summary TEXT,
ADD COLUMN duration INTERVAL,
ADD COLUMN meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL;

-- Migrate transcripts to notes
INSERT INTO notes (
    target_company_id,
    title,
    content,
    created_by,
    created_at,
    updated_at,
    type,
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
    'transcript'::note_type,
    summary,
    duration,
    meeting_id
FROM transcripts;

-- Update activities table to point to new notes
UPDATE activities 
SET reference_id = (
    SELECT n.id 
    FROM notes n 
    JOIN transcripts t ON t.title = n.title 
    AND t.content = n.content 
    AND t.target_company_id = n.target_company_id
    WHERE t.id = activities.reference_id
)
WHERE type = 'transcript';

-- Drop transcripts table
DROP TABLE transcripts;

-- Update activity_type enum
ALTER TYPE activity_type RENAME TO activity_type_old;
CREATE TYPE activity_type AS ENUM ('note', 'meeting');
ALTER TABLE activities 
    ALTER COLUMN type TYPE activity_type 
    USING (
        CASE 
            WHEN type::text = 'transcript' THEN 'note'::activity_type
            ELSE type::text::activity_type
        END
    );
DROP TYPE activity_type_old; 