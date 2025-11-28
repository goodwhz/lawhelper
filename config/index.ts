import type { AppInfo } from '@/types/app'
export const APP_ID = '5e18f32a-f037-4eb6-92fc-4fd1bb1b0923'
export const API_KEY = 'app-eNk3GtruKTh2pHmcBk7g6gs4'
export const API_URL = 'https://dify.aipfuture.com/v1'
export const APP_INFO: AppInfo = {
  title: 'CoolBrain-LaborLawhelper',
  description: '专业的劳动法咨询与工具平台，提供智能问答、法律计算器和文书模板服务',
  copyright: '© 2024 CoolBrain-LaborLawhelper',
  privacy_policy: '',
  default_language: 'zh-CN',
  disable_session_same_site: false, // set it to true if you want to embed the chatbot in an iframe
}

export const isShowPrompt = false
export const promptTemplate = '你是一个专业的劳动法助手，请根据用户的问题提供准确的法律咨询。'

export const API_PREFIX = '/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
