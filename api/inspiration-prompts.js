// api/inspiration-prompts.js
// ✅ 正确：Node.js Serverless Function 写法（CommonJS 兼容）
// api/inspiration-prompts.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
  if (!MOONSHOT_API_KEY) {
    return res.status(500).json({ error: 'Missing MOONSHOT_API_KEY' });
  }

  try {
    const apiRes = await fetch('https://api.moonshot.cn/v1/chat/completions', {
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

    const data = await apiRes.json();
    let prompts = [];

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      prompts = text
        .split('\n')
        .map(p => p.trim().replace(/^\d+\.\s*/, '').replace(/"/g, ''))
        .filter(p => p.length > 5 && p.length < 30)
        .slice(0, 9);
    }

    if (prompts.length < 3) {
      prompts = [
        "一只戴着墨镜的柴犬在东京街头",
        "赛博朋克风格的未来城市夜景",
        "水墨山水画，有仙鹤和云雾"
      ];
    }

    res.status(200).json(prompts);
  } catch (err) {
    console.error('Moonshot error:', err);
    res.status(500).json([
      "一只穿着宇航服的猫在月球上",
      "复古蒸汽朋克图书馆",
      "梦幻星空下的独角兽"
    ]);
  }
};
