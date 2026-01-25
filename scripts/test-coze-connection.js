/**
 * Coze 连接测试脚本
 * 测试会话管理、心跳保活和自动重连功能
 */

const BASE_URL = 'http://localhost:3000'

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 测试 1: 初始化数据库
async function testDatabaseSetup() {
  log('\n=== 测试 1: 数据库初始化 ===', 'blue')

  try {
    const response = await fetch(`${BASE_URL}/api/coze/setup`, {
      method: 'POST',
    })

    const data = await response.json()

    if (data.success) {
      log('✅ 数据库初始化成功', 'green')
      log(`   创建的表: ${data.tables.join(', ')}`, 'green')
      log(`   创建的视图: ${data.views.join(', ')}`, 'green')
      return true
    } else {
      log('❌ 数据库初始化失败', 'red')
      log(`   错误: ${data.message}`, 'red')
      return false
    }
  } catch (error) {
    log('❌ 数据库初始化请求失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return false
  }
}

// 测试 2: 检查数据库状态
async function testDatabaseStatus() {
  log('\n=== 测试 2: 检查数据库状态 ===', 'blue')

  try {
    const response = await fetch(`${BASE_URL}/api/coze/setup`)
    const data = await response.json()

    if (data.success) {
      log('✅ 数据库状态正常', 'green')
      log(`   表存在: ${data.status.tablesExist}`, 'green')
      log(`   会话数量: ${data.status.sessionCount}`, 'green')
      log(`   会话统计: ${JSON.stringify(data.status.sessionStats)}`, 'green')
      return true
    } else {
      log('❌ 数据库状态检查失败', 'red')
      return false
    }
  } catch (error) {
    log('❌ 数据库状态检查请求失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return false
  }
}

// 测试 3: 创建会话并发送消息
async function testSessionCreation() {
  log('\n=== 测试 3: 创建会话并发送消息 ===', 'blue')

  try {
    const response = await fetch(`${BASE_URL}/api/coze/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disputeType: '工资争议',
        description: '公司拖欠工资三个月，共15000元',
        userId: 'test_user_1',
      }),
    })

    const data = await response.json()

    if (data.success) {
      log('✅ 会话创建成功', 'green')
      log(`   会话ID: ${data.data.sessionId}`, 'green')
      log(`   会话统计: ${JSON.stringify(data.data.sessionStats)}`, 'green')
      log(`   AI响应长度: ${data.data.analysis.summary.length} 字符`, 'green')

      // 返回会话ID供后续测试使用
      return data.data.sessionId
    } else {
      log('❌ 会话创建失败', 'red')
      log(`   错误: ${data.error}`, 'red')
      return null
    }
  } catch (error) {
    log('❌ 会话创建请求失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return null
  }
}

// 测试 4: 继续对话（使用现有会话）
async function testContinueChat(sessionId) {
  log('\n=== 测试 4: 继续对话（使用现有会话） ===', 'blue')

  if (!sessionId) {
    log('⚠️  跳过测试：没有有效的会话ID', 'yellow')
    return false
  }

  try {
    const response = await fetch(`${BASE_URL}/api/coze/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disputeType: '工资争议',
        description: '请问需要收集哪些证据？',
        userId: 'test_user_1',
        sessionId,
      }),
    })

    const data = await response.json()

    if (data.success) {
      log('✅ 继续对话成功', 'green')
      log(`   使用会话ID: ${data.data.sessionId}`, 'green')
      log(`   AI响应长度: ${data.data.analysis.summary.length} 字符`, 'green')
      log(`   会话统计: ${JSON.stringify(data.data.sessionStats)}`, 'green')
      return true
    } else {
      log('❌ 继续对话失败', 'red')
      log(`   错误: ${data.error}`, 'red')
      return false
    }
  } catch (error) {
    log('❌ 继续对话请求失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return false
  }
}

