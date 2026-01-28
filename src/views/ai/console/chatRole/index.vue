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
          @click="openDialog('create', null, '新增AI 聊天角色')"
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
          <el-button link type="primary" icon="Edit" @click="openDialog('update', scope.row.id, '修改AI 聊天角色')" v-hasPermi="['ai:chat-role:update']">修改</el-button>
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

    <!-- 添加或修改AI 聊天角色对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="roleRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色头像" prop="avatar">
          <image-upload
            v-model="form.avatar"
            :limit="1"
          />
        </el-form-item>
        <el-form-item label="绑定模型" prop="modelId" v-if="!isUser">
          <el-select v-model="form.modelId" placeholder="请选择模型" clearable>
            <el-option
              v-for="model in models"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色类别" prop="category">
          <el-input v-model="form.category" placeholder="请输入角色类别" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="角色设定" prop="systemMessage">
          <el-input v-model="form.systemMessage" type="textarea" placeholder="请输入角色设定" />
        </el-form-item>
        <el-form-item label="引用知识库" prop="knowledgeIds">
          <el-select v-model="form.knowledgeIds" placeholder="请选择知识库" clearable multiple>
            <el-option
              v-for="item in knowledgeList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="引用工具" prop="toolIds">
          <el-select v-model="form.toolIds" placeholder="请选择工具" clearable multiple>
            <el-option v-for="item in toolList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="引用 MCP" prop="toolIds">
          <el-select v-model="form.mcpClientNames" placeholder="请选择 MCP" clearable multiple>
            <el-option
              v-for="dict in ai_mcp_client_name"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否公开" prop="publicStatus" v-if="!isUser">
          <el-radio-group v-model="form.publicStatus">
            <el-radio
              v-for="dict in boolean_string"
              :key="dict.value"
              :value="dict.value"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色排序" prop="sort" v-if="!isUser">
          <el-input-number v-model="form.sort" :min="0" placeholder="请输入角色排序" />
        </el-form-item>
        <el-form-item label="开启状态" prop="status" v-if="!isUser">
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

<script setup name="chatRole">
import { listRole, getRole, delRole, addRole, updateRole } from "@/api/ai/console/chatRole"
import { getModelSimpleList } from "@/api/ai/console/model"
import { AiModelTypeEnum } from '@/utils/constants/AiConstants'

const { proxy } = getCurrentInstance()
const { boolean_string, sys_normal_disable, ai_mcp_client_name } = proxy.useDict('boolean_string', 'sys_normal_disable', 'ai_mcp_client_name')

/** 是否【我】自己创建，私有角色 */
const isUser = computed(() => {
  return formType.value === 'my-create' || formType.value === 'my-update'
})

const roleList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref('')
const formType = ref('')  // 表单的类型：create - 新增；update - 修改
const models = ref([])  // 聊天模型列表
const knowledgeList = ref([]) // 知识库列表
const toolList = ref([]) // 工具列表

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    category: null,
    publicStatus: null
  },
  rules: {
    name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
    avatar: [{ required: true, message: '角色头像不能为空', trigger: 'blur' }],
    category: [{ required: true, message: '角色类别不能为空', trigger: 'blur' }],
    sort: [{ required: true, message: '角色排序不能为空', trigger: 'blur' }],
    description: [{ required: true, message: '角色描述不能为空', trigger: 'blur' }],
    systemMessage: [{ required: true, message: '角色设定不能为空', trigger: 'blur' }],
    publicStatus: [{ required: true, message: '是否公开不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询AI 聊天角色列表 */
function getList() {
  loading.value = true
  listRole(queryParams.value).then(response => {
    roleList.value = response.rows
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
    name: null,
    avatar: null,
    category: null,
    description: null,
    systemMessage: null,
    modelId: null,
    knowledgeIds: null,
    toolIds: null,
    mcpClientNames: null,
    publicStatus: 'true',
    sort: 1,
    status: 0
  }
  proxy.resetForm("roleRef")
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
function openDialog(type, id, dialogTitle) {
  reset()
  formType.value = type
  title.value = dialogTitle
  if (id) {
    getRole(id).then(response => {
      form.value = response.data
      form.value.publicStatus = form.value.publicStatus.toString()
    })
  }
  // 获得下拉数据
  getModelSimpleList(AiModelTypeEnum.CHAT).then(response => {
    models.value = response.data
  })
  // 获取知识库列表
  // 获取工具列表
  open.value = true
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["roleRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateRole(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addRole(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除AI 聊天角色编号为"' + _id + '"的数据项？').then(function() {
    return delRole(_id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
</script>
