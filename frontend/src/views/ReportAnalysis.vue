<template>
  <div class="report-analysis">
    <el-card class="analysis-card">
      <div class="card-header">
        <h2>报表数据分析</h2>
      </div>

      <div class="main-content">
        <!-- 左侧输入区域 -->
        <div class="input-section">
          <div class="file-upload-area">
            <el-upload
              class="upload-demo"
              drag
              action=""
              :http-request="handleUpload"
              :before-upload="beforeUpload"
              accept=".csv"
              :show-file-list="false"
            >
              <div class="upload-content">
                <i class="el-icon-upload"></i>
                <div class="upload-text">
                  <template v-if="file">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="upload-tip">点击重新上传</div>
                  </template>
                  <template v-else>
                    <div>点击上传 / 拖拽CSV文件</div>
                    <div class="upload-tip">文件大小限制10M以内</div>
                  </template>
                </div>
              </div>
            </el-upload>
          </div>

          <!-- 新增分析模式选择区 -->
          <div class="analysis-mode-selector">
            <!-- 添加模型选择 -->
            <el-select
              size="small"
              v-model="selectedModel"
              placeholder="选择模型"
              class="model-selector"
            >
              <el-option
                v-for="item in modelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <div class="mode-icons">
              <el-tooltip content="文本分析模式" placement="top">
                <div
                  class="mode-icon-wrapper"
                  :class="{ active: analysisMode === 'text' }"
                  @click="switchMode('text')"
                >
                  <i class="el-icon-document mode-icon"></i>
                </div>
              </el-tooltip>
              <el-tooltip
                content="图表分析模式（支持饼图/折线图/XY图）"
                placement="top"
              >
                <div
                  class="mode-icon-wrapper"
                  :class="{ active: analysisMode === 'chart' }"
                  @click="switchMode('chart')"
                >
                  <i class="el-icon-pie-chart mode-icon"></i>
                </div>
              </el-tooltip>
            </div>
          </div>

          <div class="prompt-area">
            <el-input
              type="textarea"
              v-model="prompt"
              :rows="6"
              :placeholder="promptPlaceholder"
            ></el-input>
          </div>
          <div class="action-section">
            <el-button
              type="primary"
              @click="handleAnalyze"
              :loading="analyzing"
            >
              {{ analyzing ? "分析中..." : "开始分析" }}
            </el-button>
          </div>
        </div>

        <!-- 右侧结果区域 -->
        <div class="result-section" :class="{ 'has-result': result }">
          <template v-if="result">
            <div class="result-header">
              <h3>分析结果</h3>
              <div class="result-stats">
                <span class="stat-item">
                  <i class="el-icon-time"></i>
                  耗时：{{ analysisStats.totalTime }}秒
                </span>
                <span class="stat-item">
                  <i class="el-icon-data-line"></i>
                  Tokens：{{ analysisStats.totalTokens }}
                  <el-tooltip effect="dark" placement="top">
                    <template #content>
                      <div>输入：{{ analysisStats.inputTokens }}</div>
                      <div>输出：{{ analysisStats.outputTokens }}</div>
                    </template>
                    <i class="el-icon-question"></i>
                  </el-tooltip>
                </span>
                <el-button
                  v-if="showType === 'text'"
                  type="text"
                  icon="el-icon-document-copy"
                  @click="copyResult"
                >
                  复制结果
                </el-button>
                <!-- 导出按钮 -->
                <el-button
                  v-if="showType === 'chart'"
                  size="small"
                  type="text"
                  icon="el-icon-download"
                  @click="exportChart"
                >
                  导出图片
                </el-button>
              </div>
            </div>

            <!-- 根据模式选择显示的组件 -->
            <chart-analysis
              ref="chartAnalysisRef"
              v-show="showType === 'chart'"
              :content="result"
            />
            <text-analysis v-show="showType === 'text'" :content="result" />
          </template>
          <div v-else class="empty-result">
            <i class="el-icon-data-analysis"></i>
            <p>分析结果将在这里显示</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { analyzeReport } from "../api/analysis";
