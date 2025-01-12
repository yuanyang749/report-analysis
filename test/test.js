const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testAnalyze() {
    try {
        console.log('开始测试数据分析服务...');
        
        const csvPath = path.join(__dirname, '../意向客户列表2024年12月19日18时03分.csv');
        console.log('CSV文件路径:', csvPath);

        // 检查文件是否存在
        if (!fs.existsSync(csvPath)) {
            throw new Error('CSV文件不存在!');
        }

        console.log('正在读取CSV文件...');
        const csvFile = fs.createReadStream(csvPath);

        console.log('准备发送请求...');
        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('prompt', '请分析以下数据，并给出详细的分析报告。');

        console.log('正在发送分析请求...');
        const startTime = Date.now();
        const response = await axios.post('http://localhost:3000/api/analyze', formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 120000 // 设置2分钟超时
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n请求耗时: ${duration}秒`);
        console.log('\n分析完成! 结果如下:\n');
        console.log(response.data.data.analysis);
        
        console.log('\n测试成功完成!');
    } catch (error) {
        console.error('\n测试失败!');
        if (error.response) {
            console.error('服务器响应:', error.response.data);
            console.error('状态码:', error.response.status);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('无法连接到服务器，请确保服务已启动');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('请求超时，请检查服务器状态');
        } else {
            console.error('错误信息:', error.message);
        }
        process.exit(1);
    }
}

testAnalyze(); 