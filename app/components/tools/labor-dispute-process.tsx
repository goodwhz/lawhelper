'use client'

import React, { useState } from 'react'

interface DisputeData {
  disputeType: 'wage' | 'termination' | 'discrimination' | 'socialSecurity' | 'other'
  disputeLevel: 'low' | 'medium' | 'high'
  hasEvidence: boolean
  preferredResolution: 'mediation' | 'arbitration' | 'lawsuit'
  budget: number
}

interface ProcessStep {
  step: number
  title: string
  description: string
  duration: string
  cost: string
  successRate: string
  tips: string[]
}

const LaborDisputeProcess: React.FC = () => {
  const [data, setData] = useState<DisputeData>({
    disputeType: 'wage',
    disputeLevel: 'medium',
    hasEvidence: false,
    preferredResolution: 'mediation',
    budget: 5000
  })

  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  const disputeTypes = [
    { value: 'wage', label: '工资争议', icon: '💰' },
    { value: 'termination', label: '解除合同争议', icon: '📝' },
    { value: 'discrimination', label: '歧视争议', icon: '⚖️' },
    { value: 'socialSecurity', label: '社保争议', icon: '🏥' },
    { value: 'other', label: '其他争议', icon: '❓' }
  ]

  const generateProcess = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    
    // 模拟数据处理过程
    for (let i = 0; i <= 100; i += 20) {
      setGenerationProgress(i)
      await new Promise(resolve => setTimeout(resolve, 400))
    }
    
    const baseSteps: ProcessStep[] = [
      {
        step: 1,
        title: '证据收集与整理',
        description: '收集相关证据材料，包括劳动合同、工资单、聊天记录等',
        duration: '1-3天',
        cost: '免费',
        successRate: '100%',
        tips: ['整理时间顺序', '保留电子证据', '制作证据清单']
      },
      {
        step: 2,
        title: '内部协商',
        description: '与用人单位进行初步沟通协商',
        duration: '3-7天',
        cost: '免费',
        successRate: '40%',
        tips: ['保持冷静沟通', '明确诉求', '记录协商过程']
      }
    ]

    // 详细的分支逻辑 - 根据争议类型、严重程度和证据情况
    if (data.disputeType === 'wage') {
      if (data.disputeLevel === 'low' && data.hasEvidence) {
        baseSteps.push({
          step: 3,
          title: '劳动监察投诉（快速通道）',
          description: '向劳动监察部门投诉，适用于事实清楚、证据充分的工资争议',
          duration: '15-30天',
          cost: '免费',
          successRate: '85%',
          tips: ['准备工资流水证明', '计算欠薪具体金额', '明确投诉诉求', '保存投诉回执']
        })
      } else if (data.disputeLevel === 'medium') {
        baseSteps.push({
          step: 3,
          title: '劳动仲裁申请',
          description: '向劳动争议仲裁委员会申请仲裁，适用于有一定复杂性的工资争议',
          duration: '45-60天',
          cost: '免费',
          successRate: '65%',
          tips: ['准备仲裁申请书', '计算应得工资总额', '收集加班记录', '保留考勤证据']
        })
      } else if (data.disputeLevel === 'high') {
        baseSteps.push({
          step: 3,
          title: '法院诉讼（工资争议）',
          description: '向人民法院提起诉讼，适用于重大金额或复杂的工资争议',
          duration: '3-6个月',
          cost: '诉讼费+律师费（约1-3万元）',
          successRate: '55%',
          tips: ['聘请专业劳动法律师', '准备完整证据链', '评估诉讼时效', '考虑执行风险']
        })
      }
    } else if (data.disputeType === 'termination') {
      if (data.disputeLevel === 'low') {
        baseSteps.push({
          step: 3,
          title: '协商补偿方案',
          description: '与用人单位协商解除劳动合同的经济补偿金',
          duration: '7-15天',
          cost: '免费',
          successRate: '70%',
          tips: ['计算法定补偿标准', '准备工作年限证明', '协商技巧培训', '签订书面协议']
        })
      } else if (data.disputeLevel === 'medium') {
        baseSteps.push({
          step: 3,
          title: '劳动仲裁（违法解除）',
          description: '申请仲裁认定解除行为违法并要求赔偿',
          duration: '45-60天',
          cost: '免费',
          successRate: '60%',
          tips: ['证明解除程序违法', '收集解除通知文件', '计算双倍赔偿金', '准备证据材料']
        })
      } else if (data.disputeLevel === 'high') {
        baseSteps.push({
          step: 3,
          title: '法院诉讼+恢复劳动关系',
          description: '通过诉讼要求恢复劳动关系并赔偿损失',
          duration: '3-8个月',
          cost: '诉讼费+律师费（约2-5万元）',
          successRate: '45%',
          tips: ['评估恢复可行性', '计算期间工资损失', '聘请专业律师', '准备完整证据']
        })
      }
    } else if (data.disputeType === 'discrimination') {
      baseSteps.push({
        step: 3,
        title: '劳动监察+法律援助',
        description: '向劳动监察部门举报歧视行为，必要时寻求法律援助',
        duration: '30-60天',
        cost: '免费或较低',
        successRate: '50%',
        tips: ['收集歧视证据', '记录歧视言论', '寻求公益律师', '心理支持准备']
      })
    } else if (data.disputeType === 'socialSecurity') {
      baseSteps.push({
        step: 3,
        title: '社保稽核+行政投诉',
        description: '向社保部门申请稽核，要求补缴社保费用',
        duration: '30-90天',
        cost: '免费',
        successRate: '80%',
        tips: ['计算应缴社保金额', '准备工资证明', '跟进处理进度', '保存处理结果']
      })
    } else {
      // 其他类型争议
      baseSteps.push({
        step: 3,
        title: '综合解决方案',
        description: '根据具体情况制定个性化解决策略',
        duration: '视情况而定',
        cost: '视情况而定',
        successRate: '50%',
        tips: ['咨询专业律师', '评估风险收益', '制定详细计划', '分步骤实施']
      })
    }

    // 根据选择的解决方式调整流程
    if (data.preferredResolution === 'mediation' && data.disputeLevel !== 'high') {
      baseSteps.splice(2, 0, {
        step: 2.5,
        title: '专业调解（推荐）',
        description: '通过劳动人事争议调解组织进行专业调解',
        duration: '7-15天',
        cost: '较低（500-2000元）',
        successRate: '75%',
        tips: ['选择有经验的调解员', '准备调解方案', '保持理性沟通', '签订调解协议']
      })
    } else if (data.preferredResolution === 'arbitration') {
      // 仲裁是默认路径，已在前面处理
    } else if (data.preferredResolution === 'lawsuit' && data.disputeLevel === 'high') {
      // 诉讼是最终路径，已在前面处理
    }

    // 重新编号步骤
    const renumberedSteps = baseSteps.map((step, index) => ({
      ...step,
      step: index + 1
    }))

    // 最后一步进度
    setGenerationProgress(100)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setProcessSteps(renumberedSteps)
    setIsGenerating(false)
    setGenerationProgress(0)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">劳动争议解决流程向导</h3>
        <p className="text-gray-600 text-sm">
          根据您的具体情况，系统将生成个性化的解决路径，明确告诉您每一步应该如何操作。
          请如实填写以下信息，以获得最准确的指导。
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            争议类型
          </label>
          <div className="space-y-2">
            {disputeTypes.map(type => (
              <label key={type.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value={type.value}
                  checked={data.disputeType === type.value}
                  onChange={e => setData({ ...data, disputeType: e.target.value as any })}
                  className="text-blue-600"
                />
                <span className="text-lg">{type.icon}</span>
                <span>{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              争议严重程度
            </label>
            <select
              value={data.disputeLevel}
              onChange={e => setData({ ...data, disputeLevel: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">轻微（金额较小，事实清楚）</option>
              <option value="medium">中等（有一定复杂性）</option>
              <option value="high">严重（涉及重大利益）</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              是否持有证据
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={data.hasEvidence}
                  onChange={() => setData({ ...data, hasEvidence: true })}
                  className="mr-2"
                />
                有证据
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!data.hasEvidence}
                  onChange={() => setData({ ...data, hasEvidence: false })}
                  className="mr-2"
                />
                无证据
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              偏好解决方式
            </label>
            <select
              value={data.preferredResolution}
              onChange={e => setData({ ...data, preferredResolution: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mediation">调解（快速、低成本）</option>
              <option value="arbitration">仲裁（专业、公正）</option>
              <option value="lawsuit">诉讼（最终保障）</option>
            </select>
          </div>
        </div>
      </div>

      {isGenerating ? (
        <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-md font-semibold">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>正在生成个性化解决流程...</span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <button
          onClick={generateProcess}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
        >
          🚀 生成解决流程
        </button>
      )}

      {processSteps.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4 text-gray-800">个性化解决流程</h4>
          
          <div className="space-y-6">
            {processSteps.map(step => (
              <div key={step.step} className="relative pl-8 border-l-2 border-blue-200">
                <div className="absolute -left-3 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-gray-800">{step.title}</h5>
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <span>⏱️ {step.duration}</span>
                      <span>💵 {step.cost}</span>
                      <span>📈 {step.successRate}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{step.description}</p>
                  
                  <div className="bg-white p-3 rounded border">
                    <span className="text-sm font-medium text-gray-700">💡 实用建议：</span>
                    <ul className="mt-1 space-y-1">
                      {step.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-md">
        <h5 className="font-semibold text-green-800 mb-3">🎯 具体行动指南</h5>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-green-700">📋 立即行动：</span>
            <ul className="mt-1 space-y-1">
              <li className="text-green-600">• 整理所有相关证据材料</li>
              <li className="text-green-600">• 记录争议发生的时间线</li>
              <li className="text-green-600">• 计算具体的损失金额</li>
              <li className="text-green-600">• 准备正式的沟通文件</li>
            </ul>
          </div>
          <div>
            <span className="font-medium text-blue-700">⚠️ 注意事项：</span>
            <ul className="mt-1 space-y-1">
              <li className="text-blue-600">• 注意诉讼时效（1年内）</li>
              <li className="text-blue-600">• 保留所有沟通记录</li>
              <li className="text-blue-600">• 避免情绪化表达</li>
              <li className="text-blue-600">• 咨询专业律师意见</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded border">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-700">预计总时长：</span>
              <span className="ml-2 text-gray-600">{processSteps.reduce((sum, step) => {
                const days = parseInt(step.duration) || 0
                return sum + days
              }, 0)}天</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">成功率预估：</span>
              <span className="ml-2 text-green-600 font-semibold">
                {processSteps.length > 0 ? 
                  Math.round(processSteps.reduce((sum, step) => {
                    const rate = parseInt(step.successRate) || 0
                    return sum + rate
                  }, 0) / processSteps.length) + '%' : '计算中...'}
              </span>
            </div>
          </div>
        </div>
      </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        <strong>💡 法律提示：</strong>劳动争议处理应当遵循"协商-调解-仲裁-诉讼"的基本流程。
        及时收集证据是维权成功的关键因素。
      </div>
    </div>
  )
}

export default LaborDisputeProcess