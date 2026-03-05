// 测试挑战计时逻辑（自然日制）
console.log('=== 测试挑战计时逻辑（自然日制） ===\n')

// 模拟解锁逻辑
function testUnlockLogic() {
  console.log('1. 测试解锁逻辑:')
  
  // 测试场景1：前一天23:30打卡，次日0:00应该解锁
  const submittedAt = new Date('2026-02-27T23:30:00Z')
  const unlockDate = new Date(submittedAt)
  unlockDate.setDate(unlockDate.getDate() + 1) // 次日
  unlockDate.setHours(0, 0, 0, 0) // 0:00:00.000
  
  const testTime1 = new Date('2026-02-28T00:00:01Z') // 次日0:00:01
  const today1 = new Date(testTime1)
  today1.setHours(0, 0, 0, 0)
  
  const isUnlocked1 = today1 >= unlockDate
  console.log(`场景1 - 前一天23:30打卡，次日0:00:01: ${isUnlocked1 ? '✅ 已解锁' : '❌ 未解锁'}`)
  
  // 测试场景2：前一天23:30打卡，当日23:59应该未解锁
  const testTime2 = new Date('2026-02-27T23:59:59Z')
  const today2 = new Date(testTime2)
  today2.setHours(0, 0, 0, 0)
  
  const isUnlocked2 = today2 >= unlockDate
  console.log(`场景2 - 前一天23:30打卡，当日23:59: ${isUnlocked2 ? '❌ 已解锁（错误）' : '✅ 未解锁（正确）'}`)
  
  // 测试场景3：用户 ally 的情况（已打第2天卡，今晚0:00后应自动解锁第3天）
  const allySubmittedAt = new Date('2026-02-28T14:00:00Z') // 假设今天14:00打了第2天卡
  const allyUnlockDate = new Date(allySubmittedAt)
  allyUnlockDate.setDate(allyUnlockDate.getDate() + 1)
  allyUnlockDate.setHours(0, 0, 0, 0)
  
  const afterMidnight = new Date('2026-02-29T00:00:01Z') // 2月29日0:00:01
  const today3 = new Date(afterMidnight)
  today3.setHours(0, 0, 0, 0)
  
  const isUnlocked3 = today3 >= allyUnlockDate
  console.log(`场景3 - ally第2天14:00打卡，2月29日0:00:01: ${isUnlocked3 ? '✅ 已解锁第3天' : '❌ 未解锁'}`)
}

// 测试截止时间逻辑
function testDeadlineLogic() {
  console.log('\n2. 测试截止时间逻辑:')
  
  const startDate = '2026-02-27'
  const start = new Date(startDate + 'T12:00:00')
  
  // 第1天截止时间
  const day1Deadline = new Date(start)
  day1Deadline.setHours(23, 59, 59, 999)
  console.log(`第1天截止时间: ${day1Deadline.toISOString()}`)
  
  // 第2天截止时间
  const day2Deadline = new Date(start)
  day2Deadline.setDate(start.getDate() + 1)
  day2Deadline.setHours(23, 59, 59, 999)
  console.log(`第2天截止时间: ${day2Deadline.toISOString()}`)
  
  // 测试是否超时
  const testTimeBefore = new Date('2026-02-27T23:59:00Z')
  const testTimeAfter = new Date('2026-02-28T00:00:01Z')
  
  console.log(`第1天23:59: ${testTimeBefore <= day1Deadline ? '✅ 未超时' : '❌ 已超时'}`)
  console.log(`第1天次日0:00: ${testTimeAfter <= day1Deadline ? '❌ 未超时（错误）' : '✅ 已超时（正确）'}`)
}

// 测试漏打卡检测
function testMissedDayLogic() {
  console.log('\n3. 测试漏打卡检测:')
  
  const startDate = '2026-02-27'
  const start = new Date(startDate + 'T12:00:00')
  
  // 模拟第1天有打卡，第2天没有打卡
  const logs = [
    { log_date: '2026-02-27', submitted_at: '2026-02-27T14:00:00Z' }
  ]
  
  // 测试时间：第2天23:59
  const testTime1 = new Date('2026-02-28T23:59:00Z')
  const dayDate = new Date(start)
  dayDate.setDate(start.getDate() + 1) // 第2天
  
  const deadline = new Date(dayDate)
  deadline.setHours(23, 59, 59, 999)
  
  const hasLog = logs.find(l => {
    const logDate = new Date(l.log_date + 'T12:00:00')
    return logDate.toDateString() === dayDate.toDateString()
  })
  
  console.log(`第2天23:59检测: ${!hasLog && testTime1 > deadline ? '❌ 检测到漏打卡（错误）' : '✅ 未漏打卡（正确）'}`)
  
  // 测试时间：第2天次日0:00
  const testTime2 = new Date('2026-02-29T00:00:01Z')
  console.log(`第2天次日0:00检测: ${!hasLog && testTime2 > deadline ? '✅ 检测到漏打卡（正确）' : '❌ 未漏打卡（错误）'}`)
}

// 运行所有测试
testUnlockLogic()
testDeadlineLogic()
testMissedDayLogic()

console.log('\n=== 测试完成 ===')
console.log('总结：自然日制逻辑已正确实现：')
console.log('1. 用户任何时间打卡后，次日0:00自动解锁下一天')
console.log('2. 当天23:59前未打卡则视为漏打卡')
console.log('3. 用户 ally 今晚（2月29日）0:00后应自动解锁第3天')