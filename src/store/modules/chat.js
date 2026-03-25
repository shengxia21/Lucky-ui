import { getChatMessageListByConversationId, sendChatMessageStream } from '@/api/ai/chat/message'

const useChatStore = defineStore('chat',{
  state: () => ({
    // 对话相关
    activeConversationId: null,
    activeConversation: null,
    conversationInProgress: false,
    conversationInAbortController: null,

    // 消息列表相关
    activeMessageList: [],
    activeMessageListLoading: false,

    // 消息接收相关
    receiveMessageFullText: '',
    receiveMessageDisplayedText: '',
    receiveMessageFullReasoningText: '',
    receiveMessageDisplayedReasoningText: '',

    // 发送消息输入框相关
    prompt: '',
    enableContext: true,
    enableWebSearch: false,
    uploadFiles: [],
    isComposing: false,

    // 消息滚动回调相关
    scrollTopCallback: null,
    scrollBottomCallback: null
  }),
  getters: {
    messageList: (state) => {
      if (state.activeMessageList.length > 0) {
        return state.activeMessageList
      }
      // 没有消息时，如果有 systemMessage 则展示它
      if (state.activeConversation?.systemMessage) {
        return [
          {
            id: 0,
            type: 'system',
            content: state.activeConversation.systemMessage,
            createTime: new Date()
          }
        ]
      }
      return []
    }
  },
  actions: {
    // 设置滚动到顶部回调
    setScrollTopCallback(callback) {
      this.scrollTopCallback = callback
    },
    // 调用滚动到顶部
    scrollToTop() {
      if (this.scrollTopCallback) {
        this.scrollTopCallback()
      }
    },
    // 设置滚动到底部回调
    setScrollBottomCallback(callback) {
      this.scrollBottomCallback = callback
    },
    // 调用滚动到底部
    scrollToBottom(isIgnore = false) {
      if (this.scrollBottomCallback) {
        this.scrollBottomCallback(isIgnore)
      }
    },
    // 设置选中的对话
    setActiveConversation(conversation) {
      this.activeConversationId = conversation?.id || null
      this.activeConversation = conversation || null
    },
    // 清空选中的对话
    clearActiveConversation() {
      this.activeConversationId = null
      this.activeConversation = null
      this.activeMessageList = []
    },
    // 删除消息列表中对应的消息
    deleteMessage(id) {
      const index = this.activeMessageList.findIndex((msg) => msg.id === id)
      if (index !== -1) {
        this.activeMessageList.splice(index, 1)
      }
    },
    // 清空消息列表
    clearMessageList() {
      this.activeMessageList = []
    },
    // 获取消息列表
    async getMessageList() {
      if (this.activeConversationId === null) {
        return
      }
      try {
        this.activeMessageListLoading = true
        const response = await getChatMessageListByConversationId(this.activeConversationId)
        this.activeMessageList = response.data
      } finally {
        this.activeMessageListLoading = false
      }
    },
    // 发送消息
    async sendMessage(content) {
      // 准备附件 URL 数组
      const attachmentUrls = [...this.uploadFiles]
      // 清空输入框和文件列表
      this.prompt = ''
      this.uploadFiles = []

      // 创建 AbortController 实例，以便中止请求
      this.conversationInAbortController = new AbortController()
      // 标记对话进行中
      this.conversationInProgress = true
      // 重置接收消息状态
      this.receiveMessageFullText = ''
      this.receiveMessageDisplayedText = ''
      this.receiveMessageFullReasoningText = ''
      this.receiveMessageDisplayedReasoningText = ''

      // 1.1 先添加两个假数据，等 stream 返回再替换
      this.activeMessageList.push({
        id: -1,
        type: 'user',
        content: content,
        attachmentUrls: attachmentUrls || [],
        createTime: new Date()
      })
      this.activeMessageList.push({
        id: -2,
        type: 'assistant',
        content: '思考中...',
        reasoningContent: '',
        createTime: new Date()
      })
      // 1.2 滚动到最下面
      this.scrollToBottom(true)
      // 1.3 开始动画
      this.startAnimation()

      // 是否是第一个 chunk 消息段
      let isFirstChunk = true
      // 2. 发送 event stream 请求
      await sendChatMessageStream(
        this.activeConversationId,
        content,
        this.enableContext,
        this.enableWebSearch,
        attachmentUrls || [],
        this.conversationInAbortController,
        async (response) => {
          const { code, data, msg } = JSON.parse(response.data)

          // 处理响应
          if (code !== 200) {
            // 将异常信息显示在 assistant 消息中(有些操作可能是用户配置问题导致的)
            this.activeMessageList[this.activeMessageList.length - 1].content = msg
            return
          }

          // 首次返回需要添加一个 message 到页面，后面的都是更新
          if (isFirstChunk) {
            isFirstChunk = false
            const userMessage = this.activeMessageList[this.activeMessageList.length - 2]
            // 替换 user 消息内容
            userMessage.id = data.sendId
            userMessage.content = data.sendContent
            userMessage.createTime = data.sendTime
            // 替换 assistant 消息内容
            const assistantMessage = this.activeMessageList[this.activeMessageList.length - 1]
            assistantMessage.id = data.id
            assistantMessage.content = data.content
            assistantMessage.reasoningContent = data.reasoningContent
            assistantMessage.createTime = data.createTime
          }

          // 处理 reasoningContent
          if (data.reasoningContent) {
            this.receiveMessageFullReasoningText = this.receiveMessageFullReasoningText + data.reasoningContent
          }

          // 处理输出文本内容
          if (data.content) {
            this.receiveMessageFullText = this.receiveMessageFullText + data.content
          }
        },
        (error) => {
          // 异常提示，并停止流式传输(后续修改为回调)
          // proxy.$modal.alert(`对话异常！`)
          this.stopStream()
          // 需要抛出异常，禁止重试
          throw error
        },
        () => {
          // 流式传输完成，标记对话结束
          this.conversationInProgress = false
        }
      )
    },
    // 开始动画
    startAnimation() {
      // 动画更新流式文本
      const animateResponseText = () => {
        // 如果请求已被中止，结束动画
        if (this.conversationInAbortController?.signal.aborted) {
          // 显示所有正常消息剩余文本
          this.receiveMessageDisplayedText = this.receiveMessageFullText
          // 显示所有思考消息剩余文本
          this.receiveMessageDisplayedReasoningText = this.receiveMessageFullReasoningText
          updateLastMessageContent()
          return
        }

        // 思考内容是否渲染完成
        let isReasoningComplete = this.receiveMessageFullReasoningText.length > 0 ? false : true

        // 计算思考消息剩余文本
        const remainingReasoningText = this.receiveMessageFullReasoningText.slice(this.receiveMessageDisplayedReasoningText.length)
        if (remainingReasoningText.length > 0) {
          // 动态计算每次显示的字符数，根据剩余文本长度调整
          const chunkSize = Math.max(1, Math.ceil(remainingReasoningText.length / 60))
          const chunk = remainingReasoningText.slice(0, chunkSize)
          this.receiveMessageDisplayedReasoningText += chunk
          // 更新 message
          updateLastMessageContent()
        } else {
          isReasoningComplete = true
        }

        // 计算正常消息剩余文本
        const remainingText = this.receiveMessageFullText.slice(this.receiveMessageDisplayedText.length)
        // 思考内容渲染完成并且正常消息有剩余文本，进行文本动画更新
        if (isReasoningComplete && remainingText.length > 0) {
          // 动态计算每次显示的字符数，根据剩余文本长度调整
          const chunkSize = Math.max(1, Math.ceil(remainingText.length / 60))
          const chunk = remainingText.slice(0, chunkSize)
          this.receiveMessageDisplayedText += chunk
          // 更新 message
          updateLastMessageContent()
        }

        // 如果对话还在进行中或者还有文本未显示，继续动画
        if (this.conversationInProgress || remainingReasoningText.length > 0 || remainingText.length > 0) {
          requestAnimationFrame(animateResponseText)
        }
      }

      // 更新assistant消息，也就是最后一条消息的内容
      const updateLastMessageContent = () => {
        const lastMessage = this.activeMessageList[this.activeMessageList.length - 1]
        if (lastMessage && lastMessage.type === 'assistant') {
          lastMessage.content = this.receiveMessageDisplayedText
          lastMessage.reasoningContent = this.receiveMessageDisplayedReasoningText
          // 滚动到最下面
          this.scrollToBottom()
        }
      }

      // 开始动画响应文本
      animateResponseText()
    },
    // 停止流式对话
    stopStream() {
      if (this.conversationInAbortController) {
        this.conversationInAbortController.abort()
      }
      this.conversationInProgress = false
    }
  }
})

export default useChatStore
