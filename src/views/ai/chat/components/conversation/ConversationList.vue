<!-- AI 对话 -->
<template>
  <el-aside
    class="ai-chat-aside"
  >
    <!-- 左顶部：对话 -->
    <div class="ai-chat-aside-content">
      <el-button class="new-conversation-btn" type="primary" @click="createConversation">
        <el-icon class="btn-icon"><Plus /></el-icon>
        新建对话
      </el-button>

      <!-- 左顶部：搜索对话 -->
      <el-input
        v-model="searchName"
        size="large"
        class="search-input"
        placeholder="搜索历史记录"
        @keyup="searchConversation"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <!-- 左中间：对话列表 -->
      <div class="conversation-list-container" v-loading="loading">
        <!-- 按照 group 分组，展示聊天会话 list 列表 -->
        <div v-for="conversationKey in Object.keys(conversationMap)" :key="conversationKey">
          <div class="conversation-group-title" v-if="conversationMap[conversationKey].length">
            <el-text class="group-title-text" size="small" tag="b">
              {{ conversationKey }}
            </el-text>
          </div>
          <div
            class="conversation-item-container"
            v-for="conversation in conversationMap[conversationKey]"
            :key="conversation.id"
            @click="handleConversationClick(conversation.id)"
            @mouseover="hoverConversationId = conversation.id"
            @mouseout="hoverConversationId = ''"
          >
            <div
              class="conversation-item"
              :class="{ 'conversation-item-active': conversation.id == activeConversationId }"
            >
              <div class="conversation-info">
                <img
                  class="conversation-avatar"
                  :src="conversation.roleAvatar || roleAvatarDefaultImg"
                />
                <span class="conversation-title">
                  {{ conversation.title }}
                </span>
              </div>
              <div
                class="conversation-actions"
                v-show="hoverConversationId === conversation.id"
              >
                <el-button class="action-btn" link @click.stop="handleTop(conversation)">
                  <el-icon title="置顶" v-if="!conversation.pinned"><Top /></el-icon>
                  <el-icon title="置顶" v-if="conversation.pinned"><Bottom /></el-icon>
                </el-button>
                <el-button class="action-btn" link @click.stop="updateConversationTitle(conversation)">
                  <el-icon title="编辑">
                    <el-icon><Edit /></el-icon>
                  </el-icon>
                </el-button>
                <el-button class="action-btn" link @click.stop="deleteChatConversation(conversation)">
                  <el-icon title="删除对话">
                    <el-icon><Delete /></el-icon>
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部占位  -->
        <div class="conversation-list-bottom"></div>
      </div>
    </div>

    <!-- 左底部：工具栏 -->
    <div class="ai-chat-toolbar" v-if="conversationList.length > 0">
      <div
        class="toolbar-item"
        @click="handleClearConversation"
      >
        <el-icon><Delete /></el-icon>
        <el-text class="toolbar-text" size="small">清空未置顶对话</el-text>
      </div>
    </div>
  </el-aside>
</template>

<script setup name="ConversationList">
import { getChatConversationMyList, createChatConversationMy,
  updateChatConversationMy, deleteChatConversationMy,
  deleteChatConversationMyByUnpinned } from '@/api/ai/chat/conversation'
import roleAvatarDefaultImg from '@/assets/images/ai/chatgpt.png'

const { proxy } = getCurrentInstance()

// 定义属性
const searchName = ref('') // 对话搜索
const activeConversationId = ref(null) // 选中的对话，默认为 null
const hoverConversationId = ref(null) // 悬浮上去的对话
const conversationList = ref([]) // 对话列表
const conversationMap = ref({}) // 对话分组 (置顶、今天、三天前、一星期前、一个月前)
const loading = ref(false) // 加载中

// 定义组件 props
const props = defineProps({
  activeId: {
    type: [String, Number],
    required: true
  }
})

// 定义钩子
const emits = defineEmits([
  'onConversationCreate',
  'onConversationClick',
  'onConversationClear',
  'onConversationDelete',
  'onConversationUpdated'
])

