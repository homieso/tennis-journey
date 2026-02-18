// 模拟 i18n.js 中的 getCurrentLanguage 函数
const SUPPORTED_LANGUAGES = {
  zh: '简体中文',
  en: 'English',
  zh_tw: '繁體中文'
};
const DEFAULT_LANGUAGE = 'zh';

function getCurrentLanguage(hostname, browserLang) {
  const savedLang = null; // 假设没有保存的语言
  if (savedLang && SUPPORTED_LANGUAGES[savedLang]) {
    return savedLang;
  }
  
  // 检测域名，自动设置默认语言
  // 注意：域名检测的优先级低于用户手动保存的语言，但高于浏览器语言
  if (hostname.includes('tennisjourney.top')) {
    // 国内域名默认简体中文
    return 'zh';
  } else if (hostname.includes('tj-7.vercel.app')) {
    // 国际域名默认英语
    return 'en';
  }
  
  // 检测浏览器语言
  if (browserLang.startsWith('zh')) {
    if (browserLang.includes('tw') || browserLang.includes('hant')) {
      return 'zh_tw';
    }
    return 'zh';
  } else if (browserLang.startsWith('en')) {
    return 'en';
  }
  
  return DEFAULT_LANGUAGE;
}

// 测试用例
console.log('Testing domain language detection:');
console.log('localhost:5173 ->', getCurrentLanguage('localhost:5173', 'zh-CN'));
console.log('tennisjourney.top ->', getCurrentLanguage('tennisjourney.top', 'en-US'));
console.log('tj-7.vercel.app ->', getCurrentLanguage('tj-7.vercel.app', 'zh-CN'));
console.log('tennisjourney.top with en browser ->', getCurrentLanguage('tennisjourney.top', 'en'));
console.log('unknown domain with zh browser ->', getCurrentLanguage('example.com', 'zh-CN'));
console.log('unknown domain with en browser ->', getCurrentLanguage('example.com', 'en'));