<template>
  <el-main class="chat-main">
    <div class="chat-content-wrapper">
      <!-- 情况一：消息加载中 -->
      <MessageLoading v-if="chatStore.activeMessageListLoading" />
      <!-- 情况四：消息列表不为空 -->
      <MessageList v-if="!chatStore.activeMessageListLoading && chatStore.messageList.length > 0 && chatStore.activeConversation" />
    </div>
  </el-main>
</template>

<script setup name="ChatMain">
import useChatStore from '@/store/modules/chat'
import MessageLoading from './MessageLoading.vue'
import MessageList from './MessageList.vue'

const chatStore = useChatStore()
</script>

<style lang="scss" scoped>
.chat-main {
  margin: 0;
  padding: 0;
  position: relative;
  height: 100%;
  width: 100%;

  .chat-content-wrapper {
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
</style>
