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

      <!-- main：消息列表 -->
      <el-main class="message-main-container">
        <div>
          <div class="message-content-wrapper">
            <!-- 情况一：消息加载中 -->
            <MessageLoading v-if="activeMessageListLoading" />
            <!-- 情况四：消息列表不为空 -->
            <MessageList
              v-if="!activeMessageListLoading && messageList.length > 0 && activeConversation"
              ref="messageRef"
              :conversation="activeConversation"
              :list="messageList"
              @on-delete-success="handleMessageDelete"
              @on-edit="handleMessageEdit"
              @on-refresh="handleMessageRefresh"
            />
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- 更新对话 Form -->
    <ConversationUpdateForm
      ref="conversationUpdateFormRef"
      @success="handleConversationUpdateSuccess"
    />
  </el-container>
</template>

<script setup name="Chat">
import { deleteChatMessageByConversationId, getChatMessageListByConversationId } from '@/api/ai/chat/message'
import ConversationList from './components/conversation/ConversationList.vue'
import ConversationUpdateForm from './components/conversation/ConversationUpdateForm.vue'
import MessageLoading from './components/message/MessageLoading.vue'
import MessageList from './components/message/MessageList.vue'

const { proxy } = getCurrentInstance()

// 聊天对话
const conversationListRef = ref()
const activeConversationId = ref(null) // 选中的对话编号
const activeConversation = ref(null) // 选中的对话
const conversationInProgress = ref(false) // 对话是否在进行中

// 消息列表
const messageRef = ref()
const activeMessageList = ref([]) // 选中对话的消息列表
const activeMessageListLoading = ref(false) // activeMessageList 是否正在加载中

// 更新对话 Form 引用
const conversationUpdateFormRef = ref()

// 消息列表
const messageList = computed(() => {
  if (activeMessageList.value.length > 0) {
    return activeMessageList.value
  }
  // 没有消息时，如果有 systemMessage 则展示它
  if (activeConversation.value?.systemMessage) {
    return [
      {
        id: 0,
        conversationId: activeConversation.value.id || 0,
        type: 'system',
        userId: '',
        roleId: '',
        model: 0,
        modelId: 0,
        content: activeConversation.value.systemMessage,
        tokens: 0,
        createTime: new Date(),
        roleAvatar: '',
        userAvatar: ''
      }
    ]
  }
  return []
})

/** 获取消息 message 列表 */
const getMessageList = async () => {
  if (activeConversationId.value === null) {
    return
  }
  try {
    // 加载中
    activeMessageListLoading.value = true
    // 获取消息列表
    await getChatMessageListByConversationId(activeConversationId.value)
    .then(response => {
      activeMessageList.value = response.data
    })

    // 滚动到最下面
    await nextTick()
    await scrollToBottom()
  } finally {
    // 加载结束
    activeMessageListLoading.value = false
  }
}

/** 处理聊天对话的创建成功 */
const handleConversationCreateSuccess = () => {

}

/** 处理聊天对话的点击 */
const handleConversationClick = async (conversation) => {
  // 对话进行中，不允许切换
  if (conversationInProgress.value) {
    proxy.$model.alert('对话中，不允许切换!')
    return
  }

  // 更新选中的对话 id
  activeConversationId.value = conversation.id
  activeConversation.value = conversation
  // 刷新 message 列表
  await getMessageList()
  // 滚动底部
  scrollToBottom(true)
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
  messageRef.value.handlerGoTop()
}

/** 处理聊天消息的删除 */
const handleMessageDelete = () => {
  if (conversationInProgress.value) {
    message.alert('回答中，不能删除!')
    return
  }
  // 刷新 message 列表
  getMessageList()
}

/** 编辑 message：设置为 prompt，可以再次编辑 */
const handleMessageEdit = () => {
  // prompt.value = message.content
}

/** 刷新 message：基于指定消息，再次发起对话 */
const handleMessageRefresh = () => {
  // doSendMessage(message.content)
}

/** 滚动到消息列表底部 */
const scrollToBottom = async (isIgnore) => {
  await nextTick()
  if (messageRef.value) {
    messageRef.value.scrollToBottom(isIgnore)
  }
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

  .message-main-container {
    margin: 0;
    padding: 0;
    position: relative;
    height: 100%;
    width: 100%;

    > div {
      .message-content-wrapper {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        overflow-y: hidden;
        padding: 0;
        margin: 0;
      }
    }
  }
}
</style>
