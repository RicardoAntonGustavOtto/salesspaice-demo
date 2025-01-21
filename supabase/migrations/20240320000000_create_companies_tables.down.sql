-- Drop triggers
DROP TRIGGER IF EXISTS create_transcript_activity ON transcripts;
DROP TRIGGER IF EXISTS create_meeting_activity ON meetings;
DROP TRIGGER IF EXISTS create_note_activity ON notes;

DROP TRIGGER IF EXISTS update_transcripts_updated_at ON transcripts;
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;

-- Drop functions
DROP FUNCTION IF EXISTS create_activity_entry();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS transcripts;
DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS notes;

-- Drop enum
DROP TYPE IF EXISTS activity_type; 