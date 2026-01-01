// api/inspiration-prompts.js
const { MOONSHOT_API_KEY } = process.env;

export default async function handler() {
  try {
    const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{
          role: 'user',
          content: '生成9个中文AI绘画提示词，每个一行，不要编号，内容多样化（动物、风景、人物、科幻、奇幻等），每行不超过20字'
        }],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const prompts = text
      .split('\n')
      .map(p => p.trim().replace(/^\d+\.\s*/, '').replace(/"/g, ''))
      .filter(p => p.length > 5 && p.length < 30)
      .slice(0, 9);

    if (prompts.length < 3) {
      prompts.push(
        "一只戴着墨镜的柴犬在东京街头",
        "赛博朋克风格的未来城市夜景",
        "水墨山水画，有仙鹤和云雾"
      );
    }

    return new Response(JSON.stringify(prompts), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify([
      "一只穿着宇航服的猫在月球上",
      "复古蒸汽朋克图书馆",
      "梦幻星空下的独角兽"
    ]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
