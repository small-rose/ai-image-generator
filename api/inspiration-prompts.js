// /api/inspiration-prompts.js
export default async () => {
  const apiKey = process.env.MOONSHOT_API_KEY;
  const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: '生成9个中文AI绘画提示词，每个一行，不要编号，内容多样化（动物、风景、人物、科幻等）' }],
      temperature: 0.8
    })
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  const prompts = text.split('\n').filter(p => p.trim()).slice(0, 9);
  return new Response(JSON.stringify(prompts.length ? prompts : [
    '一只戴着墨镜的柴犬在东京街头',
    '赛博朋克风格的未来城市夜景',
    '水墨风格的山水画，有仙鹤和云雾'
  ]), { headers: { 'Content-Type': 'application/json' } });
};
