'use client'
import type { FC } from 'react'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/header'
import Navigation from '@/app/components/navigation'
import { useProtectedAction } from './auth-guard'

const HomePage: FC = () => {
  const router = useRouter()
  let executeProtectedAction: any = () => {}
  
  try {
    const { executeProtectedAction: protectedAction } = useProtectedAction()
    executeProtectedAction = protectedAction
  } catch (error) {
    console.warn('useProtectedAction not available, using fallback')
    executeProtectedAction = (action: Function) => action()
  }
  const [isVisible, setIsVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setIsVisible(true)

    // 滚动监听效果
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 滚动到指定元素
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 间隔带配置 - 可直观调整这些值
  const spacerConfig = {
    height: '90px', // 间隔带高度，可修改为 '8px', '24px', '32px' 等
    color: 'rgb(100,16,19)', // 间隔带颜色
  }

  const features = [
    {
      title: '智能核心',
      description: 'CoolBrain-LaborLawhelper',
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

  // 详细功能介绍
  const detailedFeatures = [
    {
      title: '智能法律问答',
      description: '基于最新法律大模型，提供精准、专业的法律咨询服务',
      icon: '🤖',
      href: '/ai-chat',
      color: 'law-red',
      benefits: ['7x24小时在线服务', '涵盖劳动法全领域', '个性化解决方案', '实时更新的法律知识'],
      buttonText: '开始智能咨询',
      image: '/ai-chat-preview.jpg',
    },
    {
      title: '专业计算工具',
      description: '一站式劳动法计算平台，解决各类赔偿、工资计算问题',
      icon: '🛠️',
      href: '/tools',
      color: 'law-orange',
      benefits: ['一键计算赔偿金额', '自动生成计算报告', '支持多种计算场景', '实时更新算法'],
      buttonText: '使用计算工具',
      image: '/tools-preview.jpg',
    },
    {
      title: '标准文书模板',
      description: '100+标准法律文书模板，满足各类法律文书需求',
      icon: '📄',
      href: '/documents',
      color: 'purple',
      benefits: ['全品类文书模板', '一键生成功能', '法律合规审核', '支持在线编辑'],
      buttonText: '查看文书模板',
      image: '/documents-preview.jpg',
    },
    {
      title: '法律知识库',
      description: '最全面的法律法规数据库，助力法律学习与研究',
      icon: '📚',
      href: '/knowledge-base',
      color: 'law-blue',
      benefits: ['海量法律条文', '实时更新维护', '智能搜索功能', '案例参考分析'],
      buttonText: '探索知识库',
      image: '/knowledge-preview.jpg',
    },
  ]

  // 用户真实评价
  const testimonials = [
    {
      name: '张先生',
      role: '企业HR',
      avatar: '/avatars/zhang.jpg',
      rating: 5,
      content: '使用CoolBrain处理员工劳动纠纷，原本需要3天的工作现在1小时就能完成，准确率99%以上！',
      date: '2024-11-10',
      tags: ['高效', '准确', '专业'],
    },
    {
      name: '李女士',
      role: '劳动者',
      avatar: '/avatars/li.jpg',
      rating: 5,
      content: '通过平台成功追回被拖欠的工资，文书模板和计算工具太实用了，强烈推荐给所有劳动者！',
      date: '2024-11-08',
      tags: ['实用', '成功维权', '推荐'],
    },
    {
      name: '王律师',
      role: '法律顾问',
      avatar: '/avatars/wang.jpg',
      rating: 5,
      content: '作为法律从业者，这个平台的案例库和知识库对我帮助很大，查询效率提升了5倍以上。',
      date: '2024-11-05',
      tags: ['专业工具', '效率提升', '案例丰富'],
    },
    {
      name: '陈先生',
      role: '创业者',
      avatar: '/avatars/chen.jpg',
      rating: 4,
      content: '初创公司必备，合同模板和劳动法咨询帮我们避免了很多法律风险，物超所值！',
      date: '2024-11-03',
      tags: ['初创必备', '风险防控', '实用'],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
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
            <button 
              onClick={() => executeProtectedAction(() => router.push('/ai-chat'), { requireAuth: true })}
              className="bg-white text-law-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              🚀 立即体验
            </button>
            <button 
              onClick={() => executeProtectedAction(() => router.push('/tools'), { requireAuth: true })}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-law-red-600 transition-all duration-300"
            >
              🔧 探索工具
            </button>
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
            <div 
              key={index} 
              onClick={() => executeProtectedAction(() => router.push(feature.href), { requireAuth: true })}
              className="cursor-pointer"
            >
              <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 h-full flex flex-col border border-gray-100 overflow-hidden">
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
            </div>
          ))}
        </div>
      </div>

      {/* 统计数据 - 带动画效果 */}
      <div className="bg-gradient-to-br from-law-red-50 via-law-orange-50 to-law-blue-50 py-20 w-full">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: '1000+', label: '法律咨询案例', color: 'law-red' },
              { number: '10000+', label: '工具使用次数', color: 'law-orange' },
              { number: '100+', label: '法律法规文件', color: 'law-blue' },
              { number: '99.9%', label: '用户满意度', color: 'law-red' },
            ].map((stat, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`text-4xl font-bold ${
                  stat.color === 'law-red'
                    ? 'text-law-red-600'
                    : stat.color === 'law-orange'
                      ? 'text-law-orange-600'
                      : 'text-law-blue-600'
                } mb-3 animate-pulse`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 详细功能展示 - 高级设计 */}
      <div className="py-20 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-law-red-800 mb-4">核心功能详解</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              每个功能都经过精心设计，为您提供最专业、最便捷的法律服务体验
            </p>
          </div>

          {detailedFeatures.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } items-center gap-12 mb-20 ${
                isVisible ? 'animate-fade-in' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 300}ms` }}
            >
              {/* 图片区域 - 替换为PNG图片 */}
              <div className="lg:w-1/2">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <img
                    src={`/${index + 1}.png`}
                    alt={`${feature.title} 功能展示`}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      // 如果图片加载失败，显示默认的图标背景
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div class="text-6xl">${feature.icon}</div>
                          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                        </div>
                      `
                    }}
                  />
                </div>
              </div>

              {/* 内容区域 */}
              <div className="lg:w-1/2">
                <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${
                  feature.color === 'law-red'
                    ? 'from-law-red-100 to-law-red-200 text-law-red-800'
                    : feature.color === 'law-orange'
                      ? 'from-law-orange-100 to-law-orange-200 text-law-orange-800'
                      : feature.color === 'law-blue'
                        ? 'from-law-blue-100 to-law-blue-200 text-law-blue-800'
                        : 'from-purple-100 to-purple-200 text-purple-800'
                } text-sm font-medium mb-4`}>
                  <span className="mr-2">{feature.icon}</span>
                  {feature.title}
                </div>

                <h3 className="text-3xl font-bold text-gray-900 mb-4">{feature.description}</h3>

                <div className="space-y-3 mb-6">
                  {feature.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        feature.color === 'law-red'
                          ? 'bg-law-red-500'
                          : feature.color === 'law-orange'
                            ? 'bg-law-orange-500'
                            : feature.color === 'law-blue'
                              ? 'bg-law-blue-500'
                              : 'bg-purple-500'
                      }`}></div>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => executeProtectedAction(() => router.push(feature.href), { requireAuth: true })}
                  className={`bg-gradient-to-r ${
                    feature.color === 'law-red'
                      ? 'from-law-red-500 to-law-red-600 hover:from-law-red-600 hover:to-law-red-700'
                      : feature.color === 'law-orange'
                        ? 'from-law-orange-500 to-law-orange-600 hover:from-law-orange-600 hover:to-law-orange-700'
                        : feature.color === 'law-blue'
                          ? 'from-law-blue-500 to-law-blue-600 hover:from-law-blue-600 hover:to-law-blue-700'
                          : 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                  } text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl`}
                >
                  {feature.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 用户真实评价 - 高级设计 */}
      <div className="py-20 bg-gradient-to-br from-law-red-50 via-white to-law-blue-50">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-law-red-800 mb-4">用户真实评价</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              听听真实用户的声音，了解CoolBrain如何帮助他们解决法律问题
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer group ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
                onClick={() => {
                  // 点击评价卡片时的交互效果
                  const element = document.getElementById(`testimonial-${index}`)
                  if (element) {
                    element.classList.add('scale-105')
                    setTimeout(() => {
                      element.classList.remove('scale-105')
                    }, 200)
                  }
                }}
                id={`testimonial-${index}`}
              >
                {/* 用户信息 */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-law-red-200 to-law-red-300 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{testimonial.date}</div>
                  </div>
                </div>

                {/* 评价内容 */}
                <p className="text-gray-700 mb-4 leading-relaxed">"{testimonial.content}"</p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2">
                  {testimonial.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-law-red-100 to-law-red-200 text-law-red-800 text-xs rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* 底部CTA - 现代化设计 */}
      <div className="bg-law-red-600 text-white py-20 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative w-full max-w-5xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">现在，诚邀您加入CoolBrain-Laborlawhelper体验</h2>
          <p className="text-xl mb-8 text-white/90 mx-auto whitespace-nowrap">
            亲身感受智能法律助手带来的专业升级和效率飞跃，开启更轻松、更精准、更有保障的法律服务之路。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => executeProtectedAction(() => router.push('/ai-chat'), { requireAuth: true })}
              className="bg-white text-law-red-600 px-10 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
            >
              💬 开始咨询
            </button>
            <button 
              onClick={() => executeProtectedAction(() => router.push('/tools'), { requireAuth: true })}
              className="border-2 border-white text-white px-10 py-4 rounded-xl font-semibold hover:bg-white hover:text-law-red-600 transition-all duration-300 transform hover:-translate-y-1"
            >
              🛠️ 使用工具
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
