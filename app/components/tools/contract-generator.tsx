'use client'

import React, { useState } from 'react'

interface ContractData {
  employeeName: string
  employeeId: string
  companyName: string
  position: string
  salary: number
  contractStartDate: string
  contractEndDate: string
  probationPeriod: number
}

interface ContractTemplate {
  id: string
  title: string
  category: string
  downloadUrl: string
  description: string
}

const contractTemplates: ContractTemplate[] = [
  {
    id: '1',
    title: '标准劳动合同',
    category: '合同管理',
    downloadUrl: '/api/template/劳动合同模板.doc',
    description: '适用于普通劳动关系的标准劳动合同模板',
  },
  {
    id: '2',
    title: '劳动合同续签申请书',
    category: '合同管理',
    downloadUrl: '/api/template/劳动合同续签申请书.doc',
    description: '劳动合同到期续签申请的标准格式',
  },
  {
    id: '3',
    title: '实习协议',
    category: '合同管理',
    downloadUrl: '/api/template/实习协议.doc',
    description: '适用于在校学生实习的协议模板',
  },
  {
    id: '4',
    title: '兼职劳动合同',
    category: '合同管理',
    downloadUrl: '/api/template/兼职劳动合同.doc',
    description: '适用于兼职人员的劳动合同模板',
  },
]

const ContractGenerator: React.FC = () => {
  const [mode, setMode] = useState<'form' | 'template'>('form')
  const [data, setData] = useState<ContractData>({
    employeeName: '',
    employeeId: '',
    companyName: '',
    position: '',
    salary: 5000,
    contractStartDate: '',
    contractEndDate: '',
    probationPeriod: 3,
  })

  const [generatedContract, setGeneratedContract] = useState<string>('')

  const generateContract = () => {
    const contract = `
劳动合同

甲方（用人单位）：${data.companyName}
地址：___________________________
法定代表人：___________________

乙方（劳动者）：${data.employeeName}
身份证号码：${data.employeeId}
住址：___________________________

根据《中华人民共和国劳动法》、《中华人民共和国劳动合同法》等法律法规，甲乙双方在平等自愿、协商一致的基础上，订立本合同。

第一条 劳动合同期限
本合同期限为 ${data.contractStartDate} 至 ${data.contractEndDate}。
试用期为 ${data.probationPeriod} 个月，自 ${data.contractStartDate} 起计算。

第二条 工作内容和工作地点
1. 乙方同意根据甲方工作需要，担任 ${data.position} 岗位工作。
2. 工作地点：___________________________

第三条 工作时间和休息休假
1. 甲方安排乙方执行标准工时制度。
2. 乙方依法享有法定节假日、婚假、产假、带薪年休假等休假权利。

第四条 劳动报酬
1. 甲方每月 ${data.salary} 元支付乙方工资。
2. 甲方每月15日前发放上月工资，如遇节假日顺延。

第五条 社会保险和福利待遇
甲方依法为乙方缴纳社会保险费，乙方个人缴纳部分由甲方从乙方工资中代扣代缴。

第六条 劳动保护、劳动条件和职业危害防护
甲方为乙方提供符合国家规定的劳动安全卫生条件和必要的劳动防护用品。

第七条 劳动合同的变更、解除、终止
1. 经甲乙双方协商一致，本合同可以变更或解除。
2. 乙方解除本合同，应当提前三十日以书面形式通知甲方。

第八条 劳动争议处理
甲乙双方发生劳动争议，可以协商解决，也可以直接向劳动争议仲裁委员会申请仲裁。

第九条 其他
1. 本合同未尽事宜，按国家和地方有关规定执行。
2. 本合同一式两份，甲乙双方各执一份，具有同等法律效力。

甲方（盖章）：___________________
法定代表人（签字）：___________
日期：___________________________

乙方（签字）：___________________
日期：___________________________
    `.trim()

    setGeneratedContract(contract)
  }

  const downloadContract = () => {
    const element = document.createElement('a')
    const file = new Blob([generatedContract], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `劳动合同_${data.employeeName}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const downloadTemplate = (template: ContractTemplate) => {
    const link = document.createElement('a')
    link.href = template.downloadUrl
    link.download = `${template.title}.doc`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">合同生成器</h3>

      {/* 模式切换 */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('form')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              mode === 'form'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            自定义生成
          </button>
          <button
            onClick={() => setMode('template')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              mode === 'template'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            模板下载
          </button>
        </div>
      </div>

      {mode === 'form'
        ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  员工姓名
                </label>
                <input
                  type="text"
                  value={data.employeeName}
                  onChange={e => setData({ ...data, employeeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入员工姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  身份证号码
                </label>
                <input
                  type="text"
                  value={data.employeeId}
                  onChange={e => setData({ ...data, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入身份证号码"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                公司名称
              </label>
              <input
                type="text"
                value={data.companyName}
                onChange={e => setData({ ...data, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入公司名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                职位
              </label>
              <input
                type="text"
                value={data.position}
                onChange={e => setData({ ...data, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入职位"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                月薪（元）
              </label>
              <input
                type="number"
                value={data.salary}
                onChange={e => setData({ ...data, salary: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  合同开始日期
                </label>
                <input
                  type="date"
                  value={data.contractStartDate}
                  onChange={e => setData({ ...data, contractStartDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  合同结束日期
                </label>
                <input
                  type="date"
                  value={data.contractEndDate}
                  onChange={e => setData({ ...data, contractEndDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                试用期（月）
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={data.probationPeriod}
                onChange={e => setData({ ...data, probationPeriod: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={generateContract}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              生成劳动合同
            </button>

            {generatedContract && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">生成的劳动合同</h4>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">{generatedContract}</pre>
                </div>
                <button
                  onClick={downloadContract}
                  className="mt-2 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  下载合同文本
                </button>
              </div>
            )}
          </div>
        )
        : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {contractTemplates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                      {template.category}
                    </span>
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{template.title}</h4>
                  <p className="text-gray-600 text-sm mb-4 flex-1">{template.description}</p>
                  <div className="mt-auto">
                    <button
                      onClick={() => downloadTemplate(template)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      下载模板
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-2">使用说明</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 点击"下载模板"获取标准格式的合同模板</li>
                <li>• 下载后可根据实际情况修改具体内容</li>
                <li>• 建议在使用前咨询专业法律人士</li>
                <li>• 模板仅供参考，具体内容需根据实际情况调整</li>
              </ul>
            </div>
          </div>
        )}
    </div>
  )
}

export default ContractGenerator
