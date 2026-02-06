/**
 * 大模型平台枚举
 */
export const AiPlatformEnum = {
  TONG_YI: 'TongYi', // 阿里
  YI_YAN: 'YiYan', // 百度
  DEEP_SEEK: 'DeepSeek', // DeepSeek
  ZHI_PU: 'ZhiPu', // 智谱 AI
  XING_HUO: 'XingHuo', // 讯飞
  SiliconFlow: 'SiliconFlow', // 硅基流动
  Ollama: 'Ollama', // Ollama
  DouBao: 'DouBao', // 豆包
  HunYuan: 'HunYuan', // 混元
  Moonshot: 'Moonshot', // 月之暗面
}

/**
 * 大模型类型枚举
 */
export const AiModelTypeEnum = {
  CHAT: 1, // 聊天
  IMAGE: 2, // 图像
  VOICE: 3, // 音频
  VIDEO: 4, // 视频
  EMBEDDING: 5, // 向量
  RERANK: 6 // 重排
}

/**
 * AI 图像生成状态的枚举
 */
export const AiImageStatusEnum = {
  IN_PROGRESS: 10, // 进行中
  SUCCESS: 20, // 已完成
  FAIL: 30 // 已失败
}
