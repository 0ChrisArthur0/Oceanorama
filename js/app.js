// ═══════════════════════════════════════════
// 视频素材（H.264 + AAC MP4，GitHub Pages 全浏览器兼容）
// ═══════════════════════════════════════════
// _V_CACHE_VER 用于替换视频文件后强制浏览器跳过缓存
const _V_CACHE_VER = 'v4';
const VIDEOS = [
  'videos/IMG_4700.mp4',
  'videos/IMG_4706.mp4',
  'videos/IMG_4709.mp4',
  'videos/IMG_4710.mp4',
  'videos/IMG_4714.mp4',
  'videos/IMG_4718.mp4',
  'videos/IMG_4723.mp4',
].map((p) => `${p}?${_V_CACHE_VER}`);

// ═══════════════════════════════════════════
// 状态
// ═══════════════════════════════════════════
const state = {
  view: 'wall',
  videoIndex: 0,
  isAnimating: false,
};

// ═══════════════════════════════════════════
// DOM
// ═══════════════════════════════════════════
const videoSource = document.getElementById('videoSource');
const mainCanvas = document.getElementById('mainCanvas');
const ctx = mainCanvas.getContext('2d');
const windowBox = document.getElementById('windowBox');
const wallHint = document.getElementById('wallHint');

// ═══════════════════════════════════════════
// 工具
// ═══════════════════════════════════════════
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ═══════════════════════════════════════════
// Canvas 视频渲染
// ═══════════════════════════════════════════
function drawVideoFrame() {
  const cssW = mainCanvas.clientWidth;
  const cssH = mainCanvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  const bw = Math.floor(cssW * dpr);
  const bh = Math.floor(cssH * dpr);

  if (mainCanvas.width !== bw || mainCanvas.height !== bh) {
    mainCanvas.width = bw;
    mainCanvas.height = bh;
  }

  if (!videoSource.paused && !videoSource.ended) {
    const vw = videoSource.videoWidth;
    const vh = videoSource.videoHeight;
    if (vw > 0 && vh > 0 && bw > 0 && bh > 0) {
      const videoRatio = vw / vh;
      const canvasRatio = bw / bh;
      let sx, sy, sw, sh;
      if (videoRatio > canvasRatio) {
        sh = vh;
        sw = vh * canvasRatio;
        sx = (vw - sw) / 2;
        sy = 0;
      } else {
        sw = vw;
        sh = vw / canvasRatio;
        sx = 0;
        sy = (vh - sh) / 2;
      }
      ctx.drawImage(videoSource, sx, sy, sw, sh, 0, 0, bw, bh);
    }
  }
  requestAnimationFrame(drawVideoFrame);
}

function loadVideo(index) {
  videoSource.src = VIDEOS[index % VIDEOS.length];
  videoSource.load();
  return new Promise((resolve) => {
    videoSource.oncanplay = () => resolve();
    videoSource.onerror = () => resolve();
  });
}

// ═══════════════════════════════════════════
// 窗户布局
// 图片 1920×1080，玻璃区域: x[196,1764] y[76,1016]
// 玻璃宽比 = 1568/1920 = 0.8167
// 玻璃高比 = 940/1080 = 0.8704
// 玻璃中心 = (0.5104, 0.5056)
// ═══════════════════════════════════════════
const IMG_RATIO = 1920 / 1080;
const GLASS_W_RATIO = 1568 / 1920;  // 0.8167
const GLASS_H_RATIO = 940 / 1080;   // 0.8704
const GLASS_CX = 0.5104;            // 玻璃中心 X（相对图片）
const GLASS_CY = 0.5056;            // 玻璃中心 Y（相对图片）

function setWallLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let w = Math.min(vw * 0.72, 620);
  let h = w / IMG_RATIO;
  if (h > vh * 0.72) {
    h = vh * 0.72;
    w = h * IMG_RATIO;
  }
  windowBox.style.left = `${(vw - w) / 2}px`;
  windowBox.style.top = `${(vh - h) / 2}px`;
  windowBox.style.width = `${w}px`;
  windowBox.style.height = `${h}px`;
}

