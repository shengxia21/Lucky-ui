<template>
  <div ref="messageContainer" class="message-list-container">
    <div class="message-item-wrapper" v-for="(item, index) in chatStore.messageList" :key="index">
      <!-- 靠左 message：system、assistant 类型 -->
      <div class="message-left-container" v-if="item.type !== 'user'">
        <div class="message-avatar">
          <el-avatar :src="roleAvatar" />
        </div>
        <div class="message-content-left">
          <div>
            <el-text class="message-time">{{ parseTime(item.createTime) }}</el-text>
          </div>
          <div class="message-bubble-left" ref="markdownViewRef">
            <MessageReasoning
              :reasoning-content="item.reasoningContent || ''"
              :content="item.content || ''"
            />
            <MarkdownView :content="item.content" />
          </div>
          <div class="message-actions-left">
            <el-button
              class="message-action-btn"
              link
              v-copyText="item.content"
              v-copyText:callback="copyTextSuccess"
            >
              <img class="message-action-icon" src="@/assets/images/ai/copy.svg" />
            </el-button>
            <el-button
              v-if="item.id > 0"
              class="message-action-btn"
              link
              @click="onDelete(item.id)"
            >
              <img class="message-action-icon" src="@/assets/images/ai/delete.svg" />
            </el-button>
          </div>
        </div>
      </div>
      <!-- 靠右 message：user 类型 -->
      <div class="message-right-container" v-if="item.type === 'user'">
        <div class="message-avatar">
          <el-avatar :src="userAvatar" />
        </div>
        <div class="message-content-right">
          <div>
            <el-text class="message-time">{{ parseTime(item.createTime) }}</el-text>
          </div>
          <!-- 文本内容行 -->
          <div class="message-text-right">
            <div v-if="item.content && item.content.trim()" class="message-user-bubble">
              {{ item.content }}
            </div>
          </div>
          <div class="message-actions-right">
            <el-button
              class="message-action-btn"
              link
              v-copyText="item.content"
              v-copyText:callback="copyTextSuccess"
            >
              <img class="message-action-icon" src="@/assets/images/ai/copy.svg" />
            </el-button>
            <el-button
              class="message-action-btn"
              link
              @click="onDelete(item.id)"
            >
              <img class="message-action-icon" src="@/assets/images/ai/delete.svg" />
            </el-button>
            <el-button
              class="message-action-btn"
              link
              @click="onRefresh(item.content)"
            >
              <el-icon size="17"><RefreshRight /></el-icon>
            </el-button>
            <el-button
              class="message-action-btn"
              link
              @click="onEdit(item.content)"
            >
              <el-icon size="17"><Edit /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 回到底部 -->
  <div v-if="isScrolling" class="scroll-to-bottom" @click="handleGoBottom">
    <el-button :icon="ArrowDownBold" circle />
  </div>
</template>

<script setup name="MessageList">
import MarkdownView from '@/components/MarkdownView/index.vue'
import MessageReasoning from './MessageReasoning.vue'
import { deleteChatMessage } from '@/api/ai/chat/message'
import useUserStore from '@/store/modules/user'
import useChatStore from '@/store/modules/chat'
import userAvatarDefaultImg from '@/assets/images/profile.jpg'
import roleAvatarDefaultImg from '@/assets/images/ai/gpt.svg'
import { ArrowDownBold } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()

const userStore = useUserStore()
const chatStore = useChatStore()

// 判断"消息列表"滚动的位置(用于判断是否需要滚动到消息最下方)
const messageContainer = ref(null)
const isScrolling = ref(false) //用于判断用户是否在滚动

const userAvatar = computed(() => userStore.avatar || userAvatarDefaultImg)
const roleAvatar = computed(() => chatStore.activeConversation?.roleAvatar || roleAvatarDefaultImg)

// ============ 处理对话滚动 ==============

