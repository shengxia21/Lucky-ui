<template>
  <div class="role-list-wrapper">
    <!-- 顶部操作栏：搜索和添加按钮 -->
    <div class="toolbar-container">
      <el-input
        v-model="queryParams.name"
        class="search-input"
        size="default"
        placeholder="请输入搜索的内容"
        :suffix-icon="Search"
        clearable
        @change="handleSearch"
      />
      <el-button
        v-if="type === 'my'"
        type="primary"
        @click="handleAddRole"
        class="add-role-btn"
      >
        <el-icon class="user-icon"><User /></el-icon>
        添加角色
      </el-button>
    </div>

    <!-- 分类列表（仅公共角色显示） -->
    <RoleCategoryList
      v-if="type === 'public'"
      class="category-list"
      :category-list="categoryList"
      :active="activeCategory"
      @on-category-click="handleCategoryClick"
    />

    <!-- 角色列表 -->
    <div class="role-list-container" v-loading="loading">
      <el-empty v-if="roleList.length === 0" description="暂无数据" />
      <div v-else class="role-cards">
        <el-card v-for="role in roleList" :key="role.id" class="role-card">
          <!-- 更多操作（仅我的角色显示） -->
          <div class="more-actions" v-if="type === 'my'">
            <el-dropdown @command="handleMoreClick">
              <span>
                <el-button type="text">
                  <el-icon><More /></el-icon>
                </el-button>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="['edit', role]" style="color: var(--el-text-color-placeholder)">
                    <el-icon><Edit /></el-icon>编辑
                  </el-dropdown-item>
                  <el-dropdown-item :command="['delete', role]" style="color: var(--el-color-danger)">
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <!-- 角色信息 -->
          <div class="role-content-layout">
            <!-- 左侧：头像、名称、描述 -->
            <div class="role-left">
              <div class="role-avatar">
                <image-preview :src="role.avatar" :width="65" :height="65" />
              </div>
              <div class="role-basic-info">
                <div class="role-name">{{ role.name }}</div>
                <div class="role-description">{{ role.description }}</div>
              </div>
            </div>
            <!-- 右侧：系统消息 -->
            <div class="role-right">
              <div class="role-system-message-label">系统消息</div>
              <el-tooltip
                :content="role.systemMessage"
                placement="top"
              >
                <div class="role-system-message">
                  {{ role.systemMessage }}
                </div>
              </el-tooltip>
            </div>
          </div>
          <div class="role-actions">
            <el-button type="primary" size="small" @click="handleUseClick(role)">使用</el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 角色表单对话框 -->
    <ChatRoleForm ref="formRef" @success="handleAddRoleSuccess" />
  </div>
</template>

<script setup name="RoleList">
import ChatRoleForm from '@/views/ai/console/chatRole/ChatRoleForm.vue'
import RoleCategoryList from './RoleCategoryList.vue'
import { listMyRole, getCategoryList, delMyRole } from '@/api/ai/console/chatRole'
import { Search } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()

// 定义属性
const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['my', 'public'].includes(value)
  }
})

// 定义事件
const emits = defineEmits(['onUse'])

// 状态定义
const loading = ref(false)
const total = ref(0)
const roleList = ref([])
const categoryList = ref([])
const activeCategory = ref('全部')
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: ''
})

// 表单引用
const formRef = ref()

/** 获取角色列表 */
const getList = () => {
  loading.value = true
  const params = {
    ...queryParams,
    publicStatus: props.type === 'public',
    category: props.type === 'public' && activeCategory.value !== '全部' ? activeCategory.value : ''
  }
  listMyRole(params).then(response => {
    roleList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 获取分类列表（仅公共角色需要） */
const getRoleCategoryList = () => {
  if (props.type === 'public') {
    getCategoryList().then(response => {
      categoryList.value = ['全部', ...response.data]
    })
  }
}

/** 搜索 */
const handleSearch = () => {
  queryParams.pageNum = 1
  getList()
}

/** 处理分类点击 */
const handleCategoryClick = (category) => {
  activeCategory.value = category
  queryParams.pageNum = 1
  getList()
}

/** 添加角色 */
const handleAddRole = () => {
  formRef.value.openDialog('my-create', null)
}

/** 添加角色成功回调 */
const handleAddRoleSuccess = () => {
  getList()
}

/** 操作：编辑、删除 */
const handleMoreClick = (data) => {
  const type = data[0]
  const role = data[1]
  if (type === 'delete') {
    handleDeleteRole(role)
  } else {
    formRef.value.openDialog('my-update', role.id)
  }
}

/** 删除角色 */
const handleDeleteRole = (role) => {
  proxy.$modal.confirm('是否确认删除角色名为"' + role.name + '"的数据项？').then(() => {
    return delMyRole(role.id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 使用角色 */
const handleUseClick = (role) => {
  emits('onUse', role)
}

/** 刷新 */
const refresh = () => {
  queryParams.pageNum = 1
  queryParams.name = ''
  activeCategory.value = '全部'
  getList()
}

defineExpose({ refresh })

/** 初始化 */
onMounted(() => {
  getList()
  getRoleCategoryList()
})
</script>

<style lang="scss" scoped>
.role-list-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;

  .toolbar-container {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 12px;

    .search-input {
      width: 240px;
    }

    .add-role-btn {
      margin-left: 12px;

      .user-icon {
        margin-right: 5px;
      }
    }
  }

  .category-list {
    margin-bottom: 12px;
  }

  .role-list-container {
    flex: 1;
    overflow: auto;

    .role-cards {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;
      align-content: flex-start;
      gap: 16px;
    }

    .role-card {
      width: 320px;
      border-radius: 10px;
      position: relative;

      .more-actions {
        position: absolute;
        top: 0px;
        right: 10px;
      }

      .role-content-layout {
        display: flex;
        flex-direction: row;
        gap: 16px;
        min-height: 105px;

        .role-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;

          .role-avatar {
            width: 65px;
            height: 65px;
            flex-shrink: 0;
          }

          .role-basic-info {
            flex: 1;
            display: flex;
            flex-direction: column;

            .role-name {
              font-size: 16px;
              font-weight: bold;
              color: var(--el-text-color-primary);
              margin-bottom: 8px;
            }

            .role-description {
              font-size: 14px;
              color: var(--el-text-color-regular);
              display: -webkit-box;
              -webkit-line-clamp: 2;
              line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }

        .role-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--el-border-color-lighter);
          padding-left: 16px;

          .role-system-message-label {
            font-size: 12px;
            font-weight: bold;
            color: var(--el-text-color-secondary);
            margin-bottom: 8px;
          }

          .role-system-message {
            height: 100%;
            font-size: 13px;
            color: var(--el-text-color-regular);
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 5;
            line-clamp: 5;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
          }
        }
      }

      .role-actions {
        display: flex;
        flex-direction: row-reverse;
        margin-top: 12px;
      }
    }
  }
}
</style>
