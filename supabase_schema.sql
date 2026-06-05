-- 创建投递记录表
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  position_name TEXT NOT NULL,
  delivery_method TEXT,
  delivery_date DATE,
  interview_date DATE,
  status TEXT NOT NULL,
  industry_name TEXT,
  position_type_name TEXT,
  location TEXT,
  salary TEXT,
  remark TEXT,
  links JSONB DEFAULT '[]',
  files JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建待办事项表
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  delivery_id UUID,
  company_name TEXT,
  position_name TEXT,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建面经记录表
CREATE TABLE IF NOT EXISTS interview_notes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  delivery_id UUID,
  company_name TEXT,
  position_name TEXT,
  round TEXT,
  interviewer TEXT,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_notes_user_id ON interview_notes(user_id);

-- 启用行级安全策略（RLS）
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_notes ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can only access their own deliveries"
  ON deliveries FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own todos"
  ON todos FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own interview_notes"
  ON interview_notes FOR ALL
  USING (auth.uid() = user_id);
