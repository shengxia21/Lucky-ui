<template>
  <div class="app-container">
    <el-tabs>
      <el-tab-pane label="对话列表">
        <ChatConversationList />
      </el-tab-pane>
      <el-tab-pane label="消息列表">
        <ChatMessageList />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="ChatManager">
import ChatConversationList from './ChatConversationList.vue'
import ChatMessageList from './ChatMessageList.vue'
</script>
