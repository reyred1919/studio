-- SQL script to create all necessary tables for the OKR Tracker application.
-- You can run this script directly in your PostgreSQL client (e.g., DBeaver).

-- 1. Users Table: Stores user login information.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(256) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Teams Table: Stores teams created by users.
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Members Table: Stores members belonging to each team.
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT
);

-- 4. Objectives Table: Stores the main objectives.
CREATE TABLE IF NOT EXISTS objectives (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Key Results Table: Stores key results for each objective.
CREATE TABLE IF NOT EXISTS key_results (
    id SERIAL PRIMARY KEY,
    objective_id INTEGER NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    confidence_level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. Key Result Assignees Table: Maps members to key results (many-to-many).
CREATE TABLE IF NOT EXISTS key_result_assignees (
    key_result_id INTEGER NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    PRIMARY KEY (key_result_id, member_id)
);

-- 7. Initiatives Table: Stores initiatives for each key result.
CREATE TABLE IF NOT EXISTS initiatives (
    id SERIAL PRIMARY KEY,
    key_result_id INTEGER NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. Tasks Table: Stores tasks for each initiative.
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    initiative_id INTEGER NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. OKR Cycles Table: Stores the start and end dates for OKR cycles per user.
CREATE TABLE IF NOT EXISTS okr_cycles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- 10. Calendar Settings Table: Stores user-specific settings for the calendar view.
CREATE TABLE IF NOT EXISTS calendar_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    frequency VARCHAR(50) NOT NULL,
    check_in_day_of_week INTEGER NOT NULL,
    evaluation_date DATE
);

-- Message: All tables have been created successfully.
