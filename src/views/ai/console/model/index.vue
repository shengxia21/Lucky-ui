<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="模型名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入模型名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="模型标志" prop="model">
        <el-input
          v-model="queryParams.model"
          placeholder="请输入模型标志"
          clearable
          @keyup.enter="handleQuery"
        />
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
          @click="handleAdd"
          v-hasPermi="['ai:model:create']"
        >新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="modelList" :show-overflow-tooltip="true">
      <el-table-column label="平台" align="center" prop="platform" min-width="120">
        <template #default="scope">
          <dict-tag :options="ai_platform" :value="scope.row.platform"/>
        </template>
      </el-table-column>
      <el-table-column label="模型类型" align="center" prop="type" min-width="100">
        <template #default="scope">
          <dict-tag :options="ai_model_type" :value="scope.row.type"/>
        </template>
      </el-table-column>
      <el-table-column label="模型名称" align="center" prop="name" min-width="180" />
      <el-table-column label="模型标志" align="center" prop="model" min-width="200" />
      <el-table-column label="API 秘钥" align="center" prop="keyId" min-width="120">
        <template #default="scope">
          <span>{{ apiKeyList.find((item) => item.id === scope.row.keyId)?.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" min-width="80" />
      <el-table-column label="状态" align="center" prop="status" min-width="80">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="温度参数" align="center" prop="temperature" min-width="80" />
      <el-table-column label="回复数 Token 数" align="center" prop="maxTokens" min-width="140" />
      <el-table-column label="上下文数量" align="center" prop="maxContexts" min-width="100" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="180">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:model:update']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:model:delete']">删除</el-button>
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

    <!-- 添加或修改AI 模型对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="modelRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="平台" prop="platform">
          <el-select v-model="form.platform" placeholder="请选择平台">
            <el-option
              v-for="dict in ai_platform"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="模型类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择模型类型" :disabled="form.id">
            <el-option
              v-for="dict in ai_model_type"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="API 秘钥" prop="keyId">
          <el-select v-model="form.keyId" placeholder="请选择 API 秘钥" clearable>
            <el-option
              v-for="apiKey in apiKeyList"
              :key="apiKey.id"
              :label="apiKey.name"
              :value="apiKey.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型标识" prop="model">
          <el-input v-model="form.model" placeholder="请输入模型标识" />
        </el-form-item>
        <el-form-item label="温度参数" prop="temperature"
          v-if="form.type === AiModelTypeEnum.CHAT">
          <el-input-number
            v-model="form.temperature"
            placeholder="请输入温度参数"
            :min="0"
            :max="2"
            :precision="2"
          />
        </el-form-item>
        <el-form-item label="回复数 Token 数" prop="maxTokens"
          v-if="form.type === AiModelTypeEnum.CHAT">
          <el-input-number
            v-model="form.maxTokens"
            placeholder="请输入回复数 Token 数"
            :min="0"
            :max="8192"
          />
        </el-form-item>
        <el-form-item label="上下文数量" prop="maxContexts"
          v-if="form.type === AiModelTypeEnum.CHAT">
          <el-input-number
            v-model="form.maxContexts"
            placeholder="请输入上下文数量"
            :min="0"
            :max="20"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" placeholder="请输入模型排序" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in sys_normal_disable"
              :key="dict.value"
              :value="parseInt(dict.value)"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Model">
import { listModel, getModel, delModel, addModel, updateModel } from "@/api/ai/console/model"
import { getApiKeySimpleList } from "@/api/ai/console/apiKey"
import { AiModelTypeEnum } from '@/utils/constants/aiConstant'

const { proxy } = getCurrentInstance()
const { ai_model_type, ai_platform, sys_normal_disable } = proxy.useDict('ai_model_type', 'ai_platform', 'sys_normal_disable')

const modelList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const apiKeyList = ref([])

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    model: null,
    platform: null
  },
  rules: {
    keyId: [{ required: true, message: "API 秘钥编号不能为空", trigger: "blur" }],
    name: [{ required: true, message: "模型名称不能为空", trigger: "blur" }],
    model: [{ required: true, message: "模型标志不能为空", trigger: "blur" }],
    platform: [{ required: true, message: "平台不能为空", trigger: "blur" }],
    type: [{ required: true, message: "模型类型不能为空", trigger: "change" }],
    status: [{ required: true, message: "状态不能为空", trigger: "change" }],
    sort: [{ required: true, message: "排序不能为空", trigger: "blur" }],
    temperature: [{ required: true, message: '温度参数不能为空', trigger: 'blur' }],
    maxTokens: [{ required: true, message: '回复数 Token 数不能为空', trigger: 'blur' }],
    maxContexts: [{ required: true, message: '上下文数量不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询AI 模型列表 */
function getList() {
  loading.value = true
  listModel(queryParams.value).then(response => {
    modelList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    keyId: null,
    name: null,
    model: null,
    platform: null,
    type: null,
    status: 0,
    sort: null,
    temperature: null,
    maxTokens: null,
    maxContexts: null
  }
  proxy.resetForm("modelRef")
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

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加AI 模型"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _id = row.id
  getModel(_id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改AI 模型"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["modelRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateModel(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addModel(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _id = row.id
  proxy.$modal.confirm('是否确认删除AI 模型编号为"' + _id + '"的数据项？').then(function() {
    return delModel(_id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 获取 API 密钥列表 */
function getApiKeyList() {
  getApiKeySimpleList().then(response => {
    apiKeyList.value = response.data
  })
}

getList()
getApiKeyList()
</script>
