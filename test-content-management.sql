-- 测试内容管理功能的SQL脚本
-- 在Supabase SQL编辑器中运行此脚本来添加测试数据

-- 检查并插入测试分类（如果不存在）
INSERT INTO law_categories (id, name, description, sort_order, is_active, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', '民法', '民法相关法律文档', 1, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', '刑法', '刑法相关法律文档', 2, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', '行政法', '行政法相关法律文档', 3, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 检查并插入测试文档
INSERT INTO law_documents (
  id, 
  title, 
  content, 
  category_id, 
  document_type, 
  document_number,
  is_published, 
  is_featured,
  tags, 
  keywords,
  view_count, 
  download_count,
  created_at, 
  updated_at
)
VALUES 
  (
    'doc001',
    '中华人民共和国民法典总则',
    '《中华人民共和国民法典》总则编是民法典的开篇部分，规定了民法典的基本原则、民事主体、民事权利能力、民事行为能力等基本制度。总则编共204条，涵盖了民事活动的基本规则。',
    '550e8400-e29b-41d4-a716-446655440000',
    '法律条文',
    'GB-2020-001',
    true,
    true,
    ARRAY['民法典', '总则', '基本制度'],
    ARRAY['民事主体', '权利能力', '行为能力'],
    156,
    89,
    NOW(),
    NOW()
  ),
  (
    'doc002',
    '刑法基本原则',
    '刑法的基本原则包括罪刑法定原则、法律面前人人平等原则、罪责刑相适应原则。这些原则贯穿于整个刑法体系，是刑法适用的重要指导原则。',
    '550e8400-e29b-41d4-a716-446655440001',
    '法律条文',
    'CL-1997-001',
    true,
    false,
    ARRAY['刑法', '基本原则', '罪刑法定'],
    ARRAY['罪刑法定', '人人平等', '罪责刑相适应'],
    134,
    67,
    NOW(),
    NOW()
  ),
  (
    'doc003',
    '劳动合同法概述',
    '《中华人民共和国劳动合同法》是为了完善劳动合同制度，明确劳动合同双方当事人的权利和义务，保护劳动者的合法权益，构建和发展和谐稳定的劳动关系而制定的法律。',
    '550e8400-e29b-41d4-a716-446655440002',
    '法律条文',
    'LAB-2008-001',
    false,  -- 这个设为草稿状态
    false,
    ARRAY['劳动合同', '劳动者权益', '劳动关系'],
    ARRAY['劳动合同', '劳动者', '用人单位'],
    98,
    45,
    NOW(),
    NOW()
  ),
  (
    'doc004',
    '民事诉讼法重要条款',
    '民事诉讼法规定了民事诉讼的基本原则、管辖、审判程序、执行程序等内容。本文介绍民事诉讼中的几个重要条款，包括起诉与受理、证据规则、审判程序等。',
    '550e8400-e29b-41d4-a716-446655440000',
    '案例解析',
    'CIVIL-2021-015',
    true,
    true,
    ARRAY['民事诉讼法', '起诉', '证据', '审判程序'],
    ARRAY['管辖', '证据规则', '审判程序'],
    76,
    34,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 插入一些测试对话（如果conversations表存在且为空）
INSERT INTO conversations (id, user_id, title, message_count, created_at, updated_at)
SELECT 
  gen_random_uuid()::text,
  'test-user-id'::text,
  '关于民法典的咨询',
  5,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM conversations LIMIT 1);

-- 插入一些测试消息（如果messages表存在）
INSERT INTO messages (id, conversation_id, content, role, created_at)
SELECT 
  gen_random_uuid()::text,
  conv.id,
  '请问民法典总则的主要内容是什么？',
  'user',
  NOW()
FROM conversations conv
WHERE conv.title = '关于民法典的咨询'
LIMIT 1;

-- 显示插入的结果
SELECT 'Categories inserted: ' || COUNT(*) || ' rows' as result FROM law_categories WHERE name IN ('民法', '刑法', '行政法');
SELECT 'Documents inserted: ' || COUNT(*) || ' rows' as result FROM law_documents WHERE title LIKE '%民法典%' OR title LIKE '%刑法%' OR title LIKE '%劳动合同%';