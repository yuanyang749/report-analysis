<template>
  <div class="text-analysis">
    <type-writer 
      :text="content" 
      :speed="30"
      class="result-content"
    />
  </div>
</template>

<script>
import TypeWriter from './TypeWriter.vue'

export default {
  name: 'TextAnalysis',
  components: {
    TypeWriter
  },
  props: {
    content: {
      type: String,
      required: true
    }
  }
}
</script>

<style scoped>
.text-analysis {
  height: 100%;
}

.result-content {
  max-height: 500px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 8px;
  color: #2c3e50;
}

/* 自定义滚动条样式 */
.result-content::-webkit-scrollbar {
  width: 8px;
}

.result-content::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 0 8px 8px 0;
}

.result-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 4px;
  border: 2px solid #f5f7fa;
}

.result-content::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style> 