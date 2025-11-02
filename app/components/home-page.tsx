'use client'
import type { FC } from 'react'
import React from 'react'
import Link from 'next/link'
import Header from '@/app/components/header'
import Navigation from '@/app/components/navigation'

const HomePage: FC = () => {
  const features = [
    {
      title: '智能核心',
      description: 'AI劳动法助手',
      icon: '🤖',
      href: '/ai-chat',
      color: 'from-blue-500 to-blue-600',
      features: ['专业法律咨询', '实时问题解答', '个性化建议']
    },
    {
      title: '劳动法工具箱',
      description: '实用计算工具',
      icon: '🛠️',
      href: '/tools',
      color: 'from-green-500 to-green-600',
      features: ['赔偿计算器', '加班费计算', '年假计算器', '合同生成器']
    },
    {
      title: '法律知识库',
      description: '法规与文书模板',
      icon: '📚',
      href: '/knowledge-base',
      color: 'from-purple-500 to-purple-600',
      features: ['法律法规查询', '文书模板下载', '案例参考']
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header 
        title="AI劳动法助手" 
        isMobile={false}
        onShowSideBar={() => {}}
        onCreateNewChat={() => {}}
      />
      
      <Navigation />
      
      {/* 英雄区域 */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          专业的劳动法咨询平台
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          集AI智能问答、法律计算工具、法规知识库于一体的综合性劳动法服务平台，
          为劳动者和企业提供全方位的法律支持
        </p>
      </div>

      {/* 功能展示 */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link key={index} href={feature.href}>
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                <div className={`p-8 rounded-t-xl bg-gradient-to-r ${feature.color} text-white`}>
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-blue-100">{feature.description}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 text-center">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      开始使用
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 统计数据 */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">1000+</div>
              <div className="text-gray-600">法律咨询案例</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">500+</div>
              <div className="text-gray-600">工具使用次数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">50+</div>
              <div className="text-gray-600">法律法规文件</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">99%</div>
              <div className="text-gray-600">用户满意度</div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">立即体验专业的劳动法服务</h2>
          <p className="text-xl mb-8 text-blue-100">
            无论是个人咨询还是企业需求，我们都能为您提供专业的法律支持
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai-chat">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                开始咨询
              </button>
            </Link>
            <Link href="/tools">
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                使用工具
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage