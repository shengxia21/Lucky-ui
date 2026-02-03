<template>
  <div class="category-container">
    <div class="category-item" v-for="category in categoryList" :key="category">
      <el-button
        plain
        round
        size="small"
        :type="category === active ? 'primary' : ''"
        @click="handleCategoryClick(category)"
      >
        {{ category }}
      </el-button>
    </div>
  </div>
</template>

<script setup name="RoleCategoryList">
// 定义属性
defineProps({
  categoryList: {
    type: Array,
    required: true
  },
  active: {
    type: String,
    required: false,
    default: '全部'
  }
})

// 定义回调
const emits = defineEmits(['onCategoryClick'])

/** 处理分类点击事件 */
const handleCategoryClick = (category) => {
  emits('onCategoryClick', category)
}
</script>

<style lang="scss" scoped>
.category-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;

  .category-item {
    display: flex;
    flex-direction: row;
    margin-right: 10px;
  }
}
</style>
