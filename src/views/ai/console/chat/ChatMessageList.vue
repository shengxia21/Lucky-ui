<template>
  <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
    <el-form-item label="对话编号" prop="conversationId">
      <el-input
        v-model="queryParams.conversationId"
        placeholder="请输入对话编号"
        clearable
        @keyup.enter="handleQuery"
      />
    </el-form-item>
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

  <el-table v-loading="loading" :data="messageList" :show-overflow-tooltip="true">
    <el-table-column label="消息编号" align="center" prop="id" width="120" fixed="left" />
    <el-table-column label="对话编号" align="center" prop="conversationId" width="120" fixed="left" />
    <el-table-column label="用户" align="center" prop="userId" width="140">
      <template #default="scope">
        <span>{{ userList.find((item) => item.userId === scope.row.userId)?.nickName }}</span>
      </template>
    </el-table-column>
    <el-table-column label="角色" align="center" prop="roleName" width="140" />
    <el-table-column label="消息类型" align="center" prop="type" width="100" />
    <el-table-column label="模型标识" align="center" prop="model" width="180" />
    <el-table-column label="消息内容" align="center" prop="content" width="300" />
    <el-table-column label="创建时间" align="center" prop="createTime" width="180">
      <template #default="scope">
        <span>{{ parseTime(scope.row.createTime) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="回复消息编号" align="center" prop="replyId" width="140" />
    <el-table-column label="携带上下文" align="center" prop="useContext" width="100">
      <template #default="scope">
        <dict-tag :options="boolean_string" :value="scope.row.useContext + ''"/>
      </template>
    </el-table-column>
    <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="140" fixed="right">
      <template #default="scope">
        <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:message:delete']">删除</el-button>
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
import { listMessage, delMessage } from "@/api/ai/console/chat/message"
import { optionselect as getUserOptionselect } from "@/api/system/user"

const { proxy } = getCurrentInstance()
const { boolean_string } = proxy.useDict('boolean_string')

const messageList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const userList = ref([])

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    conversationId: null,
    userId: null
  }
})

const { queryParams } = toRefs(data)

/** 查询AI 聊天消息列表 */
function getList() {
  loading.value = true
  listMessage(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    messageList.value = response.rows
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
  const _ids = row.id || ids.value
  proxy.$modal.confirm('是否确认删除AI 聊天消息编号为"' + _ids + '"的数据项？').then(() => {
    return delMessage(_ids)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 获取用户列表 */
function getUserList() {
  getUserOptionselect().then(response => {
    userList.value = response.data
  })
}

getList()
getUserList()
</script>
