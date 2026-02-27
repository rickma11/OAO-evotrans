const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// 飞书应用信息
const APP_ID = 'cli_a92bade0463f9bc6';
const APP_SECRET = 'sHjefg5iK5SbaF05Jt4UFhdcFolmXV42';
const SPREADSHEET_TOKEN = 'LShHw040qiPp2hkdGKFcnQGdnGJ';
const SHEET_ID = '7b9b5f'; // 请根据实际工作表ID修改

// 启用CORS
app.use(cors());

// 获取访问令牌
async function getAccessToken() {
  try {
    const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/', {
      app_id: APP_ID,
      app_secret: APP_SECRET
    });
    return response.data.tenant_access_token;
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    throw error;
  }
}

// 获取表格数据
async function getSheetData() {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${SPREADSHEET_TOKEN}/sheets/${SHEET_ID}/values`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data.values;
  } catch (error) {
    console.error('获取表格数据失败:', error);
    throw error;
  }
}

// 转换数据格式
function transformData(rows) {
  const translations = {};
  // 跳过表头（第一行）
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const english = row[0];
    const webpagedata = row[1];
    const shorten = row[2] || webpagedata;
    
    if (english && webpagedata) {
      translations[english] = {
        webpagedata,
        shorten
      };
    }
  }
  return translations;
}

// API端点
app.get('/api/evolutions', async (req, res) => {
  try {
    const rows = await getSheetData();
    const data = transformData(rows);
    res.json(data);
  } catch (error) {
    console.error('API请求失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API端点: http://localhost:${PORT}/api/evolutions`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});