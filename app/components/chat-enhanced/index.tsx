'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'

interface SimpleMessage {
  id: string
  content: string
  isAnswer: boolean
}

interface ConversationSession {
  id: string
  title: string
  messages: SimpleMessage[]
  createdAt: Date
  updatedAt: Date
}

// 简单的Markdown解析器
function parseMarkdown(text: string): JSX.Element[] {
  if (!text) return [];
  
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let currentList: JSX.Element[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  lines.forEach((line, index) => {
    // 处理标题
    if (line.startsWith('### ')) {
      if (inList) {
        elements.push(
          React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        React.createElement('h3', { 
          key: `h3-${index}`, 
          className: 'text-lg font-semibold text-gray-900 mb-2 mt-4' 
        }, parseInlineMarkdown(line.substring(4)))
      );
      return;
    }
    
    if (line.startsWith('## ')) {
      if (inList) {
        elements.push(
          React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        React.createElement('h2', { 
          key: `h2-${index}`, 
          className: 'text-xl font-bold text-gray-900 mb-3 mt-6' 
        }, parseInlineMarkdown(line.substring(3)))
      );
      return;
    }
    
    if (line.startsWith('# ')) {
      if (inList) {
        elements.push(
          React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        React.createElement('h1', { 
          key: `h1-${index}`, 
          className: 'text-2xl font-bold text-gray-900 mb-4 mt-8' 
        }, parseInlineMarkdown(line.substring(2)))
      );
      return;
    }

    // 处理引用
    if (line.startsWith('> ')) {
      if (inList) {
        elements.push(
          React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        React.createElement('blockquote', { 
          key: `quote-${index}`, 
          className: 'border-l-4 border-gray-300 pl-4 py-2 my-2 bg-gray-50 text-gray-600 italic' 
        }, parseInlineMarkdown(line.substring(2)))
      );
      return;
    }

    // 处理无序列表
    if (line.match(/^[\*\-\+] /)) {
      if (!inList) {
        listType = 'ul';
        inList = true;
      }
      currentList.push(
        React.createElement('li', { 
          key: `li-${index}`, 
          className: 'mb-1 text-gray-800' 
        }, parseInlineMarkdown(line.substring(2)))
      );
      return;
    }

    // 处理有序列表
    if (line.match(/^\d+\. /)) {
      if (!inList) {
        listType = 'ol';
        inList = true;
      }
      currentList.push(
        React.createElement('li', { 
          key: `li-${index}`, 
          className: 'mb-1 text-gray-800' 
        }, parseInlineMarkdown(line.substring(line.indexOf('. ') + 2)))
      );
      return;
    }

    // 结束列表
    if (inList && line.trim() === '') {
      elements.push(
        React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
      );
      currentList = [];
      inList = false;
      return;
    }

    // 普通段落
    if (inList) {
      elements.push(
        React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
      );
      currentList = [];
      inList = false;
    }

    if (line.trim() !== '') {
      elements.push(
        React.createElement('p', { 
          key: `p-${index}`, 
          className: 'text-gray-800 mb-2' 
        }, parseInlineMarkdown(line))
      );
    } else {
      elements.push(React.createElement('br', { key: `br-${index}` }));
    }
  });

  // 处理最后的列表
  if (inList && currentList.length > 0) {
    elements.push(
      React.createElement(listType, { key: 'list-final', className: 'ml-4 mb-2' }, currentList)
    );
  }

  return elements;
}

// 处理内联Markdown（加粗、斜体、代码等）
function parseInlineMarkdown(text: string): React.ReactNode {
  // 处理代码块
  let processedText = text;
  const codeBlocks: React.ReactNode[] = [];
  
  // 处理内联代码 `code`
  processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm">$1</code>');
  
  // 处理加粗 **text**
  processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-red-600 font-semibold">$1</strong>');
  
  // 处理斜体 *text*
  processedText = processedText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-gray-600">$1</em>');
  
  // 处理链接 [text](url)
  processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
  
  return React.createElement('span', { 
    dangerouslySetInnerHTML: { __html: processedText } 
  });
}

const EnhancedChatComponent: React.FC = () => {
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SimpleMessage[]>([])
  const [isResponding, setIsResponding] = useState(false)
  const [showQuickResponse, setShowQuickResponse] = useState(true)
  const [error, setError] = useState('')
  const [showSessionPanel, setShowSessionPanel] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 从localStorage加载会话列表
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions')
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions)
        setSessions(parsedSessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        })))
      } catch (e) {
        console.warn('解析会话数据失败:', e)
      }
    }
  }, [])

  // 保存会话列表到localStorage
  const saveSessions = useCallback((updatedSessions: ConversationSession[]) => {
    localStorage.setItem('chatSessions', JSON.stringify(updatedSessions))
    setSessions(updatedSessions)
  }, [])

  // 创建新会话
  const createNewSession = useCallback(() => {
    const newSession: ConversationSession = {
      id: `session_${Date.now()}`,
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    saveSessions([newSession, ...sessions])
    setCurrentSessionId(newSession.id)
    setMessages([])
    setShowQuickResponse(true)
    setShowSessionPanel(false)
  }, [sessions, saveSessions])

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    const updatedSessions = sessions.filter(session => session.id !== sessionId)
    saveSessions(updatedSessions)
    
    // 如果删除的是当前会话，切换到第一个会话或创建新会话
    if (sessionId === currentSessionId) {
      if (updatedSessions.length > 0) {
        const firstSession = updatedSessions[0]
        setCurrentSessionId(firstSession.id)
        setMessages(firstSession.messages)
        setShowQuickResponse(firstSession.messages.length === 0)
      } else {
        setCurrentSessionId(null)
        setMessages([])
        setShowQuickResponse(true)
      }
    }
  }, [sessions, currentSessionId, saveSessions])

  // 清除当前会话的所有消息
  const clearCurrentSession = useCallback(() => {
    if (!currentSessionId) return
    
    const updatedSessions = sessions.map(session => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          messages: [],
          title: '新对话',
          updatedAt: new Date()
        }
      }
      return session
    })
    
    saveSessions(updatedSessions)
    setMessages([])
    setShowQuickResponse(true)
  }, [sessions, currentSessionId, saveSessions])

  // 切换会话
  const switchSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
      setShowQuickResponse(session.messages.length === 0)
      setShowSessionPanel(false)
    }
  }, [sessions])

  // 更新当前会话的消息
  const updateCurrentSession = useCallback((newMessages: SimpleMessage[]) => {
    if (!currentSessionId) return
    
    const updatedSessions = sessions.map(session => {
      if (session.id === currentSessionId) {
        const title = session.messages.length === 0 && newMessages.length > 0 
          ? newMessages[0].content.substring(0, 20) + '...'
          : session.title
        
        return {
          ...session,
          messages: newMessages,
          title: title || '新对话',
          updatedAt: new Date()
        }
      }
      return session
    })
    
    saveSessions(updatedSessions)
  }, [sessions, currentSessionId, saveSessions])

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsResponding(false)
  }, [])

  const handleSend = useCallback(async (content: string) => {
    if (isResponding || !content.trim()) return

    // 如果没有当前会话，创建新会话
    if (!currentSessionId) {
      createNewSession()
      return
    }

    setIsResponding(true)
    setShowQuickResponse(false)
    setError('')

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // 创建用户消息
      const userMessage: SimpleMessage = {
        id: `user_${Date.now()}`,
        content: content.trim(),
        isAnswer: false,
      }
      
      const newMessages = [...messages, userMessage]
      setMessages(newMessages)
      updateCurrentSession(newMessages)

      // 创建空的AI消息
      const aiMessage: SimpleMessage = {
        id: `ai_${Date.now()}`,
        content: '',
        isAnswer: true,
      }
      
      const messagesWithAi = [...newMessages, aiMessage]
      setMessages(messagesWithAi)
      updateCurrentSession(messagesWithAi)
      setIsResponding(true)

      // 发送消息到API
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query: content.trim(),
          response_mode: 'streaming',
          conversation_id: undefined,
          user: 'user_enhanced',
          auto_generate_name: true,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentContent = ''
      let isWorkflowMode = false
      let lastProcessedAnswer = ''

      if (!reader) {
        throw new Error('无法获取响应流')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('流式响应结束')
          break
        }
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.event === 'message' || parsed.event === 'agent_message') {
                if (isWorkflowMode) {
                  console.log('跳过workflow模式下的message事件')
                  continue
                }
                
                if (parsed.answer) {
                  currentContent += parsed.answer
                  const finalMessages = [...messagesWithAi]
                  finalMessages[finalMessages.length - 1].content = currentContent
                  setMessages(finalMessages)
                  updateCurrentSession(finalMessages)
                }
              }
              else if (parsed.event === 'workflow_started') {
                isWorkflowMode = true
                console.log('进入workflow模式')
              }
              else if (parsed.event === 'workflow_finished' && parsed.data?.outputs?.answer) {
                let answer = parsed.data.outputs.answer || ''
                if (answer) {
                  if (!lastProcessedAnswer) {
                    currentContent = answer
                  } else if (answer.length > lastProcessedAnswer.length) {
                    const incrementalContent = answer.substring(lastProcessedAnswer.length)
                    currentContent += incrementalContent
                  }
                  lastProcessedAnswer = answer
                  
                  const finalMessages = [...messagesWithAi]
                  finalMessages[finalMessages.length - 1].content = currentContent
                  setMessages(finalMessages)
                  updateCurrentSession(finalMessages)
                }
              }
            } catch (e) {
              console.warn('解析数据失败:', e)
            }
          }
        }
      }

    } catch (error: any) {
      console.error('发送消息失败:', error)
      if (error.name === 'AbortError') {
        console.log('请求被取消')
      } else {
        setError(error.message || '发送消息失败，请重试')
      }
    } finally {
      setIsResponding(false)
    }
  }, [isResponding, messages, currentSessionId, createNewSession, updateCurrentSession])

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return '今天'
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 - 会话列表 */}
      <div className={`${showSessionPanel ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}>
        <div className="h-full flex flex-col">
          {/* 侧边栏头部 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">对话历史</h2>
              <button
                onClick={() => setShowSessionPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
            
            <button
              onClick={createNewSession}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>➕</span>
              <span>新建对话</span>
            </button>
          </div>

          {/* 会话列表 */}
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无对话历史
              </div>
            ) : (
              <div className="p-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                      currentSessionId === session.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div onClick={() => switchSession(session.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {session.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {session.messages.length} 条消息
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(session.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('确定要删除这个对话吗？')) {
                          deleteSession(session.id)
                        }
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-red-500"
                      title="删除对话"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 侧边栏底部 */}
          <div className="p-4 border-t border-gray-200">
            {currentSessionId && (
              <button
                onClick={() => {
                  if (confirm('确定要清除当前对话的所有消息吗？')) {
                    clearCurrentSession()
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                🧹 清除当前对话
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 聊天主区域 */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* 顶部工具栏 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSessionPanel(!showSessionPanel)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="显示/隐藏对话历史"
            >
              📚
            </button>
            
            <h1 className="text-lg font-semibold text-gray-900">
              专业劳动法AI助手 (增强版)
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {messages.length} 条消息
            </span>
            {currentSessionId && (
              <button
                onClick={clearCurrentSession}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                清空
              </button>
            )}
          </div>
        </div>

        {/* 聊天消息区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showQuickResponse && messages.length === 0 && (
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  专业劳动法AI助手 (增强版)
                </h1>
                <p className="text-gray-600">
                  我是您的专业劳动法助手，支持**格式化输出**和**对话历史管理**
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  💾 所有对话都会自动保存在本地
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('请用Markdown格式解释劳动合同的基本要素')}>
                  <h3 className="font-medium text-gray-900 mb-2">劳动合同咨询</h3>
                  <p className="text-sm text-gray-600">了解劳动合同的**基本要素**和注意事项</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('请用格式化方式说明加班工资的计算方法')}>
                  <h3 className="font-medium text-gray-900 mb-2">工资计算</h3>
                  <p className="text-sm text-gray-600">了解**加班工资**的计算方式</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('请详细说明解除劳动合同的各种情形')}>
                  <h3 className="font-medium text-gray-900 mb-2">解除劳动关系</h3>
                  <p className="text-sm text-gray-600">了解解除劳动合同的**条件**和程序</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('请用列表说明社保缴纳的具体标准')}>
                  <h3 className="font-medium text-gray-900 mb-2">社会保险</h3>
                  <p className="text-sm text-gray-600">了解社保缴纳的**比例和标准**</p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={message.id} className={`flex ${message.isAnswer ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-2xl px-4 py-3 rounded-lg ${
                message.isAnswer 
                  ? 'bg-white border border-gray-200 text-gray-900' 
                  : 'bg-blue-600 text-white'
              }`}>
                {message.isAnswer && (
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">🤖</span>
                    </div>
                    <span className="text-sm text-gray-600">AI助手</span>
                  </div>
                )}
                
                {message.isAnswer ? (
                  <div className="space-y-2">
                    {message.content ? parseMarkdown(message.content) : (
                      <div className="text-gray-500">
                        {isResponding && index === messages.length - 1 ? '正在思考中...' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                )}
                
                {!message.isAnswer && (
                  <div className="flex items-center mt-2 justify-end">
                    <span className="text-xs text-blue-100">用户</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isResponding && (
            <div className="flex justify-start">
              <div className="max-w-2xl px-4 py-3 rounded-lg bg-white border border-gray-200">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs">🤖</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>AI正在思考中...</span>
                    <button
                      onClick={handleStop}
                      className="ml-4 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                    >
                      停止
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const message = formData.get('message') as string
              if (message?.trim()) {
                handleSend(message.trim())
                e.currentTarget.reset()
              }
            }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-end space-x-2">
              <textarea
                name="message"
                placeholder="请输入您的问题... (支持Markdown格式回复，对话会自动保存)"
                disabled={isResponding}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const form = e.currentTarget.form
                    if (form) {
                      const formData = new FormData(form)
                      const message = formData.get('message') as string
                      if (message?.trim()) {
                        handleSend(message.trim())
                        form.reset()
                      }
                    }
                  }
                }}
              />
              <button
                type="submit"
                disabled={isResponding}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isResponding ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
          
          <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>AI回复支持格式化显示：**加粗** *斜体* `代码` 列表 引用等</span>
            <span>💾 对话自动保存</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedChatComponent