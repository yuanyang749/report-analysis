<template>
  <div class="type-writer" ref="content" v-html="renderedText"></div>
</template>

<script>
import MarkdownIt from 'markdown-it';

export default {
  name: 'TypeWriter',
  props: {
    text: {
      type: String,
      required: true
    },
    speed: {
      type: Number,
      default: 50
    }
  },
  data() {
    return {
      displayText: '',
      currentIndex: 0,
      md: new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true
      })
    }
  },
  computed: {
    renderedText() {
      return this.md.render(this.displayText);
    }
  },
  watch: {
    text: {
      handler(newText) {
        this.resetAndStart(newText);
      },
      immediate: true
    }
  },
  methods: {
    resetAndStart(text) {
      this.displayText = '';
      this.currentIndex = 0;
      this.typeText(text);
    },
    typeText(text) {
      if (this.currentIndex < text.length) {
        this.displayText += text[this.currentIndex];
        this.currentIndex++;
        setTimeout(() => this.typeText(text), this.speed);
        
        // 自动滚动到底部
        this.$nextTick(() => {
          const element = this.$refs.content;
          element.scrollTop = element.scrollHeight;
        });
      }
    }
  }
}
</script>

<style scoped>
.type-writer {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  white-space: pre-wrap;
  line-height: 150%;
  overflow-y: auto;
  background: #f8f9fa;
  color: #2c3e50;
  position: relative;
  font-size: 14px;
  letter-spacing: 0.3px;
  padding: 20px;
}

/* Markdown 样式 */
.type-writer :deep(h1),
.type-writer :deep(h2),
.type-writer :deep(h3),
.type-writer :deep(h4),
.type-writer :deep(h5),
.type-writer :deep(h6) {
  margin: 0;
  padding: 0;
  font-weight: 600;
  line-height: 100%;
}

.type-writer :deep(h1) { font-size: 2em; }
.type-writer :deep(h2) { font-size: 1.5em; }
.type-writer :deep(h3) { font-size: 1.25em; }
.type-writer :deep(h4) { font-size: 1em; }

.type-writer :deep(p) {
  margin: 0;
}

.type-writer :deep(ul),
.type-writer :deep(ol) {
 
  margin: 0;
  padding: 0;
  padding-left: 2em;
}

.type-writer :deep(li) {
  margin: 0;
  padding: 0;
}

.type-writer :deep(code) {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
}

.type-writer :deep(pre) {
  background-color: #f6f8fa;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

.type-writer :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 4px solid #ddd;
  color: #666;
}

.type-writer :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.type-writer :deep(th),
.type-writer :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.type-writer :deep(th) {
  background-color: #f6f8fa;
}

.type-writer :deep(a) {
  color: #0366d6;
  text-decoration: none;
}

.type-writer :deep(a:hover) {
  text-decoration: underline;
}

@media screen and (max-width: 768px) {
  .type-writer {
    font-size: 13px;
    padding: 16px;
  }
}
</style> 