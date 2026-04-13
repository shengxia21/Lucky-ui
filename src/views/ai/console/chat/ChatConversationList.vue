<template>
  <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
    <el-form-item label="用户编号" prop="userId">
      <el-select
          v-model="queryParams.userId"
          clearable
          placeholder="请选择用户"
          style="width: 200px;"
        >
          <el-option
            v-for="item in userList"
            :key="item.userId"
            :label="item.nickName"
            :value="item.userId"
          />
        </el-select>
    </el-form-item>
    <el-form-item label="对话标题" prop="title">
      <el-input
        v-model="queryParams.title"
        placeholder="请输入对话标题"
        clearable
        @keyup.enter="handleQuery"
      />
    </el-form-item>
    <el-form-item label="创建时间" style="width: 308px">
      <el-date-picker
        v-model="dateRange"
        value-format="YYYY-MM-DD"
        type="daterange"
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      ></el-date-picker>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
      <el-button icon="Refresh" @click="resetQuery">重置</el-button>
    </el-form-item>
  </el-form>

  <el-row :gutter="10" class="mb8">
    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
  </el-row>

  <el-table v-loading="loading" :data="conversationList" :show-overflow-tooltip="true">
    <el-table-column label="对话编号" align="center" prop="id" width="180" fixed="left" />
    <el-table-column label="对话标题" align="center" prop="title" width="180" fixed="left" />
    <el-table-column label="用户" align="center" prop="userId" width="180">
      <template #default="scope">
        <span>{{ userList.find((item) => item.userId === scope.row.userId)?.nickName }}</span>
      </template>
    </el-table-column>
    <el-table-column label="角色" align="center" prop="roleName" width="180" />
    <el-table-column label="模型标识" align="center" prop="model" width="180" />
    <el-table-column label="消息数" align="center" prop="messageCount" />
    <el-table-column label="创建时间" align="center" prop="createTime" width="180">
      <template #default="scope">
        <span>{{ parseTime(scope.row.createTime) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="温度参数" align="center" prop="temperature" />
    <el-table-column label="回复 Token 数" align="center" prop="maxTokens" width="120" />
    <el-table-column label="上下文数量" align="center" prop="maxContexts" width="120" />
    <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="140" fixed="right">
      <template #default="scope">
        <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:chat-conversation:delete']">删除</el-button>
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
</template>

<script setup>
import { listConversation, delConversation } from "@/api/ai/console/chat/conversation"
import { optionSelect as getUserOptionSelect } from "@/api/system/user"

const { proxy } = getCurrentInstance()

const conversationList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const userList = ref([])

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userId: null,
    title: null
  }
})

const { queryParams } = toRefs(data)

/** 查询AI 聊天对话列表 */
function getList() {
  loading.value = true
  listConversation(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    conversationList.value = response.rows
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
  dateRange.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _id = row.id
  proxy.$modal.confirm('是否确认删除AI 聊天对话编号为"' + _id + '"的数据项？').then(() => {
    return delConversation(_id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 获取用户选择框列表 */
function getUserList() {
  getUserOptionSelect().then(response => {
    userList.value = response.data
  })
}

getList()
getUserList()
</script>
