-- Seed members (team) — password is "password123" bcrypt hashed
INSERT INTO members (id, email, password_hash, name, avatar_url, role, agent_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'paul@example.com',   '$2b$12$LJ3m4ys3Lf0Xg3YdeZMHiOQbGMaxMRo1QmRGBH3BQWCZpGxTMWdWy', 'Paul',   NULL, 'admin',  NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'david@example.com',  '$2b$12$LJ3m4ys3Lf0Xg3YdeZMHiOQbGMaxMRo1QmRGBH3BQWCZpGxTMWdWy', 'David',  NULL, 'member', 'david'),
  ('550e8400-e29b-41d4-a716-446655440003', 'dana@example.com',   '$2b$12$LJ3m4ys3Lf0Xg3YdeZMHiOQbGMaxMRo1QmRGBH3BQWCZpGxTMWdWy', 'Dana',   NULL, 'member', 'dana'),
  ('550e8400-e29b-41d4-a716-446655440004', 'logan@example.com',  '$2b$12$LJ3m4ys3Lf0Xg3YdeZMHiOQbGMaxMRo1QmRGBH3BQWCZpGxTMWdWy', 'Logan',  NULL, 'member', 'logan'),
  ('550e8400-e29b-41d4-a716-446655440005', 'alex@example.com',   '$2b$12$LJ3m4ys3Lf0Xg3YdeZMHiOQbGMaxMRo1QmRGBH3BQWCZpGxTMWdWy', 'Alex',   NULL, 'member', 'alex'),
  ('550e8400-e29b-41d4-a716-446655440006', 'rex@example.com',    '$2b$12$LJ3m4ys3Lf0Xg3YdeZMHiOQbGMaxMRo1QmRGBH3BQWCZpGxTMWdWy', 'Rex',    NULL, 'member', 'rex'),
  ('550e8400-e29b-41d4-a716-446655440007', 'tom@example.com',    '$2b$12$LJ3m4ys3Lf0Xg3YdeZMHiOQbGMaxMRo1QmRGBH3BQWCZpGxTMWdWy', 'Tom',    NULL, 'member', 'tom'),
  ('550e8400-e29b-41d4-a716-446655440008', 'bruce@example.com',  '$2b$12$LJ3m4ys3Lf0Xg3YdeZMHiOQbGMaxMRo1QmRGBH3BQWCZpGxTMWdWy', 'Bruce',  NULL, 'member', 'bruce')
ON CONFLICT (email) DO NOTHING;

-- Seed labels
INSERT INTO labels (name, color, description) VALUES
  ('bug',           '#EF4444', 'Something isn''t working'),
  ('feature',       '#3B82F6', 'New feature or request'),
  ('enhancement',   '#8B5CF6', 'Improvement to existing feature'),
  ('documentation', '#10B981', 'Documentation updates'),
  ('frontend',      '#F59E0B', 'Frontend work'),
  ('backend',       '#06B6D4', 'Backend work'),
  ('database',      '#EC4899', 'Database schema or queries'),
  ('urgent',        '#DC2626', 'High priority, needs immediate attention'),
  ('security',      '#991B1B', 'Security-related'),
  ('devops',        '#059669', 'Infrastructure and deployment')
ON CONFLICT (name) DO NOTHING;

-- Seed projects
INSERT INTO projects (id, key, name, description, status, owner_id, created_by, next_issue_number) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'MC', 'Mission Control', 'Internal project management system', 'active',
   '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 5)
ON CONFLICT (key) DO NOTHING;

-- Seed sample issues
INSERT INTO issues (key, title, description, status, priority, project_id, assignee_id, created_by) VALUES
  ('MC-1', 'Design system architecture', 'Create architecture docs for Mission Control', 'done', 'high',
   '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
  ('MC-2', 'Design database schema', 'Design tables, indexes, and migration strategy', 'done', 'high',
   '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
  ('MC-3', 'Implement backend API', 'Build all API routes for issues, projects, members, labels', 'in_progress', 'high',
   '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001'),
  ('MC-4', 'Build Kanban board UI', 'React component with drag-and-drop using @dnd-kit', 'todo', 'medium',
   '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (key) DO NOTHING;
