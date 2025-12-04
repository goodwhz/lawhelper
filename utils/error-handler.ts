/**
 * 错误处理工具类
 */

export interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: boolean
  onRetry?: (attempt: number, error: any) => void
}

/**
 * 带重试机制的网络请求
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 执行结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        break
      }

      // 某些错误不需要重试
      if (shouldNotRetry(error)) {
        break
      }

      // 计算延迟时间
      const retryDelay = backoff ? delay * Math.pow(2, attempt) : delay
      
      // 执行重试回调
      if (onRetry) {
        onRetry(attempt + 1, error)
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  throw lastError
}

/**
 * 判断错误是否不应该重试
 * @param error 错误对象
 * @returns 是否不重试
 */
function shouldNotRetry(error: any): boolean {
  if (!error) return false

  const message = error.message?.toLowerCase() || ''
  const status = error.status

  // 认证错误不应该重试
  if (message.includes('invalid') || 
      message.includes('unauthorized') || 
      message.includes('forbidden') ||
      status === 401 || 
      status === 403) {
    return true
  }

  // 请求格式错误不应该重试
  if (status === 400 || status === 422) {
    return true
  }

  return false
}

/**
 * 获取用户友好的错误消息
 * @param error 错误对象
 * @returns 用户友好的错误消息
 */
export function getErrorMessage(error: any): string {
  if (!error) return '未知错误'

  const message = error.message || ''
  const status = error.status

  // 网络相关错误
  if (message.includes('fetch') || 
      message.includes('network') || 
      message.includes('timeout')) {
    return '网络连接失败，请检查网络后重试'
  }

  // 超时错误
  if (message.includes('超时') || message.includes('timeout')) {
    return '请求超时，请稍后重试'
  }

  // 认证错误
  if (status === 401 || message.includes('invalid') || message.includes('credentials')) {
    return '邮箱或密码错误，请重新输入'
  }

  // 权限错误
  if (status === 403 || message.includes('forbidden')) {
    return '权限不足，无法访问'
  }

  // 服务器错误
  if (status >= 500) {
    return '服务器暂时不可用，请稍后重试'
  }

  // 数据验证错误
  if (status === 400 || status === 422) {
    return '输入信息有误，请检查后重试'
  }

  // 返回原始错误消息
  return message || '操作失败，请重试'
}

/**
 * 错误分类
 */
export enum ErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

/**
 * 获取错误类型
 * @param error 错误对象
 * @returns 错误类型
 */
export function getErrorType(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN

  const message = error.message?.toLowerCase() || ''
  const status = error.status

  if (message.includes('fetch') || message.includes('network')) {
    return ErrorType.NETWORK
  }

  if (message.includes('超时') || message.includes('timeout')) {
    return ErrorType.TIMEOUT
  }

  if (status === 401 || message.includes('invalid') || message.includes('credentials')) {
    return ErrorType.AUTHENTICATION
  }

  if (status === 403 || message.includes('forbidden')) {
    return ErrorType.PERMISSION
  }

  if (status >= 500) {
    return ErrorType.SERVER
  }

  if (status === 400 || status === 422) {
    return ErrorType.VALIDATION
  }

  return ErrorType.UNKNOWN
}