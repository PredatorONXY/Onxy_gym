# Database Setup Guide for Gym Trainer Application

## Overview
This guide provides step-by-step instructions for setting up the database schema for the Gym Trainer application using Supabase.

## Prerequisites
- Supabase account and project
- Supabase CLI (optional, but recommended)
- Basic knowledge of SQL and database concepts

## Step 1: Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or use an existing one
3. Note your project URL and API keys

## Step 2: Set Up Database Tables

### Option A: Using SQL Editor in Supabase Dashboard
1. Navigate to your Supabase project
2. Go to SQL Editor
3. Copy and paste the contents of `create_new_tables.sql`
4. Execute the SQL script

### Option B: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run the SQL script
supabase db execute -f src/lib/create_new_tables.sql
```

## Step 3: Insert Sample Data (Optional)
To populate your database with sample data for testing:

1. In Supabase SQL Editor, run:
```sql
-- Copy and paste the contents of sample_data.sql
-- Execute the script
```

## Step 4: Configure Row Level Security (RLS)
The schema includes basic RLS policies. Review and adjust them as needed for your security requirements.

## Step 5: Test the Setup
Run sample queries to verify the setup:

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify sample data was inserted
SELECT * FROM users LIMIT 5;
SELECT * FROM clients LIMIT 5;
```

## Database Structure Overview

### Core Tables
1. **users** - User accounts (linked to Supabase Auth)
2. **clients** - Client-specific information
3. **trainers** - Trainer profiles and specialties
4. **sessions** - Training session records
5. **progress_logs** - Client progress tracking
6. **plans** - Workout and nutrition plans
7. **diet_charts** - Detailed diet plans with meals

### Key Relationships
- Users can be either clients or trainers (or both)
- Each client has progress logs and sessions
- Trainers create plans and diet charts for clients
- All data is connected through user IDs

## Progress Tracking Features

### Weight Tracking
- Store weight measurements in `progress_logs`
- Track changes over time with dates
- Add progress photos for visual tracking

### Session Management
- Record training sessions with notes
- Track which trainer worked with which client
- Monitor session frequency and types

### Diet and Nutrition
- Create detailed meal plans with macronutrients
- Track active/inactive diet plans
- Monitor nutritional intake

## Common Operations

### Adding a New Client
1. User signs up through Auth
2. Insert record in `users` table
3. Create corresponding record in `clients` table

### Creating a Training Session
```sql
INSERT INTO sessions (client_id, trainer_id, session_date, session_type, notes)
VALUES ('client-uuid', 'trainer-uuid', '2024-01-15', 'Strength Training', 'Focused on form');
```

### Logging Progress
```sql
INSERT INTO progress_logs (client_id, log_date, weight_kg, notes)
VALUES ('client-uuid', '2024-01-15', 75.5, 'Weekly check-in');
```

### Creating a Diet Plan
Use the DietChartForm component or insert directly:
```sql
INSERT INTO diet_charts (trainer_id, client_id, title, meals, active)
VALUES ('trainer-uuid', 'client-uuid', 'Weight Loss Plan', '{"breakfast": {...}}', true);
```

## Troubleshooting

### Common Issues
1. **Permission denied errors**: Check RLS policies
2. **Foreign key violations**: Ensure referenced records exist
3. **JSON parsing errors**: Validate JSON structure in diet_charts.meals

### Debugging Tips
- Use Supabase Logs to see query execution
- Test queries in SQL Editor first
- Verify user permissions and RLS policies

## Next Steps
1. Integrate with your frontend application
2. Implement real-time subscriptions for live updates
3. Add more complex queries for analytics
4. Set up automated backups

## Support
- Refer to `database_schema_documentation.md` for detailed schema info
- Check Supabase documentation for platform-specific questions
- Review sample queries in `sample_data.sql` for examples

## Security Notes
- Always enable RLS on production databases
- Regularly review and update security policies
- Use environment variables for sensitive information
- Implement proper authentication and authorization
