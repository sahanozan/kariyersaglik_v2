-- Create feedback table for user feedback submissions

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_type TEXT CHECK (feedback_type IN ('bug_report', 'feature_request', 'general', 'complaint', 'compliment')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);

-- Add comments
COMMENT ON TABLE feedback IS 'User feedback and suggestions table';
COMMENT ON COLUMN feedback.user_id IS 'ID of the user who submitted the feedback';
COMMENT ON COLUMN feedback.subject IS 'Subject/title of the feedback';
COMMENT ON COLUMN feedback.message IS 'Detailed feedback message';
COMMENT ON COLUMN feedback.rating IS 'User rating from 1-5 stars';
COMMENT ON COLUMN feedback.feedback_type IS 'Type of feedback: bug_report, feature_request, general, complaint, compliment';
COMMENT ON COLUMN feedback.status IS 'Status of the feedback: pending, in_progress, resolved, closed';
COMMENT ON COLUMN feedback.admin_notes IS 'Admin notes about the feedback';
COMMENT ON COLUMN feedback.resolved_at IS 'Timestamp when feedback was resolved';

-- Enable RLS (Row Level Security)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON feedback;

-- Create policies
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update all feedback" ON feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_type TEXT CHECK (feedback_type IN ('bug_report', 'feature_request', 'general', 'complaint', 'compliment')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);

-- Add comments
COMMENT ON TABLE feedback IS 'User feedback and suggestions table';
COMMENT ON COLUMN feedback.user_id IS 'ID of the user who submitted the feedback';
COMMENT ON COLUMN feedback.subject IS 'Subject/title of the feedback';
COMMENT ON COLUMN feedback.message IS 'Detailed feedback message';
COMMENT ON COLUMN feedback.rating IS 'User rating from 1-5 stars';
COMMENT ON COLUMN feedback.feedback_type IS 'Type of feedback: bug_report, feature_request, general, complaint, compliment';
COMMENT ON COLUMN feedback.status IS 'Status of the feedback: pending, in_progress, resolved, closed';
COMMENT ON COLUMN feedback.admin_notes IS 'Admin notes about the feedback';
COMMENT ON COLUMN feedback.resolved_at IS 'Timestamp when feedback was resolved';

-- Enable RLS (Row Level Security)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON feedback;

-- Create policies
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update all feedback" ON feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();




