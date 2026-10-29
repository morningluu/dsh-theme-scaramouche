#!/usr/bin/env node
/**
 * 把本地视频压成开屏素材并注入 lib/client.js。
 *
 *   node scripts/intro-video.cjs --video "C:\path\to\main.mp4" --fallback "C:\path\to\fallback.mp4"
 *   node scripts/intro-video.cjs --video "C:\path\to\main.mp4"
 *   node scripts/intro-video.cjs --fallback "C:\path\to\fallback.mp4"
 *   node scripts/intro-video.cjs --music "C:\path\to\music.mp3"
 *   node scripts/intro-video.cjs --check
 *   node scripts/intro-video.cjs --clean
 *
 * 说明：
 * - 视频会以 base64 data URI 嵌入 lib/client.js，仅适合本机自用。
 * - 主视频加载失败 / 被拦截时，客户端自动尝试 fallback。
 * - 发布 / 分发前务必执行 --clean，避免把官方视频素材打进 tgz。
 * - 依赖系统 PATH 里的 ffmpeg。
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const clientPath = path.join(root, "lib", "client.js");
const cacheDir = path.join(root, ".cache");

const MARKERS = {
  video: {
    label: "主视频",
    start: "/*__SC_INTRO_VIDEO_START__*/",
    end: "/*__SC_INTRO_VIDEO_END__*/",
    cache: path.join(cacheDir, "intro-primary.mp4"),
  },
  fallback: {
    label: "备用视频",
    start: "/*__SC_INTRO_VIDEO_FALLBACK_START__*/",
    end: "/*__SC_INTRO_VIDEO_FALLBACK_END__*/",
    cache: path.join(cacheDir, "intro-fallback.mp4"),
  },
  poster: {
    label: "默认壁纸（最后一帧）",
    start: "/*__SC_DEFAULT_WALLPAPER_START__*/",
    end: "/*__SC_DEFAULT_WALLPAPER_END__*/",
    cache: path.join(cacheDir, "intro-poster.jpg"),
  },
  music: {
    label: "背景音乐",
    start: "/*__SC_MUSIC_AUDIO_START__*/",
    end: "/*__SC_MUSIC_AUDIO_END__*/",
    cache: path.join(cacheDir, "music.mp3"),
  },
};

function readClient() {
  return fs.readFileSync(clientPath, "utf8");
}

function writeMarker(marker, value) {
  const src = readClient();
  const a = src.indexOf(marker.start);
  const b = src.indexOf(marker.end, a + marker.start.length);
  if (a < 0 || b < 0) throw new Error(`找不到 ${marker.label} 标记，请检查 lib/client.js`);
  const next = src.slice(0, a + marker.start.length) + value + src.slice(b);
  fs.writeFileSync(clientPath, next, "utf8");
}

function readMarker(marker) {
  const src = readClient();
  const a = src.indexOf(marker.start);
  if (a < 0) return null;
  const start = a + marker.start.length;
  const b = src.indexOf(marker.end, start);
  if (b < 0) return null;
  return src.slice(start, b);
}

function ffmpeg(args) {
  const p = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (p.error) {
    throw new Error(`无法运行 ffmpeg：${p.error.message}（请确认 ffmpeg 在 PATH 中）`);
  }
  if (p.status !== 0) throw new Error(`ffmpeg 退出码 ${p.status}`);
}

