-- 创建法律分类表
CREATE TABLE IF NOT EXISTS law_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建法律文档表
CREATE TABLE IF NOT EXISTS law_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category_id UUID REFERENCES law_categories(id) ON DELETE CASCADE,
  document_type TEXT DEFAULT 'law',
  document_number TEXT,
  publish_date DATE,
  effective_date DATE,
  expire_date DATE,
  file_path TEXT,
  file_size BIGINT,
  file_type TEXT,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  keywords TEXT[],
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入基础分类数据
INSERT INTO law_categories (name, sort_order) VALUES 
('劳动法律', 1),
('社会保障', 2),
('就业指导', 3),
('劳动争议', 4),
('职业安全', 5)
ON CONFLICT DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_law_documents_category_id ON law_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_law_documents_published ON law_documents(is_published);
CREATE INDEX IF NOT EXISTS idx_law_documents_title_gin ON law_documents USING gin(to_tsvector('chinese', title));
CREATE INDEX IF NOT EXISTS idx_law_documents_content_gin ON law_documents USING gin(to_tsvector('chinese', content));

-- 创建全文搜索函数
CREATE OR REPLACE FUNCTION search_law_documents(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category_id UUID,
  category_name TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.category_id,
    c.name as category_name,
    ts_rank(
      setweight(to_tsvector('chinese', d.title), 'A') ||
      setweight(to_tsvector('chinese', d.content), 'B'),
      plainto_tsquery('chinese', search_query)
    ) as rank
  FROM law_documents d
  JOIN law_categories c ON d.category_id = c.id
  WHERE d.is_published = true
    AND (
      to_tsvector('chinese', d.title) @@ plainto_tsquery('chinese', search_query) OR
      to_tsvector('chinese', d.content) @@ plainto_tsquery('chinese', search_query) OR
      d.title ILIKE '%' || search_query || '%' OR
      d.content ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 启用 RLS (Row Level Security)
ALTER TABLE law_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_documents ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Anyone can view published law_categories" ON law_categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view published law_documents" ON law_documents
  FOR SELECT USING (is_published = true);

-- 给匿名用户权限
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON law_categories TO anon;
GRANT SELECT ON law_documents TO anon;