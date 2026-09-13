-- Simplified Database Schema for Gym Trainer Application
-- Single admin/trainer model - no separate trainers table

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_trainer BOOLEAN DEFAULT FALSE,
  specialization TEXT,
  experience_years INT CHECK (experience_years >= 0),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create constraints to ensure only one admin and one trainer exists
CREATE UNIQUE INDEX only_one_admin ON users (is_admin) WHERE is_admin = TRUE;
CREATE UNIQUE INDEX only_one_trainer ON users (is_trainer) WHERE is_trainer = TRUE;

-- 2. Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  age INT CHECK (age >= 16 AND age <= 100),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  goals TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sessions table (directly references admin user as trainer)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_type TEXT NOT NULL,
  duration_minutes INT CHECK (duration_minutes > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure session date is not in the future
  CONSTRAINT valid_session_date CHECK (session_date <= CURRENT_DATE)
);

-- 4. Progress logs table
CREATE TABLE progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  weight_kg NUMERIC(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
  height_cm NUMERIC(5,2) CHECK (height_cm > 0 AND height_cm < 300),
  body_fat_percentage NUMERIC(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure log date is not in the future
  CONSTRAINT valid_log_date CHECK (log_date <= CURRENT_DATE)
);

-- 5. Plans table (created by admin/trainer)
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  plan_type TEXT CHECK (plan_type IN ('workout', 'nutrition')),
  title TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end date is after start date if both are provided
  CONSTRAINT valid_dates CHECK (
    (start_date IS NULL AND end_date IS NULL) OR
    (start_date IS NOT NULL AND end_date IS NULL) OR
    (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date)
  )
);

-- 6. Diet Charts table (created by admin/trainer)
CREATE TABLE diet_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  meals JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Workout Exercises table (for detailed workout plans)
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INT CHECK (sets > 0),
  reps INT CHECK (reps > 0),
  weight_kg NUMERIC(5,2) CHECK (weight_kg >= 0),
  rest_seconds INT CHECK (rest_seconds >= 0),
  day_of_week INT CHECK (day_of_week >= 1 AND day_of_week <= 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_sessions_client_id ON sessions(client_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_progress_logs_client_id ON progress_logs(client_id);
CREATE INDEX idx_progress_logs_date ON progress_logs(log_date);
CREATE INDEX idx_plans_client_id ON plans(client_id);
CREATE INDEX idx_diet_charts_client_id ON diet_charts(client_id);
CREATE INDEX idx_workout_exercises_plan_id ON workout_exercises(plan_id);

-- ROW LEVEL SECURITY POLICIES

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Clients policies
CREATE POLICY "Users can view their own client data" ON clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can manage all clients" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Sessions policies
CREATE POLICY "Clients can view their own sessions" ON sessions
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all sessions" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Progress logs policies
CREATE POLICY "Clients can view their own progress logs" ON progress_logs
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all progress logs" ON progress_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Plans policies
CREATE POLICY "Clients can view their own plans" ON plans
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all plans" ON plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Diet charts policies
CREATE POLICY "Clients can view their own diet charts" ON diet_charts
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all diet charts" ON diet_charts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Workout exercises policies
CREATE POLICY "Users can view exercises for their plans" ON workout_exercises
  FOR SELECT USING (
    plan_id IN (
      SELECT p.id FROM plans p
      JOIN clients c ON p.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all exercises" ON workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to diet_charts
CREATE TRIGGER update_diet_charts_updated_at 
    BEFORE UPDATE ON diet_charts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to get client progress summary
CREATE OR REPLACE FUNCTION get_client_progress_summary(client_uuid UUID)
RETURNS TABLE (
    total_sessions INT,
    first_session_date DATE,
    last_session_date DATE,
    starting_weight NUMERIC,
    current_weight NUMERIC,
    weight_change NUMERIC,
    total_progress_entries INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT s.id)::INT as total_sessions,
        MIN(s.session_date) as first_session_date,
        MAX(s.session_date) as last_session_date,
        (SELECT weight_kg FROM progress_logs WHERE client_id = client_uuid ORDER BY log_date ASC LIMIT 1) as starting_weight,
        (SELECT weight_kg FROM progress_logs WHERE client_id = client_uuid ORDER BY log_date DESC LIMIT 1) as current_weight,
        (SELECT weight_kg FROM progress_logs WHERE client_id = client_uuid ORDER BY log_date DESC LIMIT 1) - 
        (SELECT weight_kg FROM progress_logs WHERE client_id = client_uuid ORDER BY log_date ASC LIMIT 1) as weight_change,
        COUNT(pl.id)::INT as total_progress_entries
    FROM clients c
    LEFT JOIN sessions s ON c.id = s.client_id
    LEFT JOIN progress_logs pl ON c.id = pl.client_id
    WHERE c.id = client_uuid
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- Create view for client dashboard
CREATE VIEW client_dashboard AS
SELECT
    c.id as client_id,
    u.full_name as client_name,
    u.email as client_email,
    c.age,
    c.gender,
    c.joined_at,
    (SELECT COUNT(*) FROM sessions WHERE client_id = c.id) as total_sessions,
    (SELECT COUNT(*) FROM progress_logs WHERE client_id = c.id) as total_progress_entries,
    (SELECT session_date FROM sessions WHERE client_id = c.id ORDER BY session_date DESC LIMIT 1) as last_session_date,
    (SELECT weight_kg FROM progress_logs WHERE client_id = c.id ORDER BY log_date DESC LIMIT 1) as current_weight,
    (SELECT title FROM plans WHERE client_id = c.id AND active = TRUE ORDER BY created_at DESC LIMIT 1) as active_plan
FROM clients c
JOIN users u ON c.user_id = u.id;

-- Create view for admin dashboard
CREATE VIEW admin_dashboard AS
SELECT
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM sessions) as total_sessions,
    (SELECT COUNT(*) FROM progress_logs) as total_progress_entries,
    (SELECT COUNT(*) FROM plans) as total_plans,
    (SELECT COUNT(*) FROM diet_charts) as total_diet_charts,
    (SELECT COUNT(*) FROM clients WHERE joined_at >= CURRENT_DATE - INTERVAL '30 days') as new_clients_30_days,
    (SELECT AVG(weight_kg) FROM (
        SELECT DISTINCT ON (client_id) weight_kg 
        FROM progress_logs 
        ORDER BY client_id, log_date DESC
    ) recent_weights) as avg_current_weight;

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts linked to Supabase Auth. Includes admin/trainer profile information';
COMMENT ON TABLE clients IS 'Stores client-specific information and goals';
COMMENT ON TABLE sessions IS 'Tracks training sessions for clients (admin is the only trainer)';
COMMENT ON TABLE progress_logs IS 'Logs client progress including weight, measurements, and photos';
COMMENT ON TABLE plans IS 'Stores workout and nutrition plans for clients (created by admin)';
COMMENT ON TABLE diet_charts IS 'Contains detailed diet plans with meal information (created by admin)';
COMMENT ON TABLE workout_exercises IS 'Stores individual exercises within workout plans';

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Show completion message
SELECT 'Simplified database setup completed successfully!' as status;
SELECT 'Single admin/trainer model - no separate trainers table' as note;
SELECT 'Tables created: ' || COUNT(*) as tables_created 
FROM information_schema.tables 
WHERE table_schema = 'public';