function compress(src, out) {
  if (!fs.existsSync(src)) throw new Error(`视频不存在：${src}`);
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(`压缩中（${src}）…`);
  ffmpeg([
    "-y", "-v", "error",
    "-i", src,
    "-vf", "scale=1280:-2",
    "-c:v", "libx264", "-preset", "slow", "-crf", "25",
    "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.0",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    out,
  ]);
  const bytes = fs.statSync(out).size;
  console.log(`-> ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  return out;
}

function embed(name, src) {
  if (!src) return;
  const marker = MARKERS[name];
  const out = compress(src, marker.cache);
  const b64 = fs.readFileSync(out).toString("base64");
  writeMarker(marker, '"data:video/mp4;base64,' + b64 + '"');
  console.log(`已写入 ${marker.label}：base64 ${(b64.length / 1024 / 1024).toFixed(2)} MB`);

  // 主视频额外抽取最后一帧，作为默认壁纸
  if (name === "video") {
    const poster = MARKERS.poster;
    if (!fs.existsSync(src)) throw new Error(`视频不存在：${src}`);
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log("提取视频最后一帧作为默认壁纸…");
    ffmpeg([
      "-y", "-v", "error",
      "-sseof", "-0.08",
      "-i", src,
      "-frames:v", "1",
      "-vf", "scale=1920:-2",
      "-q:v", "2",
      poster.cache,
    ]);
    const p64 = fs.readFileSync(poster.cache).toString("base64");
    writeMarker(poster, '"data:image/jpeg;base64,' + p64 + '"');
    console.log(`已写入 ${poster.label}：base64 ${(p64.length / 1024 / 1024).toFixed(2)} MB`);

  }
}


function embedMusic(src) {
  if (!src) return;
  if (!fs.existsSync(src)) throw new Error(`音乐不存在：${src}`);
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(`压缩音乐中（${src}）…`);
  ffmpeg([
    "-y", "-v", "error",
    "-i", src,
    "-vn",
    "-c:a", "libmp3lame", "-b:a", "96k", "-ar", "44100",
    MARKERS.music.cache,
  ]);
  const b64 = fs.readFileSync(MARKERS.music.cache).toString("base64");
  writeMarker(MARKERS.music, '"data:audio/mpeg;base64,' + b64 + '"');
  console.log(`已写入 ${MARKERS.music.label}：base64 ${(b64.length / 1024 / 1024).toFixed(2)} MB`);
}

function clean() {
  writeMarker(MARKERS.video, '""');
  writeMarker(MARKERS.fallback, '""');
  writeMarker(MARKERS.poster, '""');
  writeMarker(MARKERS.music, '""');
  console.log("已清空主 / 备用视频、默认壁纸与背景音乐：可安全打包 / 发布干净版。");
}

function check() {
  for (const name of ["video", "fallback", "poster", "music"]) {
    const marker = MARKERS[name];
    const value = readMarker(marker);
    if (value === '""') {
      console.log(`${marker.label}：无（空）`);
    } else if (value && value.startsWith('"data:')) {
      console.log(`${marker.label}：已嵌入，约 ${(value.length / 1024 / 1024).toFixed(2)} MB base64`);
    } else {
      console.log(`${marker.label}：标记内容不是预期 data URI`);
    }
  }
  console.log(`client.js：${(Buffer.byteLength(readClient()) / 1024 / 1024).toFixed(2)} MB`);
}

const argv = process.argv.slice(2);
const opts = {};
try {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--video" || a === "--fallback" || a === "--music") {
      const v = argv[++i];
      if (!v) throw new Error(`${a} 缺少文件路径`);
      opts[a.slice(2)] = v;
    } else if (a === "--clean") opts.clean = true;
    else if (a === "--check") opts.check = true;
    else throw new Error(`未知参数：${a}`);
  }

  if (opts.clean) {
    clean();
  } else if (opts.video || opts.fallback || opts.music) {
    embed("video", opts.video);
    embed("fallback", opts.fallback);
    embedMusic(opts.music);
    check();
    console.log("⚠ 该版本含视频 / 壁纸 / 音乐素材，仅限本机自用；发布前请运行 --clean。");
  } else if (opts.check) {
    check();
  } else {
    console.log('用法：node scripts/intro-video.cjs --video "<主视频>" --fallback "<备用视频>" [--music "<音乐>"]');
    console.log("      node scripts/intro-video.cjs --check | --clean");
    process.exitCode = 1;
  }
} catch (e) {
  console.error("失败：" + e.message);
  process.exitCode = 1;
}