function setFullScreenLayout() {
  const sw = window.innerWidth;
  const sh = window.innerHeight;

  // 计算让玻璃填满屏幕所需的盒子尺寸
  const wByWidth = sw / GLASS_W_RATIO;
  const hByHeight = sh / GLASS_H_RATIO;
  let w, h;
  if (wByWidth / IMG_RATIO > hByHeight) {
    // 宽度是限制因素
    w = wByWidth;
    h = w / IMG_RATIO;
  } else {
    // 高度是限制因素
    h = hByHeight;
    w = h * IMG_RATIO;
  }

  // 让玻璃中心对齐屏幕中心
  const left = sw / 2 - GLASS_CX * w;
  const top = sh / 2 - GLASS_CY * h;

  windowBox.style.left = `${left}px`;
  windowBox.style.top = `${top}px`;
  windowBox.style.width = `${w}px`;
  windowBox.style.height = `${h}px`;
}

// ═══════════════════════════════════════════
// 交互：拉近 / 拉远
// ═══════════════════════════════════════════
async function zoomIn() {
  if (state.isAnimating || state.view !== 'wall') return;
  state.isAnimating = true;
  state.view = 'full';

  wallHint.style.opacity = '0';
  setFullScreenLayout();

  await wait(1000);
  state.isAnimating = false;
}

async function zoomOut() {
  if (state.isAnimating || state.view !== 'full') return;
  state.isAnimating = true;
  state.view = 'wall';

  state.videoIndex = (state.videoIndex + 1) % VIDEOS.length;
  setWallLayout();

  await wait(1000);

  videoSource.src = VIDEOS[state.videoIndex];
  videoSource.load();
  videoSource.play().catch(() => {});

  wallHint.style.opacity = '';
  state.isAnimating = false;
}

windowBox.addEventListener('click', () => {
  if (state.view === 'wall') zoomIn();
  else zoomOut();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.view === 'full' && !state.isAnimating) {
    zoomOut();
  }
});

window.addEventListener('resize', () => {
  if (state.view === 'wall') setWallLayout();
  else setFullScreenLayout();
});

// ═══════════════════════════════════════════
// 初始化
// ═══════════════════════════════════════════
setWallLayout();
drawVideoFrame();
loadVideo(0).then(() => {
  videoSource.play().catch(() => {});
});


// ═══════════════════════════════════════════════════════════════════
//  音频引擎
// ═══════════════════════════════════════════════════════════════════
const AudioEngine = {
  ctx: null,
  masterGain: null,
  reverb: null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      // 简易混响：延迟反馈
      this.reverb = this.ctx.createDelay(2);
      this.reverb.delayTime.value = 0.4;
      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = 0.35;
      const reverbFilter = this.ctx.createBiquadFilter();
      reverbFilter.type = 'lowpass';
      reverbFilter.frequency.value = 2000;
      this.reverb.connect(reverbFilter).connect(reverbGain);
      reverbGain.connect(this.reverb);
      reverbGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  // 节点连接到输出 + 混响发送
  connectToOutput(node, reverbSend = 0.3) {
    node.connect(this.masterGain);
    if (reverbSend > 0 && this.reverb) {
      const sendGain = this.ctx.createGain();
      sendGain.gain.value = reverbSend;
      node.connect(sendGain).connect(this.reverb);
    }
  },
};


