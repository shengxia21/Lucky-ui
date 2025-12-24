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
      <!-- header：对话详情头 -->
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

      <!-- footer：消息发送区域 -->
      <el-footer class="chat-footer">
        <form class="chat-form">
          <textarea
            class="chat-textarea"
            v-model="prompt"
            @keydown.enter.exact="handleEnter"
            @keydown.shift.enter="handleShiftEnter"
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
            placeholder="问我任何问题...（Shift+Enter 换行，按下 Enter 发送）"
          ></textarea>
          <div class="chat-controls">
            <div class="chat-controls-left">
              <el-switch v-model="enableContext" />
              <span class="context-label">上下文</span>
              <!-- <el-switch v-model="enableWebSearch" />
              <span class="search-label">联网搜索</span> -->
            </div>
            <el-button
              type="primary"
              size="default"
              @click="handleSendByButton"
              :loading="conversationInProgress"
              v-if="conversationInProgress == false"
            >
              {{ conversationInProgress ? '进行中' : '发送' }}
            </el-button>
            <el-button
              type="danger"
              size="default"
              @click="stopStream()"
              v-if="conversationInProgress == true"
            >
              停止
            </el-button>
          </div>
        </form>
      </el-footer>
    </el-container>

    <!-- 更新对话 Form -->
    <ConversationUpdateForm
      ref="conversationUpdateFormRef"
      @success="handleConversationUpdateSuccess"
    />
  </el-container>
</template>

<script setup name="Chat">
import { deleteChatMessageByConversationId, getChatMessageListByConversationId, sendChatMessageStream } from '@/api/ai/chat/message'
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

// 发送消息输入框
const isComposing = ref(false) // 判断用户是否在输入
const conversationInAbortController = ref() // 对话进行中 abort 控制器(控制 stream 对话)
const prompt = ref('')  // 发送消息输入框内容
const enableContext = ref(true) // 是否开启上下文
const enableWebSearch = ref(false) // 是否开启联网搜索
const uploadFiles = ref([]) // 上传的文件 URL 列表
// 接收 Stream 消息
const receiveMessageFullText = ref('')  // 接收 Stream 消息的完整文本
const receiveMessageDisplayedText = ref('') // 接收 Stream 消息的显示文本

// 更新对话 Form 引用
const conversationUpdateFormRef = ref()

// =========== 【对话列表】相关 ===========

/** 处理聊天对话的创建成功 */
const handleConversationCreateSuccess = () => {
  // 创建新的对话，清空输入框
  prompt.value = ''
  // 清空文件列表
  uploadFiles.value = []
}

/** 处理聊天对话的点击 */
const handleConversationClick = async (conversation) => {
  // 对话进行中，不允许切换
  if (conversationInProgress.value) {
    proxy.$modal.alert('对话中，不允许切换!')
    return
  }

  // 更新选中的对话 id
  activeConversationId.value = conversation.id
  activeConversation.value = conversation
  // 刷新 message 列表
  await getMessageList()
  // 滚动底部
  scrollToBottom(true)
  // 清空输入框
  prompt.value = ''
  // 清空文件列表
  uploadFiles.value = []
}

/** 处理聊天对话的清空 */
const handleConversationClear = () => {
  // 对话进行中，不允许切换
  if (conversationInProgress.value) {
    proxy.$modal.alert('对话中，不允许切换!')
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

/** 处理聊天对话更新成功 */
const handleConversationUpdateSuccess = (id) => {
  // 对话更新成功，刷新列表
  conversationListRef.value.refreshConversationList(id)
}

// =========== 【对话详情头】相关 ===========

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

// =========== 【消息列表】相关 ===========

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
  } finally {
    // 加载结束
    activeMessageListLoading.value = false
  }
}

/** 处理聊天消息的删除 */
const handleMessageDelete = () => {
  if (conversationInProgress.value) {
    proxy.$modal.alert('回答中，不能删除!')
    return
  }
  // 刷新 message 列表
  getMessageList()
}

/** 编辑 message：设置为 prompt，可以再次编辑 */
const handleMessageEdit = (message) => {
  prompt.value = message.content
}

/** 刷新 message：基于指定消息，再次发起对话 */
const handleMessageRefresh = (message) => {
  doSendMessage(message.content)
}

// =========== 【发送消息输入框】相关 ===========

/** 处理 Enter 键发送 */
const handleEnter = async (event) => {
  if (isComposing.value || conversationInProgress.value) {
    event.preventDefault()
    return
  }
  
  const content = prompt.value?.trim()
  if (content) {
    event.preventDefault()
    await doSendMessage(content)
  }
}

/** 处理 Shift+Enter 换行 */
const handleShiftEnter = (event) => {
  if (isComposing.value) {
    event.preventDefault()
    return
  }
}

/** 处理来自【发送】按钮的发送消息 */
const handleSendByButton = () => {
  doSendMessage(prompt.value?.trim())
}

/** 执行发送消息操作 */
const doSendMessage = async (content) => {
  // 校验
  if (content.length < 1) {
    proxy.$modal.msgError('发送失败，原因：内容为空！')
    return
  }
  if (activeConversationId.value == null) {
    proxy.$modal.msgError('还没创建对话，不能发送!')
    return
  }

  // 准备附件 URL 数组
  const attachmentUrls = [...uploadFiles.value]

  // 清空输入框和文件列表
  prompt.value = ''
  uploadFiles.value = []

  // 发送消息请求
  await requestMessageStream({
    conversationId: activeConversationId.value,
    content: content,
    attachmentUrls: attachmentUrls
  })
}