import ChartAnalysis from "../components/ChartAnalysis.vue";
import TextAnalysis from "../components/TextAnalysis.vue";

export default {
  name: "ReportAnalysis",
  components: {
    ChartAnalysis,
    TextAnalysis,
  },
  data() {
    return {
      file: null,
      prompt: "",
      analyzing: false,
      result: "",
      showType: "text",
      analysisMode: "text",
      selectedModel: "deepseek-chat", // 默认模型
      modelOptions: [
        { label: "Grok-2", value: "grok-2-1212" },
        { label: "deepseek-chat", value: "deepseek-chat" },
        { label: "Qwen 2.5", value: "qwen2.5:latest" },
        {
          label: "qwen2.5-coder-14b",
          value: "qwen2.5-coder-14b-instruct",
        },
        // {
        //   label: "deepseek-coder-v2",
        //   value: "deepseek-coder-v2-lite-instruct-mlx",
        // },
        {
          label: "qwen2.5:14b",
          value: "qwen2.5:14b",
        },
        {
          label: "deepseek-coder-v2",
          value: "deepseek-coder-v2:latest",
        },
      ],
      analysisStats: {
        totalTime: "0.00",
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    };
  },
  computed: {
    promptPlaceholder() {
      return this.analysisMode === "chart"
        ? "请输入图表分析需求，支持：\n1. 饼图：适用于占比分析\n2. 折线图：适用于趋势分析\n3. XY图：适用于相关性分析"
        : "请输入文本数据分析相关的提示词";
    },
  },
  mounted() {},
  methods: {
    beforeUpload(file) {
      const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
      const isLt10M = file.size / 1024 / 1024 < 10;

      if (!isCSV) {
        this.$message.error("只能上传 CSV 文件!");
        return false;
      }
      if (!isLt10M) {
        this.$message.error("文件大小不能超 10MB!");
        return false;
      }

      return true;
    },
    handleUpload(options) {
      this.file = options.file;
      this.$message.success("文件已选择");
    },
    copyResult() {
      navigator.clipboard
        .writeText(this.result)
        .then(() => {
          this.$message.success("分析结果已复制到剪贴板");
        })
        .catch(() => {
          this.$message.error("复制失败，请手动复制");
        });
    },
    exportChart() {
      console.log("exportChart");
      this.$refs.chartAnalysisRef.exportChart();
    },
    switchMode(mode) {
      this.analysisMode = mode;
    },
    async handleAnalyze() {
      if (!this.file) {
        this.$message.warning("请先上传文件");
        return;
      }

      if (!this.prompt.trim()) {
        this.$message.warning("请输入提示词");
        return;
      }

      try {
        this.analyzing = true;
        this.result = "";
        this.analysisStats = {
          totalTime: "0.00",
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        };

        const formData = new FormData();
        formData.append("file", this.file);
        formData.append("prompt", this.prompt);
        formData.append("mode", this.analysisMode);
        formData.append("model", this.selectedModel); // 添加模型参数

        const response = await analyzeReport(formData);

        const { content, stats } = response.data.data;
        this.result = content;
        this.analysisStats = stats;

        this.showType = this.analysisMode;

        if (this.showType === "chart") {
          this.$nextTick(() => {
            this.$refs.chartAnalysisRef.renderChart();
          });
        }
        this.$message.success("分析完成");
      } catch (error) {
        console.error("Analysis error:", error);
        this.$message.error(error.response?.data?.message || "分析失败");
      } finally {
        this.analyzing = false;
      }
    },
  },
};
</script>

<style scoped>
.report-analysis {
  padding: 32px;
  background-color: #f5f7fa;
  /* height: 100vh; */
  padding: 0;
  margin: 0;
  /* overflow: hidden; */
}

.analysis-card {
  /* max-width: 1200px; */
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fff;
}

.card-header {
  margin-bottom: 32px;
  text-align: center;
  position: relative;
  padding-bottom: 16px;
}

.card-header h2 {
  font-size: 24px;
  color: #2c3e50;
  font-weight: 600;
  margin: 0;
  position: relative;
  display: inline-block;
}

.card-header h2::after {
  content: "";
  position: absolute;
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #53a8ff);
  border-radius: 3px;
}

.main-content {
  display: flex;
  gap: 32px;
  min-height: 600px;
}

.input-section {
  flex: 0 0 45%;
  display: flex;
  flex-direction: column;
}

.result-section {
  flex: 1;
  border-left: 1px solid #ebeef5;
  padding-left: 32px;
  display: flex;
  flex-direction: column;
}

.empty-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-result i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #dcdfe6;
}

