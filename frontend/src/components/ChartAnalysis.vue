<template>
  <div class="chart-analysis">
    <!-- 图表区域 -->
    <div ref="mermaidChart" class="mermaid-chart"></div>
    <!-- 文字分析部分 -->
    <div class="analysis-text">
      <type-writer :text="textAnalysis" :speed="30" class="result-content" />
    </div>
    <div v-if="loading" class="loading-state">
      <i class="el-icon-loading"></i>
      <p>图表渲染中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="el-icon-warning"></i>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script>
import mermaid from "mermaid";
import TypeWriter from "./TypeWriter.vue";

export default {
  name: "ChartAnalysis",
  components: {
    TypeWriter,
  },
  props: {
    content: {
      type: String,
      required: true,
    },
    // isChartMode: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  data() {
    return {
      loading: true,
      error: null,
      textAnalysis: "", // 添加文字分析内容
    };
  },
  // watch: {
  //   content: {
  //     immediate: false,
  //     handler(newContent) {
  //       if (newContent && this.isChartMode) {
  //         this.$nextTick(() => {
  //           this.renderChart();
  //         });
  //       }
  //     },
  //   },
  // },
  mounted() {
    // 初始化mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      pie: {
        useWidth: 800,
        useHeight: 600,
        textPosition: 0.5,
        labelPosition: 0.5,
        showLegend: true,
        legendPosition: "bottom",
      },
      xyChart: {
        width: 800,
        height: 600,
        backgroundColor: "#f8f9fa",
        titleColor: "#2c3e50",
        xAxisLabelColor: "#2c3e50",
        yAxisLabelColor: "#2c3e50",
        plotColorPalette: "#409EFF, #67C23A, #E6A23C, #F56C6C",
      },
    });
  },
  methods: {
    extractContent(content) {
      // 提取 Mermaid 代码和文字分析
      const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
      const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : "";

      // 提取文字分析（Mermaid代码后的所有内容）
      let textAnalysis = "";
      if (mermaidMatch) {
        textAnalysis = content
          .slice(content.indexOf("```mermaid") + mermaidMatch[0].length)
          .trim();
      }

      return {
        mermaidCode,
        textAnalysis,
      };
    },
    async renderChart() {
      try {
        this.loading = true;
        this.error = null;

        // 提取 Mermaid 代码和文字分析
        const { mermaidCode, textAnalysis } = this.extractContent(this.content);
        console.log(mermaidCode);

        // 清空之前的内容
        const chartContainer = this.$refs.mermaidChart;
        chartContainer.innerHTML = "";

        // 创建一个新的 pre 元素来包含 mermaid 代码
        const pre = document.createElement("pre");
        pre.className = "mermaid";
        pre.textContent = mermaidCode;
        chartContainer.appendChild(pre);

        // 渲染新图表
        await mermaid.run();

        // 设置文字分析内容
        this.textAnalysis = textAnalysis;

        this.loading = false;
      } catch (error) {
        console.error("图表渲染失败:", error);
        this.error = "图表渲染失败，请检查语法是否正确";
        this.loading = false;
      }
    },
    async exportChart() {
      try {
        const svg = this.$refs.mermaidChart.querySelector("svg");
        if (!svg) {
          throw new Error("未找到图表");
        }

        // 克隆 SVG 以进行修改
        const clonedSvg = svg.cloneNode(true);

        // 设置更大的尺寸（放大2倍）
        const width = svg.width.baseVal.value * 2;
        const height = svg.height.baseVal.value * 2;
        clonedSvg.setAttribute("width", width);
        clonedSvg.setAttribute("height", height);

        // 创建一个临时的 canvas，尺寸设置为 2 倍
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // 设置更好的图像质量
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // 将 SVG 转换为图片
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const img = new Image();

        // 创建 Blob URL 而不是 Data URL
        const blob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const blobUrl = URL.createObjectURL(blob);

        return new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              // 使用白色背景
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // 绘制图像
              ctx.drawImage(img, 0, 0, width, height);

              // 使用较高质量设置导出 PNG
              const dataUrl = canvas.toDataURL("image/png", 1.0);

              // 创建下载链接
              const link = document.createElement("a");
              link.download = `chart_${new Date().getTime()}.png`;
              link.href = dataUrl;
              link.click();

              // 清理
              URL.revokeObjectURL(blobUrl);
              resolve();
            } catch (error) {
              reject(error);
            }
          };

          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error("图片加载失败"));
          };

          img.src = blobUrl;
        });
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败：" + error.message);
      }
    },
  },
};
</script>

<style scoped>
.chart-analysis {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.mermaid-chart {
  margin-bottom: 20px;
  overflow: auto;
  display: flex;
  justify-content: center;
  min-height: 400px;
  width: 100%;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.loading-state i,
.error-state i {
  font-size: 32px;
  margin-bottom: 10px;
}

.error-state {
  color: #f56c6c;
}

.chart-actions {
  text-align: right;
  margin-top: 20px;
}

/* 确保 SVG 图表居中显示并且有足够空间 */
.mermaid-chart :deep(svg) {
  max-width: 100%;
  min-width: 600px;
  height: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

/* 优化折线图和XY图的样式 */
.mermaid-chart :deep(.xychart) {
  font-size: 14px;
}

.mermaid-chart :deep(.xychart-title) {
  font-size: 16px;
  font-weight: 600;
}

.mermaid-chart :deep(.xychart-label) {
  font-size: 12px;
}

.mermaid-chart :deep(.xychart-line) {
  stroke-width: 2;
}

.mermaid-chart :deep(.xychart-point) {
  fill: #fff;
  stroke-width: 2;
}

/* 优化饼图样式 */
.mermaid-chart :deep(.pie-legend) {
  font-size: 12px;
}

.mermaid-chart :deep(.pie-label) {
  font-size: 14px;
  font-weight: 500;
}

.mermaid-chart :deep(.pie-title) {
  font-size: 16px;
  font-weight: 600;
}

/* 文字分析部分的样式 */
.analysis-text {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.result-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.8;
  color: #2c3e50;
}
</style>
