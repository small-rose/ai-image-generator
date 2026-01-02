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

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error('Moonshot error:', text);
      // 降级返回保底提示词
    }

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
        "水墨山水画，有仙鹤和云雾",
        "未来主义太空站内部",
        "樱花树下的和服少女",
        "机械巨龙在沙漠中",
        "海底发光水母群",
        "中世纪魔法学院图书馆",
        "极光下的北极熊"
      ];
    }

    return res.status(200).json(prompts);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(200).json([
      "一只穿着宇航服的猫在月球上",
      "复古蒸汽朋克图书馆",
      "梦幻星空下的独角兽",
      "雨中的霓虹城市",
      "森林里的发光鹿",
      "未来机甲战士",
      "海底沉船宝藏",
      "敦煌飞天壁画风格",
      "赛博朋克猫咪"
    ]);
  }
};
