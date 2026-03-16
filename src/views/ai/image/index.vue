<template>
  <div class="image-page">
    <div class="left-sidebar">
      <image-aside ref="commonRef" @onDrawComplete="handleDrawComplete" />
    </div>
    <div class="main-content">
      <image-main ref="imageMainRef" />
    </div>
  </div>
</template>

<script setup name="Image">
import ImageAside from './components/Aside/index.vue'
import ImageMain from './components/Main/index.vue'

const imageAsideRef = ref()
const imageMainRef = ref()

/** 生成图片完成后,刷新图片列表 */
const handleDrawComplete = () => {
  imageMainRef.value.getImageList()
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
