/**
 * 密码验证工具函数
 * 要求密码必须包含大小写字母和数字
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  requirements: {
    length: boolean
    hasLowercase: boolean
    hasUppercase: boolean
    hasNumber: boolean
  }
}

/**
 * 验证密码是否符合要求
 * 要求：
 * - 至少6位字符
 * - 包含至少一个小写字母
 * - 包含至少一个大写字母
 * - 包含至少一个数字
 * 
 * @param password 要验证的密码
 * @returns 验证结果
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  const requirements = {
    length: password.length >= 6,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }

  // 检查长度要求
  if (!requirements.length) {
    errors.push('密码长度至少为6位')
  }

  // 检查小写字母要求
  if (!requirements.hasLowercase) {
    errors.push('密码必须包含至少一个小写字母')
  }

  // 检查大写字母要求
  if (!requirements.hasUppercase) {
    errors.push('密码必须包含至少一个大写字母')
  }

  // 检查数字要求
  if (!requirements.hasNumber) {
    errors.push('密码必须包含至少一个数字')
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
  }
}

/**
 * 获取密码要求描述
 * @returns 密码要求描述数组
 */
export function getPasswordRequirements(): string[] {
  return [
    '密码长度至少为6位',
    '必须包含至少一个小写字母 (a-z)',
    '必须包含至少一个大写字母 (A-Z)',
    '必须包含至少一个数字 (0-9)',
  ]
}

/**
 * 检查密码强度等级
 * @param password 要检查的密码
 * @returns 密码强度等级 (weak, medium, strong)
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  const validation = validatePassword(password)
  
  if (!validation.isValid) {
    return 'weak'
  }

  // 额外的强度检查
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const length = password.length

  if (length >= 8 && hasSpecialChar) {
    return 'strong'
  } else if (length >= 8 || (length >= 6 && hasSpecialChar)) {
    return 'medium'
  } else {
    return 'medium' // 基本要求满足，至少是中等
  }
}

/**
 * 生成密码强度颜色
 * @param strength 密码强度
 * @returns 对应的颜色类名
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'strong':
      return 'text-green-500'
    default:
      return 'text-gray-500'
  }
}

/**
 * 生成密码强度文本
 * @param strength 密码强度
 * @returns 对应的文本描述
 */
export function getPasswordStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return '密码强度：弱'
    case 'medium':
      return '密码强度：中等'
    case 'strong':
      return '密码强度：强'
    default:
      return '密码强度：未知'
  }
}