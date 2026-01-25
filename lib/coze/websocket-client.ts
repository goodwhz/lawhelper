/**
 * Coze WebSocket 客户端
 * 提供与 Coze 的 WebSocket 连接和自动重连机制
 */

import { getHeartbeatManager } from './heartbeat'

export interface WebSocketConfig {
  reconnectDelay: number // 重连延迟（毫秒）
  maxReconnectAttempts: number // 最大重连次数
  heartbeatInterval: number // 心跳间隔（毫秒）
  connectionTimeout: number // 连接超时（毫秒）
}

interface WebSocketMessage {
  type: 'message' | 'heartbeat' | 'error' | 'close'
  data?: any
  error?: Error
}

const DEFAULT_CONFIG: WebSocketConfig = {
  reconnectDelay: 3000, // 3 秒
  maxReconnectAttempts: 5,
  heartbeatInterval: 30 * 1000, // 30 秒
  connectionTimeout: 10 * 1000, // 10 秒
}

type MessageHandler = (data: any) => void
type ErrorHandler = (error: Error) => void
type CloseHandler = (event: CloseEvent) => void
type ConnectHandler = () => void

class CozeWebSocketClient {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private connectionTimer: NodeJS.Timeout | null = null
  private isConnected = false
  private isConnecting = false
  private heartbeatManager = getHeartbeatManager()

  // 事件处理器
  private messageHandlers: Set<MessageHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private closeHandlers: Set<CloseHandler> = new Set()
  private connectHandlers: Set<ConnectHandler> = new Set()

