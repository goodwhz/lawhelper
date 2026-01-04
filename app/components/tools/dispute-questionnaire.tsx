'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface Question {
  id: string
  type: 'select' | 'input' | 'number'
  label: string
  options?: string[]
  placeholder?: string
  required: boolean
}

interface FormData {
  disputeType: string
  disputeTime: string
  amount: string
  contractType: string
  description: string
  contactMethod: string
}

const DisputeQuestionnaire: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [analysisResult, setAnalysisResult] = useState('')
  const [formData, setFormData] = useState<FormData>({
    disputeType: '',
    disputeTime: '',
    amount: '',
    contractType: '',
    description: '',
    contactMethod: '',
  })

  const questions: Question[] = [
    {
      id: 'disputeType',
      type: 'select',
      label: '您遇到的具体争议类型是什么？',
      options: [
        '工资拖欠',
        '解除劳动合同',
        '加班费争议',
        '就业歧视',
        '社保缴纳问题',
        '工伤待遇',
        '竞业限制',
        '调岗降薪',
        '其他争议',
      ],
      required: true,
    },
    {
      id: 'contractType',
      type: 'select',
      label: '您与用人单位的合同类型是？',
      options: [
        '固定期限劳动合同',
        '无固定期限劳动合同',
        '以完成一定工作任务为期限',
        '没有签订合同',
      ],
      required: true,
    },
    {
      id: 'disputeTime',
      type: 'select',
      label: '争议发生的时间是？',
      options: [
        '1个月内',
        '1-3个月',
        '3-6个月',
        '6个月-1年',
        '1年以上',
      ],
      required: true,
    },
    {
      id: 'amount',
      type: 'select',
      label: '涉及的金额（元）',
      options: [
        '未知',
        '1万元以下',
        '1-5万元',
        '5-10万元',
        '10-30万元',
        '30万元以上',
      ],
      required: true,
    },
    {
      id: 'description',
      type: 'input',
      label: '请详细描述争议的具体情况',
      placeholder: `请详细描述争议发生的经过、关键时间节点和相关细节。

示例（请根据您的实际情况填写）：
• 工资拖欠：公司从2024年10月起拖欠工资，共3个月，拖欠总额5万元。我已多次向财务部门和HR部门催讨，公司以资金紧张为由一直拖延发放。我至今仍在职。

• 加班费争议：公司要求我每周工作6天，每天工作10小时，但从未支付过加班费。我已经保存了近一年的考勤记录和加班审批单。

• 解除合同：公司于2024年11月突然通知我立即离职，理由是"业务调整"。我在公司工作了2年3个月，但公司只给了1个月的经济补偿金。

• 工伤待遇：我在2024年9月因工作受伤，被认定为工伤十级。公司只报销了医疗费，拒绝支付一次性伤残补助金和停工留薪期工资。

• 就业歧视：我在应聘时明确告知公司已怀孕，面试通过并录用，但入职一周后公司以"岗位取消"为由辞退了我。`,
      required: true,
    },
  ]

  const totalSteps = questions.length

  const handleInputChange = (questionId: string, value: string) => {
    setFormData(prev => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    const currentQuestion = questions[currentStep]
    if (currentQuestion.required && !formData[currentQuestion.id as keyof FormData]) {
      console.warn('请填写此项')
      return
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disputeType: formData.disputeType,
          description: `合同类型: ${formData.contractType}\n争议时间: ${formData.disputeTime}\n涉及金额: ${formData.amount || '未提供'}\n具体情况: ${formData.description}`,
        }),
      })

      const data = await response.json()
      if (data.success && data.data?.analysis?.summary) {
        setAnalysisResult(data.data.analysis.summary)
        setShowResult(true)
      } else {
        // AI 未响应或返回空内容
        const fallbackResponse = generateFallbackResponse()
        setAnalysisResult(fallbackResponse)
        setShowResult(true)
      }
    } catch (error) {
      console.error('分析错误:', error)
      // 网络错误或其他异常，使用备用响应
      const fallbackResponse = generateFallbackResponse()
      setAnalysisResult(fallbackResponse)
      setShowResult(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 生成备用响应（当 AI 未响应时）
  const generateFallbackResponse = (): string => {
    const disputeType = formData.disputeType || '劳动争议'
    const contractType = formData.contractType || '未提供'
    const disputeTime = formData.disputeTime || '未提供'
    const amount = formData.amount || '未提供'

    return `## ⚠️ AI 未响应

很抱歉，AI 分析服务暂时无法响应。以下是基于您提供的信息生成的参考分析。

---

## 📋 情况分析

根据您提供的信息，我们对您的劳动争议进行了初步分析：

**争议类型**：${disputeType}
**合同类型**：${contractType}
**争议时间**：${disputeTime}
**涉及金额**：${amount}

---

## ⚖️ 法律分析

### 您的权益

根据《劳动合同法》等相关法律法规，您作为劳动者享有以下基本权益：

1. **获得劳动报酬的权利** - 用人单位必须按时足额支付工资
2. **获得补偿的权利** - 解除劳动合同应依法支付经济补偿
3. **休息休假的权利** - 不得强制加班或变相延长工作时间
4. **社会保险的权利** - 用人单位应依法为劳动者缴纳社保
5. **获得工伤赔偿的权利** - 因工受伤应享受工伤待遇

### 可能的法律风险

${getRiskAnalysis(disputeType)}

---

## ✅ 解决建议

### 第一步：沟通协商（推荐优先尝试）

1. **书面沟通** - 通过邮件或书面形式向用人单位提出您的诉求
2. **保留证据** - 保存沟通记录、工资条、考勤记录等
3. **明确诉求** - 清晰列出您希望解决的问题和要求的补偿
4. **设定时限** - 给予用人单位合理的处理时间（如7个工作日）

### 第二步：劳动监察投诉

如果协商无果，可向当地劳动监察大队投诉：

* **投诉电话**：12333（全国统一劳动保障热线）
* **所需材料**：身份证、劳动合同、工资条、相关证明材料
* **处理时限**：一般为15-60个工作日

### 第三步：劳动仲裁申请

如果投诉仍无法解决，可申请劳动仲裁：

1. **准备材料**：
   - 劳动仲裁申请书
   - 身份证复印件
   - 劳动合同或证明劳动关系的材料
   - 争议相关证据（工资条、考勤记录等）

2. **申请地点**：用人单位所在地或劳动合同履行地的劳动仲裁委员会

3. **仲裁时限**：劳动争议仲裁时效为 **1年**，从知道或应当知道权利被侵害之日起计算

4. **仲裁结果**：
   - 裁决书自作出之日起生效
   - 一方不服可向法院提起诉讼

### 第四步：法院诉讼（最后手段）

如对仲裁结果不服或用人单位不执行仲裁裁决：

* **管辖法院**：基层人民法院
* **诉讼时效**：收到仲裁裁决书之日起 **15日内**
* **证据准备**：尽可能收集所有相关证据

---

## 📊 证据清单

请尽量收集以下证据，这对维权成功至关重要：

### 基础证据
- [ ] 身份证件（身份证、户口本等）
- [ ] 劳动合同或聘用协议
- [ ] 工资条、银行流水
- [ ] 社保缴纳记录

### 争议相关证据
${getEvidenceList(disputeType)}

---

## ⚠️ 重要提示

### 时效提醒
- **劳动仲裁时效**：1年
- **劳动监察投诉**：一般2年内
- **工伤认定**：自事故发生之日起1年内
- **诉讼时效**：收到仲裁裁决后15日内

### 注意事项
1. **保存所有原件** - 重要文件请保留原件
2. **及时行动** - 不要错过法律时效
3. **理性维权** - 通过合法途径解决争议
4. **寻求帮助** - 复杂案件可咨询专业律师

---

**注**：以上分析基于您提供的信息，仅供参考。具体案件建议咨询专业律师或法律援助机构。`
  }

  // 根据争议类型生成具体的风险分析
  const getRiskAnalysis = (type: string): string => {
    const riskMap: Record<string, string> = {
      工资拖欠: '用人单位未按时足额支付工资属于严重违法行为，您有权要求补发工资并可能获得赔偿金（未支付金额的50%-100%）。',
      解除劳动合同: '用人单位违法解除劳动合同需支付2倍赔偿金（即2N）。协商一致解除应支付N或N+1的经济补偿。',
      加班费争议: '不支付加班费是违法的。工作日加班应支付150%工资，休息日200%，法定假日300%。',
      就业歧视: '就业歧视违反《劳动法》和《就业促进法》。您有权要求平等就业机会，并可索赔。',
      社保缴纳问题: '用人单位未依法缴纳社保是违法行为。您有权要求补缴，并可能获得经济补偿。',
      工伤待遇: '工伤待遇包括医疗费、停工留薪期工资、一次性伤残补助金等。用人单位拒绝支付是违法的。',
      竞业限制: '竞业限制必须有补偿。如未支付补偿金，竞业限制协议可能无效。',
      调岗降薪: '用人单位单方面调岗降薪需与劳动者协商一致，否则可能违法。',
    }
    return riskMap[type] || '根据具体情况，用人单位的行为可能侵犯了您的合法权益，需要进一步分析。'
  }

  // 根据争议类型生成证据清单
  const getEvidenceList = (type: string): string => {
    const evidenceMap: Record<string, string> = {
      工资拖欠: `- [ ] 欠薪证明（工资条、银行流水）
- [ ] 催讨记录（微信聊天、邮件、书面通知）
- [ ] 劳动关系证明（工牌、考勤记录）`,
      解除劳动合同: `- [ ] 解除通知书（书面或电子版）
- [ ] 工作年限证明（社保记录、离职证明）
- [ ] 工资标准证明（工资条、银行流水）`,
      加班费争议: `- [ ] 考勤记录（打卡记录、排班表）
- [ ] 加班审批单
- [ ] 工作证明（工作成果、邮件往来）`,
      就业歧视: `- [ ] 招聘沟通记录
- [ ] 录用通知书
- [ ] 解除通知及相关理由
- [ ] 证据证明歧视事实（录音、短信等）`,
      社保缴纳问题: `- [ ] 社保缴费记录
- [ ] 工资基数证明
- [ ] 用人单位未缴费证明`,
      工伤待遇: `- [ ] 工伤认定书
- [ ] 劳动能力鉴定书
- [ ] 医疗费发票
- [ ] 停工留薪期工资条`,
      竞业限制: `- [ ] 竞业限制协议
- [ ] 补偿金支付证明
- [ ] 违约证据（入职新公司证明等）`,
      调岗降薪: `- [ ] 调岗通知书
- [ ] 原岗位说明
- [ ] 工资变动记录
- [ ] 不同意调岗的证据（邮件、书面反对）`,
    }
    return evidenceMap[type] || `- [ ] 相关合同和协议
- [ ] 沟通记录
- [ ] 其他证明材料`
  }

  const handleReset = () => {
    setCurrentStep(0)
    setShowResult(false)
    setAnalysisResult('')
    setFormData({
      disputeType: '',
      disputeTime: '',
      amount: '',
      contractType: '',
      description: '',
      contactMethod: '',
    })
  }

  const currentQuestion = questions[currentStep]

  return (
    <div className="bg-white rounded-lg shadow-md">
      {!showResult
        ? (
          <>
            {/* 进度条 */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  问题 {currentStep + 1} / {totalSteps}
                </span>
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  重新开始
                </button>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* 问题区域 */}
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  {currentQuestion.label}
                  {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {currentQuestion.type === 'select' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {currentQuestion.options?.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleInputChange(currentQuestion.id, option)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          formData[currentQuestion.id as keyof FormData] === option
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'input' && (
                  <textarea
                    value={formData[currentQuestion.id as keyof FormData] as string}
                    onChange={e => handleInputChange(currentQuestion.id, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}

                {currentQuestion.type === 'number' && (
                  <input
                    type="number"
                    value={formData[currentQuestion.id as keyof FormData] as string}
                    onChange={e => handleInputChange(currentQuestion.id, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* 导航按钮 */}
              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    currentStep === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  上一步
                </button>
                <button
                  onClick={handleNext}
                  disabled={isAnalyzing}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isAnalyzing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {isAnalyzing ? '分析中...' : currentStep === totalSteps - 1 ? '提交分析' : '下一步'}
                </button>
              </div>
            </div>
          </>
        )
        : (
          <>
            {/* 结果页面 */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">法律分析报告</h2>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  重新问卷
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* 分析结果 */}
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-ul:text-gray-800 prose-ol:text-gray-800">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{children}</h3>,
                    p: ({ children }) => <p className="text-gray-800 leading-relaxed mb-4">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 text-gray-800 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 text-gray-800 space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-800">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 my-4 bg-blue-50 py-2 pr-4 text-gray-700">{children}</blockquote>,
                    code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm text-gray-800">{children}</code>,
                  }}
                >
                  {analysisResult}
                </ReactMarkdown>
              </div>

              {/* 申诉建议 */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 后续行动建议</h3>
                <ul className="text-blue-700 space-y-2">
                  <li>1. 保存此分析报告作为参考</li>
                  <li>2. 根据建议收集相关证据材料</li>
                  <li>3. 先尝试与用人单位协商解决</li>
                  <li>4. 协商无果可向劳动监察部门投诉</li>
                  <li>5. 必要时申请劳动仲裁</li>
                </ul>
              </div>

              {/* 免责声明 */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ 本分析报告由 AI 生成，仅供参考。具体案件请咨询专业律师或相关法律机构。
                </p>
              </div>
            </div>
          </>
        )}
    </div>
  )
}

export default DisputeQuestionnaire
