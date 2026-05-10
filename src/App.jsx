import React, { useState, useEffect, useRef } from 'react';
import { Download, Music, Play, Pause, Trash2, Library, FileAudio, Video, Edit2, Check, X, AlertCircle, HelpCircle } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [downloading, setDownloading] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'error', onConfirm: null });

  const tracksRef = useRef(tracks);
  const currentTrackRef = useRef(currentTrack);

  useEffect(() => {
    tracksRef.current = tracks;
    currentTrackRef.current = currentTrack;
    
    // Quản lý Background Mode dựa trên trạng thái phát nhạc
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
      const bg = window.cordova.plugins.backgroundMode;
      if (isPlaying) {
        bg.enable();
        bg.setDefaults({
          title: 'MyAudioHub',
          text: `Đang phát: ${currentTrack?.title || 'Nhạc'}`,
          icon: 'icon', 
          color: '09090b',
          resume: true,
          hidden: false
        });
      } else {
        bg.disable();
      }
    }
  }, [tracks, currentTrack, isPlaying]);

  useEffect(() => {
    loadTracks();
    
    audio.onended = () => {
      const currentTracks = tracksRef.current;
      const currentTrk = currentTrackRef.current;
      
      if (!currentTracks.length || !currentTrk) {
        setIsPlaying(false);
        return;
      }
      
      const currentIndex = currentTracks.findIndex(t => t.id === currentTrk.id);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % currentTracks.length; // Loop về đầu
        const nextTrack = currentTracks[nextIndex];
        playTrack(nextTrack);
      } else {
        setIsPlaying(false);
      }
    };

    audio.onerror = (e) => {
      console.error('Audio object error:', e);
      setIsPlaying(false);
    };
  }, []);

  const loadTracks = async () => {
    try {
      const { files } = await Filesystem.readdir({
        path: '',
        directory: Directory.Data,
      });
      
      const loadedTracks = files.filter(f => f.name.endsWith('.mp3') || f.name.endsWith('.ogg') || f.name.endsWith('.m4a')).map(f => ({
        id: f.name,
        title: f.name.replace(/\.(mp3|ogg|m4a)$/, ''),
        path: f.uri,
      }));
      setTracks(loadedTracks);
    } catch (e) {
      setTracks([]);
    }
  };

  const showToast = async (text) => {
    try {
      await Toast.show({ text, duration: 'short', position: 'bottom' });
    } catch (e) {
      console.log('Toast fallback');
    }
  };

  const showAlert = (title, message) => {
    setModal({ show: true, title, message, type: 'error', onConfirm: null });
  };

  const showConfirm = (title, message, onConfirm) => {
    setModal({ show: true, title, message, type: 'confirm', onConfirm });
  };

  const base64ToBlob = (base64, type) => {
    const binStr = atob(base64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([arr], { type: type });
  };

  const handleDownload = async () => {
    if (!url) return;
    setDownloading(true);
    
    try {
      let downloadUrl = '';
      let title = `Audio_${Date.now()}`;

      if (platform === 'tiktok') {
        const response = await CapacitorHttp.get({
          url: `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`
        });
        if (response.data?.data?.music) {
          downloadUrl = response.data.data.music;
          title = response.data.data.title || title;
        } else {
          throw new Error('Không tìm thấy link nhạc TikTok.');
        }
      } else {
        const response = await CapacitorHttp.post({
          url: 'https://api.cobalt.tools/api/json',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          data: {
            url: url,
            downloadMode: 'audio',
            audioFormat: 'mp3'
          }
        });

        if (response.data?.status === 'stream' || response.data?.status === 'picker' || response.data?.url) {
          downloadUrl = response.data.url;
          title = response.data.filename || title;
        } else {
          throw new Error(response.data?.text || 'Lỗi khi lấy link nhạc từ YouTube.');
        }
      }

      const audioResponse = await CapacitorHttp.get({
        url: downloadUrl,
        responseType: 'blob'
      });

      const fileName = `${title.replace(/[^\w\s-]/gi, '')}.mp3`;

      await Filesystem.writeFile({
        path: fileName,
        data: audioResponse.data, 
        directory: Directory.Data,
      });
      
      setDownloading(false);
      setUrl('');
      await loadTracks();
      showToast('Tải nhạc thành công! 🎉');
    } catch (error) {
      setDownloading(false);
      showAlert('Lỗi tải về', `Lỗi: ${error.message}`);
    }
  };

  const handleDelete = (track) => {
    showConfirm(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa bài hát "${track.title}"?`,
      async () => {
        try {
          await Filesystem.deleteFile({
            path: track.id,
            directory: Directory.Data,
          });
          await loadTracks();
          setModal({ ...modal, show: false });
          showToast('Đã xóa bài hát');
          if (currentTrack?.id === track.id) {
            audio.pause();
            setCurrentTrack(null);
            setIsPlaying(false);
          }
        } catch (e) {
          console.error('Delete failed:', e);
        }
      }
    );
  };

  const handleRename = async (track) => {
    if (!editValue || editValue === track.title) {
      setEditingId(null);
      return;
    }

    try {
      const extension = track.id.split('.').pop();
      const newFileName = `${editValue}.${extension}`;
      await Filesystem.rename({
        from: track.id,
        to: newFileName,
        directory: Directory.Data,
      });
      setEditingId(null);
      await loadTracks();
      showToast('Đã đổi tên thành công');
    } catch (e) {
      showAlert('Lỗi đổi tên', 'Tên đã tồn tại hoặc không hợp lệ.');
    }
  };

  const playTrack = async (track) => {
    if (editingId) return;

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(e => console.error('Play error:', e));
        setIsPlaying(true);
      }
    } else {
      try {
        // Để phát nhạc ổn định trên cả Web và Android
        // Ta đọc file dưới dạng Base64 và tạo Blob URL
        const fileData = await Filesystem.readFile({
          path: track.id,
          directory: Directory.Data
        });
        
        const extension = track.id.split('.').pop();
        let mimeType = 'audio/mpeg';
        if (extension === 'ogg') mimeType = 'audio/ogg';
        else if (extension === 'm4a') mimeType = 'audio/mp4';
        
        const audioBlob = base64ToBlob(fileData.data, mimeType);
        const blobUrl = URL.createObjectURL(audioBlob);
        
        setCurrentTrack(track);
        audio.pause();
        audio.src = blobUrl;
        audio.load();
        
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Playback error:', err);
          showAlert('Lỗi phát nhạc', 'Trình duyệt không hỗ trợ định dạng này.');
        });
      } catch (e) {
        console.error('Play error:', e);
        showAlert('Lỗi', 'Không thể mở file nhạc.');
      }
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>MyAudioHub</h1>
        <p>Thư viện nhạc của bạn</p>
      </header>

      {modal.show && (
        <div className="modal-overlay">
          <div className="modal card">
            {modal.type === 'error' ? (
              <AlertCircle size={44} color="var(--danger)" style={{marginBottom: 8}} />
            ) : (
              <HelpCircle size={44} color="var(--text-primary)" style={{marginBottom: 8}} />
            )}
            <h3>{modal.title}</h3>
            <p>{modal.message}</p>
            <div className="modal-actions">
              {modal.type === 'confirm' && (
                <button className="btn btn-secondary" onClick={() => setModal({ ...modal, show: false })}>Hủy</button>
              )}
              <button 
                className="btn btn-primary" 
                onClick={modal.onConfirm || (() => setModal({ ...modal, show: false }))}
              >
                {modal.type === 'confirm' ? 'Xác nhận' : 'Đã hiểu'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="download-section card">
        <div className="platform-toggle">
          <button 
            className={`platform-btn ${platform === 'youtube' ? 'active' : ''}`}
            onClick={() => setPlatform('youtube')}
          >
            <Play size={18} /> YouTube
          </button>
          <button 
            className={`platform-btn ${platform === 'tiktok' ? 'active' : ''}`}
            onClick={() => setPlatform('tiktok')}
          >
            <Video size={18} /> TikTok
          </button>
        </div>

        <div className="input-group">
          <input
            type="text"
            className="input-field"
            placeholder={`Dán link ${platform === 'youtube' ? 'YouTube' : 'TikTok'}...`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleDownload}
          disabled={downloading || !url}
          style={{marginTop: 8, width: '100%'}}
        >
          {downloading ? 'ĐANG TẢI...' : <><Download size={20} /> TẢI MP3</>}
        </button>
      </section>

      <section className="library-section">
        <div className="section-title" style={{marginTop: 24}}>
          <h2><Library size={20} style={{marginRight: 8, verticalAlign: 'middle'}}/> Thư viện</h2>
          <span className="audio-meta">{tracks.length} bài hát</span>
        </div>

        <div className="audio-list card" style={{padding: 0, overflow: 'hidden', marginTop: 12}}>
          {tracks.length === 0 ? (
            <div style={{textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)'}}>
              <Music size={48} style={{opacity: 0.5, marginBottom: 12}} />
              <p style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.9rem'}}>Chưa có nhạc</p>
            </div>
          ) : (
            tracks.map(track => (
              <div key={track.id} className="audio-item">
                <div className="audio-icon" onClick={() => playTrack(track)}>
                  <FileAudio size={24} />
                </div>
                <div className="audio-info">
                  {editingId === track.id ? (
                    <div style={{display: 'flex', gap: 6, alignItems: 'center'}}>
                      <input 
                        className="edit-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(track)}
                      />
                      <button className="btn-icon" onClick={() => handleRename(track)}><Check size={18} color="var(--text-primary)" /></button>
                    </div>
                  ) : (
                    <div onClick={() => playTrack(track)}>
                      <div className="audio-title">{track.title}</div>
                      <div className="audio-meta">NHẤN ĐỂ NGHE</div>
                    </div>
                  )}
                </div>
                {!editingId && (
                  <div className="actions">
                    <button className="btn-icon" onClick={() => {
                      setEditingId(track.id);
                      setEditValue(track.title);
                    }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(track)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {currentTrack && (
        <div className="player-bar">
          <div className="player-info">
            <div className="audio-title">{currentTrack.title}</div>
            <div className="audio-meta">{isPlaying ? 'ĐANG PHÁT' : 'ĐÃ TẠM DỪNG'}</div>
          </div>
          <div className="player-controls">
            <button className="play-btn" onClick={() => playTrack(currentTrack)}>
              {isPlaying ? <Pause size={24} color="var(--bg-color)" /> : <Play size={24} color="var(--bg-color)" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
