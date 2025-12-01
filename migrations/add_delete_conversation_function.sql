-- 创建删除对话的数据库函数 (绕过RLS限制)
-- 这个函数使用SECURITY DEFINER属性，以数据库所有者权限执行
-- 但内部会验证用户只能删除自己的对话

CREATE OR REPLACE FUNCTION public.delete_user_conversation(conversation_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_user_id UUID;
    current_user_id UUID;
BEGIN
    -- 获取当前认证用户的ID
    current_user_id := auth.uid();
    
    -- 如果用户未认证，返回错误
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION '用户未认证';
        RETURN FALSE;
    END IF;
    
    -- 检查对话是否存在并获取其user_id
    SELECT user_id INTO conversation_user_id 
    FROM public.conversations 
    WHERE id = conversation_uuid;
    
    -- 如果对话不存在，返回错误
    IF conversation_user_id IS NULL THEN
        RAISE EXCEPTION '对话不存在';
        RETURN FALSE;
    END IF;
    
    -- 验证用户只能删除自己的对话
    IF conversation_user_id != current_user_id THEN
        RAISE EXCEPTION '无权删除此对话';
        RETURN FALSE;
    END IF;
    
    -- 先删除该对话的所有消息 (由于有外键约束，设置为ON DELETE CASCADE会自动删除)
    -- 这里不需要显式删除消息，因为外键约束设置了ON DELETE CASCADE
    
    -- 删除对话
    DELETE FROM public.conversations 
    WHERE id = conversation_uuid AND user_id = current_user_id;
    
    -- 返回成功
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- 记录错误并返回失败
        RAISE;
        RETURN FALSE;
END;
$$;

-- 创建删除对话及其所有消息的完整函数
CREATE OR REPLACE FUNCTION public.delete_conversation_with_messages(conversation_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_user_id UUID;
    current_user_id UUID;
    deleted_message_count INTEGER := 0;
    result JSONB;
BEGIN
    -- 获取当前认证用户的ID
    current_user_id := auth.uid();
    
    -- 如果用户未认证，返回错误
    IF current_user_id IS NULL THEN
        result := jsonb_build_object(
            'success', false,
            'error', '用户未认证'
        );
        RETURN result;
    END IF;
    
    -- 检查对话是否存在并获取其user_id和消息数量
    SELECT c.user_id, COUNT(m.id) as message_count
    INTO conversation_user_id, deleted_message_count
    FROM public.conversations c
    LEFT JOIN public.messages m ON c.id = m.conversation_id
    WHERE c.id = conversation_uuid
    GROUP BY c.user_id;
    
    -- 如果对话不存在，返回错误
    IF conversation_user_id IS NULL THEN
        result := jsonb_build_object(
            'success', false,
            'error', '对话不存在'
        );
        RETURN result;
    END IF;
    
    -- 验证用户只能删除自己的对话
    IF conversation_user_id != current_user_id THEN
        result := jsonb_build_object(
            'success', false,
            'error', '无权删除此对话'
        );
        RETURN result;
    END IF;
    
    -- 删除对话 (消息会由于外键约束ON DELETE CASCADE自动删除)
    DELETE FROM public.conversations 
    WHERE id = conversation_uuid AND user_id = current_user_id;
    
    -- 返回成功结果
    result := jsonb_build_object(
        'success', true,
        'message', '对话删除成功',
        'deleted_messages', deleted_message_count
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- 返回错误信息
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$;

-- 创建批量删除对话的函数
CREATE OR REPLACE FUNCTION public.delete_multiple_conversations(conversation_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    deleted_count INTEGER := 0;
    failed_ids UUID[];
    result JSONB;
    conv_id UUID;
BEGIN
    -- 获取当前认证用户的ID
    current_user_id := auth.uid();
    
    -- 如果用户未认证，返回错误
    IF current_user_id IS NULL THEN
        result := jsonb_build_object(
            'success', false,
            'error', '用户未认证'
        );
        RETURN result;
    END IF;
    
    -- 逐个删除对话
    FOREACH conv_id IN ARRAY conversation_ids
    LOOP
        BEGIN
            -- 检查对话是否属于当前用户
            IF EXISTS (
                SELECT 1 FROM public.conversations 
                WHERE id = conv_id AND user_id = current_user_id
            ) THEN
                -- 删除对话 (消息会自动删除)
                DELETE FROM public.conversations 
                WHERE id = conv_id AND user_id = current_user_id;
                deleted_count := deleted_count + 1;
            ELSE
                failed_ids := array_append(failed_ids, conv_id);
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                failed_ids := array_append(failed_ids, conv_id);
        END;
    END LOOP;
    
    -- 返回结果
    result := jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'failed_ids', failed_ids,
        'message', format('成功删除 %s 个对话，失败 %s 个', deleted_count, array_length(failed_ids, 1))
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$;

-- 为删除函数添加注释
COMMENT ON FUNCTION public.delete_user_conversation(UUID) IS '删除用户指定的对话 (包含所有相关消息)';
COMMENT ON FUNCTION public.delete_conversation_with_messages(UUID) IS '删除对话并返回详细结果信息';
COMMENT ON FUNCTION public.delete_multiple_conversations(UUID[]) IS '批量删除多个用户对话';

-- 创建一个简化的API调用函数
CREATE OR REPLACE FUNCTION public.api_delete_conversation(conversation_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.delete_conversation_with_messages(conversation_id::UUID);
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '无效的对话ID格式'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;