-- 修复批量删除函数，支持用户ID参数
CREATE OR REPLACE FUNCTION public.delete_multiple_conversations(
    conversation_ids UUID[],
    user_id_param UUID DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    deleted_conversations BIGINT,
    deleted_messages BIGINT,
    failed_ids TEXT[]
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
    failed_array TEXT[] := ARRAY[]::TEXT[];
    current_user_id UUID;
BEGIN
    -- 确定用户ID
    current_user_id := COALESCE(user_id_param, auth.uid());
    
    -- 检查输入数组
    IF conversation_ids IS NULL OR array_length(conversation_ids, 1) = 0 THEN
        RETURN QUERY
            SELECT false, '未提供对话ID'::TEXT, 0::BIGINT, 0::BIGINT, ARRAY[]::TEXT[];
        RETURN;
    END IF;
    
    -- 如果仍然没有用户ID，返回错误
    IF current_user_id IS NULL THEN
        RETURN QUERY
            SELECT false, '用户未认证'::TEXT, 0::BIGINT, 0::BIGINT, conversation_ids::TEXT[];
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
            failed_array := array_append(failed_array, conv_id::TEXT);
            CONTINUE;
        END IF;
        
        -- 验证用户权限（使用传入的用户ID）
        IF conv_user_id != current_user_id THEN
            failed_array := array_append(failed_array, conv_id::TEXT);
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
    IF array_length(failed_array, 1) > 0 AND total_convs = 0 THEN
        -- 全部失败
        RETURN QUERY
            SELECT false, '所有对话删除失败'::TEXT, 0::BIGINT, 0::BIGINT, failed_array;
    ELSIF array_length(failed_array, 1) > 0 THEN
        -- 部分成功
        RETURN QUERY
            SELECT true, '部分删除成功'::TEXT, total_convs, total_messages, failed_array;
    ELSE
        -- 全部成功
        RETURN QUERY
            SELECT true, '批量删除成功'::TEXT, total_convs, total_messages, ARRAY[]::TEXT[];
    END IF;
END;
$$;

-- 授权
GRANT EXECUTE ON FUNCTION public.delete_multiple_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_multiple_conversations TO anon;

-- 创建更简单的删除函数（不需要认证）
CREATE OR REPLACE FUNCTION public.delete_conversations_by_user(
    conversation_ids UUID[],
    user_id_param UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    deleted_count BIGINT,
    failed_ids TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conv_id UUID;
    conv_user_id UUID;
    total_deleted BIGINT := 0;
    failed_array TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 检查输入
    IF conversation_ids IS NULL OR array_length(conversation_ids, 1) = 0 THEN
        RETURN QUERY
            SELECT false, '未提供对话ID'::TEXT, 0::BIGINT, ARRAY[]::TEXT[];
        RETURN;
    END IF;
    
    IF user_id_param IS NULL THEN
        RETURN QUERY
            SELECT false, '用户ID不能为空'::TEXT, 0::BIGINT, conversation_ids::TEXT[];
        RETURN;
    END IF;
    
    -- 遍历删除
    FOREACH conv_id IN ARRAY conversation_ids
    LOOP
        -- 验证对话所有权
        SELECT user_id INTO conv_user_id
        FROM public.conversations
        WHERE id = conv_id AND user_id = user_id_param;
        
        IF conv_user_id IS NULL THEN
            failed_array := array_append(failed_array, conv_id::TEXT);
            CONTINUE;
        END IF;
        
        -- 删除对话（级联删除消息）
        DELETE FROM public.conversations
        WHERE id = conv_id AND user_id = user_id_param;
        
        IF FOUND THEN
            total_deleted := total_deleted + 1;
        ELSE
            failed_array := array_append(failed_array, conv_id::TEXT);
        END IF;
    END LOOP;
    
    -- 返回结果
    RETURN QUERY
        SELECT 
            CASE WHEN total_deleted > 0 THEN true ELSE false END,
            CASE 
                WHEN total_deleted > 0 AND array_length(failed_array, 1) > 0 THEN '部分删除成功'::TEXT
                WHEN total_deleted > 0 THEN '删除成功'::TEXT
                ELSE '删除失败'::TEXT
            END,
            total_deleted,
            failed_array;
END;
$$;

-- 授权
GRANT EXECUTE ON FUNCTION public.delete_conversations_by_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_conversations_by_user TO anon;