  // 待发送消息队列
  private messageQueue: string[] = []

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 连接到 WebSocket 服务器
   */
  async connect(url: string): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      console.log('WebSocket 已连接或正在连接中')
      return
    }

    this.isConnecting = true
    console.log(`连接 WebSocket: ${url}`)

    return new Promise((resolve, reject) => {
      // 连接超时处理
      this.connectionTimer = setTimeout(() => {
        if (!this.isConnected) {
          this.isConnecting = false
          const error = new Error(`连接超时: ${this.config.connectionTimeout}ms`)
          this.handleError(error)
          reject(error)
        }
      }, this.config.connectionTimeout)

      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('WebSocket 连接成功')

          this.isConnected = true
          this.isConnecting = false
          this.reconnectAttempts = 0

          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer)
            this.connectionTimer = null
          }

          // 发送队列中的消息
          this.flushMessageQueue()

          // 启动心跳
          this.startHeartbeat()

          // 触发连接事件
          this.connectHandlers.forEach(handler => handler())

          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket 错误:', error)
          this.handleError(new Error('WebSocket 连接错误'))
        }

        this.ws.onclose = (event) => {
          console.log(`WebSocket 关闭: code=${event.code}, reason=${event.reason}`)

          this.isConnected = false
          this.isConnecting = false

          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer)
            this.connectionTimer = null
          }

          this.stopHeartbeat()

          // 触发关闭事件
          this.closeHandlers.forEach(handler => handler(event))

          // 尝试重连
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect(url)
          }
        }
      } catch (error: any) {
        this.isConnecting = false
        if (this.connectionTimer) {
          clearTimeout(this.connectionTimer)
          this.connectionTimer = null
        }
        this.handleError(error)
        reject(error)
      }
    })
  }

  /**
   * 发送消息
   */
  send(message: string | object): void {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message)

    if (!this.isConnected || !this.ws) {
      console.log('WebSocket 未连接，消息加入队列')
      this.messageQueue.push(messageStr)
      return
    }

    try {
      this.ws.send(messageStr)
      console.log('发送消息:', messageStr.substring(0, 100))
    } catch (error) {
      console.error('发送消息失败:', error)
      this.handleError(error as Error)
    }
  }

  /**
   * 发送消息并等待响应
   */
  async sendAndWait<T = any>(
    message: string | object,
    timeout: number = 30000,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message)

      // 设置超时
      const timeoutTimer = setTimeout(() => {
        const timeoutError = new Error(`响应超时: ${timeout}ms`)
        this.removeMessageHandler(handler)
        reject(timeoutError)
      }, timeout)

      // 一次性消息处理器
      const handler: MessageHandler = (data: any) => {
        clearTimeout(timeoutTimer)
        this.removeMessageHandler(handler)
        resolve(data)
      }

      this.addMessageHandler(handler)
      this.send(messageStr)
    })
  }

  /**
   * 发送队列中的消息
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return
    }

    console.log(`发送队列中的 ${this.messageQueue.length} 条消息`)

    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, this.config.heartbeatInterval)

    console.log('启动心跳，间隔:', this.config.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
      console.log('停止心跳')
    }
  }

  /**
   * 发送心跳
   */
  private sendHeartbeat(): void {
    if (!this.isConnected || !this.ws) {
      return
    }

    const heartbeat = {
      type: 'heartbeat',
      timestamp: Date.now(),
    }

    try {
      this.ws.send(JSON.stringify(heartbeat))
      console.log('发送心跳')
    } catch (error) {
      console.error('发送心跳失败:', error)
      this.handleError(error as Error)
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(url: string): void {
    this.reconnectAttempts++

    if (this.reconnectAttempts > this.config.maxReconnectAttempts) {
      console.error('超过最大重连次数，放弃重连')
      return
    }

    const delay = this.config.reconnectDelay * this.reconnectAttempts
    console.log(`计划重连 (${this.reconnectAttempts}/${this.config.maxReconnectAttempts}), 延迟: ${delay}ms`)

    this.reconnectTimer = setTimeout(() => {
      console.log('开始重连...')
      this.connect(url).catch((error) => {
        console.error('重连失败:', error)
      })
    }, delay)
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const parsed = JSON.parse(data)
      console.log('收到消息:', parsed)

      // 分发消息给所有处理器
      this.messageHandlers.forEach((handler) => {
        try {
          handler(parsed)
        } catch (error) {
          console.error('消息处理器错误:', error)
        }
      })
    } catch (error) {
      // 非JSON消息，直接分发
      console.log('收到原始消息:', data)
      this.messageHandlers.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          console.error('消息处理器错误:', error)
        }
      })
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    console.error('WebSocket 错误:', error)

    this.errorHandlers.forEach((handler) => {
      try {
        handler(error)
      } catch (error) {
        console.error('错误处理器错误:', error)
      }
    })
  }

  /**
   * 添加消息处理器
   */
  addMessageHandler(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.removeMessageHandler(handler)
  }

  /**
   * 移除消息处理器
   */
  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler)
  }

  /**
   * 添加错误处理器
   */
  addErrorHandler(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.removeErrorHandler(handler)
  }

  /**
   * 移除错误处理器
   */
  removeErrorHandler(handler: ErrorHandler): void {
    this.errorHandlers.delete(handler)
  }

  /**
   * 添加关闭处理器
   */
  addCloseHandler(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler)
    return () => this.removeCloseHandler(handler)
  }

  /**
   * 移除关闭处理器
   */
  removeCloseHandler(handler: CloseHandler): void {
    this.closeHandlers.delete(handler)
  }

  /**
   * 添加连接处理器
   */
  addConnectHandler(handler: ConnectHandler): () => void {
    this.connectHandlers.add(handler)
    return () => this.removeConnectHandler(handler)
  }

  /**
   * 移除连接处理器
   */
  removeConnectHandler(handler: ConnectHandler): void {
    this.connectHandlers.delete(handler)
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('主动断开 WebSocket 连接')

    // 停止重连
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    // 停止心跳
    this.stopHeartbeat()

    // 关闭连接
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0

    // 清空消息队列
    this.messageQueue = []
  }

  /**
   * 获取连接状态
   */
  getStatus(): {
    connected: boolean
    connecting: boolean
    reconnectAttempts: number
    queuedMessages: number
  } {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
    }
  }
}

export default CozeWebSocketClient
