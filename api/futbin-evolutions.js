// api/futbin-evolutions.js
export default function handler(req, res) {
  // 设置 CORS 头，允许跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // FUTBIN 进化数据
  const evolutions = [
    {
      id: 50,
      content: "Birthday Warmup",
      scraped_date: "2026-03-04",
      url: "https://www.futbin.com/evolutions"
    }
    // 这里可以添加更多进化数据
  ];
  
  // 返回 JSON 数据
  res.status(200).json(evolutions);
}
