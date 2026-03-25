<template>
  <div v-if="shouldShowComponent" class="reasoning-component">
    <!-- 推理过程标题栏 -->
    <div class="reasoning-header" @click="toggleExpanded">
      <div class="reasoning-header-title">
        <el-icon :size="16" class="reasoning-header-icon"><ChatDotSquare /></el-icon>
        <span>{{ titleText }}</span>
      </div>
      <el-icon
        :size="14"
        class="reasoning-header-arrow"
        :class="{ 'reasoning-header-arrow-expanded': isExpanded }"
      ><ArrowDown /></el-icon>
    </div>

    <!-- 推理内容区域 -->
    <div v-show="isExpanded" class="reasoning-content">
      <markdown-it
        class="reasoning-markdown"
        :content="props.reasoningContent"
      />
    </div>
  </div>
</template>

<script setup>
import MarkdownIt from '@/components/MarkdownIt/index.vue'

// 定义 props
const props = defineProps({
  reasoningContent: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  }
})

const isExpanded = ref(true) // 默认展开

/** 计算属性：判断是否应该显示组件（有思考内容时，则展示） */
const shouldShowComponent = computed(() => {
  return !(!props.reasoningContent || props.reasoningContent.trim() === '')
})

/** 计算属性：标题文本 */
const titleText = computed(() => {
  const hasReasoningContent = props.reasoningContent && props.reasoningContent.trim() !== ''
  const hasContent = props.content && props.content.trim() !== ''
  if (hasReasoningContent && !hasContent) {
    return '深度思考中'
  }
  return '已深度思考'
})

/** 切换展开/收缩状态 */
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style lang="scss" scoped>
.reasoning-component {
  margin-top: 8px;
  margin-bottom: 12px;

  .reasoning-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px 8px 0 0;
    background: linear-gradient(to right, #eff6ff, #f5f3ff);
    border: 1px solid rgba(209, 213, 219, 0.6);
    border-bottom: 0;
    transition: all 0.2s;

    &:hover {
      background: linear-gradient(to right, #dbeafe, #e0e7ff);
    }

    &-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    &-icon {
      color: #2563eb;
    }

    &-arrow {
      color: #6b7280;
      transition: transform 0.2s;

      &.reasoning-header-arrow-expanded {
        transform: rotate(180deg);
      }
    }
  }

  .reasoning-content {
    padding: 4px 10px;
    background-color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(209, 213, 219, 0.6);
    border-top: 0;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  }

  .reasoning-markdown {
    font-size: 14px;
    line-height: 1.6;
  }
}
</style>