// ═══════════════════════════════════════════════════════════════════
//  模块一：海洋馆背景音乐
// ═══════════════════════════════════════════════════════════════════
const AquariumMusic = {
  nodes: [],
  timers: [],
  intervalIds: [],
  isPlaying: false,
  preset: 0,
  volume: 0.4,
  gainNode: null,
  presetNames: ['宁静海底', '珊瑚礁', '深海鲸歌'],

  // 创建持续音符（oscillator + gain envelope）
  createNote(freq, duration, startTime, type = 'sine', vol = 0.08) {
    const osc = this.gainNode.context.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const g = this.gainNode.context.createGain();
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(vol, startTime + duration * 0.3);
    g.gain.linearRampToValueAtTime(vol * 0.6, startTime + duration * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(g);
    AudioEngine.connectToOutput(g, 0.4);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
    this.nodes.push(osc, g);
  },

  // ── 预设1：宁静海底 ──
  // C 大调五声音阶慢速和弦进行
  presetCalm(ctx) {
    // 和弦进行：C - Am - F - G（五声音阶）
    const chords = [
      [261.63, 311.13, 392.00],  // C major
      [220.00, 261.63, 329.63],  // A minor
      [174.61, 220.00, 261.63],  // F major
      [196.00, 246.94, 293.66],  // G major
    ];
    let chordIdx = 0;

    const playChord = () => {
      const now = ctx.currentTime;
      const chord = chords[chordIdx % chords.length];
      chord.forEach((freq, i) => {
        this.createNote(freq, 6, now + i * 0.15, 'sine', 0.05);
      });
      // 低音
      this.createNote(chord[0] / 2, 6, now, 'sine', 0.07);
      chordIdx++;
    };

    playChord();
    const id = setInterval(playChord, 5500);
    this.intervalIds.push(id);

    // 水流底噪
    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(ctx, 4);
    noise.loop = true;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = 600;
    nFilter.Q.value = 0.5;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.015;

    // LFO 调制水流
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.01;
    lfo.connect(lfoGain).connect(nGain.gain);
    lfo.start();

    noise.connect(nFilter).connect(nGain);
    AudioEngine.connectToOutput(nGain, 0.2);
    noise.start();
    this.nodes.push(noise, nFilter, nGain, lfo, lfoGain);
  },

  // ── 预设2：珊瑚礁 ──
  // 明亮的 D 大调琶音 + 轻快气泡
  presetCoral(ctx) {
    // D 大调琶音
    const notes = [293.66, 369.99, 440.00, 587.33, 440.00, 369.99];
    let noteIdx = 0;

    const playArp = () => {
      const now = ctx.currentTime;
      const freq = notes[noteIdx % notes.length];
      this.createNote(freq, 2.5, now, 'triangle', 0.035);
      // 和声
      if (noteIdx % 4 === 0) {
        this.createNote(freq * 1.5, 3, now, 'sine', 0.02);
      }
      noteIdx++;
    };

    playArp();
    const id = setInterval(playArp, 700);
    this.intervalIds.push(id);

    // 低音垫
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 146.83; // D3
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.025;

    const droneLfo = ctx.createOscillator();
    droneLfo.frequency.value = 0.1;
    const droneLfoGain = ctx.createGain();
    droneLfoGain.gain.value = 0.015;
    droneLfo.connect(droneLfoGain).connect(droneGain.gain);
    droneLfo.start();

    drone.connect(droneGain);
    AudioEngine.connectToOutput(droneGain, 0.3);
    drone.start();
    this.nodes.push(drone, droneGain, droneLfo, droneLfoGain);

    // 气泡声
    const bubbleId = setInterval(() => {
      if (Math.random() < 0.5) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const f = 400 + Math.random() * 600;
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 2.5, now + 0.12);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.015, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.connect(g);
        AudioEngine.connectToOutput(g, 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    }, 800);
    this.intervalIds.push(bubbleId);
  },

  // ── 预设3：深海鲸歌 ──
  // 低频 drone + 鲸鱼叫声 + 深海回响
  presetWhale(ctx) {
    // 多层低频 drone
    [55, 82.5, 110].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.04 - i * 0.008;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.02;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2 + i;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start();

      osc.connect(g);
      AudioEngine.connectToOutput(g, 0.4);
      osc.start();
      this.nodes.push(osc, g, lfo, lfoGain);
    });

    // 鲸鱼叫声
    const whaleId = setInterval(() => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';

      const baseFreq = 180 + Math.random() * 120;
      const peakFreq = baseFreq * (1.4 + Math.random() * 0.6);

      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.linearRampToValueAtTime(peakFreq, now + 1.2);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.7, now + 2.8);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.6);
      g.gain.linearRampToValueAtTime(0.04, now + 1.8);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      // 颤音
      const vib = ctx.createOscillator();
      vib.frequency.value = 4.5;
      const vibGain = ctx.createGain();
      vibGain.gain.value = 4;
      vib.connect(vibGain).connect(osc.frequency);
      vib.start(now);
      vib.stop(now + 3.3);

      osc.connect(g);
      AudioEngine.connectToOutput(g, 0.5);
      osc.start(now);
      osc.stop(now + 3.3);
      this.nodes.push(osc, g, vib, vibGain);
    }, 4000 + Math.random() * 3000);
    this.intervalIds.push(whaleId);

    // 深海水流
    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(ctx, 5);
    noise.loop = true;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.value = 200;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.02;
    noise.connect(nFilter).connect(nGain);
    AudioEngine.connectToOutput(nGain, 0.3);
    noise.start();
    this.nodes.push(noise, nFilter, nGain);
  },

  makeNoiseBuffer(ctx, seconds) {
    const len = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3;
    }
    return buf;
  },

  clearAll() {
    this.nodes.forEach(n => {
      try { n.stop && n.stop(); } catch(e) {}
      try { n.disconnect && n.disconnect(); } catch(e) {}
    });
    this.intervalIds.forEach(id => clearInterval(id));
    this.nodes = [];
    this.intervalIds = [];
  },

  start() {
    AudioEngine.init();
    this.gainNode = AudioEngine.ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.gain.linearRampToValueAtTime(this.volume, AudioEngine.ctx.currentTime + 1);
    AudioEngine.connectToOutput(this.gainNode, 0);

    // 临时替换 connectToOutput 让音符连到 gainNode
    const origConnect = AudioEngine.connectToOutput.bind(AudioEngine);
    AudioEngine.connectToOutput = (node, reverbSend = 0.3) => {
      node.connect(this.gainNode);
      if (reverbSend > 0 && AudioEngine.reverb) {
        const sendGain = AudioEngine.ctx.createGain();
        sendGain.gain.value = reverbSend;
        node.connect(sendGain).connect(AudioEngine.reverb);
      }
    };

    const ctx = AudioEngine.ctx;
    if (this.preset === 0) this.presetCalm(ctx);
    else if (this.preset === 1) this.presetCoral(ctx);
    else this.presetWhale(ctx);

    // 恢复
    AudioEngine.connectToOutput = origConnect;

    this.isPlaying = true;
  },

  stop() {
    if (this.gainNode) {
      const now = AudioEngine.ctx.currentTime;
      this.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    }
    setTimeout(() => this.clearAll(), 600);
    this.isPlaying = false;
  },

  setVolume(v) {
    this.volume = v;
    if (this.gainNode && AudioEngine.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(v, AudioEngine.ctx.currentTime + 0.1);
    }
  },

  switchPreset() {
    this.preset = (this.preset + 1) % this.presetNames.length;
    if (this.isPlaying) {
      this.stop();
      setTimeout(() => this.start(), 700);
    }
    document.getElementById('musicLabel').textContent = this.presetNames[this.preset];
  },
};


