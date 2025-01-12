require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    llmApiUrl: process.env.LLM_API_URL || 'http://localhost:1234/v1/chat/completions',
    llmApiKey: process.env.LLM_API_KEY || '',
    requestTimeout: process.env.REQUEST_TIMEOUT || 600000,
    modelName: process.env.MODEL_NAME || 'qwen2-7b-instruct'
}; 