/** 发起 stream 流式调用 */
const requestMessageStream = async (userMessage) => {
  // 创建 AbortController 实例，以便中止请求
  conversationInAbortController.value = new AbortController()
  // 标记对话进行中
  conversationInProgress.value = true
  // 设置为空
  receiveMessageFullText.value = ''
  receiveMessageDisplayedText.value = ''

  // 1.1 先添加两个假数据，等 stream 返回再替换
  activeMessageList.value.push({
    id: -1,
    conversationId: activeConversationId.value,
    type: 'user',
    content: userMessage.content,
    attachmentUrls: userMessage.attachmentUrls || [],
    createTime: new Date()
  })
  activeMessageList.value.push({
    id: -2,
    conversationId: activeConversationId.value,
    type: 'assistant',
    content: '思考中...',
    reasoningContent: '',
    createTime: new Date()
  })
  // 1.2 滚动到最下面
  scrollToBottom()
  // 1.3 开始动画
  startAnimation()

  // 2. 发送 event stream 请求
  let isFirstChunk = true // 是否是第一个 chunk 消息段
  await sendChatMessageStream(
    activeConversationId.value,
    userMessage.content,
    enableContext.value,
    enableWebSearch.value,
    userMessage.attachmentUrls || [],
    conversationInAbortController.value,
    async (response) => {
      // 解析响应数据
      const { code, data, msg } = JSON.parse(response.data)
      // 处理响应
      if (code !== 200) {
        proxy.$modal.alert(`对话异常! ${msg}`)
        // 如果未接收到消息，则进行删除
        if (receiveMessageFullText.value === '') {
          activeMessageList.value.pop()
        }
        return
      }

      // 首次返回需要添加一个 message 到页面，后面的都是更新
      if (isFirstChunk) {
        isFirstChunk = false
        // 弹出两个假数据
        activeMessageList.value.pop()
        activeMessageList.value.pop()
        // 更新返回的数据
        activeMessageList.value.push(data.send)
        data.send.attachmentUrls = userMessage.attachmentUrls
        activeMessageList.value.push(data.receive)
      }

      // 处理 reasoningContent
      if (data.receive.reasoningContent) {
        const lastMessage = activeMessageList.value[activeMessageList.value.length - 1]
        lastMessage.reasoningContent = lastMessage.reasoningContent + data.receive.reasoningContent
      }

      // 处理正常内容
      if (data.receive.content !== '') {
        receiveMessageFullText.value = receiveMessageFullText.value + data.receive.content
      }
    },
    (error) => {
      // 异常提示，并停止流
      proxy.$modal.alert(`对话异常！`)
      stopStream()
      // 需要抛出异常，禁止重试
      throw error
    },
    () => {
      // 流式传输完成，标记对话结束
      conversationInProgress.value = false
    }
  )
}

/** 开始动画 */
const startAnimation = () => {
  // 动画更新流式文本
  const animateResponseText = () => {
    // 如果请求已被中止，结束动画
    if (conversationInAbortController.value?.signal.aborted) {
      // 显示所有剩余文本
      receiveMessageDisplayedText.value = receiveMessageFullText.value
      updateLastMessageContent()
      return
    }

    // 计算剩余文本
    const remainingText = receiveMessageFullText.value.slice(receiveMessageDisplayedText.value.length)
    // 如果有剩余文本，进行文本动画更新
    if (remainingText.length > 0) {
      // 动态计算每次显示的字符数，根据剩余文本长度调整
      const chunkSize = Math.max(1, Math.ceil(remainingText.length / 60))
      const chunk = remainingText.slice(0, chunkSize)
      receiveMessageDisplayedText.value += chunk
      // 更新 message
      updateLastMessageContent()
    }

    // 如果对话还在进行中或者还有文本未显示，继续动画
    if (conversationInProgress.value || remainingText.length > 0) {
      requestAnimationFrame(animateResponseText)
    }
  }

  // 更新最后一条消息的内容
  const updateLastMessageContent = () => {
    const lastMessage = activeMessageList.value[activeMessageList.value.length - 1]
    if (lastMessage) {
      lastMessage.content = receiveMessageDisplayedText.value
      // 滚动到最下面
      scrollToBottom()
    }
  }

  // 动画响应文本
  animateResponseText()
}

/** 停止 stream 流式调用 */
const stopStream = () => {
  // 如果 stream 进行中的 message，就需要调用 controller 结束
  if (conversationInAbortController.value) {
    conversationInAbortController.value.abort()
  }
  // 设置为 false
  conversationInProgress.value = false
}

// ============== 【消息滚动】相关 =============

/** 滚动到消息列表底部 */
const scrollToBottom = async (isIgnore) => {
  await nextTick()
  if (messageRef.value) {
    messageRef.value.scrollToBottom(isIgnore)
  }
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

  .chat-footer {
    display: flex;
    flex-direction: column;
    height: auto !important;
    padding: 0 !important;

    .chat-form {
      margin-top: 10px;
      margin-left: 20px;
      margin-right: 20px;
      margin-bottom: 20px;
      padding: 9px 10px;
      display: flex;
      flex-direction: column;
      height: auto;
      border-radius: 10px;
      border: 1px solid var(--el-border-color);

      .chat-textarea {
        height: 80px;
        border: none;
        box-sizing: border-box;
        resize: none;
        padding: 0 2px;
        overflow: auto;
      }

      .chat-textarea:focus {
        outline: none;
      }

      .chat-textarea::placeholder {
        color: #8f8f8f;
      }

      .chat-controls {
        display: flex;
        justify-content: space-between;
        padding-top: 5px;
        padding-bottom: 0;

        .chat-controls-left {
          display: flex;
          align-items: center;

          .context-label {
            margin-left: 5px;
            margin-right: 15px;
            font-size: 14px;
            color: #8f8f8f;
          }

          .search-label {
            margin-left: 5px;
            font-size: 14px;
            color: #8f8f8f;
          }
        }
      }
    }
  }
}
</style>
