<template>
  <el-container class="role-repo-container">
    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabsClick" class="role-tabs">
      <el-tab-pane label="我的角色" name="my-role" class="my-role-pane">
        <RoleList ref="myRoleListRef" role-type="my" @on-use="handleRoleUse" />
      </el-tab-pane>
      <el-tab-pane label="公共角色" name="public-role" class="public-role-pane">
        <RoleList ref="publicRoleListRef" role-type="public" @on-use="handleRoleUse" />
      </el-tab-pane>
    </el-tabs>
  </el-container>
</template>

<script setup name="ChatRole">
import RoleList from './RoleList.vue'

const emits = defineEmits(['onUseRole'])

// 属性定义
const activeTab = ref('my-role') // 选中的角色 Tab
// 引用
const myRoleListRef = ref()
const publicRoleListRef = ref()

/** tabs 点击 */
const handleTabsClick = (tab) => {
  activeTab.value = tab.paneName
  // 刷新角色列表
  if (activeTab.value == 'my-role') {
    myRoleListRef.value.refresh()
  } else if (activeTab.value == 'public-role') {
    publicRoleListRef.value.refresh()
  }
}

/** 角色使用回调 */
const handleRoleUse = (role) => {
  emits('onUseRole', role)
}
</script>

<style lang="scss" scoped>
.role-repo-container {
  height: 100%;

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 12px;
  }

  .role-tabs {
    width: 100%;

    .my-role-pane,
    .public-role-pane {
      height: 100%;
    }
  }
}
</style>
