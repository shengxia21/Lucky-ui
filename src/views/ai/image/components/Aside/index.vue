<template>
  <div class="common-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" require-asterisk-position="right">
      <!-- 模型选择 -->
      <el-form-item label="生成模型" prop="modelId">
        <el-select v-model="form.modelId" placeholder="请选择生成图片模型">
          <el-option
            v-for="item in models"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <!-- 正向提示词 -->
      <el-form-item label="正向提示词" prop="prompt">
        <el-input
          v-model="form.prompt"
          type="textarea"
          :rows="4"
          placeholder="请输入想要生成的图片描述内容"
          :maxlength="1200"
          show-word-limit
          resize="none"
        />
      </el-form-item>

      <!-- 负向提示词 -->
      <el-form-item v-if="showNegativePrompt" label="负向提示词" prop="negativePrompt">
        <el-input
          v-model="form.negativePrompt"
          type="textarea"
          :rows="4"
          placeholder="请输入用于指定不希望生成的内容"
          :maxlength="2000"
          show-word-limit
          resize="none"
        />
      </el-form-item>

      <!-- 尺寸选择 -->
      <el-form-item label="图片分辨率" prop="size">
        <div v-if="currentSizePresets.length > 0" class="size-buttons">
          <el-button
            v-for="size in currentSizePresets"
            :key="size.label"
            :type="form.size === size.value ? 'primary' : 'default'"
            @click="form.size = size.value"
          >
            {{ size.label }}
          </el-button>
        </div>
        <div v-else class="size-inputs">
          <el-input
            v-model="form.width"
            type="number"
            placeholder="宽度"
            :min="1"
            style="width: 150px;"
          />
          <span style="margin: 0 10px;">×</span>
          <el-input
            v-model="form.height"
            type="number"
            placeholder="高度"
            :min="1"
            style="width: 150px;"
          />
        </div>
      </el-form-item>

      <!-- 提示词扩展 -->
      <el-form-item label="智能扩写" prop="promptExtend" label-position="left">
        <el-switch v-model="form.promptExtend" />
      </el-form-item>

      <!-- 生成按钮 -->
      <el-form-item>
        <el-button
          type="primary"
          size="large"
          round
          :loading="drawIn"
          :disabled="form.prompt.length === 0"
          @click="validateForm"
          style="width: 100%;"
        >
          {{ drawIn ? '生成中' : '生成内容' }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup name="ImageAside">
import { getModelSimpleList } from '@/api/ai/console/model'
import { AiModelTypeEnum, modelSizeMap } from '@/utils/constants/aiConstant'
import { drawImage } from '@/api/ai/image'

const { proxy } = getCurrentInstance()

const models = ref([]) // 模型列表
const drawIn = ref(false) // 生成中状态
const currentSizePresets = ref([])  // 图片分辨率选项
const showNegativePrompt = ref(false) // 是否显示负向提示词

const data = reactive({
  form: {
    modelId: '',
    prompt: '',
    negativePrompt: '',
    size: '1328*1328',
    width: '',
    height: '',
    promptExtend: false
  },
  rules: {
    modelId: [{ required: true, message: '请选择生成图片模型', trigger: 'change' }],
    prompt: [{ required: true, message: '请输入正向提示词', trigger: 'blur' }]
  }
})

const { form, rules } = toRefs(data)

watch(() => form.value.modelId, () => {
  updateSizePresets()
})

const emits = defineEmits(['onDrawComplete'])

// 更新图片分辨率选项
const updateSizePresets = () => {
  const model = models.value.find(m => m.id === form.value.modelId)
  // 如果模型存在,则使用该模型的尺寸选项
  if (model && model.model && modelSizeMap[model.model]) {
    const modelConfig = modelSizeMap[model.model]
    currentSizePresets.value = modelConfig.sizes
    showNegativePrompt.value = modelConfig.showNegativePrompt || false
    // 存在尺寸选项,则使用第一个尺寸选项
    if (currentSizePresets.value.length > 0) {
      form.value.size = currentSizePresets.value[0].value
    }
  } else {
    // 如果没有匹配的尺寸选项,则清空尺寸选项
    currentSizePresets.value = []
    // 默认不展示负向提示词
    showNegativePrompt.value = false
    // 清空 size,让用户手动输入
    form.value.size = ''
  }
  form.value.width = ''
  form.value.height = ''
}

// 校验表单参数
const validateForm = async () => {
  await proxy.$refs["formRef"].validate()
  // 如果没有尺寸选项,则校验宽度和高度是否为空
  if (currentSizePresets.value.length === 0) {
    if (!form.value.width || !form.value.height) {
      proxy.$modal.msgError('请输入宽度和高度')
      return
    }
    form.value.size = `${form.value.width}*${form.value.height}`
  }
  await proxy.$modal.confirm('确认生成内容?')
  await generateImage()
}

/** 生成图片 */
const generateImage = async () => {
  try {
    drawIn.value = true
    proxy.$modal.msg("正在生成,请稍后查看!")

    const [width, height] = form.value.size.split('*').map(Number)
    const requestData = {
      modelId: form.value.modelId,
      prompt: form.value.prompt,
      width: width,
      height: height,
      options: {
        negativePrompt: form.value.negativePrompt,
        promptExtend: form.value.promptExtend
      }
    }
    await drawImage(requestData)
    form.value.prompt = ''
    form.value.negativePrompt = ''
    form.value.width = ''
    form.value.height = ''
    emits('onDrawComplete')
  } finally {
    drawIn.value = false
  }
}

/** 组件挂载的时候 */
onMounted(async() => {
  // 获取模型列表
  const response = await getModelSimpleList(AiModelTypeEnum.IMAGE)
  models.value = response.data
  // 初始化模型ID为第一个模型
  if (models.value.length > 0) {
    form.value.modelId = models.value[0].id
  }
})
</script>

<style lang="scss" scoped>
.common-form {
  padding: 1.25rem;
  height: 100%;
  overflow: auto;

  .size-buttons > button {
    width: 100px;
    margin-left: 0;
    margin-top: 10px;
    margin-right: 10px;
  }
}
</style>
