// api/generate-image.js
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // Read request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  await new Promise(resolve => req.once('end', resolve));

  let data;
  try {
    data = JSON.parse(body);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { prompt, style } = data;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Valid prompt is required' });
  }

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
    const fullPrompt = `${prompt.trim()}, ${styleMap[style] || ''}`;

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

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error('Qwen API error:', text);
      return res.status(apiRes.status).json({ error: 'Qwen API error' });
    }

    const result = await apiRes.json();
    const imageUrl = result.output?.results?.[0]?.url;

    if (imageUrl) {
      return res.status(200).json({ imageUrl });
    } else {
      return res.status(500).json({ error: 'No image returned' });
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
