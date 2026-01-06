-- 创建文档模板表
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER DEFAULT 0,
    file_type TEXT NOT NULL,
    download_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 启用行级安全策略
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- 创建策略，允许管理员进行所有操作
CREATE POLICY "管理员可以管理文档模板" ON document_templates
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email LIKE '%@admin.com'
        )
    );

-- 创建策略，允许所有用户查看已发布的模板
CREATE POLICY "用户可以查看已发布的模板" ON document_templates
    FOR SELECT USING (is_published = true);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_published ON document_templates(is_published);
CREATE INDEX IF NOT EXISTS idx_document_templates_featured ON document_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_document_templates_created_at ON document_templates(created_at DESC);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_document_templates_updated_at 
    BEFORE UPDATE ON document_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();