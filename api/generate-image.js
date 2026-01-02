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

    // ✅ 使用你提供的模型名：wanx2.6-image
    const taskRes = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-async', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: 'wanx2.6-image', // ← 关键：使用正确模型名
        input: {
          prompt: fullPrompt,
          n: 1,
          size: '1024*1024'
        }
      })
    });

    const taskText = await taskRes.text();
    let taskData;
    try {
      taskData = JSON.parse(taskText);
    } catch (e) {
      console.error('Invalid task response:', taskText);
      return res.status(500).json({ error: 'Invalid response from Qwen API' });
    }

    if (!taskRes.ok || !taskData.output || !taskData.output.task_id) {
      console.error('Create task failed:', taskData);
      return res.status(500).json({ error: 'Failed to create image task', details: taskData.message || taskData });
    }

    const taskId = taskData.output.task_id;

    // 轮询结果
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pollRes = await fetch(`https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const pollText = await pollRes.text();
      let pollData;
      try {
        pollData = JSON.parse(pollText);
      } catch (e) {
        console.error('Invalid poll response:', pollText);
        attempts++;
        continue;
      }

      const taskStatus = pollData.output?.task_status;
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
