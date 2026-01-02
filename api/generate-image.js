// api/generate-image.js
export default async function handler(request) {
  // 处理 CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // 仅允许 POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // 解析 JSON body
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { prompt, style } = data;
  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'Valid prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
  if (!DASHSCOPE_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing DASHSCOPE_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const styleMap = {
      '写实': '写实风格',
      '动漫': '动漫风格',
      '油画': '油画风格',
      '数码艺术': '数字艺术'
    };
    const fullPrompt = `${prompt.trim()}, ${styleMap[style] || ''}`;

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

    const apiData = await res.json();

    if (apiData.output?.results?.[0]?.url) {
      return new Response(JSON.stringify({ imageUrl: apiData.output.results[0].url }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const errorMessage = apiData.message || 'Image generation failed';
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: res.status >= 400 ? res.status : 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
