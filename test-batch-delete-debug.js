// 调试批量删除功能
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://duyfvvbgadrwaonvlrun.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugBatchDelete() {
    console.log('🔍 开始调试批量删除功能...\n');

    try {
        // 1. 检查现有对话
        console.log('1. 检查现有对话...');
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .limit(5);

        if (convError) {
            console.error('❌ 获取对话失败:', convError);
            return;
        }

        console.log(`✅ 找到 ${conversations.length} 个对话`);
        
        if (conversations.length === 0) {
            console.log('⚠️ 没有可删除的对话，创建测试对话...');
            
            // 创建测试对话
            const testConversation = {
                user_id: '6c383154-795a-442a-b96a-2ff19b7030d1',
                title: `测试对话 ${new Date().toLocaleString()}`,
                status: 'active'
            };
            
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert(testConversation)
                .select()
                .single();
                
            if (createError) {
                console.error('❌ 创建测试对话失败:', createError);
                return;
            }
            
            console.log('✅ 创建测试对话成功:', newConv.id);
            conversations.push(newConv);
        }

        conversations.forEach(conv => {
            console.log(`  - ${conv.id}: ${conv.title || '无标题'} (用户: ${conv.user_id})`);
        });

        // 2. 测试数据库函数
        console.log('\n2. 测试数据库函数...');
        const testIds = conversations.slice(0, 2).map(c => c.id);
        console.log('测试对话ID:', testIds);

        try {
            const { data: funcResult, error: funcError } = await supabase
                .rpc('delete_multiple_conversations', {
                    conversation_ids: testIds
                });

            if (funcError) {
                console.error('❌ 数据库函数调用失败:', funcError);
                console.error('错误详情:', {
                    code: funcError.code,
                    message: funcError.message,
                    details: funcError.details,
                    hint: funcError.hint
                });
            } else {
                console.log('✅ 数据库函数调用成功');
                console.log('返回结果:', funcResult);
            }
        } catch (e) {
            console.error('❌ 数据库函数调用异常:', e);
        }

        // 3. 测试API端点
        console.log('\n3. 测试API端点...');
        
        // 先测试X-User-ID认证
        try {
            const response = await fetch('http://localhost:3009/api/conversations/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': '6c383154-795a-442a-b96a-2ff19b7030d1',
                    'X-User-Email': 'test@example.com'
                },
                body: JSON.stringify({
                    conversation_ids: testIds
                })
            });

            console.log(`API响应状态: ${response.status}`);
            
            const responseText = await response.text();
            console.log('API响应内容:', responseText);

            if (response.ok) {
                const result = JSON.parse(responseText);
                console.log('✅ API调用成功');
                console.log('删除结果:', result);
            } else {
                console.log('❌ API调用失败');
                try {
                    const errorData = JSON.parse(responseText);
                    console.error('错误信息:', errorData);
                } catch (e) {
                    console.error('错误响应:', responseText);
                }
            }
        } catch (e) {
            console.error('❌ API调用异常:', e);
        }

        // 4. 测试直接删除
        console.log('\n4. 测试直接删除（备用方法）...');
        let directDeleteCount = 0;
        
        for (const convId of testIds) {
            try {
                console.log(`尝试删除对话: ${convId}`);
                
                // 验证对话存在
                const { data: convData, error: checkError } = await supabase
                    .from('conversations')
                    .select('id, title')
                    .eq('id', convId)
                    .eq('user_id', '6c383154-795a-442a-b96a-2ff19b7030d1')
                    .single();
                
                if (checkError) {
                    console.error(`❌ 检查对话失败 ${convId}:`, checkError);
                    continue;
                }
                
                if (!convData) {
                    console.log(`⚠️ 对话不存在或无权限: ${convId}`);
                    continue;
                }
                
                console.log(`对话验证成功: ${convData.title || '无标题'}`);
                
                // 删除对话
                const { error: deleteError } = await supabase
                    .from('conversations')
                    .delete()
                    .eq('id', convId)
                    .eq('user_id', '6c383154-795a-442a-b96a-2ff19b7030d1');
                
                if (deleteError) {
                    console.error(`❌ 删除失败 ${convId}:`, deleteError);
                } else {
                    console.log(`✅ 删除成功: ${convId}`);
                    directDeleteCount++;
                }
            } catch (error) {
                console.error(`❌ 删除异常 ${convId}:`, error);
            }
        }
        
        console.log(`\n直接删除完成: 成功 ${directDeleteCount}/${testIds.length}`);

        // 5. 验证删除结果
        console.log('\n5. 验证删除结果...');
        const { data: remainingConvs, error: remainingError } = await supabase
            .from('conversations')
            .select('*')
            .in('id', testIds);

        if (remainingError) {
            console.error('❌ 验证删除失败:', remainingError);
        } else {
            console.log(`剩余对话: ${remainingConvs.length} 个`);
            remainingConvs.forEach(conv => {
                console.log(`  - ${conv.id}: ${conv.title || '无标题'}`);
            });
        }

    } catch (error) {
        console.error('❌ 调试过程发生错误:', error);
    }
    
    console.log('\n🔍 调试完成');
}

// 运行调试
debugBatchDelete();