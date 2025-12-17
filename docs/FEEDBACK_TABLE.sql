-- Feedback table for collecting user feedback
-- Designed to support voting and public board features later

CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'planned', 'in_progress', 'completed', 'declined')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Store email even for anonymous users
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_category ON feedback(category);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (including anonymous users)
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Anyone can view feedback (for future public board)
CREATE POLICY "Anyone can view feedback"
  ON feedback FOR SELECT
  USING (true);

-- Only admins can update feedback status (you'll need to create admin logic)
-- For now, we'll skip this policy

-- Future: Votes table for upvoting
-- CREATE TABLE feedback_votes (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(feedback_id, user_id)
-- );

-- Future: Comments table
-- CREATE TABLE feedback_comments (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
--   user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
--   content TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
