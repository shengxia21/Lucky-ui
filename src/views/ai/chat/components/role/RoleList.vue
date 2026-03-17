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
        v-if="roleType === 'my'"
        type="primary"
        @click="handleAddRole"
        class="add-role-btn"
      >
        <el-icon class="user-icon"><User /></el-icon>
        添加角色
      </el-button>
    </div>

    <!-- 分类列表（仅公共角色显示） -->
    <div v-if="roleType === 'public'" class="category-list">
      <div class="category-item" v-for="category in categoryList" :key="category">
        <el-button
          plain
          round
          size="small"
          :type="category === activeCategory ? 'primary' : ''"
          @click="handleCategoryClick(category)"
        >
          {{ category }}
        </el-button>
      </div>
    </div>

    <!-- 角色列表 -->
    <div class="role-list-container" v-loading="loading">
      <el-empty v-if="roleList.length === 0" description="暂无数据" />
      <div v-else class="role-grid">
        <div v-for="role in roleList" :key="role.id">
          <!-- 角色卡片 -->
          <div class="role-card">
            <!-- 顶部操作区 -->
            <div class="card-header">
              <div v-if="roleType === 'my'">
                <el-dropdown @command="handleMoreClick">
                  <span class="more-btn">
                    <el-icon><More /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="['edit', role]">
                        <el-icon><Edit /></el-icon>编辑
                      </el-dropdown-item>
                      <el-dropdown-item :command="['delete', role]" style="color: var(--el-color-danger)">
                        <el-icon><Delete /></el-icon>删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <!-- 头像与基本信息 -->
            <div class="card-body">
              <image-preview :src="role.avatar" :width="75" :height="75" />

              <div class="role-info">
                <div class="role-name">{{ role.name }}</div>
                <div class="role-desc" :title="role.description">
                  {{ role.description }}
                </div>
              </div>
            </div>

            <!-- 系统消息 -->
            <div class="card-footer">
              <div class="system-msg-label">
                <span>系统消息</span>
              </div>
              <div class="system-msg-content" :title="role.systemMessage">
                {{ role.systemMessage }}
              </div>
            </div>

            <!-- 底部操作按钮 -->
            <div class="card-actions">
              <el-button type="primary" size="default" round @click="handleUseClick(role)">
                使用
              </el-button>
            </div>
          </div>
        </div>
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
    <ChatRoleForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup name="RoleList">
import ChatRoleForm from '@/views/ai/console/chatRole/ChatRoleForm.vue'
import { listMyRole, getCategoryList, delMyRole } from '@/api/ai/console/chatRole'
import { Search } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()

// 定义属性
const props = defineProps({
  roleType: {
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
    publicStatus: props.roleType === 'public',
    category: props.roleType === 'public' && activeCategory.value !== '全部' ? activeCategory.value : ''
  }
  listMyRole(params).then(response => {
    roleList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 获取分类列表（仅公共角色需要） */
const getRoleCategoryList = () => {
  if (props.roleType === 'public') {
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
    display: flex;
    margin-bottom: 15px;

    .category-item {
      margin-right: 10px;
    }
  }

  .role-list-container {
    flex: 1;
    overflow: auto;

    .role-grid {
      display: grid;
      gap: 16px;
      margin-bottom: 20px;
    }

    .role-card {
      margin-right: 15px;
      height: 100%;
      border-radius: 12px;
      border: 1px solid var(--el-border-color-light);

      .card-header {
        display: flex;
        justify-content: flex-end;
        padding: 12px 14px 0px 0px;

        .more-btn {
          cursor: pointer;
        }
      }

      .card-body {
        display: flex;
        gap: 14px;
        padding: 0 14px 16px;

        .role-info {
          flex: 1;
          flex-direction: column;

          .role-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 6px;
          }

          .role-desc {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            line-height: 1.5;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
          }
        }
      }

      .card-footer {
        padding: 0 14px 12px;

        .system-msg-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--el-text-color-secondary);
          margin-bottom: 6px;
        }

        .system-msg-content {
          font-size: 13px;
          color: var(--el-text-color-regular);
          line-height: 1.6;
          background: var(--el-fill-color-light);
          padding: 10px 12px;
          border-radius: 8px;
        }
      }

      .card-actions {
        padding: 5px 14px 14px;
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}
</style>