/** 回到顶部 */
const handlerGoTop = () => {
  const scrollContainer = messageContainer.value
  scrollContainer.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/** 回到底部 */
const handleGoBottom = () => {
  const scrollContainer = messageContainer.value
  scrollContainer.scrollTo({
    top: scrollContainer.scrollHeight,
    behavior: 'smooth'
  });
}

/** 直接到底部(无动画效果，在pinia中调用) */
const scrollToBottom = async (isIgnore) => {
  // 注意要使用 nextTick 以免获取不到 dom
  await nextTick()
  if (isIgnore || !isScrolling.value) {
    messageContainer.value.scrollTop =
      messageContainer.value.scrollHeight - messageContainer.value.offsetHeight
  }
}

// 文本消息渲染时的滚动事件监听
const handleScroll = () => {
  const scrollContainer = messageContainer.value
  const scrollTop = scrollContainer.scrollTop
  const scrollHeight = scrollContainer.scrollHeight
  const offsetHeight = scrollContainer.offsetHeight
  if (scrollTop + offsetHeight < scrollHeight - 10) {
    // 用户开始滚动并在最底部之上，取消保持在最底部的效果
    isScrolling.value = true
  } else {
    // 用户停止滚动并滚动到最底部，开启保持到最底部的效果
    isScrolling.value = false
  }
}

// ============ 处理消息操作 ==============

/** 复制 */
const copyTextSuccess = () => {
  proxy.$modal.msgSuccess('复制成功！')
}

/** 删除 */
const onDelete = (id) => {
  if (chatStore.conversationInProgress) {
    proxy.$modal.alert('回答中，不能删除!')
    return
  }
  deleteChatMessage(id).then(() => {
    proxy.$modal.msgSuccess('删除成功！')
    chatStore.getMessageList()
  })
}

/** 刷新 */
const onRefresh = (content) => {
  chatStore.sendMessage(content)
}

/** 编辑 */
const onEdit = (content) => {
  chatStore.prompt = content
}

/** 初始化 */
onMounted(() => {
  messageContainer.value.addEventListener('scroll', handleScroll)
  chatStore.setScrollTopCallback(() => handlerGoTop())
  chatStore.setScrollBottomCallback((isIgnore) => scrollToBottom(isIgnore))
})
</script>

<style lang="scss" scoped>
.message-list-container {
  height: 100%;
  overflow-y: auto;
  
  .message-item-wrapper {
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    padding: 0 20px;
  }
  
  .message-left-container {
    display: flex;
    flex-direction: row;
    margin-top: 50px;
    
    .message-avatar {
      flex-shrink: 0;
    }
    
    .message-content-left {
      display: flex;
      flex-direction: column;
      text-align: left;
      margin: 0 15px;
      
      .message-time {
        text-align: left;
        line-height: 30px;
      }
      
      .message-bubble-left {
        display: flex;
        flex-direction: column;
        box-shadow: 0 0 0 1px var(--el-border-color-light);
        border-radius: 10px;
        padding: 5px 10px;
      }
      
      .message-actions-left {
        display: flex;
        flex-direction: row;
        margin-top: 8px;
        
        .message-action-btn {
          display: flex;
          background: transparent;
          align-items: center;
          cursor: pointer;
          
          &:hover {
            background-color: var(--el-fill-color-lighter);
          }
          
          .message-action-icon {
            height: 20px;
          }
        }
      }
    }
  }
  
  .message-right-container {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-start;
    margin-top: 50px;
    
    .message-avatar {
      flex-shrink: 0;
    }
    
    .message-content-right {
      display: flex;
      flex-direction: column;
      text-align: left;
      margin: 0 15px;
      
      .message-time {
        text-align: left;
        line-height: 30px;
      }
      
      .message-attachments-right {
        display: flex;
        flex-direction: row-reverse;
        margin-bottom: 8px;
      }
      
      .message-text-right {
        display: flex;
        flex-direction: row-reverse;
        
        .message-user-bubble {
          font-size: 0.95rem;
          color: var(--el-color-white);
          display: inline;
          background-color: var(--el-color-primary);
          box-shadow: 0 0 0 1px var(--el-color-primary);
          border-radius: 10px;
          padding: 10px;
          width: auto;
          word-break: break-word;
          white-space: pre-wrap;
        }
      }
      
      .message-actions-right {
        display: flex;
        flex-direction: row-reverse;
        margin-top: 8px;
        
        .message-action-btn {
          display: flex;
          background: transparent;
          align-items: center;
          cursor: pointer;
          
          &:hover {
            background-color: var(--el-fill-color-lighter);
          }
          
          .message-action-icon {
            height: 20px;
            margin-right: 12px;
          }
        }
      }
    }
  }
}

.scroll-to-bottom {
  position: absolute;
  z-index: 1000;
  bottom: 0;
  right: 50%;
}
</style>
