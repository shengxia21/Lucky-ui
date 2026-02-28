<template>
  <div class="image-page">
    <div class="left-sidebar">
      <common ref="commonRef" @onDrawComplete="handleDrawComplete" />
    </div>
    <div class="main-content">
      <image-list ref="imageListRef" />
    </div>
  </div>
</template>

<script setup name="Image">
import Common from './components/common/index.vue'
import ImageList from './components/imageInfo/ImageList.vue'

const commonRef = ref()
const imageListRef = ref()

/** 生成图片完成后,刷新图片列表 */
const handleDrawComplete = () => {
  imageListRef.value.getImageList()
}
</script>

<style lang="scss" scoped>
.image-page {
  display: flex;
  width: 100%;
  height: 100%;

  .left-sidebar {
    width: 390px;
  }

  .main-content {
    flex: 1;
    background-color: white;
  }
}
</style>
