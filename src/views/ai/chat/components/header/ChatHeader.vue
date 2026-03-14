<template>
  <el-header class="chat-header">
    <div class="chat-header-title">
      {{ chatStore.activeConversation?.title ? chatStore.activeConversation?.title : '对话' }}
      <span v-if="chatStore.activeMessageList.length">({{ chatStore.activeMessageList.length }})</span>
    </div>
    <div class="chat-header-actions" v-if="chatStore.activeConversation">
      <el-tooltip content="模型名称" placement="top">
        <el-tag size="small" type="primary" class="chat-header-tag">{{ chatStore.activeConversation?.modelName }}</el-tag>
      </el-tooltip>
      <el-tooltip content="温度参数" placement="top">
        <el-tag size="small" type="success" class="chat-header-tag">温度: {{ chatStore.activeConversation?.temperature }}</el-tag>
      </el-tooltip>
      <el-tooltip content="模型单次回复的最大 Token 数" placement="top">
        <el-tag size="small" type="warning" class="chat-header-tag">Token: {{ chatStore.activeConversation?.maxTokens }}</el-tag>
      </el-tooltip>
      <el-tooltip content="上下文数量" placement="top">
        <el-tag size="small" type="danger" class="chat-header-tag">上下文: {{ chatStore.activeConversation?.maxContexts }}</el-tag>
      </el-tooltip>
      <el-button size="small" class="chat-header-icon-btn" @click="handlerMessageClear">
        <el-icon class="chat-header-icon"><Delete /></el-icon>
      </el-button>
      <el-button size="small" class="chat-header-icon-btn" @click="handleGoTopMessage">
        <el-icon class="chat-header-icon"><Top /></el-icon>
      </el-button>
    </div>
  </el-header>
</template>

<script setup name="ChatHeader">
import useChatStore from '@/store/modules/chat'
import { deleteChatMessageByConversationId } from '@/api/ai/chat/message'
import { Delete, Top } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()
const chatStore = useChatStore()

/** 处理聊天消息的清空 */
const handlerMessageClear = async () => {
  if (!chatStore.activeConversationId) {
    return
  }
  await proxy.$modal.confirm('确认清空对话消息？')
  await deleteChatMessageByConversationId(chatStore.activeConversationId)
  chatStore.clearMessageList()
}

/** 处理聊天消息的滚动到顶部 */
const handleGoTopMessage = () => {
  chatStore.scrollToTop()
}
</script>

<style lang="scss" scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-bg-color-page);

  &-title {
    font-size: 18px;
    font-weight: bold;
  }

  &-actions {
    width: 600px;
    display: flex;
    justify-content: flex-end;

    .chat-header-tag {
      margin-right: 6px;
      padding: 11px;
    }

    .chat-header-icon-btn {
      margin-left: 10px;
      padding: 10px;

      .chat-header-icon {
        color: var(--el-text-color-placeholder);
      }
    }
  }
}
</style>
