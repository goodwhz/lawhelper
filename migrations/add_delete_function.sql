-- 创建删除对话及其消息的数据库函数
-- 这个函数会绕过 RLS 限制，确保用户可以删除自己的对话

CREATE OR REPLACE FUNCTION public.delete_conversation_with_messages(
    conversation_uuid UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    deleted_messages BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conv_user_id UUID;
    msg_count BIGINT;
BEGIN
    -- 验证对话存在并获取用户ID
    SELECT user_id INTO conv_user_id
    FROM public.conversations
    WHERE id = conversation_uuid;
    
    IF conv_user_id IS NULL THEN
        RETURN QUERY
        SELECT false, '对话不存在'::TEXT, 0::BIGINT;
        RETURN;
    END IF;
    
    -- 验证当前用户是对话的所有者
    IF conv_user_id != auth.uid() THEN
        RETURN QUERY
            SELECT false, '无权删除此对话'::TEXT, 0::BIGINT;
        RETURN;
    END IF;
    
    -- 计算要删除的消息数量
    SELECT COUNT(*) INTO msg_count
    FROM public.messages
    WHERE conversation_id = conversation_uuid;
    
    -- 删除所有相关消息
    DELETE FROM public.messages
    WHERE conversation_id = conversation_uuid;
    
    -- 删除对话
    DELETE FROM public.conversations
    WHERE id = conversation_uuid;
    
    -- 返回成功结果
    RETURN QUERY
        SELECT true, '对话删除成功'::TEXT, msg_count;
        
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
            SELECT false, '删除失败: ' || SQLERRM::TEXT, 0::BIGINT;
END;
$$;

-- 授权给所有用户执行此函数
GRANT EXECUTE ON FUNCTION public.delete_conversation_with_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_conversation_with_messages TO anon;

-- 创建删除多个对话的函数
CREATE OR REPLACE FUNCTION public.delete_multiple_conversations(
    conversation_ids UUID[]
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    deleted_conversations BIGINT,
    deleted_messages BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conv_id UUID;
    conv_user_id UUID;
    total_convs BIGINT := 0;
    total_messages BIGINT := 0;
    msg_count BIGINT;
BEGIN
    -- 检查输入数组
    IF conversation_ids IS NULL OR array_length(conversation_ids, 1) = 0 THEN
        RETURN QUERY
            SELECT false, '未提供对话ID'::TEXT, 0::BIGINT, 0::BIGINT;
        RETURN;
    END IF;
    
    -- 遍历并删除每个对话
    FOREACH conv_id IN ARRAY conversation_ids
    LOOP
        -- 验证对话存在并获取用户ID
        SELECT user_id INTO conv_user_id
        FROM public.conversations
        WHERE id = conv_id;
        
        -- 跳过不存在的对话
        IF conv_user_id IS NULL THEN
            CONTINUE;
        END IF;
        
        -- 验证用户权限
        IF conv_user_id != auth.uid() THEN
            CONTINUE;
        END IF;
        
        -- 计算消息数量
        SELECT COUNT(*) INTO msg_count
        FROM public.messages
        WHERE conversation_id = conv_id;
        
        -- 删除消息
        DELETE FROM public.messages
        WHERE conversation_id = conv_id;
        
        -- 删除对话
        DELETE FROM public.conversations
        WHERE id = conv_id;
        
        -- 统计
        total_convs := total_convs + 1;
        total_messages := total_messages + msg_count;
    END LOOP;
    
    -- 返回结果
    RETURN QUERY
        SELECT true, '批量删除完成'::TEXT, total_convs, total_messages;
        
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
            SELECT false, '批量删除失败: ' || SQLERRM::TEXT, 0::BIGINT, 0::BIGINT;
END;
$$;

-- 授权给所有用户执行此函数
GRANT EXECUTE ON FUNCTION public.delete_multiple_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_multiple_conversations TO anon;

-- 验证函数创建
SELECT 
    proname as function_name,
    pg_get_userbyid(proowner) as owner
FROM pg_proc 
WHERE proname IN ('delete_conversation_with_messages', 'delete_multiple_conversations');