.empty-result p {
  font-size: 14px;
  margin: 0;
}

.prompt-area {
  margin-bottom: 16px;
}

.prompt-area :deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
  resize: none;
  min-height: 120px;
  white-space: pre-line;
}

.prompt-area :deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.file-upload-area {
  margin-bottom: 16px;
}

.upload-demo {
  border-radius: 8px;
  overflow: hidden;
}
.upload-demo :deep(.el-upload) {
  width: 100%;
}
.upload-demo :deep(.el-upload-dragger) {
  width: 100%;
}
.upload-demo:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

.upload-content {
  padding: 16px;
  text-align: center;
}

.upload-content i {
  font-size: 24px;
  color: #409eff;
  margin-bottom: 8px;
}

.upload-text {
  color: #606266;
  font-size: 14px;
}

.file-name {
  color: #409eff;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.action-section {
  text-align: center;
  margin-top: 24px;
}

.action-section .el-button {
  padding: 12px 36px;
  font-size: 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.result-header {
  margin-bottom: 16px;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 13px;
}

.stat-item i {
  font-size: 14px;
  color: #909399;
}

.stat-item .el-icon-question {
  font-size: 12px;
  cursor: pointer;
  color: #c0c4cc;
}

.stat-item .el-icon-question:hover {
  color: #909399;
}

.result-content {
  flex: 1;
  overflow: auto;
  border-radius: 8px;
  background: #f8f9fa;
  padding: 10px;
  max-height: 500px;
}

/* 自定义滚动条样式 */
.result-content :deep(.type-writer::-webkit-scrollbar) {
  width: 8px;
}

.result-content :deep(.type-writer::-webkit-scrollbar-track) {
  background: #f5f7fa;
  border-radius: 0 8px 8px 0;
}

.result-content :deep(.type-writer::-webkit-scrollbar-thumb) {
  background: #dcdfe6;
  border-radius: 4px;
  border: 2px solid #f5f7fa;
}

.result-content :deep(.type-writer::-webkit-scrollbar-thumb:hover) {
  background: #c0c4cc;
}

.result-content :deep(.type-writer) {
  max-height: 500px;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.8;
  color: #2c3e50;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media screen and (max-width: 992px) {
  .main-content {
    flex-direction: column;
    gap: 24px;
    min-height: auto;
  }

  .input-section {
    flex: none;
    width: 100%;
  }

  .result-section {
    border-left: none;
    border-top: 1px solid #ebeef5;
    padding-left: 0;
    padding-top: 24px;
    min-height: 400px;
  }
}

@media screen and (max-width: 768px) {
  .report-analysis {
    padding: 16px;
  }

  .card-header h2 {
    font-size: 20px;
  }

  .action-section {
    text-align: center;
  }

  .action-section .el-button {
    width: 100%;
  }
}

.analysis-mode-selector {
  margin: 16px 0 0 0;
  padding: 2px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.mode-icons {
  display: flex;
  gap: 16px;
}

.model-selector {
  min-width: 150px;
}

.mode-icon-wrapper {
  position: relative;
  cursor: pointer;
  padding: 8px;
  transition: all 0.3s ease;
}

.mode-icon {
  font-size: 20px;
  transition: all 0.3s ease;
  color: #909399;
}

.mode-icon-wrapper:hover .mode-icon {
  transform: scale(1.1);
}

.mode-icon-wrapper.active .mode-icon {
  color: #409eff;
}

.mode-icon-wrapper.active::after {
  content: "";
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background-color: #409eff;
  border-radius: 1px;
}
</style>
