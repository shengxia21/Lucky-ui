<template>
  <el-drawer
    v-model="showDrawer"
    title="图片详细"
    @close="handleDrawerClose"
  >
    <div v-loading="loading">
      <!-- 图片预览 -->
      <div class="image-div">
        <image-preview
          :src="detail.picUrl"
          width="100%"
          height="100%"
        />
      </div>

      <!-- 基础信息 -->
      <el-descriptions title="基础信息" :column="1" :label-width="100" border>
        <el-descriptions-item label="提交时间">
          {{ parseTime(detail.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="生成时间">
          {{ parseTime(detail.finishTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="模型">
          {{ detail.model }}({{ detail.height }}x{{ detail.width }})
        </el-descriptions-item>
        <el-descriptions-item label="提示词">
          <div class="prompt-text">{{ detail.prompt }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="图片地址">
          <div class="url-text">{{ detail.picUrl }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </el-drawer>
</template>

<script setup>
import { getImageMy } from '@/api/ai/image'

const showDrawer = ref(false)
const detail = ref({})
const loading = ref(false)

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
    default: false
  },
  imageId: {
    type: [Number, String]
  }
})

const emits = defineEmits(['close'])

watch(() => props.show, (newVal, _oldVal) => {
  showDrawer.value = newVal
})

watch(() => props.imageId, (newVal, _oldVal) => {
  if (newVal) {
    getImageDetail(newVal)
  }
})

const getImageDetail = async (imageId) => {
  loading.value = true
  const { data } = await getImageMy(imageId)
  detail.value = data
  loading.value = false
}

const handleDrawerClose = () => {
  emits('close')
}
</script>

<style lang="scss" scoped>
.image-div {
  margin-bottom: 1.25rem;
  height: 25rem;
}

.prompt-text {
  word-break: break-word;
}

.url-text {
  word-break: break-all;
  font-size: 0.75rem;
}
</style>
