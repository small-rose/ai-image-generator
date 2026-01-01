// api/generate-image.js
const { DASHSCOPE_API_KEY } = process.env;

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { prompt, style } = await request.json();
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

    const data = await res.json();

    if (data.output?.results?.[0]?.url) {
      return new Response(JSON.stringify({ imageUrl: data.output.results[0].url }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: data.message || '生成失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
