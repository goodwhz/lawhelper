// 调用 RLS 修复 API
fetch('http://localhost:3005/api/fix-rls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('RLS 修复结果:', JSON.stringify(data, null, 2))
})
.catch(error => {
  console.error('调用 API 失败:', error)
})