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

/**
 * 模型对应的图片分辨率映射
 * showNegativePrompt: 是否显示负向提示词
 */
export const modelSizeMap = {
  'wan2.6-image': {
    sizes: [
      { label: '1280*1280', value: '1280*1280' },
      { label: '1024*1024', value: '1024*1024' },
      { label: '800*1200', value: '800*1200' },
      { label: '1200*800', value: '1200*800' },
      { label: '960*1280', value: '960*1280' },
      { label: '1280*960', value: '1280*960' },
      { label: '720*1280', value: '720*1280' },
      { label: '1280*720', value: '1280*720' },
      { label: '1344*576', value: '1344*576' }
    ],
    showNegativePrompt: false
  },
  'wan2.6-r2v-flash': {
    sizes: [
      { label: '1280*1280', value: '1280*1280' },
      { label: '1104*1472', value: '1104*1472' },
      { label: '1472*1104', value: '1472*1104' },
      { label: '960*1696', value: '960*1696' },
      { label: '1696*960', value: '1696*960' }
    ],
    showNegativePrompt: false
  },
  'qwen-image-plus-2026-01-09': {
    sizes: [
      { label: '1664*928', value: '1664*928' },
      { label: '1472*1140', value: '1472*1140' },
      { label: '1328*1328', value: '1328*1328' },
      { label: '1140*1472', value: '1140*1472' },
      { label: '928*1664', value: '928*1664' }
    ],
    showNegativePrompt: true
  },
  'qwen-image-max': {
    sizes: [
      { label: '1664*928', value: '1664*928' },
      { label: '1472*1140', value: '1472*1140' },
      { label: '1328*1328', value: '1328*1328' },
      { label: '1140*1472', value: '1140*1472' },
      { label: '928*1664', value: '928*1664' }
    ],
    showNegativePrompt: true
  }
}
