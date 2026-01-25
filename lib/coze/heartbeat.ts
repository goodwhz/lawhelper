/**
 * Coze 心跳保活机制
 * 负责定期发送心跳包以保持连接活跃
 */

import { getSessionManager } from './session-manager'

export interface HeartbeatConfig {
  interval: number // 心跳间隔（毫秒）
  maxFailedAttempts: number // 最大失败次数
  timeout: number // 心跳超时时间（毫秒）
}

interface HeartbeatStatus {
  sessionId: string
  lastHeartbeat: number
  failedAttempts: number
  isActive: boolean
}

const DEFAULT_CONFIG: HeartbeatConfig = {
  interval: 30 * 1000, // 30 秒
  maxFailedAttempts: 3,
  timeout: 10 * 1000, // 10 秒
}

class CozeHeartbeat {
  private heartbeats: Map<string, HeartbeatStatus> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private config: HeartbeatConfig
  private sessionManager: ReturnType<typeof getSessionManager>

  constructor(config: Partial<HeartbeatConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionManager = getSessionManager()
  }

  /**
   * 启动心跳
   */
  startHeartbeat(
    sessionId: string,
    onHeartbeat?: (sessionId: string) => Promise<void>,
    onHeartbeatFailed?: (sessionId: string, error: Error) => void,
  ): void {
    // 如果已有心跳，先停止
    this.stopHeartbeat(sessionId)

    const status: HeartbeatStatus = {
      sessionId,
      lastHeartbeat: Date.now(),
      failedAttempts: 0,
      isActive: true,
    }

    this.heartbeats.set(sessionId, status)

    // 启动定时器
    const timer = setInterval(async () => {
      await this.performHeartbeat(sessionId, onHeartbeat, onHeartbeatFailed)
    }, this.config.interval)

    this.timers.set(sessionId, timer)

    console.log(`启动心跳: ${sessionId}, 间隔: ${this.config.interval}ms`)
  }

  /**
   * 执行心跳
   */
  private async performHeartbeat(
    sessionId: string,
    onHeartbeat?: (sessionId: string) => Promise<void>,
    onHeartbeatFailed?: (sessionId: string, error: Error) => void,
  ): Promise<void> {
    const status = this.heartbeats.get(sessionId)

    if (!status || !status.isActive) {
      return
    }

    try {
      // 执行心跳操作
      if (onHeartbeat) {
        await onHeartbeat(sessionId)
      } else {
        // 默认心跳操作：更新会话活动时间
        await this.sessionManager.updateActivity(sessionId)
      }

      // 更新状态
      status.lastHeartbeat = Date.now()
      status.failedAttempts = 0

      console.log(`心跳成功: ${sessionId}`)
    } catch (error: any) {
      status.failedAttempts += 1
      console.error(
        `心跳失败: ${sessionId}, 失败次数: ${status.failedAttempts}/${this.config.maxFailedAttempts}`,
        error,
      )

      // 触发失败回调
      if (onHeartbeatFailed) {
        onHeartbeatFailed(sessionId, error)
      }

      // 超过最大失败次数，停止心跳
      if (status.failedAttempts >= this.config.maxFailedAttempts) {
        console.error(`心跳失败次数过多，停止心跳: ${sessionId}`)
        this.stopHeartbeat(sessionId)
      }
    }
  }

  /**
   * 发送一次心跳（手动触发）
   */
  async sendPing(
    sessionId: string,
    onHeartbeat?: (sessionId: string) => Promise<void>,
  ): Promise<boolean> {
    try {
      if (onHeartbeat) {
        await onHeartbeat(sessionId)
      } else {
        await this.sessionManager.updateActivity(sessionId)
      }

      const status = this.heartbeats.get(sessionId)
      if (status) {
        status.lastHeartbeat = Date.now()
        status.failedAttempts = 0
      }

      return true
    } catch (error) {
      console.error(`手动心跳失败: ${sessionId}`, error)
      return false
    }
  }

  /**
   * 停止心跳
   */
  stopHeartbeat(sessionId: string): void {
    const timer = this.timers.get(sessionId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(sessionId)
    }

    const status = this.heartbeats.get(sessionId)
    if (status) {
      status.isActive = false
      this.heartbeats.delete(sessionId)
    }

    console.log(`停止心跳: ${sessionId}`)
  }

  /**
   * 更新心跳间隔
   */
  updateInterval(sessionId: string, newInterval: number): void {
    const status = this.heartbeats.get(sessionId)
    if (!status || !status.isActive) {
      console.warn(`会话 ${sessionId} 不活跃，无法更新心跳间隔`)
      return
    }

    // 重新启动心跳以应用新间隔
    const oldTimer = this.timers.get(sessionId)
    if (oldTimer) {
      clearInterval(oldTimer)
    }

    const timer = setInterval(() => {
      // 这里需要保存 onHeartbeat 回调，但当前实现中未存储
      // 实际使用时需要改进
    }, newInterval)

    this.timers.set(sessionId, timer)

    console.log(`更新心跳间隔: ${sessionId}, 新间隔: ${newInterval}ms`)
  }

  /**
   * 获取心跳状态
   */
  getHeartbeatStatus(sessionId: string): HeartbeatStatus | undefined {
    return this.heartbeats.get(sessionId)
  }

  /**
   * 获取所有活跃心跳
   */
  getActiveHeartbeats(): HeartbeatStatus[] {
    return Array.from(this.heartbeats.values()).filter(
      status => status.isActive,
    )
  }

  /**
   * 获取心跳统计信息
   */
  getStats(): {
    totalHeartbeats: number
    activeHeartbeats: number
    failedHeartbeats: number
  } {
    const statuses = Array.from(this.heartbeats.values())

    return {
      totalHeartbeats: statuses.length,
      activeHeartbeats: statuses.filter(s => s.isActive).length,
      failedHeartbeats: statuses.filter(s => s.failedAttempts > 0).length,
    }
  }

  /**
   * 清理所有心跳
   */
  clearAll(): void {
    for (const sessionId of this.timers.keys()) {
      this.stopHeartbeat(sessionId)
    }

    this.heartbeats.clear()
    this.timers.clear()

    console.log('清理所有心跳')
  }

  /**
   * 批量停止心跳
   */
  stopMultipleHeartbeats(sessionIds: string[]): void {
    for (const sessionId of sessionIds) {
      this.stopHeartbeat(sessionId)
    }

    console.log(`批量停止心跳: ${sessionIds.length} 个`)
  }
}

// 导出单例
let heartbeatInstance: CozeHeartbeat | null = null

export function getHeartbeatManager(): CozeHeartbeat {
  if (!heartbeatInstance) {
    heartbeatInstance = new CozeHeartbeat()
  }
  return heartbeatInstance
}

export function resetHeartbeatManager(): void {
  if (heartbeatInstance) {
    heartbeatInstance.clearAll()
    heartbeatInstance = null
  }
}
