<template>
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
        <el-input v-model="form.description" type="textarea" placeholder="请输入角色描述" :rows="4" />
      </el-form-item>
      <el-form-item label="角色设定" prop="systemMessage">
        <el-input v-model="form.systemMessage" type="textarea" placeholder="请输入角色设定" :rows="4" />
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
</template>

<script setup name="ChatRoleForm">
import { getRole, addRole, updateRole, addMyRole, updateMyRole } from "@/api/ai/console/chatRole"
import { getModelSimpleList } from "@/api/ai/console/model"
import { AiModelTypeEnum } from '@/utils/constants/aiConstant'

defineExpose({ openDialog }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

const { proxy } = getCurrentInstance()
const { boolean_string, sys_normal_disable, ai_mcp_client_name } = proxy.useDict('boolean_string', 'sys_normal_disable', 'ai_mcp_client_name')

/** 是否【我】自己创建，私有角色 */
const isUser = computed(() => {
  return formType.value === 'my-create' || formType.value === 'my-update'
})

const open = ref(false)
const title = ref('')
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const models = ref([])  // 聊天模型列表
const knowledgeList = ref([]) // 知识库列表
const toolList = ref([]) // 工具列表

const data = reactive({
  form: {
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

const { form, rules } = toRefs(data)

/** 新增/修改按钮操作 */
function openDialog(type, id) {
  reset()
  formType.value = type
  title.value = id ? '修改AI 聊天角色' : '新增AI 聊天角色'
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

/** 提交按钮 */
function submitForm() {
  proxy.$refs["roleRef"].validate(async (valid) => {
    if (valid) {
      if (formType.value === 'my-update') {
        await updateMyRole(form.value)
        proxy.$modal.msgSuccess("修改成功")
      } else if (formType.value === 'update') {
        await updateRole(form.value)
        proxy.$modal.msgSuccess("修改成功")
      } else if (formType.value === 'my-create') {
        await addMyRole(form.value)
        proxy.$modal.msgSuccess("新增成功")
      } else if (formType.value === 'create') {
        await addRole(form.value)
        proxy.$modal.msgSuccess("新增成功")
      }
      open.value = false
      emit('success')
    }
  })
}

</script>
