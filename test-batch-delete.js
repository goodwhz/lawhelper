// 测试批量删除功能
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://duyfvvbgadrwaonvlrun.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBatchDelete() {
    console.log('开始测试批量删除功能...\n');

    try {
        // 1. 测试获取当前用户
        console.log('1. 获取当前用户...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            console.error('获取用户失败:', userError);
            return;
        }
        
        console.log(`✓ 用户认证成功: ${user.email} (${user.id})`);

        // 2. 获取用户的对话列表
        console.log('\n2. 获取对话列表...');
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id, title, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (convError) {
            console.error('获取对话列表失败:', convError);
            return;
        }

        console.log(`✓ 找到 ${conversations.length} 个对话`);
        
        if (conversations.length === 0) {
            console.log('没有可测试的对话');
            return;
        }

        // 显示前3个对话
        conversations.slice(0, 3).forEach(conv => {
            console.log(`  - ${conv.id}: ${conv.title || '无标题'}`);
        });

        // 3. 测试数据库函数
        console.log('\n3. 测试批量删除数据库函数...');
        
        const testIds = conversations.slice(0, 2).map(c => c.id);
        console.log('测试对话ID:', testIds);

        const { data: deleteResult, error: deleteError } = await supabase
            .rpc('delete_multiple_conversations', {
                conversation_ids: testIds
            });

        if (deleteError) {
            console.error('数据库函数调用失败:', deleteError);
            
            // 测试备用删除方法
            console.log('\n3b. 测试备用删除方法...');
            let deletedCount = 0;
            
            for (const convId of testIds) {
                const { error: delError } = await supabase
                    .from('conversations')
                    .delete()
                    .eq('id', convId)
                    .eq('user_id', user.id);
                
                if (!delError) {
                    deletedCount++;
                    console.log(`✓ 成功删除对话: ${convId}`);
                } else {
                    console.error(`✗ 删除对话失败 ${convId}:`, delError);
                }
            }
            
            console.log(`\n备用方法删除结果: ${deletedCount}/${testIds.length}`);
        } else {
            console.log('✓ 数据库函数调用成功');
            console.log('删除结果:', deleteResult);
        }

        // 4. 测试API端点
        console.log('\n4. 测试API端点...');
        
        // 使用Bearer Token
        console.log('\n4a. 测试Bearer Token认证...');
        const bearerResponse = await fetch('http://localhost:3000/api/conversations/batch-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                conversation_ids: conversations.slice(0, 1).map(c => c.id)
            })
        });

        console.log(`Bearer Token状态: ${bearerResponse.status}`);
        if (bearerResponse.ok) {
            const result = await bearerResponse.json();
            console.log('✓ Bearer Token API调用成功:', result);
        } else {
            const errorText = await bearerResponse.text();
            console.error('✗ Bearer Token API调用失败:', errorText);
        }

        // 使用X-User-ID
        console.log('\n4b. 测试X-User-ID认证...');
        const xUserIdResponse = await fetch('http://localhost:3000/api/conversations/batch-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': user.id,
                'X-User-Email': user.email
            },
            body: JSON.stringify({
                conversation_ids: conversations.slice(1, 2).map(c => c.id)
            })
        });

        console.log(`X-User-ID状态: ${xUserIdResponse.status}`);
        if (xUserIdResponse.ok) {
            const result = await xUserIdResponse.json();
            console.log('✓ X-User-ID API调用成功:', result);
        } else {
            const errorText = await xUserIdResponse.text();
            console.error('✗ X-User-ID API调用失败:', errorText);
        }

        console.log('\n✓ 测试完成!');

    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 运行测试
testBatchDelete();