'use client'

import React, { useState } from 'react'

interface PersonnelDisputeData {
  disputeType: 'promotion' | 'salary' | 'transfer' | 'assessment' | 'discipline' | 'other'
  employeeType: 'regular' | 'contract' | 'temporary' | 'executive'
  companySize: 'small' | 'medium' | 'large'
  hasInternalPolicy: boolean
  desiredOutcome: 'compensation' | 'reinstatement' | 'apology' | 'policyChange'
}

interface ResolutionPath {
  step: number
  title: string
  description: string
  timeline: string
  complexity: 'low' | 'medium' | 'high'
  effectiveness: number
  risks: string[]
  requiredDocuments: string[]
}

const PersonnelDisputeProcess: React.FC = () => {
  const [data, setData] = useState<PersonnelDisputeData>({
    disputeType: 'promotion',
    employeeType: 'regular',
    companySize: 'medium',
    hasInternalPolicy: true,
    desiredOutcome: 'compensation'
  })

  const [resolutionPaths, setResolutionPaths] = useState<ResolutionPath[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const disputeTypes = [
    { value: 'promotion', label: '晋升争议', icon: '📈' },
    { value: 'salary', label: '薪酬争议', icon: '💰' },
    { value: 'transfer', label: '调岗争议', icon: '🔄' },
    { value: 'assessment', label: '考核争议', icon: '📊' },
    { value: 'discipline', label: '纪律处分争议', icon: '⚖️' },
    { value: 'other', label: '其他人事争议', icon: '❓' }
  ]

  const generateResolutionPaths = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    // 模拟分析过程
    const analysisSteps = [
      '分析争议类型...',
      '评估员工类型影响...',
      '考虑公司规模因素...',
      '制定解决路径...',
      '计算成功率...'
    ]
    
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisProgress((i + 1) * 20)
      await new Promise(resolve => setTimeout(resolve, 400))
    }

    const basePaths: ResolutionPath[] = [
      {
        step: 1,
        title: '内部沟通与协商',
        description: '与直接主管或HR部门进行正式沟通，表达诉求',
        timeline: '1-2周',
        complexity: 'low',
        effectiveness: 60,
        risks: ['关系紧张', '影响职业发展'],
        requiredDocuments: ['工作记录', '绩效评估', '沟通记录']
      }
    ]

    // 详细的分支逻辑 - 根据争议类型、员工类型和公司规模
    if (data.disputeType === 'promotion') {
      if (data.employeeType === 'regular' && data.companySize === 'large') {
        basePaths.push({
          step: 2,
          title: '晋升申诉+HR复核',
          description: '通过正式申诉渠道要求HR部门重新评估晋升决定',
          timeline: '2-4周',
          complexity: 'medium',
          effectiveness: 45,
          risks: ['影响未来晋升机会', '需要充分绩效证据'],
          requiredDocuments: ['绩效评估报告', '工作成果证明', '同事推荐信']
        })
      } else {
        basePaths.push({
          step: 2,
          title: '直接沟通+书面说明',
          description: '与决策者直接沟通，要求书面说明晋升标准',
          timeline: '1-3周',
          complexity: 'low',
          effectiveness: 35,
          risks: ['可能被忽视', '需要良好沟通技巧'],
          requiredDocuments: ['个人简历', '工作职责说明', '晋升标准文件']
        })
      }
    } else if (data.disputeType === 'salary') {
      if (data.hasInternalPolicy) {
        basePaths.push({
          step: 2,
          title: '薪酬制度核查',
          description: '要求HR提供薪酬制度文件，核对薪酬标准',
          timeline: '2-3周',
          complexity: 'medium',
          effectiveness: 70,
          risks: ['需要制度文件支持', '可能引发薪酬调整'],
          requiredDocuments: ['薪酬制度文件', '岗位说明书', '市场薪酬数据']
        })
      } else {
        basePaths.push({
          step: 2,
          title: '市场薪酬对比',
          description: '收集市场薪酬数据，进行合理薪酬诉求',
          timeline: '3-4周',
          complexity: 'medium',
          effectiveness: 50,
          risks: ['缺乏制度支持', '需要充分市场数据'],
          requiredDocuments: ['行业薪酬报告', '岗位市场价值', '个人贡献证明']
        })
      }
    } else if (data.disputeType === 'transfer') {
      if (data.employeeType === 'regular') {
        basePaths.push({
          step: 2,
          title: '调岗合理性评估',
          description: '评估调岗是否合理，是否符合劳动合同约定',
          timeline: '2-4周',
          complexity: 'medium',
          effectiveness: 65,
          risks: ['可能影响工作稳定性', '需要法律知识'],
          requiredDocuments: ['劳动合同', '调岗通知', '岗位职责变化']
        })
      } else {
        basePaths.push({
          step: 2,
          title: '协商调岗条件',
          description: '协商调岗后的薪酬、工作地点等条件',
          timeline: '1-2周',
          complexity: 'low',
          effectiveness: 55,
          risks: ['合同约束力较弱', '协商空间有限'],
          requiredDocuments: ['原合同条款', '新岗位说明', '协商记录']
        })
      }
    } else if (data.disputeType === 'assessment') {
      basePaths.push({
        step: 2,
        title: '绩效评估复核',
        description: '要求重新评估绩效，提供工作成果证据',
        timeline: '2-3周',
        complexity: 'medium',
        effectiveness: 60,
        risks: ['需要充分证据', '可能影响上级关系'],
        requiredDocuments: ['工作成果记录', '客户反馈', '项目完成证明']
      })
    } else if (data.disputeType === 'discipline') {
      basePaths.push({
        step: 2,
        title: '纪律处分申诉',
        description: '对纪律处分提出申诉，要求公正处理',
        timeline: '3-5周',
        complexity: 'high',
        effectiveness: 40,
        risks: ['关系严重紧张', '可能面临解雇风险'],
        requiredDocuments: ['处分决定文件', '行为事实证据', '申诉理由说明']
      })
    }

    // 根据公司规模调整策略
    if (data.companySize === 'large' && data.hasInternalPolicy) {
      basePaths.splice(1, 0, {
        step: 1.5,
        title: '工会或员工代表介入',
        description: '通过工会或员工代表进行集体协商，增加谈判筹码',
        timeline: '1-3周',
        complexity: 'medium',
        effectiveness: 75,
        risks: ['需要集体支持', '可能激化矛盾'],
        requiredDocuments: ['员工联名信', '会议记录', '协商方案']
      })
    }

    // 根据期望结果添加最终路径
    if (data.desiredOutcome === 'compensation' && data.disputeLevel !== 'high') {
      basePaths.push({
        step: basePaths.length + 1,
        title: '经济补偿协商',
        description: '协商经济补偿方案，达成和解协议',
        timeline: '2-4周',
        complexity: 'medium',
        effectiveness: 70,
        risks: ['金额协商困难', '需要专业评估'],
        requiredDocuments: ['损失计算说明', '市场补偿标准', '和解协议草案']
      })
    } else {
      basePaths.push({
        step: basePaths.length + 1,
        title: '法律途径解决',
        description: '通过劳动仲裁或法院诉讼维护权益',
        timeline: '2-6个月',
        complexity: 'high',
        effectiveness: 50,
        risks: ['时间成本高', '经济成本大', '关系破裂'],
        requiredDocuments: ['律师委托书', '证据材料', '法律文书']
      })
    }

    // 重新编号步骤
    const renumberedPaths = basePaths.map((path, index) => ({
      ...path,
      step: index + 1
    }))

    // 最后一步进度
    setAnalysisProgress(100)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setResolutionPaths(renumberedPaths)
    setIsAnalyzing(false)
    setAnalysisProgress(0)
  }

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 70) return 'text-green-600'
    if (effectiveness >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">人事争议解决路径分析</h3>
        <p className="text-gray-600 text-sm">
          针对企业内部人事争议，提供详细的解决路径分析和具体操作指导。
          不同员工类型和公司规模将影响最佳解决策略。
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
                  className="text-purple-600"
                />
                <span className="text-lg">{type.icon}</span>
                <span>{type.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              员工类型
            </label>
            <select
              value={data.employeeType}
              onChange={e => setData({ ...data, employeeType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="regular">正式员工</option>
              <option value="contract">合同制员工</option>
              <option value="temporary">临时员工</option>
              <option value="executive">高管人员</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公司规模
            </label>
            <select
              value={data.companySize}
              onChange={e => setData({ ...data, companySize: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="small">小型企业（1-50人）</option>
              <option value="medium">中型企业（51-500人）</option>
              <option value="large">大型企业（500人以上）</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公司是否有内部人事政策
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={data.hasInternalPolicy}
                  onChange={() => setData({ ...data, hasInternalPolicy: true })}
                  className="mr-2"
                />
                有制度
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!data.hasInternalPolicy}
                  onChange={() => setData({ ...data, hasInternalPolicy: false })}
                  className="mr-2"
                />
                无制度
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              期望解决结果
            </label>
            <select
              value={data.desiredOutcome}
              onChange={e => setData({ ...data, desiredOutcome: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="compensation">经济补偿</option>
              <option value="reinstatement">恢复原职</option>
              <option value="apology">道歉/澄清</option>
              <option value="policyChange">制度改进</option>
            </select>
          </div>
        </div>
      </div>

      {isAnalyzing ? (
        <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-md font-semibold">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>正在分析最佳解决路径...</span>
          </div>
          <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-purple-200 text-center">
            {analysisProgress === 20 && '分析争议类型...'}
            {analysisProgress === 40 && '评估员工类型影响...'}
            {analysisProgress === 60 && '考虑公司规模因素...'}
            {analysisProgress === 80 && '制定解决路径...'}
            {analysisProgress === 100 && '计算成功率...'}
          </div>
        </div>
      ) : (
        <button
          onClick={generateResolutionPaths}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-md hover:from-purple-700 hover:to-pink-700 transition-colors font-semibold"
        >
          🎯 分析解决路径
        </button>
      )}

      {resolutionPaths.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4 text-gray-800">个性化解决路径分析</h4>
          
          <div className="space-y-6">
            {resolutionPaths.map(path => (
              <div key={path.step} className="relative">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {path.step}
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-semibold text-gray-800 text-lg">{path.title}</h5>
                      <div className="flex space-x-3 text-sm">
                        <span className="text-gray-600">⏱️ {path.timeline}</span>
                        <span className={getComplexityColor(path.complexity)}>
                          📊 {path.complexity === 'low' ? '简单' : path.complexity === 'medium' ? '中等' : '复杂'}
                        </span>
                        <span className={getEffectivenessColor(path.effectiveness)}>
                          📈 成功率 {path.effectiveness}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{path.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border">
                        <span className="text-sm font-medium text-gray-700">⚠️ 潜在风险：</span>
                        <ul className="mt-1 space-y-1">
                          {path.risks.map((risk, index) => (
                            <li key={index} className="text-sm text-red-600 flex items-center">
                              <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <span className="text-sm font-medium text-gray-700">📋 所需材料：</span>
                        <ul className="mt-1 space-y-1">
                          {path.requiredDocuments.map((doc, index) => (
                            <li key={index} className="text-sm text-blue-600 flex items-center">
                              <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                {path.step < resolutionPaths.length && (
                  <div className="absolute left-6 top-12 w-0.5 h-6 bg-purple-200 ml-5"></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-md">
            <h5 className="font-semibold text-purple-800 mb-3">🎯 具体行动指南</h5>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-purple-700">📋 立即行动：</span>
                <ul className="mt-1 space-y-1">
                  <li className="text-purple-600">• 收集所有相关文件和证据</li>
                  <li className="text-purple-600">• 记录争议发生的时间线</li>
                  <li className="text-purple-600">• 明确您的具体诉求和目标</li>
                  <li className="text-purple-600">• 准备正式的沟通文件</li>
                </ul>
              </div>
              <div>
                <span className="font-medium text-pink-700">⚠️ 注意事项：</span>
                <ul className="mt-1 space-y-1">
                  <li className="text-pink-600">• 保持专业沟通态度</li>
                  <li className="text-pink-600">• 避免情绪化表达</li>
                  <li className="text-pink-600">• 保留所有沟通记录</li>
                  <li className="text-pink-600">• 考虑职业发展影响</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white p-2 rounded border text-center">
                <div className="font-semibold text-purple-700">预计周期</div>
                <div className="text-lg font-bold text-purple-600">
                  {resolutionPaths.reduce((sum, path) => {
                    const weeks = parseInt(path.timeline) || 0
                    return sum + weeks
                  }, 0)}周
                </div>
              </div>
              <div className="bg-white p-2 rounded border text-center">
                <div className="font-semibold text-purple-700">成功率</div>
                <div className="text-lg font-bold text-green-600">
                  {resolutionPaths.length > 0 ? 
                    Math.round(resolutionPaths.reduce((sum, path) => sum + path.effectiveness, 0) / resolutionPaths.length) + '%' : '计算中...'}
                </div>
              </div>
              <div className="bg-white p-2 rounded border text-center">
                <div className="font-semibold text-purple-700">复杂度</div>
                <div className="text-lg font-bold text-yellow-600">
                  {resolutionPaths.length > 0 ? 
                    resolutionPaths.reduce((sum, path) => {
                      const weight = path.complexity === 'low' ? 1 : path.complexity === 'medium' ? 2 : 3
                      return sum + weight
                    }, 0) / resolutionPaths.length > 2 ? '高' : '中低' : '评估中...'}
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-700">
              💡 <strong>专业建议：</strong> 建议优先尝试{resolutionPaths[0]?.title || '内部沟通'}，成功率较高且风险可控。
              关键成功因素包括证据充分性、沟通技巧和公司制度完善程度。
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-md text-sm text-purple-700">
        <strong>💡 专业提示：</strong>人事争议处理需要平衡个人权益与职场关系。
        建议在采取行动前充分评估风险，优先选择沟通协商等温和方式解决问题。
      </div>
    </div>
  )
}

export default PersonnelDisputeProcess