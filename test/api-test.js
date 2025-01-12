const axios = require('axios');
require('dotenv').config();

async function testApiConnection() {
    try {
        console.log('测试 LM Studio API 连接...');
        console.log('API URL:', process.env.LLM_API_URL);
        
        const response = await axios.post(process.env.LLM_API_URL, {
            messages: [
                {
                    role: "user",
                    content: "Hello"
                }
            ],
            model: "qwen2-7b-instruct",
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LLM_API_KEY}`
            }
        });

        console.log('API 连接成功!');
        console.log('响应:', response.data);
    } catch (error) {
        console.error('API 连接失败:', error.response?.data || error.message);
        console.error('完整错误:', error);
    }
}

testApiConnection(); 