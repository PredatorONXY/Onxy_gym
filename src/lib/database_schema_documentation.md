# Gym Trainer Database Schema Documentation

## Overview
This database schema is designed for a gym trainer application that tracks user progress, sessions, diet charts, and training plans. The schema is built on Supabase with proper relationships between tables.

## Table Relationships

### 1. Users Table (`users`)
- **Primary Key**: `id` (UUID) - References Supabase Auth users
- **Purpose**: Stores basic user information and authentication linkage
- **Relationships**:
  - One-to-Many with `clients` (via `user_id`)
  - One-to-Many with `trainers` (via `user_id`)
  - One-to-Many with `diet_charts` (as both trainer and client)

### 2. Clients Table (`clients`)
- **Primary Key**: `id` (UUID)
- **Purpose**: Stores client-specific information
- **Relationships**:
  - Many-to-One with `users` (via `user_id`)
  - One-to-Many with `sessions` (via `client_id`)
  - One-to-Many with `progress_logs` (via `client_id`)
  - One-to-Many with `plans` (via `client_id`)

### 3. Trainers Table (`trainers`)
- **Primary Key**: `id` (UUID)
- **Purpose**: Stores trainer-specific information
- **Relationships**:
  - Many-to-One with `users` (via `user_id`)
  - One-to-Many with `sessions` (via `trainer_id`)
  - One-to-Many with `plans` (via `trainer_id`)

### 4. Sessions Table (`sessions`)
- **Primary Key**: `id` (UUID)
- **Purpose**: Tracks training sessions between clients and trainers
- **Relationships**:
  - Many-to-One with `clients` (via `client_id`)
  - Many-to-One with `trainers` (via `trainer_id`)

### 5. Progress Logs Table (`progress_logs`)
- **Primary Key**: `id` (UUID)
- **Purpose**: Tracks client progress over time (weight, photos, notes)
- **Relationships**:
  - Many-to-One with `clients` (via `client_id`)

### 6. Plans Table (`plans`)
- **Primary Key**: `id` (UUID)
- **Purpose**: Stores workout and nutrition plans
- **Relationships**:
  - Many-to-One with `trainers` (via `trainer_id`)
  - Many-to-One with `clients` (via `client_id`)

### 7. Diet Charts Table (`diet_charts`)
- **Primary Key**: `id` (UUID)
- **Purpose**: Stores detailed diet plans with meal information
- **Relationships**:
  - Many-to-One with `users` (as trainer via `trainer_id`)
  - Many-to-One with `users` (as client via `client_id`)

## Progress Tracking Capabilities

### 1. Client Progress Tracking
- **Weight Tracking**: Use `progress_logs` table with `weight_kg` and `log_date`
- **Visual Progress**: Store progress photos in `progress_logs.photo_url`
- **Session History**: Track all training sessions in `sessions` table
- **Goal Tracking**: Client goals stored in `clients.goals`

### 2. Diet Progress
- **Meal Plans**: Detailed meal information in `diet_charts.meals` (JSONB)
- **Nutrition Tracking**: Macronutrient tracking through diet chart items
- **Plan Adherence**: Track which diet plans are active (`diet_charts.active`)

### 3. Training Progress
- **Workout Plans**: Store in `plans` with `plan_type = 'workout'`
- **Session Completion**: Track completed sessions in `sessions` table
- **Trainer Notes**: Session-specific notes in `sessions.notes`

## Sample Queries

### Get Client Progress Over Time
```sql
SELECT 
  pl.log_date,
  pl.weight_kg,
  pl.photo_url,
  pl.notes
FROM progress_logs pl
WHERE pl.client_id = 'client-uuid-here'
ORDER BY pl.log_date DESC;
```

### Get Client's Active Diet Chart
```sql
SELECT 
  dc.*,
  u_trainer.full_name as trainer_name,
  u_client.full_name as client_name
FROM diet_charts dc
JOIN users u_trainer ON dc.trainer_id = u_trainer.id
JOIN users u_client ON dc.client_id = u_client.id
WHERE dc.client_id = 'client-uuid-here'
AND dc.active = true;
```

### Get All Sessions for a Client
```sql
SELECT 
  s.*,
  t.specialization as trainer_specialization,
  u_trainer.full_name as trainer_name
FROM sessions s
JOIN trainers t ON s.trainer_id = t.id
JOIN users u_trainer ON t.user_id = u_trainer.id
WHERE s.client_id = 'client-uuid-here'
ORDER BY s.session_date DESC;
```

## Security Considerations
- Row Level Security (RLS) is implemented for data protection
- Users can only access their own data
- Admins have additional privileges for management

## Next Steps
1. Run the SQL script to create tables
2. Set up proper RLS policies
3. Create sample data for testing
4. Implement frontend components to interact with the database