/** 搜索对话 */
const searchConversation = () => {
  // 恢复数据
  if (!searchName.value.trim().length) {
    conversationMap.value = getConversationGroupByCreateTime(conversationList.value)
  } else {
    // 过滤
    const filterValues = conversationList.value.filter((item) => {
      return item.title.includes(searchName.value.trim())
    })
    conversationMap.value = getConversationGroupByCreateTime(filterValues)
  }
}

/** 点击对话 */
const handleConversationClick = (id) => {
  // 过滤出选中的对话
  const filterConversation = conversationList.value.filter((item) => {
    return item.id === id
  })
  // 回调 onConversationClick
  emits('onConversationClick', filterConversation[0])
}

/** 获取对话列表 */
const getChatConversationList = async () => {
  try {
    // 加载中
    loading.value = true

    // 1.1 获取对话数据
    await getChatConversationMyList().then(response => {
      conversationList.value = response.data
    })
    // 1.2 排序
    conversationList.value.sort((a, b) => {
      return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    })
    // 1.3 没有任何对话情况
    if (conversationList.value.length === 0) {
      activeConversationId.value = null
      conversationMap.value = {}
      return
    }

    // 2. 对话根据时间分组(置顶、今天、一天前、三天前、七天前、30 天前)
    conversationMap.value = getConversationGroupByCreateTime(conversationList.value)
  } finally {
    // 加载完成
    loading.value = false
  }
}

/** 按照 creteTime 创建时间，进行分组 */
const getConversationGroupByCreateTime = (list) => {
  // 排序、指定、时间分组(今天、一天前、三天前、七天前、30天前)
  const groupMap = {
    '置顶': [],
    '今天': [],
    '一天前': [],
    '三天前': [],
    '七天前': [],
    '三十天前': []
  }
  // 当前时间的时间戳
  const now = Date.now()
  // 定义时间间隔常量（单位：毫秒）
  const oneDay = 24 * 60 * 60 * 1000
  const threeDays = 3 * oneDay
  const sevenDays = 7 * oneDay
  const thirtyDays = 30 * oneDay
  
  for (const conversation of list) {
    // 置顶
    if (conversation.pinned) {
      groupMap['置顶'].push(conversation)
      continue
    }
    // 计算时间差（单位：毫秒）
    const diff = now - new Date(conversation.createTime).getTime()
    // 根据时间间隔判断
    if (diff < oneDay) {
      groupMap['今天'].push(conversation)
    } else if (diff < threeDays) {
      groupMap['一天前'].push(conversation)
    } else if (diff < sevenDays) {
      groupMap['三天前'].push(conversation)
    } else if (diff < thirtyDays) {
      groupMap['七天前'].push(conversation)
    } else {
      groupMap['三十天前'].push(conversation)
    }
  }
  return groupMap
}

/** 新建对话 */
const createConversation = async () => {
  // 1. 新建对话
  let conversationId = 0;
  await createChatConversationMy({}).then(response => {
    conversationId = response.data
  })
  // 2. 获取对话内容
  await getChatConversationList()
  // 3. 选中对话
  handleConversationClick(conversationId)
  // 4. 回调
  emits('onConversationCreate')
}

/** 修改对话的标题 */
const updateConversationTitle = (conversation) => {
  // 1. 二次确认
  proxy.$prompt("修改标题", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^[\s\S]*.*\S[\s\S]*$/,
    inputErrorMessage: "标题不能为空",
    inputValue: conversation.title
  }).then(({ value }) => {
    // 2. 发起修改
    updateChatConversationMy({
      id: conversation.id,
      title: value
    }).then(response => {
      proxy.$modal.msgSuccess("重命名成功")
      // 3. 刷新列表
      getChatConversationList()
    })
  }).catch(() => {})
}

/** 删除聊天对话 */
const deleteChatConversation = (conversation) => {
  // 删除的二次确认
  proxy.$modal.confirm(`是否确认删除对话 - ${conversation.title}?`)
  .then(() => {
    // 发起删除
    deleteChatConversationMy(conversation.id)
    .then(() => {
      proxy.$modal.msgSuccess('对话已删除')
      // 刷新列表
      getChatConversationList()
      // 回调
      emits('onConversationDelete', conversation)
    })
  }).catch(() => {})
}

