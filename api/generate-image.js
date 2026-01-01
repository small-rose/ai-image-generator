// api/generate-image.js
module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    return response.status(405).end('Method Not Allowed');
  }

  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
  if (!DASHSCOPE_API_KEY) {
    return response.status(500).json({ error: 'Missing DASHSCOPE_API_KEY' });
  }

  try {
    const { prompt, style } = await request.json();
    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required' });
    }

    const styleMap = {
      '写实': '写实风格',
      '动漫': '动漫风格',
      '油画': '油画风格',
      '数码艺术': '数字艺术'
    };
    const fullPrompt = `${prompt}, ${styleMap[style] || ''}`;

    const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
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

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Qwen API error:', errorText);
      return response.status(500).json({ error: `Qwen API: ${res.status}` });
    }

    const data = await res.json();
    const imageUrl = data.output?.results?.[0]?.url;

    if (imageUrl) {
      response.status(200).json({ imageUrl });
    } else {
      response.status(500).json({ error: 'No image URL returned' });
    }
  } catch (err) {
    console.error('Generate error:', err);
    response.status(500).json({ error: err.message || 'Internal error' });
  }
};
