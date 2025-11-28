'use client'
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { ChatMessage } from './types'
import { 
  ClipboardDocumentIcon as CopyIcon,
  HandThumbUpIcon as ThumbsUpIcon,
  HandThumbDownIcon as ThumbsDownIcon,
  ArrowPathIcon as RotateCcwIcon,
  EllipsisHorizontalIcon as MoreHorizontalIcon
} from '@heroicons/react/24/outline'

interface MessageBubbleProps {
  message: ChatMessage
  onRate?: (messageId: string, rating: 'like' | 'dislike', reason?: string) => Promise<void>
  onRegenerate?: (messageId: string) => Promise<void>
  isStreaming?: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRate,
  onRegenerate,
  isStreaming = false,
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showFeedbackInput, setShowFeedbackInput] = useState(false)
  const [feedbackReason, setFeedbackReason] = useState('')

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      // 可以添加 toast 提示
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleRate = async (rating: 'like' | 'dislike') => {
    if (rating === 'dislike') {
      setShowFeedbackInput(true)
    } else {
      await onRate?.(message.id, rating)
      setShowActions(false)
    }
  }

  const handleSubmitFeedback = async () => {
    await onRate?.(message.id, 'dislike', feedbackReason)
    setShowFeedbackInput(false)
    setFeedbackReason('')
    setShowActions(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* 头像 */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>

        {/* 消息内容 */}
        <div className={`relative ${
          isUser ? 'items-end' : 'items-start'
        } flex flex-col`}>
          {/* 消息气泡 */}
          <div
            className={`rounded-2xl px-4 py-3 max-w-none ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
            } ${isStreaming && isAssistant ? 'animate-pulse' : ''}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            {/* Markdown 渲染 */}
            {isAssistant ? (
              <ReactMarkdown
                className="prose prose-sm max-w-none break-words"
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg !bg-gray-900 !p-3 text-sm"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={`${className} px-1 py-0.5 bg-gray-100 rounded text-sm`} {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            )}

            {/* 加载状态 */}
            {isStreaming && isAssistant && (
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          {isAssistant && !isStreaming && (
            <div className={`flex items-center gap-1 mt-2 transition-opacity duration-200 ${
              showActions ? 'opacity-100' : 'opacity-0'
            }`}>
              {/* 复制按钮 */}
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="复制"
              >
                <CopyIcon className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {/* 点赞按钮 */}
              <button
                onClick={() => handleRate('like')}
                className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors ${
                  message.feedback?.rating === 'like' ? 'text-blue-600' : 'text-gray-500'
                }`}
                title="点赞"
              >
                <ThumbsUpIcon className="w-3.5 h-3.5" />
              </button>

              {/* 点踩按钮 */}
              <button
                onClick={() => handleRate('dislike')}
                className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors ${
                  message.feedback?.rating === 'dislike' ? 'text-red-600' : 'text-gray-500'
                }`}
                title="点踩"
              >
                <ThumbsDownIcon className="w-3.5 h-3.5" />
              </button>

              {/* 重新生成按钮 */}
              <button
                onClick={() => onRegenerate?.(message.id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="重新生成"
              >
                <RotateCcwIcon className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          )}

          {/* 反馈输入框 */}
          {showFeedbackInput && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">请告诉我们原因：</p>
              <textarea
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={3}
                placeholder="您的反馈对我们很重要..."
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSubmitFeedback}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  提交
                </button>
                <button
                  onClick={() => {
                    setShowFeedbackInput(false)
                    setFeedbackReason('')
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 时间戳 */}
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble