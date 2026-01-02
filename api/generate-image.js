// api/generate-image.js
module.exports = async (req, res) => {
  // 1. 设置 CORS（可选但推荐）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 仅允许 POST
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // 4. 读取请求体（关键修复！）
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  await new Promise(resolve => req.on('end', resolve));

  let prompt, style;
  try {
    const json = JSON.parse(body);
    prompt = json.prompt;
    style = json.style;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // 5. 获取 API Key
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
  if (!DASHSCOPE_API_KEY) {
    return res.status(500).json({ error: 'Missing DASHSCOPE_API_KEY' });
  }

  try {
    const styleMap = {
      '写实': '写实风格',
      '动漫': '动漫风格',
      '油画': '油画风格',
      '数码艺术': '数字艺术'
    };
    const fullPrompt = `${prompt}, ${styleMap[style] || ''}`;

    const apiRes = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'wanx-v1',
        input: { prompt: fullPrompt },
        parameters: { size: '1024*1024' }
      })
    });

    const data = await apiRes.json();

    if (data.output?.results?.[0]?.url) {
      res.status(200).json({ imageUrl: data.output.results[0].url });
    } else {
      console.error('Qwen API error:', data);
      res.status(500).json({ error: data.message || 'Image generation failed' });
    }
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
