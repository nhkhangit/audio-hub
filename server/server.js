const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const axios = require('axios');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/download/youtube', async (req, res) => {
  const videoUrl = req.query.url;
  
  if (!videoUrl || !ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: 'URL YouTube không hợp lệ' });
  }

  try {
    // Lấy thông tin video để tạo tên file
    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title.replace(/[^\w\s-]/gi, ''); // Xóa ký tự đặc biệt
    
    res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
    res.header('Content-Type', 'audio/mpeg');

    // Tải audio chất lượng cao nhất và pipe thẳng về client
    ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' })
      .on('error', (err) => {
        console.error('YTDL Error:', err);
        if (!res.headersSent) res.status(500).send('Lỗi tải YouTube');
      })
      .pipe(res);

  } catch (error) {
    console.error('Lỗi YouTube Download:', error);
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
});

app.get('/download/tiktok', async (req, res) => {
  const tiktokUrl = req.query.url;

  if (!tiktokUrl) {
    return res.status(400).json({ error: 'URL TikTok không hợp lệ' });
  }

  try {
    // Sử dụng TikWM API (API miễn phí phổ biến cho TikTok)
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}&hd=1`;
    const response = await axios.get(apiUrl);
    
    if (response.data && response.data.data && response.data.data.music) {
      const musicUrl = response.data.data.music;
      const title = (response.data.data.title || 'TikTok_Audio').replace(/[^\w\s-]/gi, '');
      
      // Tải file mp3 từ URL trả về và stream về client
      const audioResponse = await axios({
        method: 'get',
        url: musicUrl,
        responseType: 'stream'
      });

      res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
      
      audioResponse.data.pipe(res);
    } else {
      res.status(404).json({ error: 'Không tìm thấy âm thanh cho video này' });
    }
  } catch (error) {
    console.error('Lỗi TikTok Download:', error);
    res.status(500).json({ error: 'Lỗi khi tải từ TikTok' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 MyAudioHub Backend đang chạy tại http://localhost:${PORT}`);
});
