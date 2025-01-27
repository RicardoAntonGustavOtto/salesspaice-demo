-- Drop existing tables if they exist
DROP TABLE IF EXISTS notes CASCADE;

-- Drop existing note_type if it exists
DROP TYPE IF EXISTS note_type;

-- Create enum for note types
CREATE TYPE note_type AS ENUM ('general', 'meeting', 'transcript');

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    target_company_id UUID REFERENCES targetcompanies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type note_type DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_target_company_id ON notes(target_company_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING gin(tags);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read notes" ON notes;
DROP POLICY IF EXISTS "Allow authenticated users to create notes" ON notes;
DROP POLICY IF EXISTS "Allow users to update their own notes" ON notes;
DROP POLICY IF EXISTS "Allow users to delete their own notes" ON notes;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read notes"
    ON notes FOR SELECT
    TO authenticated
    USING (true);

-- Create policies for creating records
CREATE POLICY "Allow authenticated users to create notes"
    ON notes FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policies for updating own records
CREATE POLICY "Allow users to update their own notes"
    ON notes FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

-- Create policies for deleting own records
CREATE POLICY "Allow users to delete their own notes"
    ON notes FOR DELETE
    TO authenticated
    USING (created_by = auth.uid()); 