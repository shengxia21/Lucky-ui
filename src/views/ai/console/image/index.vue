<template>
  <div class="app-container">
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
      <el-form-item label="平台" prop="platform">
        <el-select v-model="queryParams.platform" placeholder="请选择平台" clearable style="width: 200px;">
          <el-option
            v-for="dict in ai_platform"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="绘画状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择绘画状态" clearable style="width: 200px;">
          <el-option
            v-for="dict in ai_image_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否发布" prop="publicStatus">
        <el-select v-model="queryParams.publicStatus" placeholder="请选择是否发布" clearable style="width: 200px;">
          <el-option
            v-for="dict in boolean_string"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
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

    <el-table v-loading="loading" :data="imageList" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="180" fixed="left" />
      <el-table-column label="图片" align="center" prop="picUrl" width="110px" fixed="left">
        <template #default="{ row }">
          <image-preview :src="row.picUrl" :width="80" :height="80" />
        </template>
      </el-table-column>
      <el-table-column label="用户" align="center" prop="userId" width="180">
        <template #default="scope">
          <span>{{ userList.find((item) => item.userId === scope.row.userId)?.nickName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" prop="platform" width="120">
        <template #default="scope">
          <dict-tag :options="ai_platform" :value="scope.row.platform"/>
        </template>
      </el-table-column>
      <el-table-column label="模型" align="center" prop="model" width="180" />
      <el-table-column label="绘画状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="ai_image_status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="是否发布" align="center" prop="publicStatus">
        <template #default="scope">
          <el-switch
            v-model="scope.row.publicStatus"
            :active-value="true"
            :inactive-value="false"
            @change="handleUpdatePublicStatusChange(scope.row)"
            :disabled="scope.row.status !== AiImageStatusEnum.SUCCESS"
            v-hasPermi="['ai:image:update']"
          />
        </template>
      </el-table-column>
      <el-table-column label="提示词" align="center" prop="prompt" width="180" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180px">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="宽度" align="center" prop="width" />
      <el-table-column label="高度" align="center" prop="height" />
      <el-table-column label="错误信息" align="center" prop="errorMessage" />
      <el-table-column label="任务编号" align="center" prop="taskId" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:image:delete']">删除</el-button>
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
  </div>
</template>

<script setup name="ImageManager">
import { listImage, updateImage, delImage } from "@/api/ai/console/image"
import { optionSelect as getUserOptionSelect } from "@/api/system/user"
import { AiImageStatusEnum } from '@/utils/constants/aiConstant'

const { proxy } = getCurrentInstance()
const { ai_image_status, ai_platform, boolean_string } = proxy.useDict('ai_image_status', 'ai_platform', 'boolean_string')

const imageList = ref([])
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
    platform: null,
    status: null,
    publicStatus: null,
  }
})

const { queryParams } = toRefs(data)

/** 查询AI 绘画列表 */
function getList() {
  loading.value = true
  listImage(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    imageList.value = response.rows
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
  proxy.$modal.confirm('是否确认删除AI 绘画编号为"' + _id + '"的数据项？').then(() => {
    return delImage(_id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 更新图片公开状态 */
function handleUpdatePublicStatusChange(row) {
  // 修改状态的二次确认
  const text = row.publicStatus ? '公开' : '私有'
  proxy.$modal.confirm('确认要' + text + '该图片吗？').then(() => {
    return updateImage({
      id: row.id,
      publicStatus: row.publicStatus
    })
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess(text + "成功")
  }).catch(() => {
    row.publicStatus = !row.publicStatus
  })
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
