const axios = require("axios");
const config = require("../config/config");
const csv = require("csv-parse/sync");

class LLMService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: config.llmApiUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.llmApiKey}`,
      },
      timeout: config.requestTimeout,
    });
  }

  async analyzeReportData(
    csvData,
    customPrompt,
    mode = "text",
    model = "grok-2-1212"
  ) {
    try {
      const startTime = Date.now();
      console.log("开始解析CSV数据...");

      // 解析CSV数据
      const records = csv.parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        encoding: "utf8",
      });

      console.log(`成功解析 ${records.length} 条记录`);

      // 使用新的格式化方法处理数据
      const formattedContent = this.formatCSVData(records);
      console.log(formattedContent);
      // 使用传入的mode参数判断是否需要生成图表
      const isChartMode = mode === "chart";

      // 构建系统提示词
      const systemPrompt = isChartMode
        ? this.getChartSystemPrompt()
        : this.getTextSystemPrompt();

      // 构建用户提示词
      const userPrompt = this.constructPrompt(
        formattedContent,
        customPrompt,
        isChartMode
      );

      console.log("正在调用AI模型分析数据...");
      const response = await this.apiClient.post(config.llmApiUrl, {
        model: model,
        temperature: 0.7,
        max_tokens: 4000,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      if (!response.data?.choices?.[0]) {
        throw new Error("AI模型返回数据格式异常");
      }

      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      const content = response.data.choices[0].message.content;
      const inputTokens = this.estimateTokens(userPrompt);
      const outputTokens = this.estimateTokens(content);

      return {
        content,
        stats: {
          totalTime: totalTime.toFixed(2),
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
      };
    } catch (error) {
      console.error("数据分析出错:", error);
      throw new Error(
        error.response?.data?.error?.message || error.message || "数据分析失败"
      );
    }
  }

  getChartSystemPrompt() {
    return `你是一个专业的数据可视化专家。请使用Mermaid语法创建图表来展示数据分析结果，并提供分析说明。

注意事项：
1. 数据的完整性和准确性
2. 返回格式为：先是Mermaid图表代码，后跟文字分析
3. 确保Mermaid语法正确
4. 图表类型根据数据特点选择最合适的（饼图、折线图、XY图等）
5. 所有图表，请确保：
   - 添加标题
   - 图例说明清晰
   - 数据标签合理

6. 对于饼图，请确保：
   - 包含百分比标签
   - 合理的颜色区分
   - 重要数据突出显示

7. 对于折线图，请确保：
   - 添加X轴和Y轴的标签
   - 数据点标记清晰
   - 使用合适的线条样式
   - 一定要包含line数据
   - 不需要bar数据
   - 多条线时使用不同的线型

8. 对于XY图，请确保：
   - 一定要包含line,bar结构数据
   - 坐标轴标签明确
   - 数据点分布清晰
   - 合理的数据范围
   - 重要数据点标注

9. 在图表代码后，另起一行添加对图表的分析说明

图表mermaid示例格式：

