const llmService = require("../services/llmService");
const multer = require("multer");
const path = require("path");

// 配置 multer
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === ".csv") {
      cb(null, true);
    } else {
      cb(new Error("只支持CSV文件"));
    }
  },
});

class AnalysisController {
  async analyzeReport(req, res) {
    try {
      const startTime = Date.now();

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "请上传CSV文件",
        });
      }

      const prompt = req.body.prompt;
      const mode = req.body.mode || "text";
      const model = req.body.model || "grok-2-1212";

      if (!prompt?.trim()) {
        return res.status(400).json({
          success: false,
          message: "请提供分析提示词",
        });
      }

      console.log(`开始处理文件: ${req.file.originalname}`);
      const csvData = req.file.buffer.toString("utf-8");

      if (!csvData.trim()) {
        return res.status(400).json({
          success: false,
          message: "CSV文件内容为空",
        });
      }

      console.log("开始分析数据...");
      const analysis = await llmService.analyzeReportData(
        csvData,
        prompt,
        mode,
        model
      );
      console.log(analysis);
      const endTime = Date.now();
      const totalTime = ((endTime - startTime) / 1000).toFixed(2);

      console.log("分析完成，返回结果");
      res.json({
        success: true,
        data: {
          content: analysis.content,
          stats: {
            totalTime,
            inputTokens: analysis.stats.inputTokens,
            outputTokens: analysis.stats.outputTokens,
            totalTokens: analysis.stats.totalTokens,
          },
        },
      });
    } catch (error) {
      console.error("分析失败:", error);
      const statusCode = error.message.includes("只支持CSV文件") ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
}

module.exports = {
  controller: new AnalysisController(),
  upload,
};
