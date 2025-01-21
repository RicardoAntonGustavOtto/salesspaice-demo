-- Create enum for activity types
CREATE TYPE activity_type AS ENUM ('note', 'meeting', 'transcript');

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    target_company_id UUID REFERENCES targetcompanies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Meetings table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    target_company_id UUID REFERENCES targetcompanies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    summary TEXT,
    attendees TEXT[],
    location TEXT,
    meeting_type TEXT,
    created_by UUID REFERENCES auth.users(id)
);

-- Transcripts table
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

-- Activities table (for timeline)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    target_company_id UUID REFERENCES targetcompanies(id) ON DELETE CASCADE,
    type activity_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    reference_id UUID, -- Can reference note_id, meeting_id, or transcript_id
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_notes_target_company_id ON notes(target_company_id);
CREATE INDEX idx_meetings_target_company_id ON meetings(target_company_id);
CREATE INDEX idx_transcripts_target_company_id ON transcripts(target_company_id);
CREATE INDEX idx_activities_target_company_id ON activities(target_company_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at
    BEFORE UPDATE ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function to create activity entries
CREATE OR REPLACE FUNCTION create_activity_entry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activities (target_company_id, type, title, reference_id, created_by)
    VALUES (
        NEW.target_company_id,
        CASE 
            WHEN TG_TABLE_NAME = 'notes' THEN 'note'::activity_type
            WHEN TG_TABLE_NAME = 'meetings' THEN 'meeting'::activity_type
            WHEN TG_TABLE_NAME = 'transcripts' THEN 'transcript'::activity_type
        END,
        NEW.title,
        NEW.id,
        NEW.created_by
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for activity creation
CREATE TRIGGER create_note_activity
    AFTER INSERT ON notes
    FOR EACH ROW
    EXECUTE FUNCTION create_activity_entry();

CREATE TRIGGER create_meeting_activity
    AFTER INSERT ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION create_activity_entry();

CREATE TRIGGER create_transcript_activity
    AFTER INSERT ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION create_activity_entry();

-- Create RLS policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read notes"
    ON notes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read meetings"
    ON meetings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read transcripts"
    ON transcripts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read activities"
    ON activities FOR SELECT
    TO authenticated
    USING (true);

-- Create policies for creating records
CREATE POLICY "Allow authenticated users to create notes"
    ON notes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to create meetings"
    ON meetings FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to create transcripts"
    ON transcripts FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Add policy for activities table
CREATE POLICY "Allow authenticated users to create activities"
    ON activities FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policies for updating own records
CREATE POLICY "Allow users to update their own notes"
    ON notes FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Allow users to update their own meetings"
    ON meetings FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Allow users to update their own transcripts"
    ON transcripts FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

-- Create policies for deleting own records
CREATE POLICY "Allow users to delete their own notes"
    ON notes FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Allow users to delete their own meetings"
    ON meetings FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Allow users to delete their own transcripts"
    ON transcripts FOR DELETE
    TO authenticated
    USING (created_by = auth.uid()); 