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
import ChatAside from './components/Aside/index.vue'
import ChatHeader from './components/Header/index.vue'
import ChatMain from './components/Main/index.vue'
import ChatFooter from './components/Footer/index.vue'
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