// ═══════════════════════════════════════════════════════════════════
//  模块二：白噪音
// ═══════════════════════════════════════════════════════════════════
const WhiteNoise = {
  source: null,
  gainNode: null,
  filter: null,
  lfo: null,
  lfoGain: null,
  isPlaying: false,
  preset: 0,
  volume: 0.3,
  presetNames: ['白噪', '粉噪', '棕噪', '海浪'],

  // 生成噪音 buffer
  generateBuffer(ctx, type) {
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);

    if (type === 0) {
      // 白噪音
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 1) {
      // 粉噪音 (Voss-McCartney 算法简化)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 2) {
      // 棕噪音
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    } else if (type === 3) {
      // 海浪：白噪音 + 慢速幅度调制（在 start 中用 LFO 实现）
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return buf;
  },

  start() {
    AudioEngine.init();
    const ctx = AudioEngine.ctx;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 0.5);
    AudioEngine.connectToOutput(this.gainNode, 0);

    this.source = ctx.createBufferSource();
    this.source.buffer = this.generateBuffer(ctx, this.preset);
    this.source.loop = true;

    this.filter = ctx.createBiquadFilter();
    if (this.preset === 2) {
      // 棕噪音：低通
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 500;
    } else if (this.preset === 3) {
      // 海浪：带通
      this.filter.type = 'bandpass';
      this.filter.frequency.value = 800;
      this.filter.Q.value = 0.3;
    } else {
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 8000;
    }

    this.source.connect(this.filter).connect(this.gainNode);
    this.source.start();

    // 海浪模式：添加 LFO 调制音量
    if (this.preset === 3) {
      this.lfo = ctx.createOscillator();
      this.lfo.frequency.value = 0.12;
      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = this.volume * 0.7;
      this.lfo.connect(this.lfoGain).connect(this.gainNode.gain);
      this.lfo.start();
    }

    this.isPlaying = true;
  },

  stop() {
    if (this.gainNode && AudioEngine.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(0, AudioEngine.ctx.currentTime + 0.3);
    }
    setTimeout(() => {
      try { this.source && this.source.stop(); } catch(e) {}
      try { this.lfo && this.lfo.stop(); } catch(e) {}
      [this.source, this.filter, this.gainNode, this.lfo, this.lfoGain].forEach(n => {
        try { n && n.disconnect(); } catch(e) {}
      });
      this.source = null;
      this.lfo = null;
    }, 400);
    this.isPlaying = false;
  },

  setVolume(v) {
    this.volume = v;
    if (this.gainNode && AudioEngine.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(v, AudioEngine.ctx.currentTime + 0.1);
      if (this.lfoGain) {
        this.lfoGain.gain.linearRampToValueAtTime(v * 0.7, AudioEngine.ctx.currentTime + 0.1);
      }
    }
  },

  switchPreset() {
    this.preset = (this.preset + 1) % this.presetNames.length;
    if (this.isPlaying) {
      this.stop();
      setTimeout(() => this.start(), 450);
    }
    document.getElementById('noiseLabel').textContent = this.presetNames[this.preset];
  },
};


