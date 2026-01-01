// /api/generate-image.js  qianwen
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { prompt, style } = await req.json();
  const apiKey = process.env.DASHSCOPE_API_KEY;

  const styleMap = { '写实': '写实风格', '动漫': '动漫风格', '油画': '油画风格', '数码艺术': '数字艺术' };
  const fullPrompt = `${prompt}, ${styleMap[style] || ''}`;

  const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'wanx-v1',
      input: { prompt: fullPrompt },
      parameters: { size: '1024*1024' }
    })
  });

  const data = await res.json();
  const url = data.output?.results?.[0]?.url;

  return new Response(JSON.stringify({ imageUrl: url, error: data.message }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
