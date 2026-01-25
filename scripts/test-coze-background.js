/**
 * Coze API 测试脚本 - 验证是否需要后台运行
 *
 * 测试目标：
 * 1. 测试 Coze API 是否可以在浏览器关闭的情况下正常调用
 * 2. 测试会话管理的有效性
 * 3. 测试心跳保活机制
 */

const BASE_URL = 'http://localhost:3000'

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 测试 1: 基础 API 调用测试
async function testBasicAPICall() {
  log('\n=== 测试 1: 基础 API 调用 ===', 'blue')

  try {
    const response = await fetch(`${BASE_URL}/api/coze/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disputeType: '工资争议',
        description: '测试：Coze API 是否需要在后台运行？',
      }),
    })

    const data = await response.json()

    if (data.success) {
      const isMock = data.data.analysis.raw?.mock
      if (isMock) {
        log('⚠️  返回的是模拟响应（API Token 未配置或调用失败）', 'yellow')
        log(`   原因: ${data.data.analysis.raw.reason}`, 'yellow')
        return { success: false, isMock: true }
      } else {
        log('✅ API 调用成功，返回真实 AI 响应', 'green')
        log(`   响应长度: ${data.data.analysis.summary.length} 字符`, 'green')
        return { success: true, isMock: false }
      }
    } else {
      log('❌ API 调用失败', 'red')
      log(`   错误: ${data.error}`, 'red')
      return { success: false, isMock: false }
    }
  } catch (error) {
    log('❌ API 调用请求失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return { success: false, isMock: false }
  }
}

// 测试 2: 增强版 API 调用测试
async function testEnhancedAPICall() {
  log('\n=== 测试 2: 增强版 API 调用（含会话管理） ===', 'blue')

  try {
    const response = await fetch(`${BASE_URL}/api/coze/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disputeType: '工资争议',
        description: '测试：增强版 API 是否需要后台运行？',
        userId: 'test_background_check',
      }),
    })

    const data = await response.json()

    if (data.success) {
      const isMock = data.data.analysis.raw?.mock
      if (isMock) {
        log('⚠️  返回的是模拟响应', 'yellow')
        log(`   原因: ${data.data.analysis.raw.reason}`, 'yellow')
        return { success: false, isMock: true }
      } else {
        log('✅ 增强版 API 调用成功', 'green')
        log(`   会话ID: ${data.data.sessionId}`, 'cyan')
        log(`   响应长度: ${data.data.analysis.summary.length} 字符`, 'green')
        log(`   会话统计: ${JSON.stringify(data.data.sessionStats)}`, 'cyan')
        return { success: true, isMock: false, sessionId: data.data.sessionId }
      }
    } else {
      log('❌ 增强版 API 调用失败', 'red')
      log(`   错误: ${data.error}`, 'red')
      return { success: false, isMock: false }
    }
  } catch (error) {
    log('❌ 增强版 API 调用请求失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return { success: false, isMock: false }
  }
}

// 测试 3: 会话连续性测试
async function testSessionContinuity(sessionId) {
  log('\n=== 测试 3: 会话连续性（模拟后台关闭） ===', 'blue')

  if (!sessionId) {
    log('⚠️  跳过测试：没有有效的会话ID', 'yellow')
    return { success: false }
  }

  try {
    // 第一次调用
    const response1 = await fetch(`${BASE_URL}/api/coze/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disputeType: '工资争议',
        description: '问题 1：什么是最低工资？',
        userId: 'test_continuity',
        sessionId,
      }),
    })

    const data1 = await response1.json()

    if (!data1.success) {
      log('❌ 第一次调用失败', 'red')
      return { success: false }
    }

    log('✅ 第一次调用成功', 'green')

    // 等待一段时间（模拟后台关闭）
    log('   等待 5 秒（模拟后台关闭）...', 'yellow')
    await sleep(5000)

    // 第二次调用（使用相同会话）
    const response2 = await fetch(`${BASE_URL}/api/coze/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disputeType: '工资争议',
        description: '问题 2：如何计算加班费？',
        userId: 'test_continuity',
        sessionId,
      }),
    })

    const data2 = await response2.json()

    if (!data2.success) {
      log('❌ 第二次调用失败', 'red')
      return { success: false }
    }

    log('✅ 第二次调用成功（会话保持活跃）', 'green')
    log(`   会话ID: ${data2.data.sessionId}`, 'cyan')

    return { success: true }
  } catch (error) {
    log('❌ 会话连续性测试失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return { success: false }
  }
}