// 测试 5: 获取会话统计
async function testSessionStats() {
  log('\n=== 测试 5: 获取会话统计 ===', 'blue')

  try {
    const response = await fetch(`${BASE_URL}/api/coze/chat/enhanced`)
    const data = await response.json()

    if (data.success) {
      log('✅ 会话统计获取成功', 'green')
      log(`   总会话数: ${data.stats.totalSessions}`, 'green')
      log(`   活跃会话: ${data.stats.activeSessions}`, 'green')
      log(`   空闲会话: ${data.stats.idleSessions}`, 'green')
      log(`   过期会话: ${data.stats.expiredSessions}`, 'green')
      return true
    } else {
      log('❌ 会话统计获取失败', 'red')
      return false
    }
  } catch (error) {
    log('❌ 会话统计获取请求失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return false
  }
}

// 测试 6: 测试多用户并发
async function testMultipleUsers() {
  log('\n=== 测试 6: 多用户并发测试 ===', 'blue')

  const userIds = ['user_1', 'user_2', 'user_3']
  const results = []

  try {
    const promises = userIds.map(async (userId) => {
      const response = await fetch(`${BASE_URL}/api/coze/chat/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeType: '加班费争议',
          description: `用户 ${userId} 的加班费问题`,
          userId,
        }),
      })

      const data = await response.json()
      return { userId, success: data.success, sessionId: data.data?.sessionId }
    })

    const responses = await Promise.all(promises)

    responses.forEach((result) => {
      if (result.success) {
        log(`✅ 用户 ${result.userId} 会话创建成功: ${result.sessionId}`, 'green')
        results.push(true)
      } else {
        log(`❌ 用户 ${result.userId} 会话创建失败`, 'red')
        results.push(false)
      }
    })

    const successCount = results.filter(r => r).length
    log(`   成功率: ${successCount}/${userIds.length}`, successCount === userIds.length ? 'green' : 'yellow')

    return successCount === userIds.length
  } catch (error) {
    log('❌ 多用户并发测试失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return false
  }
}

// 测试 7: 心跳保活测试
async function testHeartbeat() {
  log('\n=== 测试 7: 心跳保活测试 ===', 'blue')

  try {
    // 创建会话
    const response1 = await fetch(`${BASE_URL}/api/coze/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disputeType: '解除合同',
        description: '心跳测试',
        userId: 'heartbeat_test_user',
      }),
    })

    const data1 = await response1.json()

    if (!data1.success) {
      log('❌ 创建会话失败', 'red')
      return false
    }

    const sessionId = data1.data.sessionId
    log(`✅ 创建会话: ${sessionId}`, 'green')

    // 等待一段时间（心跳应该在这期间工作）
    log('   等待 35 秒（心跳间隔 30 秒）...', 'yellow')
    await sleep(35000)

    // 再次发送消息，会话应该仍然活跃
    const response2 = await fetch(`${BASE_URL}/api/coze/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disputeType: '解除合同',
        description: '心跳测试 - 第二次消息',
        userId: 'heartbeat_test_user',
        sessionId,
      }),
    })

    const data2 = await response2.json()

    if (data2.success) {
      log('✅ 心跳保活成功，会话仍然活跃', 'green')
      return true
    } else {
      log('❌ 心跳保活失败，会话可能已过期', 'red')
      return false
    }
  } catch (error) {
    log('❌ 心跳保活测试失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return false
  }
}

// 主测试函数
async function runTests() {
  log('\n========================================', 'blue')
  log('  Coze 连接测试套件', 'blue')
  log('========================================', 'blue')

  const results = []

  // 运行所有测试
  results.push(await testDatabaseSetup())
  results.push(await testDatabaseStatus())

  const sessionId = await testSessionCreation()
  results.push(!!sessionId)

  if (sessionId) {
    results.push(await testContinueChat(sessionId))
  }

  results.push(await testSessionStats())
  results.push(await testMultipleUsers())

  // 心跳测试较慢，仅在需要时运行
  if (process.argv.includes('--full')) {
    results.push(await testHeartbeat())
  } else {
    log('\n=== 测试 7: 心跳保活测试 (跳过，使用 --full 参数运行) ===', 'yellow')
  }

  // 输出测试结果
  log('\n========================================', 'blue')
  log('  测试结果汇总', 'blue')
  log('========================================', 'blue')

  const passed = results.filter(r => r).length
  const total = results.length

  log(`\n通过: ${passed}/${total}`, passed === total ? 'green' : 'yellow')

  if (passed === total) {
    log('\n🎉 所有测试通过！Coze 连接系统运行正常。', 'green')
  } else {
    log('\n⚠️  部分测试失败，请检查日志。', 'yellow')
  }

  process.exit(passed === total ? 0 : 1)
}

// 运行测试
runTests().catch((error) => {
  log(`\n❌ 测试执行出错: ${error.message}`, 'red')
  process.exit(1)
})
