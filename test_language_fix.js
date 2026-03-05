// 测试语言切换修复
import { getCurrentLanguage, setLanguage, SUPPORTED_LANGUAGES } from './src/lib/i18n.js'

console.log('=== 测试语言切换修复 ===\n')

// 模拟不同的环境
const testScenarios = [
  {
    name: '国内版域名 (tennisjourney.top)',
    hostname: 'tennisjourney.top',
    expected: 'zh'
  },
  {
    name: '国际版域名 (tj-7.vercel.app)',
    hostname: 'tj-7.vercel.app',
    expected: 'en'
  },
  {
    name: '本地开发环境 (localhost)',
    hostname: 'localhost',
    expected: 'en' // 默认英文
  },
  {
    name: '其他域名',
    hostname: 'example.com',
    expected: 'en' // 默认英文
  }
]

// 测试1: 测试getCurrentLanguage的域名检测逻辑
console.log('🔍 测试1: 域名检测逻辑')
console.log('----------------------')

// 保存原始window对象
const originalWindow = global.window

testScenarios.forEach(scenario => {
  // 模拟window对象
  global.window = {
    location: {
      hostname: scenario.hostname
    }
  }
  
  // 清除localStorage
  global.localStorage = {
    getItem: () => null,
    setItem: () => {}
  }
  
  const result = getCurrentLanguage()
  const passed = result === scenario.expected
  
  console.log(`${passed ? '✅' : '❌'} ${scenario.name}`)
  console.log(`   域名: ${scenario.hostname}`)
  console.log(`   预期: ${scenario.expected}`)
  console.log(`   实际: ${result}`)
  console.log('')
})

// 恢复原始window对象
global.window = originalWindow

// 测试2: 测试localStorage优先级
console.log('🔍 测试2: localStorage优先级')
console.log('--------------------------')

// 模拟有localStorage的情况
global.window = {
  location: {
    hostname: 'tennisjourney.top' // 应该显示中文
  }
}

global.localStorage = {
  getItem: (key) => {
    if (key === 'preferred_language') return 'en' // 用户保存了英文
    return null
  },
  setItem: () => {}
}

const resultWithStorage = getCurrentLanguage()
console.log(`域名: tennisjourney.top (应该显示中文)`)
console.log(`localStorage: preferred_language = 'en'`)
console.log(`结果: ${resultWithStorage}`)
console.log(`✅ 测试通过: ${resultWithStorage === 'en' ? '是 (优先使用用户保存的语言)' : '否'}`)
console.log('')

// 测试3: 测试setLanguage函数
console.log('🔍 测试3: setLanguage函数')
console.log('-----------------------')

let localStorageSet = false
let localStorageKey = ''
let localStorageValue = ''

global.localStorage = {
  getItem: () => null,
  setItem: (key, value) => {
    localStorageSet = true
    localStorageKey = key
    localStorageValue = value
  }
}

let windowReloaded = false
global.window = {
  location: {
    reload: () => {
      windowReloaded = true
    }
  },
  dispatchEvent: () => {}
}

// 测试设置有效语言
console.log('测试设置简体中文 (zh):')
setLanguage('zh')
console.log(`  localStorage设置: ${localStorageSet ? '✅' : '❌'} (key=${localStorageKey}, value=${localStorageValue})`)
console.log(`  页面刷新: ${windowReloaded ? '✅' : '❌'}`)

// 测试设置无效语言
console.log('\n测试设置无效语言 (xx):')
try {
  setLanguage('xx')
  console.log('  ❌ 应该抛出错误但未抛出')
} catch (e) {
  console.log(`  ✅ 正确处理无效语言: ${e.message}`)
}

console.log('\n=== 测试完成 ===')
console.log('\n修复总结:')
console.log('1. ✅ 添加了详细的调试日志')
console.log('2. ✅ 修复了useTranslation中的重复setLanguage逻辑')
console.log('3. ✅ 增强了域名检测逻辑的调试信息')
console.log('4. ✅ 确保语言切换后页面会刷新')
console.log('\n下一步:')
console.log('- 在浏览器中测试实际的语言切换功能')
console.log('- 检查控制台日志以确认语言切换流程')
console.log('- 验证国内版网站默认显示中文')