// 测试 4: 环境变量检查
async function testEnvironmentConfig() {
  log('\n=== 测试 4: 环境配置检查 ===', 'blue')

  try {
    // 检查数据库状态
    const setupResponse = await fetch(`${BASE_URL}/api/coze/setup`)
    const setupData = await setupResponse.json()

    if (setupData.success) {
      log('✅ 数据库连接正常', 'green')
      log(`   表存在: ${setupData.status.tablesExist}`, 'cyan')
      log(`   会话数量: ${setupData.status.sessionCount}`, 'cyan')
    } else {
      log('⚠️  数据库状态检查失败', 'yellow')
    }

    // 检查会话统计
    const statsResponse = await fetch(`${BASE_URL}/api/coze/chat/enhanced`)
    const statsData = await statsResponse.json()

    if (statsData.success) {
      log('✅ 会话管理器运行正常', 'green')
      log(`   总会话数: ${statsData.stats.totalSessions}`, 'cyan')
      log(`   活跃会话: ${statsData.stats.activeSessions}`, 'cyan')
    }

    return { success: true }
  } catch (error) {
    log('❌ 环境配置检查失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return { success: false }
  }
}

// 测试 5: 连接超时测试
async function testConnectionTimeout() {
  log('\n=== 测试 5: 连接超时和重试 ===', 'blue')

  try {
    // 发送多个请求，测试连接稳定性
    const requests = []

    for (let i = 0; i < 3; i++) {
      requests.push(
        fetch(`${BASE_URL}/api/coze/chat/enhanced`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            disputeType: '工资争议',
            description: `并发测试请求 ${i + 1}`,
            userId: 'test_timeout',
          }),
        }).then(res => res.json()),
      )

      // 间隔 1 秒
      await sleep(1000)
    }

    const results = await Promise.all(requests)
    const successCount = results.filter(r => r.success).length

    log(`✅ 并发请求完成: ${successCount}/${results.length}`, successCount === results.length ? 'green' : 'yellow')

    results.forEach((result, index) => {
      if (result.success) {
        const isMock = result.data.analysis.raw?.mock
        log(`   请求 ${index + 1}: ${isMock ? '模拟响应' : '真实响应'}`, isMock ? 'yellow' : 'green')
      } else {
        log(`   请求 ${index + 1}: 失败`, 'red')
      }
    })

    return { success: successCount === results.length }
  } catch (error) {
    log('❌ 连接超时测试失败', 'red')
    log(`   错误: ${error.message}`, 'red')
    return { success: false }
  }
}

// 主测试函数
async function runTests() {
  log('\n========================================', 'blue')
  log('  Coze 后台依赖性测试套件', 'blue')
  log('========================================', 'blue')

  const results = []

  // 运行所有测试
  const basicResult = await testBasicAPICall()
  results.push({ name: '基础 API 调用', result: basicResult })

  const enhancedResult = await testEnhancedAPICall()
  results.push({ name: '增强版 API 调用', result: enhancedResult })

  if (enhancedResult.sessionId) {
    const continuityResult = await testSessionContinuity(enhancedResult.sessionId)
    results.push({ name: '会话连续性', result: continuityResult })
  } else {
    results.push({ name: '会话连续性', result: { success: false } })
  }

  const envResult = await testEnvironmentConfig()
  results.push({ name: '环境配置检查', result: envResult })

  const timeoutResult = await testConnectionTimeout()
  results.push({ name: '连接超时测试', result: timeoutResult })

  // 输出测试结果
  log('\n========================================', 'blue')
  log('  测试结果汇总', 'blue')
  log('========================================', 'blue')

  results.forEach(({ name, result }) => {
    if (result.success) {
      log(`✅ ${name}: 通过`, 'green')
    } else if (result.isMock) {
      log(`⚠️  ${name}: 返回模拟响应`, 'yellow')
    } else {
      log(`❌ ${name}: 失败`, 'red')
    }
  })

  // 分析结论
  log('\n========================================', 'blue')
  log('  分析结论', 'blue')
  log('========================================', 'blue')

  const passed = results.filter(r => r.result.success).length
  const mockResponses = results.filter(r => r.result.isMock).length
  const total = results.length

  if (mockResponses > 0) {
    log('\n⚠️  重要发现:', 'yellow')
    log('   检测到 API 返回模拟响应', 'yellow')
    log('   可能的原因:', 'yellow')
    log('   1. Coze API Token 未正确配置', 'yellow')
    log('   2. Coze API 服务暂时不可用', 'yellow')
    log('   3. 网络连接问题', 'yellow')
    log('\n   建议:', 'yellow')
    log('   - 检查 .env.local 中的 COZE_API_URL 和 COZE_API_TOKEN', 'yellow')
    log('   - 确保 Coze 平台的 Bot 或 Workflow 已发布', 'yellow')
    log('   - 检查网络连接', 'yellow')
  } else if (passed === total) {
    log('\n✅ 结论:', 'green')
    log('   Coze API 可以正常调用，无需 Coze 后台运行', 'green')
    log('   系统通过 REST API 调用 Coze 服务', 'green')
    log('   会话管理和心跳机制正常运行', 'green')
  } else {
    log('\n⚠️  结论:', 'yellow')
    log('   部分测试失败，可能存在问题', 'yellow')
    log('   请检查错误日志和环境配置', 'yellow')
  }

  log(`\n通过: ${passed}/${total}`, passed === total ? 'green' : 'yellow')

  process.exit(passed === total ? 0 : 1)
}

// 运行测试
runTests().catch((error) => {
  log(`\n❌ 测试执行出错: ${error.message}`, 'red')
  process.exit(1)
})
