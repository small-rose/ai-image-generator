// api/generate-image.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  let body = '';
  req.on('data', chunk => body += chunk);
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

    // Step 1: 创建异步任务
    const taskRes = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-async-synthesis', {
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

    if (!taskRes.ok) {
      const text = await taskRes.text();
      console.error('Create task error:', text);
      return res.status(500).json({ error: 'Failed to create image task' });
    }

    const taskData = await taskRes.json();
    const taskId = taskData.output.task_id;

    if (!taskId) {
      return res.status(500).json({ error: 'No task_id returned' });
    }

    // Step 2: 轮询结果（最多 30 秒）
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等 1 秒

      const pollRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!pollRes.ok) {
        console.error('Poll error:', await pollRes.text());
        break;
      }

      const pollData = await pollRes.json();
      const taskStatus = pollData.output.task_status;

      if (taskStatus === 'SUCCEEDED') {
        const imageUrl = pollData.output.results?.[0]?.url;
        if (imageUrl) {
          return res.status(200).json({ imageUrl });
        } else {
          return res.status(500).json({ error: 'No image URL in result' });
        }
      } else if (taskStatus === 'FAILED') {
        return res.status(500).json({ error: 'Image generation failed' });
      }

      attempts++;
    }

    return res.status(504).json({ error: 'Image generation timeout' });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
