// src/components/NTRPSlider.jsx
// NTRP自评等级滑块组件（1.0 - 5.0，支持0.5步进）

function NTRPSlider({ value, onChange }) {
  // NTRP等级列表
  const levels = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]
  
  // 将数值转换为滑块位置（0-8）
  const valueToIndex = (val) => levels.indexOf(val)
  const indexToValue = (idx) => levels[idx]

  const handleSliderChange = (e) => {
    const index = parseInt(e.target.value)
    onChange(indexToValue(index))
  }

  return (
    <div className="space-y-4">
      {/* 滑块区域 */}
      <div className="relative pt-6 pb-2">
        {/* 滑块轨道 */}
        <input
          type="range"
          min="0"
          max="8"
          step="1"
          value={valueToIndex(value)}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-wimbledon-grass"
        />
        
        {/* 刻度标记 */}
        <div className="flex justify-between px-1 mt-2">
          {levels.map((level) => (
            <div key={level} className="flex flex-col items-center">
              <div className="w-0.5 h-2 bg-gray-300"></div>
              <span className="text-xs text-gray-600 mt-1">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 当前选中的值 */}
      <div className="flex justify-center">
        <div className="bg-wimbledon-grass/10 text-wimbledon-green font-medium px-4 py-2 rounded-xl">
          自评等级：NTRP {value.toFixed(1)}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        拖动滑块选择你的技术水平（1.0初学者 - 5.0专业级）
      </p>
    </div>
  )
}

export default NTRPSlider