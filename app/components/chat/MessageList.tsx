'use client'
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import MessageBubble from './MessageBubble'
import type { ChatMessage } from './types'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming?: boolean
  onRate?: (messageId: string, rating: 'like' | 'dislike', reason?: string) => Promise<void>
  onRegenerate?: (messageId: string) => Promise<void>
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming = false,
  onRate,
  onRegenerate,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleMessageCount, setVisibleMessageCount] = useState(20)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // 性能优化：延迟加载消息
  const visibleMessages = useMemo(() => {
    return messages.slice(-visibleMessageCount)
  }, [messages, visibleMessageCount])

  // 优化滚动性能
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // 使用requestAnimationFrame确保流畅滚动
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      })
    }
  }, [])

  // 监听消息变化，智能滚动
  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // 只在有新消息或流式响应时滚动
    if (messages.length > 0) {
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom()
      }, isStreaming ? 0 : 50) // 流式响应时立即滚动
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [messages.length, isStreaming, scrollToBottom])

  // 无限滚动：加载更多消息
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const scrollTop = element.scrollTop
    const _scrollHeight = element.scrollHeight
    const _clientHeight = element.clientHeight

    // 当滚动到顶部附近时加载更多消息
    if (scrollTop < 100 && visibleMessageCount < messages.length) {
      const newCount = Math.min(visibleMessageCount + 10, messages.length)
      setVisibleMessageCount(newCount)
      console.log(`📱 延迟加载: ${newCount}/${messages.length} 条消息`)
    }
  }, [visibleMessageCount, messages.length])

  // 当消息数量变化时重置可见消息数量
  useEffect(() => {
    setVisibleMessageCount(Math.min(20, messages.length))
  }, [messages.length])

  // 如果没有消息，显示欢迎界面
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              CoolBrain-LaborLawhelper
            </h2>
            <p className="text-gray-600">
              专业的劳动法智能咨询，24小时为您解答劳动法相关问题
            </p>
          </div>

          {/* 常见问题建议 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-4">您可以这样问我：</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="text-left p-3 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                试用期被辞退有补偿吗？
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                加班费如何计算？
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                年假天数怎么确定？
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                工伤认定流程是什么？
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb #f9fafb' }}
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 显示加载更多提示 */}
        {visibleMessageCount < messages.length && (
          <div className="text-center mb-4">
            <button
              onClick={() => setVisibleMessageCount(Math.min(visibleMessageCount + 10, messages.length))}
              className="text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              加载更多消息 ({visibleMessageCount}/{messages.length})
            </button>
          </div>
        )}

        {/* 渲染可见的消息 */}
        {visibleMessages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRate={onRate}
            onRegenerate={onRegenerate}
            isStreaming={isStreaming && index === visibleMessages.length - 1 && message.role === 'assistant'}
          />
        ))}

        {/* 流式加载状态 */}
        {isStreaming && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                AI
              </div>
              <div className="relative">
                <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm animate-pulse">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList
