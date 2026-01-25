/**
 * Coze 会话管理器
 * 负责创建、维护和清理 Coze Bot 对话会话
 */

import { createClient } from '@supabase/supabase-js'

export interface CozeSession {
  id: string
  userId: string
  conversationId?: string
  lastActivity: number
  messageCount: number
  status: 'active' | 'idle' | 'expired'
}

interface SessionConfig {
  maxIdleTime: number // 最大空闲时间（毫秒）
  maxSessionAge: number // 会话最大生命周期（毫秒）
  heartbeatInterval: number // 心跳间隔（毫秒）
}

const DEFAULT_CONFIG: SessionConfig = {
  maxIdleTime: 30 * 60 * 1000, // 30 分钟
  maxSessionAge: 2 * 60 * 60 * 1000, // 2 小时
  heartbeatInterval: 30 * 1000, // 30 秒
}

class CozeSessionManager {
  private sessions: Map<string, CozeSession> = new Map()
  private config: SessionConfig
  private supabase: any
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map()
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // 初始化 Supabase 客户端（服务器端）
    if (typeof window === 'undefined') {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
    }

    // 启动定期清理任务
    this.startCleanupTask()
  }

  /**
   * 创建新会话
   */
  async createSession(userId: string): Promise<CozeSession> {
    // 检查是否已有活跃会话
    const existingSession = this.findActiveSession(userId)
    if (existingSession) {
      console.log(`用户 ${userId} 已有活跃会话: ${existingSession.id}`)
      return this.updateActivity(existingSession.id)
    }

    const session: CozeSession = {
      id: this.generateSessionId(),
      userId,
      lastActivity: Date.now(),
      messageCount: 0,
      status: 'active',
    }

    this.sessions.set(session.id, session)

    // 保存到 Supabase
    if (this.supabase) {
      try {
        await this.supabase
          .from('coze_sessions')
          .insert({
            id: session.id,
            user_id: userId,
            last_activity: new Date().toISOString(),
            message_count: 0,
            status: 'active',
          })
      } catch (error) {
        console.error('保存会话到数据库失败:', error)
      }
    }

    // 启动心跳
    this.startHeartbeat(session.id)

    console.log(`创建新会话: ${session.id} for user: ${userId}`)
    return session
  }

  /**
   * 获取或创建会话
   */
  async getOrCreateSession(userId: string): Promise<CozeSession> {
    const existingSession = this.findActiveSession(userId)
    if (existingSession) {
      return this.updateActivity(existingSession.id)
    }
    return this.createSession(userId)
  }

  /**
   * 发送消息到会话
   */
  async sendMessage(
    sessionId: string,
    message: string,
  ): Promise<{ success: boolean, conversationId?: string, error?: string }> {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return { success: false, error: '会话不存在' }
    }

    if (session.status !== 'active') {
      return { success: false, error: '会话已过期' }
    }

    // 更新活动时间
    session.lastActivity = Date.now()
    session.messageCount += 1

    // 更新数据库
    if (this.supabase) {
      try {
        await this.supabase
          .from('coze_sessions')
          .update({
            last_activity: new Date().toISOString(),
            message_count: session.messageCount,
          })
          .eq('id', sessionId)
      } catch (error) {
        console.error('更新会话失败:', error)
      }
    }

    return { success: true, conversationId: session.conversationId }
  }

  /**
   * 更新会话活动时间
   */
  async updateActivity(sessionId: string): Promise<CozeSession> {
    const session = this.sessions.get(sessionId)

    if (!session) {
      throw new Error('会话不存在')
    }

    session.lastActivity = Date.now()

    // 更新数据库
    if (this.supabase) {
      try {
        await this.supabase
          .from('coze_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', sessionId)
      } catch (error) {
        console.error('更新会话活动时间失败:', error)
      }
    }

    return session
  }

  /**
   * 查找用户的活跃会话
   */
  private findActiveSession(userId: string): CozeSession | undefined {
    const now = Date.now()

    for (const [id, session] of this.sessions.entries()) {
      if (
        session.userId === userId
        && session.status === 'active'
        && now - session.lastActivity < this.config.maxIdleTime
      ) {
        return session
      }
    }

    return undefined
  }

  /**
   * 启动心跳保活
   */
  private startHeartbeat(sessionId: string): void {
    // 清除旧的心跳定时器
    if (this.heartbeatTimers.has(sessionId)) {
      clearInterval(this.heartbeatTimers.get(sessionId)!)
    }

    const timer = setInterval(async () => {
      await this.sendHeartbeat(sessionId)
    }, this.config.heartbeatInterval)

    this.heartbeatTimers.set(sessionId, timer)
    console.log(`启动心跳: ${sessionId}`)
  }

  /**
   * 发送心跳
   */
  private async sendHeartbeat(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)

    if (!session) {
      this.stopHeartbeat(sessionId)
      return
    }

    const now = Date.now()
    const idleTime = now - session.lastActivity

    // 检查是否空闲超时
    if (idleTime > this.config.maxIdleTime) {
      console.log(`会话 ${sessionId} 空闲超时，标记为过期`)
      await this.expireSession(sessionId)
      return
    }

    // 检查是否超过最大生命周期
    if (now - session.lastActivity > this.config.maxSessionAge) {
      console.log(`会话 ${sessionId} 超过最大生命周期，标记为过期`)
      await this.expireSession(sessionId)
      return
    }

    // 更新活动时间
    session.lastActivity = now

    // 更新数据库
    if (this.supabase) {
      try {
        await this.supabase
          .from('coze_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', sessionId)
      } catch (error) {
        console.error('心跳更新失败:', error)
      }
    }

    console.log(`心跳成功: ${sessionId}`)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(sessionId: string): void {
    const timer = this.heartbeatTimers.get(sessionId)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(sessionId)
      console.log(`停止心跳: ${sessionId}`)
    }
  }

  /**
   * 标记会话为过期
   */
  private async expireSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) { return }

    session.status = 'expired'
    this.stopHeartbeat(sessionId)

    // 更新数据库
    if (this.supabase) {
      try {
        await this.supabase
          .from('coze_sessions')
          .update({ status: 'expired' })
          .eq('id', sessionId)
      } catch (error) {
        console.error('更新会话状态失败:', error)
      }
    }

    // 从内存中移除
    this.sessions.delete(sessionId)
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now()
    const expiredSessions: string[] = []

    for (const [id, session] of this.sessions.entries()) {
      const age = now - session.lastActivity

      if (
        age > this.config.maxIdleTime
        || age > this.config.maxSessionAge
        || session.status === 'expired'
      ) {
        expiredSessions.push(id)
      }
    }

    for (const sessionId of expiredSessions) {
      await this.expireSession(sessionId)
    }

    if (expiredSessions.length > 0) {
      console.log(`清理了 ${expiredSessions.length} 个过期会话`)
    }
  }

  /**
   * 启动定期清理任务
   */
  private startCleanupTask(): void {
    // 每 5 分钟清理一次过期会话
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions()
    }, 5 * 60 * 1000)
  }

  /**
   * 关闭会话
   */
  async closeSession(sessionId: string): Promise<void> {
    this.stopHeartbeat(sessionId)
    const session = this.sessions.get(sessionId)

    if (session) {
      session.status = 'expired'

      // 更新数据库
      if (this.supabase) {
        try {
          await this.supabase
            .from('coze_sessions')
            .update({ status: 'expired' })
            .eq('id', sessionId)
        } catch (error) {
          console.error('关闭会话失败:', error)
        }
      }

      this.sessions.delete(sessionId)
      console.log(`关闭会话: ${sessionId}`)
    }
  }

  /**
   * 获取会话统计信息
   */
  getStats(): {
    totalSessions: number
    activeSessions: number
    idleSessions: number
    expiredSessions: number
  } {
    let activeSessions = 0
    let idleSessions = 0
    let expiredSessions = 0

    for (const session of this.sessions.values()) {
      if (session.status === 'active') {
        const idleTime = Date.now() - session.lastActivity
        if (idleTime < 5 * 60 * 1000) {
          activeSessions++
        } else {
          idleSessions++
        }
      } else {
        expiredSessions++
      }
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      idleSessions,
      expiredSessions,
    }
  }

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * 销毁会话管理器
   */
  destroy(): void {
    // 停止所有心跳
    for (const sessionId of this.heartbeatTimers.keys()) {
      this.stopHeartbeat(sessionId)
    }

    // 清理定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    // 清空会话
    this.sessions.clear()

    console.log('会话管理器已销毁')
  }
}

// 导出单例
let sessionManagerInstance: CozeSessionManager | null = null

export function getSessionManager(): CozeSessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new CozeSessionManager()
  }
  return sessionManagerInstance
}

export function resetSessionManager(): void {
  if (sessionManagerInstance) {
    sessionManagerInstance.destroy()
    sessionManagerInstance = null
  }
}
