/**
 * 运行用户数据同步脚本
 */

const { execSync } = require('child_process')
const path = require('path')

async function runSync() {
  try {
    console.log('🔄 开始同步用户数据...')

    // 切换到项目根目录并运行同步脚本
    const projectRoot = path.join(__dirname, '..')
    process.chdir(projectRoot)

    // 使用 TypeScript 直接运行同步脚本
    execSync('npx ts-node scripts/sync-user-profiles.ts', {
      stdio: 'inherit',
      cwd: projectRoot,
    })

    console.log('✅ 用户数据同步完成')
  } catch (error) {
    console.error('❌ 同步过程中发生错误:', error.message)
    process.exit(1)
  }
}

runSync()
