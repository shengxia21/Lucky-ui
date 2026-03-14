<template>
  <el-container class="window-container">
    <!-- 左侧：对话列表 -->
    <ChatAside />

    <!-- 右侧：对话详情 -->
    <div class="chat-container">
      <!-- header：对话详情头 -->
      <ChatHeader />

      <!-- main：消息列表 -->
      <ChatMain />

      <!-- footer：消息发送区域 -->
      <ChatFooter />
    </div>
  </el-container>
</template>

<script setup name="AiChat">
import ChatAside from './components/aside/ChatAside.vue'
import ChatHeader from './components/header/ChatHeader.vue'
import ChatMain from './components/main/ChatMain.vue'
import ChatFooter from './components/footer/ChatFooter.vue'
</script>

<style lang="scss" scoped>
.window-container {
  height: calc(100vh - 84px);

  .chat-container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
}
</style>
