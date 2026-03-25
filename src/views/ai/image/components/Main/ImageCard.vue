<template>
  <el-card class="image-card">
    <div class="card-actions">
      <div>
        <el-button type="primary" text bg v-if="detail?.status === AiImageStatusEnum.IN_PROGRESS">
          生成中
        </el-button>
        <el-button text bg v-else-if="detail?.status === AiImageStatusEnum.SUCCESS">
          已完成
        </el-button>
        <el-button type="danger" text bg v-else-if="detail?.status === AiImageStatusEnum.FAIL">
          异常
        </el-button>
      </div>

      <!-- 操作按钮 -->
      <div>
        <el-button
          class="action-btn"
          text
          :icon="Download"
          @click="handleButtonClick('download', detail)"
        />
        <el-button
          class="action-btn"
          text
          :icon="RefreshRight"
          @click="handleButtonClick('regeneration', detail)"
        />
        <el-button
          class="action-btn"
          text
          :icon="Delete"
          @click="handleButtonClick('delete', detail)"
        />
        <el-button
          class="action-btn"
          text
          :icon="More"
          @click="handleButtonClick('more', detail)"
        />
      </div>
    </div>

    <!-- 图片展示 -->
    <div class="image-container" v-loading="loading">
      <image-preview
        :src="detail.picUrl"
        width="100%"
        height="100%"
        v-if="detail?.status !== AiImageStatusEnum.FAIL"
      />
      <div class="error-message" v-else>
        {{ detail?.errorMessage }}
      </div>
    </div>

    <!-- 图片详情 -->
    <image-detail
      :show="showDetail"
      :image-id="imageId"
      @close="handleDetailClose"
    />
  </el-card>
</template>

<script setup>
import ImageDetail from './ImageDetail.vue'
import { Delete, Download, More, RefreshRight } from '@element-plus/icons-vue'
import { AiImageStatusEnum } from '@/utils/constants/aiConstant'
import { deleteImageMy } from '@/api/ai/image'

const { proxy } = getCurrentInstance()

const props = defineProps({
  detail: {
    type: Object,
    required: true
  }
})

watch(() => props.detail.status, (value) => {
  handleLoading(value)
})

const emits = defineEmits(['onDeleteSuccess', 'onRegeneration'])

const loading = ref(false)  // 图片加载中
const showDetail = ref(false) // 是否显示图片详情
const imageId = ref('') // 图片详情ID

// 处理按钮点击事件
const handleButtonClick = (type, imageDetail) => {
  // 详情
  if (type === 'more') {
    imageId.value = imageDetail.id
    showDetail.value = true
  }
  // 删除
  else if (type === 'delete') {
    proxy.$modal.confirm(`是否删除照片?`).then(() => {
      return deleteImageMy(imageDetail.id)
    }).then(() => {
      proxy.$modal.msgSuccess('删除成功')
      emits('onDeleteSuccess')
    }).catch(() => {})
  }
  // 下载
  else if (type === 'download') {
    if (props.detail.status === AiImageStatusEnum.IN_PROGRESS) {
      proxy.$modal.msgError('照片还未生成完成，无法下载')
      return
    } else if (props.detail.status === AiImageStatusEnum.FAIL) {
      proxy.$modal.msgError('照片生成失败，无法下载')
      return
    }
    proxy.$download.resource(imageDetail.picUrl)
  }
  // 重新生成
  else if (type === 'regeneration') {
    emits('onRegeneration', imageDetail)
  }
}

// 关闭详情抽屉
const handleDetailClose = () => {
  showDetail.value = false
  imageId.value = ''
}

// 处理图片加载状态
const handleLoading = (status) => {
  if (status === AiImageStatusEnum.IN_PROGRESS) {
    loading.value = true
  } else {
    loading.value = false
  }
}

onMounted(() => {
  handleLoading(props.detail.status)
})
</script>

<style lang="scss" scoped>
.image-card {
  width: 20rem;
  height: 23.5rem;
  border-radius: 10px;

  .card-actions {
    display: flex;
    justify-content: space-between;

    .action-btn {
      padding: 10px;
      margin: 0;
    }
  }

  .image-container {
    margin-top: 20px;
    height: 280px;

    .error-message {
      color: var(--el-color-danger);
      margin-top: 0.5rem;
      font-size: 0.875rem;
      word-break: break-all;
    }
  }
}
</style>
