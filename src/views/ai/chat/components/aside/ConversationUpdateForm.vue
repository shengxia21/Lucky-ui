<template>
  <el-dialog title="设定" v-model="dialogVisible" width="40%" draggable destroy-on-close>
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="130px"
      v-loading="loading"
    >
      <el-form-item label="对话标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入对话标题"
        />
      </el-form-item>
      <el-form-item label="角色设定" prop="systemMessage">
        <el-input
          type="textarea"
          v-model="formData.systemMessage"
          :rows="4"
          placeholder="请输入角色设定"
        />
      </el-form-item>
      <el-form-item label="模型" prop="modelId">
        <el-select v-model="formData.modelId" placeholder="请选择模型">
          <el-option
            v-for="model in models"
            :key="model.id"
            :label="model.name"
            :value="model.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="温度参数" prop="temperature">
        <el-input-number
          v-model="formData.temperature"
          placeholder="请输入温度参数"
          :min="0"
          :max="2"
          :precision="2"
        />
      </el-form-item>
      <el-form-item label="回复数 Token 数" prop="maxTokens">
        <el-input-number
          v-model="formData.maxTokens"
          placeholder="请输入回复数 Token 数"
          :min="0"
          :max="8192"
        />
      </el-form-item>
      <el-form-item label="上下文数量" prop="maxContexts">
        <el-input-number
          v-model="formData.maxContexts"
          placeholder="请输入上下文数量"
          :min="0"
          :max="20"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="loading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </el-dialog>
</template>

<script setup name="ChatConversationUpdateForm">
import { getModelSimpleList } from '@/api/ai/console/model'
import { updateChatConversationMy } from '@/api/ai/chat/conversation'
import { AiModelTypeEnum } from '@/utils/constants/aiConstant'

const { proxy } = getCurrentInstance()

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  title: undefined,
  systemMessage: undefined,
  modelId: undefined,
  temperature: undefined,
  maxTokens: undefined,
  maxContexts: undefined
})
const rules = reactive({
  title: [{ required: true, message: '对话标题不能为空', trigger: 'blur' }],
  modelId: [{ required: true, message: '模型不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
  temperature: [{ required: true, message: '温度参数不能为空', trigger: 'blur' }],
  maxTokens: [{ required: true, message: '回复数 Token 数不能为空', trigger: 'blur' }],
  maxContexts: [{ required: true, message: '上下文数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const models = ref([]) // 聊天模型列表

// 定义 success 事件，用于操作成功后的回调
const emit = defineEmits(['success'])

/** 打开弹窗 */
const open = async (conversation) => {
  dialogVisible.value = true
  resetForm()
  // 修改时，设置数据
  if (conversation) {
    formData.value = {
      id: conversation.id,
      title: conversation.title,
      systemMessage: conversation.systemMessage,
      modelId: conversation.modelId,
      temperature: conversation.temperature,
      maxTokens: conversation.maxTokens,
      maxContexts: conversation.maxContexts
    }
  }
  loading.value = true
  // 获得下拉数据
  await getModelSimpleList(AiModelTypeEnum.CHAT).then(response => {
    models.value = response.data
    loading.value = false
  })
}

/** 提交表单 */
const submitForm = () => {
  // 校验表单
  formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true
      try {
        const data = formData.value
        await updateChatConversationMy(data).then(() => {
          proxy.$modal.msgSuccess('对话配置已更新')
          dialogVisible.value = false
          // 发送操作成功的事件
          emit('success', formData.value.id)
        })
      } finally {
        loading.value = false
      }
    }
  })
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    title: undefined,
    systemMessage: undefined,
    modelId: undefined,
    temperature: undefined,
    maxTokens: undefined,
    maxContexts: undefined
  }
  formRef.value?.resetFields()
}

// 暴露 open 方法，用于打开弹窗
defineExpose({ open })
</script>
