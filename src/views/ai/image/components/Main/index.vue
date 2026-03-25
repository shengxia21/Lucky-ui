<template>
  <el-card
    class="image-list-container"
    :body-style="{ height: '100%', position: 'relative' }"
    shadow="never"
  >
    <template #header>
      <div class="card-header">
        <span>绘画任务</span>
        <el-button @click="handleViewPublic">绘画作品</el-button>
      </div>
    </template>

    <!-- 图片列表 -->
    <div class="image-grid" v-loading="loading">
      <image-card
        v-for="image in imageList"
        :key="image.id"
        :detail="image"
        @onDeleteSuccess="getImageList"
        @onRegeneration="handleRegeneration"
      />
    </div>

    <div class="pagination-div">
      <pagination
        v-show="total>0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getImageList"
      />
    </div>
  </el-card>
</template>

<script setup>
import { getMyImagePage, getImageListMyByIds } from '@/api/ai/image'
import { AiImageStatusEnum } from '@/utils/constants/aiConstant'
import ImageCard from './ImageCard.vue'

const total = ref(0)
const imageList = ref([])
const loading = ref(false)
// 图片轮询相关的参数（正在生成中的）
const inProgressImageMap = ref({}) // 监听的 image 映射，一般是生成中（需要轮询），key 为 image 编号，value 为 image
const inProgressTimer = ref() // 生成中的 image 定时器，轮询生成进展

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10
})

// 获取图片列表
const getImageList = async () => {
  try {
    // 1. 加载图片列表
    loading.value = true
    const response = await getMyImagePage(queryParams)
    imageList.value = response.rows
    total.value = response.total
    // 2. 计算需要轮询的图片
    const waitImages = {}
    imageList.value.forEach((item) => {
      if (item.status === AiImageStatusEnum.IN_PROGRESS) {
        waitImages[item.id] = item
      }
    })
    inProgressImageMap.value = waitImages
    // 3. 启动轮询
    if (Object.keys(waitImages).length > 0) {
      startPolling()
    }
  } finally {
    // 关闭正在"加载中"的 Loading
    loading.value = false
  }
}

// 启动轮询
const startPolling = () => {
  if (!inProgressTimer.value) {
    inProgressTimer.value = setInterval(refreshWatchImages, 1000 * 5)
  }
}

// 停止轮询
const stopPolling = () => {
  if (inProgressTimer.value) {
    clearInterval(inProgressTimer.value)
    inProgressTimer.value = null
  }
}

// 轮询生成中的 image 列表
const refreshWatchImages = async () => {
  const imageIds = Object.keys(inProgressImageMap.value).map(Number)
  if (imageIds.length === 0) {
    // 没有正在生成中的图片，轮询结束
    stopPolling()
    return
  }

  const { data: list } = await getImageListMyByIds(imageIds)
  const newWatchImages = {}
  list.forEach((image) => {
    if (image.status === AiImageStatusEnum.IN_PROGRESS) {
      newWatchImages[image.id] = image
    } else {
      const index = imageList.value.findIndex((oldImage) => image.id === oldImage.id)
      if (index >= 0) {
        // 更新 imageList
        imageList.value[index] = image
      }
    }
  })
  inProgressImageMap.value = newWatchImages

  // 避免重复轮询，提前结束
  if (Object.keys(newWatchImages).length === 0) {
    stopPolling()
  }
}

// 处理查看公共图片
const handleViewPublic = () => {
  console.log('handleViewPublic')
}

// 处理重新生成
const handleRegeneration = (imageDetail) => {
  console.log('handleRegeneration', imageDetail)
}

defineExpose({ getImageList })

onMounted(() => {
  getImageList()
})

onUnmounted(() => {
  // 组件卸载时，清除定时器
  stopPolling()
})
</script>

<style lang="scss" scoped>
.image-list-container {
  width: 100%;
  height: 100%;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .image-grid {
    display: flex;
    flex-wrap: wrap;
    height: 100%;
    overflow: auto;
    padding: 0.5rem;
    padding-bottom: 140px;

    & > div {
      margin-right: 1rem;
      margin-bottom: 1rem;
    }
  }

  .pagination-div {
    position: absolute;
    bottom: 0;
    left: 0;
    padding-bottom: 23px;
    height: 50px;
    width: 100%;
    z-index: 999;
    background-color: white;
    display: flex;
    justify-content: center;
  }
}
</style>
