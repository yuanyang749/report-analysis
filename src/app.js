const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const { controller, upload } = require("./controllers/analysisController");

const app = express();

// 配置CORS
app.use(
  cors({
    origin: "*", // 在生产环境中应该设置为具体的域名
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 中间件
app.use(express.json());

// 路由
app.post("/api/analyze", upload.single("file"), controller.analyzeReport);

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 启动服务器
app.listen(config.port, () => {
  console.log(`服务已启动，监听端口 ${config.port}`);
});

module.exports = app;