1. 饼图示例：
\`\`\`mermaid
pie showData
    title 客户分布情况
    "新客户" : 30
    "老客户" : 70
\`\`\`

2. 折线图示例：
\`\`\`mermaid
xychart-beta 
    title "所属校区与客户数量的关系"
    x-axis ["A测试校区", "台北校区", "澎湖校区", "唐校长的校区1234", "聂卫平围棋网校-新"]
    y-axis "客户数量" 0 --> 10
    line [1, 2, 3, 5, 6]
\`\`\`

3. XY图示例：
\`\`\`mermaid
 xychart-beta
    title "所属校区与客户数量的关系"
    x-axis ["A测试校区", "台北校区", "澎湖校区", "唐校长的校区1234", "聂卫平围棋网校-新"]
    y-axis "客户数量" 0 --> 10
    bar [1, 2, 3, 5, 6]
    line [1, 2, 3, 5, 6]
\`\`\`

分析说明示例：
根据图表可以看出以下特点：
1. 数据分布情况...
2. 主要趋势为...
3. 关键发现...
4. 建议...`;
  }

  getTextSystemPrompt() {
    return `你是一个专业的数据分析师，请根据提供的数据和分析要求，给出详细的分析结果。分析时请注意：
1. 数据的完整性和准确性
2. 数据中的关键趋势和模式
3. 异常值和特殊情况
4. 提供具体的数据支持
5. 给出合理的建议和洞见`;
  }

  constructPrompt(formattedContent, customPrompt, isChartMode) {
    if (isChartMode) {
      return `请分析以下数据，并使用Mermaid语法创建一个图表来展示分析结果。
请注意：
1. 数据已经过预处理和采样
2. 统计信息是基于全量数据
3. 采样数据用于辅助验证

${formattedContent}

分析要求：${customPrompt}

请按照以下格式返回：
1. 首先是完整的Mermaid图表代码
2. 然后是对图表的分析说明，分析时请结合统计信息`;
    }

    return `请分析以下数据：
请注意：
1. 数据已经过预处理和采样
2. 统计信息是基于全量数据
3. 采样数据用于辅助验证

${formattedContent}

分析要求：${customPrompt}`;
  }

  // 保持原有的 estimateTokens 方法不变
  estimateTokens(text) {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    const numbers = text.match(/\d+/g) || [];
    const punctuation = text.match(/[^\w\s\u4e00-\u9fa5]/g) || [];

    return (
      chineseChars.length +
      englishWords.length +
      numbers.length +
      punctuation.length
    );
  }

  formatCSVData(records) {
    if (!records || records.length === 0) {
      return "";
    }

    // 1. 数据概要
    const totalRecords = records.length;
    const headers = Object.keys(records[0]);

    // 2. 智能采样
    const sampledRecords = this.getSampledRecords(records);

    // 3. 预处理统计
    const statistics = this.calculateStatistics(records);

    // 4. 构建完整的数据描述
    return `数据概要：
- 总记录数：${totalRecords}条
- 数据字段：${headers.join(", ")}

统计信息：
${statistics}

采样数据（${sampledRecords.length}条）：
${sampledRecords
  .map((record) => `[${headers.map((header) => record[header]).join(", ")}]`)
  .join("\n")}`;
  }

  getSampledRecords(records) {
    const totalRecords = records.length;
    let sampleSize;

    // 根据数据量确定采样比例
    if (totalRecords <= 30) {
      return records; // 小数据集返回全量数据
    } else if (totalRecords <= 100) {
      sampleSize = Math.ceil(totalRecords * 0.3); // 30-100条采样30%
    } else {
      sampleSize = Math.ceil(totalRecords * 0.2); // 大于100条采样20%
    }

    // 随机采样，但确保包含一些关键记录
    const sampledData = new Set();
    const recordsCopy = [...records];

    // 随机采样
    while (sampledData.size < sampleSize && recordsCopy.length > 0) {
      const randomIndex = Math.floor(Math.random() * recordsCopy.length);
      sampledData.add(recordsCopy.splice(randomIndex, 1)[0]);
    }

    return Array.from(sampledData);
  }

  calculateStatistics(records) {
    const stats = {};

    // 获取所有字段
    const fields = Object.keys(records[0]);

    // 对每个字段进行统计
    fields.forEach((field) => {
      const fieldStats = {};
      records.forEach((record) => {
        const value = record[field];
        fieldStats[value] = (fieldStats[value] || 0) + 1;
      });

      // 计算百分比并格式化输出
      const total = records.length;
      stats[field] = Object.entries(fieldStats)
        .map(([value, count]) => ({
          value,
          count,
          percentage: ((count / total) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count); // 按数量降序排序
    });

    // 构建统计信息字符串
    return Object.entries(stats)
      .map(([field, values]) => {
        const statLines = values
          .map((v) => `  - ${v.value}: ${v.count}条 (${v.percentage}%)`)
          .join("\n");
        return `${field}分布：\n${statLines}`;
      })
      .join("\n\n");
  }
}

module.exports = new LLMService();
