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

<script setup name="Chat">
import ChatAside from './components/Aside/index.vue'
import ChatHeader from './components/Header/index.vue'
import ChatMain from './components/Main/index.vue'
import ChatFooter from './components/Footer/index.vue'
import useSettingStore from '@/store/modules/settings'

const settingStore = useSettingStore()

const containerHeight = computed(() => {
  const { tagsView, footerVisible, isFullscreen } = settingStore

  // 全屏状态下的高度
  if (isFullscreen && footerVisible) {
    return 'calc(100vh - 36px)'
  } else if (isFullscreen) {
    return '100vh'
  }

  if (tagsView && footerVisible) {
    return 'calc(100vh - 120px)'
  } else if (!tagsView && footerVisible) {
    return 'calc(100vh - 86px)'
  } else if (tagsView && !footerVisible) {
    return 'calc(100vh - 84px)'
  }
  return 'calc(100vh - 52px)'
})
</script>

<style lang="scss" scoped>
.window-container {
  height: v-bind(containerHeight);

  .chat-container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
}
</style>
