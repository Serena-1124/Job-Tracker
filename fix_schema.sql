-- 检查并添加缺失的列
DO $$
BEGIN
  -- 检查 deliveries 表的 timeline 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'timeline'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN timeline JSONB DEFAULT '[]';
  END IF;

  -- 检查 deliveries 表的 links 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'links'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN links JSONB DEFAULT '[]';
  END IF;

  -- 检查 deliveries 表的 files 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'files'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN files JSONB DEFAULT '[]';
  END IF;

  -- 检查 deliveries 表的 sort_order 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;

  -- 检查 todos 表的 sort_order 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE todos ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;

  -- 检查 interview_notes 表的 sort_order 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interview_notes' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE interview_notes ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- 查看表结构确认
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'deliveries'
ORDER BY ordinal_position;
