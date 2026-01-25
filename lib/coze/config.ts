/**
 * Coze 配置文件
 * 统一管理 Coze 相关的配置常量
 */

export const COZE_CONFIG = {
  // API 配置
  API: {
    DEFAULT_TIMEOUT: 60000, // 60秒
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000, // 2秒
  },

  // 会话配置
  SESSION: {
    MAX_IDLE_TIME: 30 * 60 * 1000, // 30分钟
    MAX_SESSION_AGE: 2 * 60 * 60 * 1000, // 2小时
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5分钟清理一次
  },

  // 心跳配置
  HEARTBEAT: {
    INTERVAL: 30 * 1000, // 30秒
    MAX_FAILED_ATTEMPTS: 3,
    TIMEOUT: 10 * 1000, // 10秒
  },

  // WebSocket 配置
  WEBSOCKET: {
    RECONNECT_DELAY: 3000, // 3秒
    MAX_RECONNECT_ATTEMPTS: 5,
    CONNECTION_TIMEOUT: 10 * 1000, // 10秒
  },

  // 数据库配置
  DATABASE: {
    MESSAGE_HISTORY_LIMIT: 100, // 保留最近100条消息
    MESSAGE_RETENTION_DAYS: 30, // 消息保留30天
    CONNECTION_LOG_RETENTION_DAYS: 7, // 连接日志保留7天
    EXPIRED_SESSION_RETENTION_HOURS: 24, // 过期会话保留24小时
  },
} as const

export type CozeConfig = typeof COZE_CONFIG
