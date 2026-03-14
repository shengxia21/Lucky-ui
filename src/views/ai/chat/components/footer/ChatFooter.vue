<template>
  <el-footer class="chat-footer">
    <form class="chat-form">
      <textarea
        class="chat-textarea"
        v-model="chatStore.prompt"
        @keydown.enter.exact="handleEnter"
        @keydown.shift.enter="handleShiftEnter"
        @compositionstart="chatStore.isComposing = true"
        @compositionend="chatStore.isComposing = false"
        placeholder="问我任何问题...（Shift+Enter 换行，按下 Enter 发送）"
      ></textarea>
      <!-- 操作按钮 -->
      <div class="chat-controls">
        <div class="chat-controls-left">
          <el-switch v-model="chatStore.enableContext" />
          <span class="context-label">上下文</span>
        </div>
        <el-button
          type="primary"
          size="default"
          @click="handleSendByButton"
          :loading="chatStore.conversationInProgress"
          v-if="chatStore.conversationInProgress == false"
        >
          {{ chatStore.conversationInProgress ? '进行中' : '发送' }}
        </el-button>
        <el-button
          type="danger"
          size="default"
          @click="handleStop"
          v-if="chatStore.conversationInProgress == true"
        >
          停止
        </el-button>
      </div>
    </form>
  </el-footer>
</template>

<script setup name="ChatFooter">
import useChatStore from '@/store/modules/chat'

const { proxy } = getCurrentInstance()
const chatStore = useChatStore()

/** 处理 Enter 键发送 */
const handleEnter = (event) => {
  if (chatStore.isComposing || chatStore.conversationInProgress) {
    event.preventDefault()
    return
  }

  const content = chatStore.prompt?.trim()
  if (content) {
    event.preventDefault()
    chatStore.sendMessage(content)
  }
}

/** 处理 Shift+Enter 换行 */
const handleShiftEnter = (event) => {
  if (chatStore.isComposing) {
    event.preventDefault()
    return
  }
}

/** 处理发送按钮点击 */
const handleSendByButton = () => {
  const content = chatStore.prompt?.trim()
  if (content.length < 1) {
    proxy.$modal.msgError('发送失败，原因：内容为空！')
    return
  }
  if (chatStore.activeConversationId == null) {
    proxy.$modal.msgError('还没创建对话，不能发送!')
    return
  }
  chatStore.sendMessage(content)
}

/** 处理停止按钮点击 */
const handleStop = () => {
  chatStore.stopStream()
}
</script>

<style lang="scss" scoped>
.chat-footer {
  height: auto !important;
  padding: 0 !important;

  .chat-form {
    margin-top: 10px;
    margin-left: 20px;
    margin-right: 20px;
    margin-bottom: 20px;
    padding: 9px 10px;
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    background-color: var(--el-bg-color);

    .chat-textarea {
      width: 100%;
      height: 60px;
      border: none;
      outline: none;
      resize: none;
      font-size: 15px;
      font-family: inherit;
      background-color: transparent;
    }

    .chat-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .chat-controls-left {
        display: flex;
        align-items: center;

        .context-label {
          margin-left: 8px;
          margin-right: 15px;
          color: var(--el-text-color-regular);
        }

        .search-label {
          margin-left: 8px;
          color: var(--el-text-color-regular);
        }
      }
    }
  }
}
</style>
