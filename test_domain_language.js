// 测试域名语言定向功能
const { getCurrentLanguage } = require('./src/lib/i18n.js')

// 模拟不同的域名环境
function testDomainLanguage() {
  console.log('测试域名语言定向功能...\n')
  
  const testCases = [
    {
      hostname: 'tennisjourney.top',
      expected: 'zh',
      description: '国内域名应返回简体中文'
    },
    {
      hostname: 'tj-7.vercel.app',
      expected: 'en',
      description: '国际域名应返回英语'
    },
    {
      hostname: 'localhost',
      expected: 'zh', // 默认中文，因为浏览器语言检测会处理
      description: '本地开发环境'
    }
  ]
  
  // 保存原始的 window 和 localStorage
  const originalWindow = global.window
  const originalLocalStorage = global.localStorage
  
  testCases.forEach(testCase => {
    // 清理 localStorage
    if (global.localStorage) {
      global.localStorage.clear()
    }
    
    // 模拟 window 对象
    global.window = {
      location: {
        hostname: testCase.hostname
      }
    }
    
    // 模拟 navigator（浏览器语言为中文）
    global.navigator = {
      language: 'zh-CN'
    }
    
    // 模拟 localStorage
    const mockStorage = {}
    global.localStorage = {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, value) => { mockStorage[key] = value },
      clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]) }
    }
    
    const result = getCurrentLanguage()
    const passed = result === testCase.expected
    
    console.log(`${passed ? '✅' : '❌'} ${testCase.description}`)
    console.log(`  域名: ${testCase.hostname}`)
    console.log(`  预期: ${testCase.expected}, 实际: ${result}`)
    console.log()
  })
  
  // 测试用户手动切换语言优先级
  console.log('测试用户手动切换语言优先级...')
  global.window = { location: { hostname: 'tj-7.vercel.app' } }
  global.navigator = { language: 'zh-CN' }
  const mockStorage = {}
  global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => { mockStorage[key] = value },
    clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]) }
  }
  
  // 用户手动保存了中文偏好
  mockStorage['preferred_language'] = 'zh'
  const resultWithPref = getCurrentLanguage()
  console.log(`用户保存了中文偏好，访问国际域名 tj-7.vercel.app`)
  console.log(`结果: ${resultWithPref} (应为 'zh'，优先级高于域名检测)`)
  console.log(resultWithPref === 'zh' ? '✅ 通过' : '❌ 失败')
  
  // 恢复原始对象
  global.window = originalWindow
  global.localStorage = originalLocalStorage
}

try {
  testDomainLanguage()
} catch (error) {
  console.error('测试失败:', error.message)
  console.error(error.stack)
}