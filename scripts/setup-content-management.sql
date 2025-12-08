-- 内容管理功能数据库初始化脚本
-- 在 Supabase SQL 编辑器中运行此脚本

-- 创建法律文档表
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建文档分类表
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建对话表
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认分类
INSERT INTO document_categories (name, description) VALUES
('民法', '民法相关法律文档'),
('刑法', '刑法相关法律文档'),
('行政法', '行政法相关法律文档'),
('商法', '商法相关法律文档'),
('劳动法', '劳动法相关法律文档'),
('婚姻家庭法', '婚姻家庭法相关法律文档'),
('房地产法', '房地产法相关法律文档'),
('知识产权法', '知识产权法相关法律文档')
ON CONFLICT (name) DO NOTHING;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_legal_documents_category_id ON legal_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_author_id ON legal_documents(author_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_published ON legal_documents(published);
CREATE INDEX IF NOT EXISTS idx_legal_documents_created_at ON legal_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_legal_documents_tags ON legal_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_document_categories_parent_id ON document_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_legal_documents_updated_at ON legal_documents;
CREATE TRIGGER update_legal_documents_updated_at BEFORE UPDATE ON legal_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 删除现有的策略（如果存在）
DROP POLICY IF EXISTS "管理员可以管理所有文档" ON legal_documents;
DROP POLICY IF EXISTS "已认证用户可以查看已发布的文档" ON legal_documents;
DROP POLICY IF EXISTS "管理员可以管理所有分类" ON document_categories;
DROP POLICY IF EXISTS "所有人都可以查看分类" ON document_categories;
DROP POLICY IF EXISTS "管理员可以查看所有对话" ON conversations;
DROP POLICY IF EXISTS "用户只能查看自己的对话" ON conversations;
DROP POLICY IF EXISTS "用户可以创建自己的对话" ON conversations;
DROP POLICY IF EXISTS "管理员可以查看所有消息" ON messages;
DROP POLICY IF EXISTS "用户只能查看自己对话中的消息" ON messages;
DROP POLICY IF EXISTS "用户可以在自己对话中添加消息" ON messages;

-- 创建新的RLS策略
CREATE POLICY "管理员可以管理所有文档" ON legal_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "已认证用户可以查看已发布的文档" ON legal_documents
    FOR SELECT USING (
        published = true AND auth.role() = 'authenticated'
    );

CREATE POLICY "管理员可以管理所有分类" ON document_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "所有人都可以查看分类" ON document_categories
    FOR SELECT USING (true);

CREATE POLICY "管理员可以查看所有对话" ON conversations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "用户只能查看自己的对话" ON conversations
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "用户可以创建自己的对话" ON conversations
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "用户可以更新自己的对话" ON conversations
    FOR UPDATE USING (
        user_id = auth.uid()
    );

CREATE POLICY "管理员可以查看所有消息" ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "用户只能查看自己对话中的消息" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "用户可以在自己对话中添加消息" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "用户可以更新自己对话中的消息" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- 插入一些示例法律文档
INSERT INTO legal_documents (title, content, category_id, tags, published) 
SELECT 
    '民法典总则',
    '《中华人民共和国民法典》总则编是民法典的开篇部分，规定了民法典的基本原则、民事主体、民事权利能力、民事行为能力等基本制度。',
    (SELECT id FROM document_categories WHERE name = '民法' LIMIT 1),
    ARRAY['民法典', '总则', '基本制度'],
    true
WHERE EXISTS (SELECT 1 FROM document_categories WHERE name = '民法')
AND NOT EXISTS (SELECT 1 FROM legal_documents WHERE title = '民法典总则')
ON CONFLICT DO NOTHING;

INSERT INTO legal_documents (title, content, category_id, tags, published) 
SELECT 
    '劳动合同法概述',
    '《中华人民共和国劳动合同法》是为了完善劳动合同制度，明确劳动合同双方当事人的权利和义务，保护劳动者的合法权益，构建和发展和谐稳定的劳动关系而制定的法律。',
    (SELECT id FROM document_categories WHERE name = '劳动法' LIMIT 1),
    ARRAY['劳动合同', '劳动者权益', '劳动关系'],
    true
WHERE EXISTS (SELECT 1 FROM document_categories WHERE name = '劳动法')
AND NOT EXISTS (SELECT 1 FROM legal_documents WHERE title = '劳动合同法概述')
ON CONFLICT DO NOTHING;

INSERT INTO legal_documents (title, content, category_id, tags, published) 
SELECT 
    '刑法基本原则',
    '刑法的基本原则包括罪刑法定原则、法律面前人人平等原则、罪责刑相适应原则。这些原则贯穿于整个刑法体系，是刑法适用的重要指导原则。',
    (SELECT id FROM document_categories WHERE name = '刑法' LIMIT 1),
    ARRAY['刑法', '基本原则', '罪刑法定'],
    true
WHERE EXISTS (SELECT 1 FROM document_categories WHERE name = '刑法')
AND NOT EXISTS (SELECT 1 FROM legal_documents WHERE title = '刑法基本原则')
ON CONFLICT DO NOTHING;

-- 创建用于更新消息计数的函数
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations 
        SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations 
        SET message_count = GREATEST(message_count - 1, 0), updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器以自动更新对话的消息计数
DROP TRIGGER IF EXISTS update_message_count_trigger ON messages;
CREATE TRIGGER update_message_count_trigger
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

-- 创建用于获取对话统计的视图
CREATE OR REPLACE VIEW conversation_stats AS
SELECT 
    c.id,
    c.user_id,
    c.title,
    c.created_at,
    c.updated_at,
    COUNT(m.id) as actual_message_count,
    MAX(m.created_at) as last_message_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.user_id, c.title, c.created_at, c.updated_at;

-- 创建用于获取分类统计的视图
CREATE OR REPLACE VIEW category_stats AS
SELECT 
    dc.id,
    dc.name,
    dc.description,
    dc.parent_id,
    dc.created_at,
    COUNT(ld.id) as document_count
FROM document_categories dc
LEFT JOIN legal_documents ld ON dc.id = ld.category_id
GROUP BY dc.id, dc.name, dc.description, dc.parent_id, dc.created_at;