'use client'
import type { FC } from 'react'
import React from 'react'
import Link from 'next/link'
import Header from '@/app/components/header'
import Navigation from '@/app/components/navigation'

const HomePage: FC = () => {
  // 间隔带配置 - 可直观调整这些值
  const spacerConfig = {
    height: '90px', // 间隔带高度，可修改为 '8px', '24px', '32px' 等
    color: 'rgb(100,16,19)', // 间隔带颜色
  }

  const features = [
    {
      title: '智能核心',
      description: 'AI劳动法助手',
      icon: '🤖',
      href: '/ai-chat',
      color: 'from-law-red-500 to-law-red-600',
      features: ['专业法律咨询', '实时问题解答', '个性化建议'],
    },
    {
      title: '劳动法工具箱',
      description: '实用计算工具',
      icon: '🛠️',
      href: '/tools',
      color: 'from-law-orange-500 to-law-orange-600',
      features: ['赔偿计算器', '加班费计算', '年假计算器', '合同生成器'],
    },
    {
      title: '文书模板库',
      description: '标准法律文书',
      icon: '📄',
      href: '/documents',
      color: 'from-purple-500 to-purple-600',
      features: ['辞职信模板', '仲裁申请书', '合同模板', '各类文书'],
    },
    {
      title: '法律知识库',
      description: '法规与案例库',
      icon: '📚',
      href: '/knowledge-base',
      color: 'from-law-blue-500 to-law-blue-600',
      features: ['法律法规查询', '案例参考', '法律条文解读'],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-law-red-50 via-law-orange-50 to-law-blue-50">
      <Header
        title="CoolBrain Labor Law"
        isMobile={false}
        onShowSideBar={() => {}}
        onCreateNewChat={() => {}}
      />

      <Navigation />

      {/* 红色间隔带 - 通过修改spacerConfig.height直观调整粗细 */}
      <div className="w-full" style={{ height: spacerConfig.height, backgroundColor: spacerConfig.color }}></div>

      {/* 首页- 现代化设计 */}
      <div className="relative overflow-hidden">
        {/* 红色背景图片作为底层背景 */}
        <div className="absolute inset-0">
          <img
            src="/red-background.jpg"
            alt="红色背景"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative text-center py-20 px-4 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            CoolBrain-LaborLawhelper
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 leading-relaxed drop-shadow-md">
            专为劳动者打造的法律智能助手
          </h2>

          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed drop-shadow-sm">
            CoolBrain-LaborLawhelperjpeg基于新一代法律大模型，深度融合各种真实业务流程，集AI智能问答、法律计算工具、法规知识库于一体的综合性劳动法服务平台
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai-chat">
              <button className="bg-white text-law-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                🚀 立即体验
              </button>
            </Link>
            <Link href="/tools">
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-law-red-600 transition-all duration-300">
                🔧 探索工具
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 功能展示 - 现代化卡片设计 */}
      <div className="w-full max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-law-red-800 mb-4">核心功能</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            四大核心功能模块，全面提升法律工作效率与准确性
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Link key={index} href={feature.href}>
              <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer h-full flex flex-col border border-gray-100 overflow-hidden">
                {/* 顶部装饰条 */}
                <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>

                <div className="p-8 flex-1 flex flex-col">
                  {/* 图标区域 */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} text-white text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>

                  {/* 标题和描述 */}
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-law-red-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* 功能列表 */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <span className={`w-2 h-2 rounded-full mr-3 bg-gradient-to-r ${feature.color}`}></span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* 按钮 */}
                  <div className="text-center">
                    <button className={`bg-gradient-to-r ${feature.color} text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 w-full group-hover:scale-105`}>
                      开始使用
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 统计数据 - 现代化设计 */}
      <div className="bg-gradient-to-r from-law-red-50 via-law-orange-50 to-law-blue-50 py-16 w-full">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: '1000+', label: '法律咨询案例', color: 'law-red' },
              { number: '10000+', label: '工具使用次数', color: 'law-orange' },
              { number: '100+', label: '法律法规文件', color: 'law-blue' },
              { number: '99.9%', label: '用户满意度', color: 'law-red' },
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className={`text-4xl font-bold ${stat.color === 'law-red' ? 'text-law-red-600' : stat.color === 'law-orange' ? 'text-law-orange-600' : 'text-law-blue-600'} mb-3`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部CTA - 现代化设计 */}
      <div className="bg-gradient-to-r from-law-red-600 via-law-orange-600 to-law-blue-600 text-white py-20 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative w-full max-w-5xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">现在，诚邀您加入CoolBrain-Laborlawhelper体验</h2>
          <p className="text-xl mb-8 text-white/90 mx-auto whitespace-nowrap">
            亲身感受智能法律助手带来的专业升级和效率飞跃，开启更轻松、更精准、更有保障的法律服务之路。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/ai-chat">
              <button className="bg-white text-law-red-600 px-10 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
                💬 开始咨询
              </button>
            </Link>
            <Link href="/tools">
              <button className="border-2 border-white text-white px-10 py-4 rounded-xl font-semibold hover:bg-white hover:text-law-red-600 transition-all duration-300 transform hover:-translate-y-1">
                🛠️ 使用工具
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
