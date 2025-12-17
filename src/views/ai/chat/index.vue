<template>
  <el-container class="window-container">
    <!-- 左侧：对话列表 -->
    <ConversationList
      :active-id="activeConversationId?.toString() || ''"
      ref="conversationListRef"
      @on-conversation-create="handleConversationCreateSuccess"
      @on-conversation-click="handleConversationClick"
      @on-conversation-clear="handleConversationClear"
      @on-conversation-delete="handlerConversationDelete"
      @on-conversation-updated="handleConversationUpdated"
    />
    <!-- 右侧：对话详情 -->
    <el-container>
      <!-- 对话详情头 -->
      <el-header class="chat-header">
        <div class="chat-header-title">
          {{ activeConversation?.title ? activeConversation?.title : '对话' }}
          <span v-if="activeMessageList.length">({{ activeMessageList.length }})</span>
        </div>
        <div class="chat-header-actions" v-if="activeConversation">
          <el-button type="primary" bg plain size="small" @click="openChatConversationUpdateForm">
            <span v-html="activeConversation?.modelName"></span>
            <el-icon class="chat-header-btn-icon"><Setting /></el-icon>
          </el-button>
          <el-button size="small" class="chat-header-icon-btn" @click="handlerMessageClear">
            <el-icon class="chat-header-icon"><Delete /></el-icon>
          </el-button>
          <el-button size="small" class="chat-header-icon-btn" @click="handleGoTopMessage">
            <el-icon class="chat-header-icon"><Top /></el-icon>
          </el-button>
        </div>
      </el-header>
    </el-container>

    <!-- 更新对话 Form -->
    <ConversationUpdateForm
      ref="conversationUpdateFormRef"
      @success="handleConversationUpdateSuccess"
    />
  </el-container>
</template>

<script setup name="Chat">
import { deleteChatMessageByConversationId } from '@/api/ai/chat/message'
import ConversationList from './components/conversation/ConversationList.vue'
import ConversationUpdateForm from './components/conversation/ConversationUpdateForm.vue'

const { proxy } = getCurrentInstance()

// 聊天对话
const conversationListRef = ref()
const activeConversationId = ref(null) // 选中的对话编号
const activeConversation = ref(null) // 选中的对话
const conversationInProgress = ref(false) // 对话是否在进行中

// 消息列表
const messageRef = ref()
const activeMessageList = ref([]) // 选中对话的消息列表

// 更新对话 Form 引用
const conversationUpdateFormRef = ref()

/** 处理聊天对话的创建成功 */
const handleConversationCreateSuccess = () => {

}

/** 处理聊天对话的点击 */
const handleConversationClick = (conversation) => {
  // 对话进行中，不允许切换
  if (conversationInProgress.value) {
    proxy.$model.alert('对话中，不允许切换!')
    return
  }

  // 更新选中的对话 id
  activeConversationId.value = conversation.id
  activeConversation.value = conversation
}

/** 处理聊天对话的清空 */
const handleConversationClear = () => {
  // 对话进行中，不允许切换
  if (conversationInProgress.value) {
    proxy.$model.alert('对话中，不允许切换!')
    return
  }
  activeConversationId.value = null
  activeConversation.value = null
  activeMessageList.value = []
}

/** 处理聊天对话的删除 */
const handlerConversationDelete = (delConversation) => {
  // 删除的对话如果是当前选中的，那么就重置
  if (activeConversationId.value === delConversation.id) {
    handleConversationClear()
  }
}

/** 处理聊天对话的更新 */
const handleConversationUpdated = (conversation) => {
  // 更新选中的对话
  activeConversationId.value = conversation.id
  activeConversation.value = conversation
}

/** 打开聊天对话更新表单 */
const openChatConversationUpdateForm = () => {
  conversationUpdateFormRef.value.open(activeConversation.value)
}

/** 处理聊天消息的清空 */
const handlerMessageClear = () => {
  if (!activeConversationId.value) {
    return
  }
  // 确认提示
  proxy.$modal.confirm('确认清空对话消息？')
  .then(() => {
    // 清空对话
    deleteChatMessageByConversationId(activeConversationId.value).then(() => {
      // 刷新 message 列表
      activeMessageList.value = []
    })
  }).catch(() => {})
}

/** 处理聊天消息的滚动到顶部 */
const handleGoTopMessage = () => {
  // messageRef.value?.scrollToTop()
}



/** 处理聊天对话更新成功 */
const handleConversationUpdateSuccess = (id) => {
  // 对话更新成功，刷新列表
  conversationListRef.value.refreshConversationList(id)
}
</script>

<style lang="scss" scoped>
.window-container {
  height: calc(100vh - 84px);
}

.chat-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-bg-color-page);
  box-shadow: 0 0 0 0 var(--el-border-color-light);

  &-title {
    font-size: 18px;
    font-weight: bold;
  }

  &-actions {
    width: 300px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;

    .chat-header-btn-icon {
      margin-left: 10px;
    }

    .chat-header-icon-btn {
      padding: 10px;

      .chat-header-icon {
        color: var(--el-text-color-placeholder);
      }
    }
  }
}
</style>
