<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="角色名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入角色名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="角色类别" prop="category">
        <el-input
          v-model="queryParams.category"
          placeholder="请输入角色类别"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否公开" prop="publicStatus">
        <el-select v-model="queryParams.publicStatus" placeholder="请选择是否公开" clearable style="width: 200px;">
          <el-option
            v-for="dict in boolean_string"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="openForm('create', null)"
          v-hasPermi="['ai:chat-role:create']"
        >新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="roleList" :show-overflow-tooltip="true">
      <el-table-column label="角色名称" align="center" prop="name" />
      <el-table-column label="绑定模型" align="center" prop="modelName" />
      <el-table-column label="角色头像" align="center" prop="avatar">
        <template #default="scope">
          <image-preview :src="scope.row.avatar" :width="50" :height="50" />
        </template>
      </el-table-column>
      <el-table-column label="角色类别" align="center" prop="category" />
      <el-table-column label="角色描述" align="center" prop="description" />
      <el-table-column label="角色设定" align="center" prop="systemMessage" />
      <el-table-column label="知识库" align="center" prop="knowledgeIds">
        <template #default="scope">
          <span v-if="!scope.row.knowledgeIds || scope.row.knowledgeIds.length === 0">-</span>
          <span v-else>引用 {{ scope.row.knowledgeIds.length }} 个</span>
        </template>
      </el-table-column>
      <el-table-column label="工具" align="center" prop="toolIds">
        <template #default="scope">
          <span v-if="!scope.row.toolIds || scope.row.toolIds.length === 0">-</span>
          <span v-else>引用 {{ scope.row.toolIds.length }} 个</span>
        </template>
      </el-table-column>
      <el-table-column label="是否公开" align="center" prop="publicStatus">
        <template #default="scope">
          <dict-tag :options="boolean_string" :value="scope.row.publicStatus + ''" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="角色排序" align="center" prop="sort" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="openForm('update', scope.row.id)" v-hasPermi="['ai:chat-role:update']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:chat-role:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 表单弹窗：添加/修改 -->
    <ChatRoleForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup name="ChatRole">
import { listRole, delRole } from "@/api/ai/console/chatRole"
import ChatRoleForm from './ChatRoleForm.vue'

const { proxy } = getCurrentInstance()
const { boolean_string, sys_normal_disable } = proxy.useDict('boolean_string', 'sys_normal_disable')

const roleList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const formRef = ref() // 表单弹窗引用

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    category: null,
    publicStatus: null
  }
})

const { queryParams } = toRefs(data)

/** 查询AI 聊天角色列表 */
function getList() {
  loading.value = true
  listRole(queryParams.value).then(response => {
    roleList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 新增/修改按钮操作 */
function openForm(type, id) {
  formRef.value.openDialog(type, id)
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _id = row.id
  proxy.$modal.confirm('是否确认删除AI 聊天角色编号为"' + _id + '"的数据项？').then(() => {
    return delRole(_id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
</script>
