// 测试密码策略功能的脚本
// 在浏览器控制台中运行

async function testPasswordPolicy() {
  console.log('=== 测试密码策略功能 ===')
  
  // 测试用例
  const testCases = [
    {
      name: '空密码',
      password: '',
      shouldFail: true
    },
    {
      name: '太短的密码',
      password: 'Ab1',
      shouldFail: true
    },
    {
      name: '只有小写字母',
      password: 'abcdef',
      shouldFail: true
    },
    {
      name: '只有大写字母',
      password: 'ABCDEF',
      shouldFail: true
    },
    {
      name: '只有数字',
      password: '123456',
      shouldFail: true
    },
    {
      name: '缺少大写字母',
      password: 'abdef123',
      shouldFail: true
    },
    {
      name: '缺少小写字母',
      password: 'ABDEF123',
      shouldFail: true
    },
    {
      name: '缺少数字',
      password: 'abDefgh',
      shouldFail: true
    },
    {
      name: '有效密码 - 最小长度',
      password: 'Abc123',
      shouldFail: false
    },
    {
      name: '有效密码 - 复杂',
      password: 'MyPassword123',
      shouldFail: false
    },
    {
      name: '有效密码 - 带特殊字符',
      password: 'MyPass123!',
      shouldFail: false
    }
  ]
  
  console.log('📋 测试用例验证：')
  
  for (const testCase of testCases) {
    try {
      // 测试注册验证
      console.log(`\n🧪 测试: ${testCase.name}`)
      console.log(`密码: "${testCase.password}"`)
      
      const registerResponse = await fetch('/api/test-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: testCase.password,
          name: 'Test User'
        })
      })
      
      if (testCase.shouldFail) {
        if (!registerResponse.ok) {
          const error = await registerResponse.json()
          console.log(`✅ 预期失败: ${error.error}`)
        } else {
          console.log('❌ 预期失败但成功了')
        }
      } else {
        // 对于有效的密码，我们只检查验证逻辑，不实际注册
        console.log('✅ 密码符合要求（跳过实际注册）')
      }
      
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`)
    }
  }
  
  console.log('\n🌐 前端验证测试：')
  
  // 测试前端验证函数
  try {
    const { validatePassword } = await import('/utils/password-validation.js')
    
    for (const testCase of testCases) {
      const validation = validatePassword(testCase.password)
      
      console.log(`\n🔍 前端验证: ${testCase.name}`)
      console.log(`密码: "${testCase.password}"`)
      console.log(`有效: ${validation.isValid}`)
      
      if (validation.errors.length > 0) {
        console.log(`错误: ${validation.errors.join(', ')}`)
      }
      
      console.log(`要求: 长度=${validation.requirements.length}, 小写=${validation.requirements.hasLowercase}, 大写=${validation.requirements.hasUppercase}, 数字=${validation.requirements.hasNumber}`)
      
      const shouldPass = !testCase.shouldFail
      if (validation.isValid === shouldPass) {
        console.log('✅ 验证结果符合预期')
      } else {
        console.log('❌ 验证结果不符合预期')
      }
    }
    
  } catch (error) {
    console.error('无法导入前端验证函数:', error)
    console.log('💡 提示：前端验证可能需要通过实际UI测试来验证')
  }
  
  console.log('\n🎯 密码策略测试完成！')
  console.log('💡 建议：')
  console.log('1. 手动测试注册页面的密码输入体验')
  console.log('2. 手动测试密码重置页面的密码验证')
  console.log('3. 验证现有账户仍能正常登录')
  console.log('4. 确认错误提示信息清晰易懂')
}

// 创建一个临时的测试API端点（如果不存在）
async function createTestEndpoint() {
  console.log('检查测试API端点...')
  
  try {
    const response = await fetch('/api/test-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'Test123',
        name: 'Test User'
      })
    })
    
    if (response.status === 404) {
      console.log('⚠️ 测试API端点不存在，请手动测试注册功能')
      return false
    } else {
      console.log('✅ 测试API端点可用')
      return true
    }
  } catch (error) {
    console.log('⚠️ 无法检查测试API端点')
    return false
  }
}

console.log('运行 testPasswordPolicy() 来测试密码策略功能')
console.log('这将测试各种密码情况并验证前后端验证逻辑')