// ═══════════════════════════════════════════
//  UI 绑定
// ═══════════════════════════════════════════
const musicToggle = document.getElementById('musicToggle');
const musicSwitch = document.getElementById('musicSwitch');
const musicVolume = document.getElementById('musicVolume');
const noiseToggle = document.getElementById('noiseToggle');
const noiseSwitch = document.getElementById('noiseSwitch');
const noiseVolume = document.getElementById('noiseVolume');

musicToggle.addEventListener('click', () => {
  if (AquariumMusic.isPlaying) {
    AquariumMusic.stop();
    musicToggle.classList.remove('active');
  } else {
    AquariumMusic.start();
    musicToggle.classList.add('active');
  }
});

musicSwitch.addEventListener('click', () => {
  AquariumMusic.switchPreset();
});

musicVolume.addEventListener('input', (e) => {
  AquariumMusic.setVolume(e.target.value / 100);
});

noiseToggle.addEventListener('click', () => {
  if (WhiteNoise.isPlaying) {
    WhiteNoise.stop();
    noiseToggle.classList.remove('active');
  } else {
    WhiteNoise.start();
    noiseToggle.classList.add('active');
  }
});

noiseSwitch.addEventListener('click', () => {
  WhiteNoise.switchPreset();
});

noiseVolume.addEventListener('input', (e) => {
  WhiteNoise.setVolume(e.target.value / 100);
});

/* ═══════════════════════════════════════════
   音频面板收起 / 展开
   ═══════════════════════════════════════════ */
const audioPanel = document.getElementById('audioPanel');
const panelCollapseBtn = document.getElementById('panelCollapse');
const panelMiniBtn = document.getElementById('panelMini');
const panelHeader = document.querySelector('.panel-header');
const COLLAPSE_KEY = 'window_audio_panel_collapsed';

// 读取上次状态
try {
  if (localStorage.getItem(COLLAPSE_KEY) === '1') {
    audioPanel.classList.add('collapsed');
  }
} catch (e) {}

function togglePanel() {
  audioPanel.classList.toggle('collapsed');
  try {
    localStorage.setItem(
      COLLAPSE_KEY,
      audioPanel.classList.contains('collapsed') ? '1' : '0'
    );
  } catch (e) {}
}

if (panelMiniBtn) {
  panelMiniBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audioPanel.classList.contains('collapsed')) {
      togglePanel();
    }
  });
}
if (panelCollapseBtn) {
  panelCollapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });
}
if (panelHeader) {
  panelHeader.addEventListener('click', (e) => {
    if (!e.target.closest('.panel-collapse')) {
      togglePanel();
    }
  });
}
