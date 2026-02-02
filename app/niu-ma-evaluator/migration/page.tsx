'use client'

import React, { useState } from 'react'
import Navigation from '@/app/components/navigation'
import MobilePageHeader from '@/app/components/ui/MobilePageHeader'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

// 注意：这个文件需要在服务器端组件中读取迁移SQL
// 但为了演示，我们直接在页面中显示SQL内容

const NiuMaMigrationPage: React.FC = () => {
  const [copied, setCopied] = useState(false)
  const [migrationStep, setMigrationStep] = useState<number>(1)

  const migrationSQL = `-- 牛马测评仪数据库表结构
-- 参考智能核心的表结构设计

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 表 1: niuma_evaluations (测评对话表)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.niuma_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL DEFAULT 'normal' CHECK (version IN ('simple', 'normal')),
  title TEXT NOT NULL DEFAULT '新测评',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  coze_conversation_id TEXT,
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 表 2: niuma_evaluation_messages (测评消息表)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.niuma_evaluation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.niuma_evaluations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  coze_message_id TEXT,
  message_data JSONB DEFAULT '{}',
  feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 表 3: niuma_evaluation_results (测评结果表)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.niuma_evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.niuma_evaluations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_score DECIMAL(5,2),
  salary_score DECIMAL(5,2),
  workload_score DECIMAL(5,2),
  growth_score DECIMAL(5,2),
  environment_score DECIMAL(5,2),
  atmosphere_score DECIMAL(5,2),
  mental_health_score DECIMAL(5,2),
  evaluation_summary TEXT,
  suggestions TEXT,
  dimensions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 索引优化
-- =====================================================

-- niuma_evaluations 表索引
CREATE INDEX IF NOT EXISTS idx_niuma_evaluations_user_id
  ON public.niuma_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluations_status
  ON public.niuma_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluations_version
  ON public.niuma_evaluations(version);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluations_updated_at
  ON public.niuma_evaluations(updated_at DESC);

-- niuma_evaluation_messages 表索引
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_messages_evaluation_id
  ON public.niuma_evaluation_messages(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_messages_user_id
  ON public.niuma_evaluation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_messages_created_at
  ON public.niuma_evaluation_messages(created_at DESC);

-- niuma_evaluation_results 表索引
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_results_evaluation_id
  ON public.niuma_evaluation_results(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_results_user_id
  ON public.niuma_evaluation_results(user_id);

-- =====================================================
-- Row Level Security (RLS) 安全策略
-- =====================================================

-- 启用 RLS
ALTER TABLE public.niuma_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niuma_evaluation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niuma_evaluation_results ENABLE ROW LEVEL SECURITY;

-- niuma_evaluations 表策略
CREATE POLICY "用户可以查看自己的测评"
  ON public.niuma_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的测评"
  ON public.niuma_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的测评"
  ON public.niuma_evaluations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的测评"
  ON public.niuma_evaluations FOR DELETE
  USING (auth.uid() = user_id);

-- niuma_evaluation_messages 表策略
CREATE POLICY "用户可以查看自己的测评消息"
  ON public.niuma_evaluation_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的测评消息"
  ON public.niuma_evaluation_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的测评消息"
  ON public.niuma_evaluation_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- niuma_evaluation_results 表策略
CREATE POLICY "用户可以查看自己的测评结果"
  ON public.niuma_evaluation_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的测评结果"
  ON public.niuma_evaluation_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的测评结果"
  ON public.niuma_evaluation_results FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 触发器：自动更新 updated_at 字段
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_niuma_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER niuma_evaluations_updated_at
  BEFORE UPDATE ON public.niuma_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_niuma_updated_at();

CREATE TRIGGER niuma_evaluation_messages_updated_at
  BEFORE UPDATE ON public.niuma_evaluation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_niuma_updated_at();

CREATE TRIGGER niuma_evaluation_results_updated_at
  BEFORE UPDATE ON public.niuma_evaluation_results
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_niuma_updated_at();

-- =====================================================
-- 注释
-- =====================================================

COMMENT ON TABLE public.niuma_evaluations IS '牛马测评仪-测评对话表';
COMMENT ON TABLE public.niuma_evaluation_messages IS '牛马测评仪-测评消息表';
COMMENT ON TABLE public.niuma_evaluation_results IS '牛马测评仪-测评结果表';

COMMENT ON COLUMN public.niuma_evaluations.version IS '测评版本: simple(简易版) 或 normal(正常版)';
COMMENT ON COLUMN public.niuma_evaluations.coze_conversation_id IS 'Coze API对话ID（如果使用）';
COMMENT ON COLUMN public.niuma_evaluation_messages.coze_message_id IS 'Coze消息ID（如果使用）';
COMMENT ON COLUMN public.niuma_evaluation_results.total_score IS '综合评分（0-100）';`

  const handleCopy = () => {
    navigator.clipboard.writeText(migrationSQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navigation />
          <MobilePageHeader title="数据库迁移" />

          <div className="flex-1 max-w-4xl mx-auto p-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🗄️ 牛马测评仪 - 数据库迁移
              </h1>

              {/* 步骤指示器 */}
              <div className="flex items-center mb-8">
                {[1, 2, 3].map(step => (
                  <div
                    key={step}
                    className={`flex-1 h-2 rounded-full ${
                      migrationStep >= step
                        ? 'bg-pink-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* 当前步骤内容 */}
              {migrationStep === 1 && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    步骤 1：复制迁移 SQL
                  </h2>
                  <p className="text-gray-600 mb-6">
                    点击下方按钮复制完整的迁移 SQL 脚本
                  </p>
                  <button
                    onClick={handleCopy}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
                  >
                    {copied ? '✅ 已复制' : '📋 复制 SQL'}
                  </button>
                </div>
              )}

              {migrationStep === 2 && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    步骤 2：在 Supabase 中执行
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        打开 Supabase SQL Editor
                      </h3>
                      <ol className="list-decimal pl-5 space-y-2 text-blue-800">
                        <li>访问 Supabase 控制台</li>
                        <li>在左侧菜单选择 "SQL Editor"</li>
                        <li>点击 "New query" 创建新查询</li>
                      </ol>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4">
                      <h3 className="font-semibold text-green-900 mb-2">
                        执行迁移 SQL
                      </h3>
                      <ol className="list-decimal pl-5 space-y-2 text-green-800">
                        <li>粘贴已复制的 SQL 脚本</li>
                        <li>点击 "RUN" 按钮执行</li>
                        <li>等待执行完成，检查是否有错误</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4">
                      <h3 className="font-semibold text-yellow-900 mb-2">
                        Supabase 控制台链接
                      </h3>
                      <a
                        href="https://supabase.com/dashboard/project/duyfvvbgadrwaonvlrun/sql"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-700 underline hover:text-yellow-900"
                      >
                        点击打开 SQL Editor →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {migrationStep === 3 && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    步骤 3：验证迁移结果
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h3 className="font-semibold text-purple-900 mb-2">
                        检查表是否创建成功
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 text-purple-800">
                        <li>在左侧菜单选择 "Database"</li>
                        <li>检查是否包含以下表：
                          <ul className="list-disc pl-5 mt-2">
                            <li>niuma_evaluations</li>
                            <li>niuma_evaluation_messages</li>
                            <li>niuma_evaluation_results</li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-pink-50 rounded-xl p-4">
                      <h3 className="font-semibold text-pink-900 mb-2">
                        开始使用
                      </h3>
                      <p className="text-pink-800 mb-4">
                        迁移完成后，点击下方按钮开始使用牛马测评仪
                      </p>
                      <a
                        href="/niu-ma-evaluator"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
                      >
                        🚀 开始使用
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* 步骤导航 */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setMigrationStep(Math.max(1, migrationStep - 1))}
                  disabled={migrationStep === 1}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    migrationStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ← 上一步
                </button>
                <button
                  onClick={() => setMigrationStep(Math.min(3, migrationStep + 1))}
                  disabled={migrationStep === 3}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    migrationStep === 3
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-md'
                  }`}
                >
                  {migrationStep === 3 ? '完成' : '下一步 →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default NiuMaMigrationPage