/** 清空对话 */
const handleClearConversation = () => {
  proxy.$modal.confirm('确认后对话会全部清空，置顶的对话除外。')
  .then(() => {
    deleteChatConversationMyByUnpinned()
    .then(() => {
      proxy.$modal.msgSuccess('操作成功!')
      // 清空对话和对话内容
      activeConversationId.value = null
      // 获取对话列表
      getChatConversationList()
      // 回调方法
      emits('onConversationClear')
    })
  }).catch(() => {})
}

/** 对话置顶 */
const handleTop = async (conversation) => {
  // 更新对话置顶
  conversation.pinned = !conversation.pinned
  await updateChatConversationMy(conversation)
  // 刷新对话
  await getChatConversationList()
}

/** 刷新对话列表 */
const refreshConversationList = async (id) => {
  await getChatConversationMyList().then(response => {
    conversationList.value = response.data
  })
  // 找到更新的对话
  const conversation = conversationList.value.find(item => item.id === id)
  // 回调 onConversationUpdated
  emits('onConversationUpdated', conversation)
}

/** 监听选中的对话 */
const { activeId } = toRefs(props)
watch(activeId, (newValue) => {
  activeConversationId.value = newValue
})

// 暴露给父组件调用的方法
defineExpose({ createConversation, refreshConversationList })

/** 初始化 */
onMounted(async () => {
  // 获取对话列表
  await getChatConversationList()
  // 默认选中
  if (props.activeId) {
    activeConversationId.value = props.activeId
  } else {
    // 首次默认选中第一个
    if (conversationList.value.length) {
      activeConversationId.value = conversationList.value[0].id
      // 回调 onConversationClick
      emits('onConversationClick', conversationList.value[0])
    }
  }
})
</script>

<style lang='scss' scoped>
.ai-chat-aside {
  width: 260px;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 10px 0;
  overflow: hidden;

  &-content {
    height: 100%;

    .new-conversation-btn {
      width: 100%;
      padding: 18px 0;

      .btn-icon {
        margin-right: 5px;
      }
    }

    .search-input {
      margin-top: 20px;
    }

    .conversation-list-container {
      overflow: auto;
      height: 100%;

      .conversation-group-title {
        margin-top: 5px;
        padding-top: 10px;

        .group-title-text {
          margin: 0 4px;
        }
      }

      .conversation-item-container {
        margin-top: 5px;

        .conversation-item {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          flex: 1;
          padding: 0 5px;
          cursor: pointer;
          border-radius: 5px;
          align-items: center;
          line-height: 30px;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          &.conversation-item-active {
            background-color: var(--el-color-primary-light-9);
            border: 1px solid var(--el-color-primary-light-7);
          }

          .conversation-info {
            display: flex;
            flex-direction: row;
            align-items: center;

            .conversation-avatar {
              width: 25px;
              height: 25px;
              border-radius: 5px;
              display: flex;
              flex-direction: row;
              justify-content: center;
            }

            .conversation-title {
              padding: 2px 10px;
              max-width: 220px;
              font-size: 14px;
              font-weight: 400;
              color: var(--el-text-color-regular);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
          }

          .conversation-actions {
            position: absolute;
            right: 2px;
            display: flex;
            flex-direction: row;
            justify-content: center;
            color: var(--el-text-color-regular);
            margin-right: 3px;

            .action-btn {
              margin: 0;
            }
          }
        }
      }

      .conversation-list-bottom {
        height: 160px;
        width: 100%;
      }
    }
  }

  .ai-chat-toolbar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0 20px;
    line-height: 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--el-fill-color-extra-light);
    box-shadow: 0 0 1px 1px var(--el-border-color-lighter);
    color: var(--el-text-color);

    .toolbar-item {
      display: flex;
      align-items: center;
      padding: 0;
      margin: 0;
      cursor: pointer;
      color: var(--el-text-color-regular);

      .toolbar-text {
        margin-left: 5px;
      }
    }
  }
}
</style>
