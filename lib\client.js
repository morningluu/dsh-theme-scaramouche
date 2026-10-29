/**
 * dsh-theme-scaramouche —— 原神「散兵」主题（浏览器端）
 *
 * 机制（与 dsh-theme-firefly / 官方 decoration 模板同款）：
 *   1. window.__ModuleLoader__.load() 注册为 DSH 客户端模块；
 *   2. 导出 { isPlugin, inject: ["theme"], apply }；
 *   3. apply(ctx) 里 ctx.theme.register({ id, colorScheme, tokens }) 注册
 *      --dsw-* 设计令牌并用 setTheme 激活；
 *   4. 注入身份层：墨黑潮底、深海蓝 / 青蓝 / 雾紫、青海波 / 华盖 / 三巴纹、开屏视频/雷印、
 *      可拖动控制条、本机壁纸导入。
 *
 * 全部图形（三巴纹、华盖、雷光）为原创内联 SVG，不包含任何官方素材。
 */
window.__ModuleLoader__.load({
	id: "dsh-theme-scaramouche",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const THEME_ID = "dsh-theme-scaramouche";
		const LS = {
			dock: "sc_dock_v3",
			wpMode: "sc_wp_mode",
			wpShade: "sc_wp_shade",
			wpActive: "sc_wp_active",
			wpPlay: "sc_wp_play",
			wpCount: "sc_wp_count",
			opening: "sc_opening",
			introSound: "sc_intro_sound",
			music: "sc_music",
			musicVol: "sc_music_vol",
			particles: "sc_particles",
		};
		const SS_INTRO = "sc_intro_seen";
const VIDEO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%231A4C90'/%3E%3Cstop offset='1' stop-color='%235DBECC'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='640' height='360' fill='url(%23g)'/%3E%3C/svg%3E";

		// 本地开屏视频：由 scripts/intro-video.cjs 注入 base64 data URI。
		// 主视频失败自动切第二个；两个都为空时回退到下面的 CSS 三巴纹开屏。
		const INTRO_VIDEO = /*__SC_INTRO_VIDEO_START__*/""/*__SC_INTRO_VIDEO_END__*/;
		const INTRO_VIDEO_FALLBACK = /*__SC_INTRO_VIDEO_FALLBACK_START__*/""/*__SC_INTRO_VIDEO_FALLBACK_END__*/;

		// 默认壁纸：开屏视频最后一帧（本地构建由 scripts/intro-video.cjs 注入）
		const DEFAULT_WALLPAPER = /*__SC_DEFAULT_WALLPAPER_START__*/""/*__SC_DEFAULT_WALLPAPER_END__*/;
		const MUSIC_AUDIO = /*__SC_MUSIC_AUDIO_START__*/""/*__SC_MUSIC_AUDIO_END__*/;

		// ═══════════ 0. 小工具 ═══════════
		function make(tag, cls, html) {
			const el = document.createElement(tag);
			if (cls) el.className = cls;
			if (html !== undefined) el.innerHTML = html;
			return el;
		}
		function lsGet(key, fallback) {
			try {
				const v = localStorage.getItem(key);
				return v === null ? fallback : v;
			} catch (e) {
				return fallback;
			}
		}
		function lsSet(key, value) {
			try {
				localStorage.setItem(key, String(value));
			} catch (e) {}
		}
		function prefersReduced() {
			try {
				return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			} catch (e) {
				return false;
			}
		}

		// ═══════════ 1. 设计令牌层：墨黑 × 深海蓝 × 青蓝 × 雾紫 ═══════════
		const TOKENS = {
			// 背景：墨黑主色；聊天主层低不透明度，让壁纸透出来
			"--dsw-alias-bg-base": "rgba(4, 6, 10, 0.55)",
			"--dsw-alias-bg-layer-1": "rgba(10, 14, 21, 0.52)",
			"--dsw-alias-bg-layer-2": "rgba(14, 20, 29, 0.66)",
			"--dsw-alias-bg-layer-3": "rgba(19, 26, 37, 0.78)",
			"--dsw-alias-bg-layer-4": "rgba(24, 32, 45, 0.84)",
			"--dsw-alias-bg-overlay": "rgba(8, 12, 18, 0.95)",
			"--dsw-alias-bg-module-platform": "rgba(6, 9, 14, 0.88)",
			"--dsw-alias-bg-multi-select": "rgba(26, 76, 144, 0.38)",
			"--dsw-alias-bg-skeleton": "rgba(93, 190, 204, 0.08)",
			"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.62)",
			"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.32)",
			"--dsw-alias-bg-mask-drop": "rgba(0, 0, 0, 0.70)",
			"--dsw-alias-bg-document-selection": "rgba(93, 190, 204, 0.26)",

			// 文字：冰白 → 蓝灰 → 雾蓝
			"--dsw-alias-label-primary": "#EAF6FF",
			"--dsw-alias-label-secondary": "#A9C3D8",
			"--dsw-alias-label-tertiary": "#7E93A8",
			"--dsw-alias-label-caption": "#8FA6BC",
			"--dsw-alias-label-dimmed": "#5C6E82",
			"--dsw-alias-label-primary-foreground": "#04121F",
			"--dsw-alias-label-primary-inverted": "#04121F",
			"--dsw-alias-label-error": "#FF6B85",
			"--dsw-alias-label-shimmer": "rgba(234, 246, 255, 0.45)",

			// 品牌：青蓝
			"--dsw-alias-brand-primary": "#5DBECC",
			"--dsw-alias-brand-text": "#7FD8E4",
			"--dsw-alias-brand-primary-invert": "#04121F",

			// 按钮
			"--dsw-alias-button-primary-fill": "#1A4C90",
			"--dsw-alias-button-primary-hover": "#2A63AE",
			"--dsw-alias-button-primary-dimmed": "rgba(26, 76, 144, 0.35)",
			"--dsw-alias-button-contrast-fill": "#EAF6FF",
			"--dsw-alias-button-elevated-fill": "#0E151F",
			"--dsw-alias-button-floating-fill": "#0A1018",
			"--dsw-alias-button-floating-hover": "#121C28",
			"--dsw-alias-button-ghost-active-fill": "rgba(26, 76, 144, 0.36)",
			"--dsw-alias-button-ghost-active-hover": "rgba(26, 76, 144, 0.52)",
			"--dsw-alias-button-info-fill": "#5DBECC",
			"--dsw-alias-button-info-hover": "#7FD8E4",
			"--dsw-alias-button-tool-bar-fill": "rgba(93, 190, 204, 0.10)",
			"--dsw-alias-button-tool-bar-hover": "rgba(93, 190, 204, 0.18)",
			"--dsw-alias-button-ghost-active-border": "#5DBECC",

			// 交互
			"--dsw-alias-interactive-bg-hover": "rgba(93, 190, 204, 0.08)",
			"--dsw-alias-interactive-bg-active": "rgba(93, 190, 204, 0.15)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(75, 73, 112, 0.32)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(255, 107, 133, 0.16)",

			// 边框
			"--dsw-alias-border-l1": "rgba(93, 190, 204, 0.14)",
			"--dsw-alias-border-l2": "rgba(93, 190, 204, 0.24)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(93, 190, 204, 0.10)",
			"--dsw-alias-border-l3": "rgba(75, 73, 112, 0.55)",
			"--dsw-alias-border-l4": "rgba(93, 190, 204, 0.42)",

			// 状态：语义色保持可辨识
			"--dsw-alias-state-success-primary": "#4FD1B5",
			"--dsw-alias-state-success-secondary": "rgba(79, 209, 181, 0.16)",
			"--dsw-alias-state-success-tertiary": "rgba(79, 209, 181, 0.08)",
			"--dsw-alias-state-error-primary": "#FF6B85",
			"--dsw-alias-state-error-secondary": "rgba(255, 107, 133, 0.16)",
			"--dsw-alias-state-warn-primary": "#E8B45A",
			"--dsw-alias-state-warn-secondary": "rgba(232, 180, 90, 0.16)",
			"--dsw-alias-state-warn-tertiary": "rgba(232, 180, 90, 0.08)",
			"--dsw-alias-state-warn-label": "#E8B45A",
			"--dsw-alias-state-business-primary": "#5DBECC",
			"--dsw-alias-state-business-tertiary": "rgba(93, 190, 204, 0.10)",
			"--dsw-alias-state-idle-primary": "#6F8095",

			// toast / tooltip / markdown / 滚动条
			"--dsw-alias-toast-bg": "rgba(6, 10, 16, 0.95)",
			"--dsw-alias-toast-label": "#EAF6FF",
			"--dsw-alias-tooltip-bg": "rgba(6, 10, 16, 0.96)",
			"--dsw-alias-tooltip-key-bg": "rgba(255, 255, 255, 0.12)",
			"--dsw-alias-markdown-inline-code": "rgba(93, 190, 204, 0.12)",
			"--dsw-alias-markdown-code-block": "rgba(3, 6, 10, 0.64)",
			"--dsw-alias-markdown-code-block-banner": "rgba(26, 76, 144, 0.28)",
			"--dsw-alias-markdown-tag": "rgba(75, 73, 112, 0.35)",
			"--dsw-alias-scrollbar-bg-l1": "rgba(93, 190, 204, 0.18)",
			"--dsw-alias-scrollbar-bg-l2": "rgba(93, 190, 204, 0.28)",
			"--dsw-alias-scrollbar-hover-l1": "rgba(93, 190, 204, 0.36)",
			"--dsw-alias-scrollbar-hover-l2": "rgba(93, 190, 204, 0.48)",

			// 组件特化：气泡 / 输入框高透明；左侧可收缩栏纯黑，不铺壁纸
			"--dsw-specific-sidebar-fill": "#000000",
			"--dsw-specific-sidebar-nav-item-active": "rgba(26, 76, 144, 0.42)",
			"--dsw-specific-sidebar-nav-item-active-accent": "#5DBECC",
			"--dsw-specific-sidebar-nav-item-hover": "rgba(93, 190, 204, 0.07)",
			"--dsw-specific-bubble": "rgba(9, 14, 21, 0.90)",
			"--dsw-specific-bubble-highlight": "rgba(93, 190, 204, 0.10)",
			"--dsw-specific-input-major": "#0A1017",
			"--dsw-specific-menu": "rgba(6, 10, 16, 0.94)",
			"--dsw-specific-selector": "rgba(10, 15, 22, 0.90)",
			"--dsw-specific-tip": "rgba(93, 190, 204, 0.10)",

			// 菜单 / 浮层 / 焦点 / 阴影
			"--dsw-menu-surface-fill": "rgba(6, 10, 16, 0.82)",
			"--dsw-menu-backdrop-filter": "blur(18px) saturate(140%)",
			"--dsw-menu-group-header-fill": "rgba(12, 18, 26, 0.94)",
			"--dsw-alias-menu-icon": "#A9C3D8",
			"--dsw-hovercard-bg": "rgba(6, 10, 16, 0.97)",
			"--dsw-focus-ring-color": "#5DBECC",
			"--dsw-focus-ring-width": "2px",
			"--dsw-elevation-stroke-color": "rgba(93, 190, 204, 0.16)",
			"--dsw-shadow-lv3": "0 18px 48px rgba(0, 0, 0, 0.55)",
		};

		// ═══════════ 2. 原创内联图形（墨海青潮）═══════════
		// 三巴纹雷印：中心三枚巴纹 + 青蓝环 + 雷光
		const SIGIL_SVG =
			'<svg class="sc-sigil-svg" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
			'<defs>' +
			'<linearGradient id="sc-sig-v" x1="0" y1="0" x2="1" y2="1">' +
			'<stop offset="0" stop-color="#7FD8E4"/><stop offset=".55" stop-color="#1A4C90"/><stop offset="1" stop-color="#4B4970"/>' +
			'</linearGradient>' +
			'<linearGradient id="sc-sig-g" x1="0" y1="0" x2="1" y2="1">' +
			'<stop offset="0" stop-color="#5DBECC"/><stop offset="1" stop-color="#4B4970"/>' +
			'</linearGradient>' +
			'</defs>' +
			'<circle class="sc-sig-ring" cx="120" cy="120" r="106" stroke="url(#sc-sig-g)" stroke-width="1" stroke-dasharray="2 7" opacity=".55"/>' +
			'<circle class="sc-sig-ring" cx="120" cy="120" r="90" stroke="#5DBECC" stroke-width="1" opacity=".32"/>' +
			'<g transform="translate(120 120)">' +
			'<path class="sc-sig-tomoe" d="M0 -9C24 -33 56 -23 58 3C60 26 40 42 19 39C39 30 47 13 40 1C33 -10 16 -13 0 -9Z" fill="url(#sc-sig-v)" opacity=".92"/>' +
			'<path class="sc-sig-tomoe" d="M0 -9C24 -33 56 -23 58 3C60 26 40 42 19 39C39 30 47 13 40 1C33 -10 16 -13 0 -9Z" fill="url(#sc-sig-v)" opacity=".92" transform="rotate(120)"/>' +
			'<path class="sc-sig-tomoe" d="M0 -9C24 -33 56 -23 58 3C60 26 40 42 19 39C39 30 47 13 40 1C33 -10 16 -13 0 -9Z" fill="url(#sc-sig-v)" opacity=".92" transform="rotate(240)"/>' +
			'<path d="M0 -17 3.6 -4.4 16 0 3.6 4.4 0 17 -3.6 4.4 -16 0 -3.6 -4.4Z" fill="#EAF6FF"/>' +
			'<circle r="15" stroke="url(#sc-sig-g)" stroke-width="1" opacity=".6"/>' +
			'<path d="M0 -78V-60M0 60V78M-78 0H-60M60 0H78" stroke="url(#sc-sig-g)" stroke-width="1" opacity=".45"/>' +
			'</g>' +
			'</svg>';

		// 华盖 / 斗笠：宽檐、锥顶、垂纱
		const HAT_SVG =
			'<svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
			'<g stroke="#5DBECC" stroke-width="1.5" stroke-linecap="round">' +
			'<path d="M20 168c60-22 120-32 180-32s120 10 180 32c-60 22-120 32-180 32S80 190 20 168Z"/>' +
			'<path d="M120 158c8-58 32-96 80-116 48 20 72 58 80 116"/>' +
			'<path d="M200 42V24"/><circle cx="200" cy="18" r="4"/>' +
			'<path d="M140 170c-4 34 6 54 18 66M176 174c-2 30 2 52 12 68M224 174c2 30-2 52-12 68M260 170c4 34-6 54-18 66" opacity=".7"/>' +
			'</g>' +
			'<g stroke="#1A4C90" stroke-width="1.2" opacity=".8">' +
			'<path d="M168 150c10-24 21-38 32-48 11 10 22 24 32 48"/>' +
			'<path d="M200 120v44"/>' +
			'</g>' +
			'<path d="M200 118l-9 18h7l-6 17 14-20h-7l5-15Z" fill="#7FD8E4" opacity=".9"/>' +
			'</svg>';

		// 控制条顶端的小雷印
		const MARK_SVG =
			'<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
			'<circle cx="16" cy="16" r="14" stroke="#4B4970" stroke-opacity=".9" stroke-width=".8" stroke-dasharray="1 3"/>' +
			'<path d="M17.6 7.5 11 17.4h4.1l-2.4 7.6 7.9-11h-4.3l1.3-6.5Z" fill="#5DBECC"/>' +
			'</svg>';

		// ═══════════ 3. 身份层 CSS（墨海 · 青潮）═══════════
		function identityCSS() {
			const tokenLines = Object.entries(TOKENS)
				.map(([name, value]) => "  " + name + ": " + value + " !important;")
				.join("\n");

			return `
/* ── 基础与令牌：墨黑底，冰白正文，青蓝高光 ── */
html { color-scheme: dark !important; background: #04060A !important; }
html, body { min-height: 100%; }
body {
  --sc-serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif;
  --sc-sans: "MiSans", "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif;
  --sc-black: #04060A;
  --sc-navy: #1A4C90;
  --sc-cyan: #5DBECC;
  --sc-mist: #4B4970;
  --sc-ice: #EAF6FF;
  --sc-gold: #C8A96A;
  --sc-gold-soft: rgba(200, 169, 106, 0.28);
  --sc-gold-line: rgba(200, 169, 106, 0.16);
  background-color: transparent !important;
  color: var(--dsw-alias-label-primary, #EAF6FF);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --dsw-font-family: var(--sc-sans);
  --ds-font-family-code: "JetBrains Mono", "Cascadia Code", "SF Mono", Consolas, Menlo, monospace;
${tokenLines}
}
#root, #root > div, #app, #app > div { background-color: transparent !important; }
/* DSH Windows frame 默认拿 sidebar 色当底，会整块盖住壁纸；强制半透明 */
.mP3x-q_frame, [class$="-q_frame"] { background: rgba(4, 6, 10, 0.24) !important; }
.mP3x-q_centerCol, [class$="-q_centerCol"] {
  background: rgba(4, 6, 10, 0.24) !important;
}
.mP3x-q_sidebarCol, [class$="-q_sidebarCol"] {
  border-right: 1px solid rgba(200, 169, 106, 0.18) !important;
  box-shadow: inset -1px 0 0 rgba(93, 190, 204, 0.05);
}
[data-windows-titlebar] .mP3x-q_frame:before {
  border-bottom: 1px solid rgba(200, 169, 106, 0.10);
  box-shadow: 0 1px 0 rgba(93, 190, 204, 0.04);
}
/* 壁纸内层：直接放进中心列，盖在 frame 背景之上、UI 之下，避免被不透明层挡住 */
.sc-has-inner-wallpaper {
  position: relative !important;
  z-index: 0 !important;
}
.sc-wallpaper-inner {
  position: absolute; inset: 0; z-index: -2; pointer-events: none;
}
.sc-wallpaper-image {
  position: absolute; inset: 0; z-index: 0;
  background-position: center; background-size: cover;
  background-attachment: scroll; background-repeat: no-repeat;
}
.sc-wallpaper-video {
  position: absolute; inset: 0; z-index: 1;
  width: 100%; height: 100%; object-fit: cover;
  display: none; pointer-events: none;
}
.sc-wallpaper-video.on { display: block; }
.sc-wallpaper-inner::after {
  content: ""; position: absolute; inset: 0; z-index: 2; opacity: var(--sc-shade, 0.3);
  background:
    linear-gradient(180deg,
      rgba(4, 6, 10, 0.46) 0%,
      rgba(4, 6, 10, 0.16) 11%,
      rgba(4, 6, 10, 0.02) 32%,
      rgba(4, 6, 10, 0) 52%,
      rgba(4, 6, 10, 0) 62%,
      rgba(4, 6, 10, 0.06) 76%,
      rgba(4, 6, 10, 0.24) 90%,
      rgba(4, 6, 10, 0.42) 100%),
    radial-gradient(120% 100% at 58% 44%, transparent 58%, rgba(4, 6, 10, 0.26) 100%),
    linear-gradient(100deg,
      rgba(4, 6, 10, 0.42) 0%,
      rgba(4, 6, 10, 0.20) 30%,
      rgba(4, 6, 10, 0.06) 64%,
      rgba(4, 6, 10, 0.02) 100%);
}
/* 壁纸档：聊天主层、气泡、输入框再降透明度；侧栏保持纯黑 */
body.sc-scene-custom {
  --dsw-alias-bg-base: rgba(4, 6, 10, 0.55) !important;
  --dsw-specific-sidebar-fill: #000000 !important;
  --dsw-specific-bubble: rgba(9, 14, 21, 0.90) !important;
  --dsw-specific-input-major: #0A1017 !important;
}
::selection { background: rgba(93, 190, 204, 0.28) !important; color: #EAF6FF !important; }
::-moz-selection { background: rgba(93, 190, 204, 0.28) !important; color: #EAF6FF !important; }
* { scrollbar-width: thin; scrollbar-color: rgba(93, 190, 204, 0.32) rgba(255, 255, 255, 0.04); }
:focus-visible { outline-color: rgba(93, 190, 204, 0.88) !important; }
input, textarea, [contenteditable="true"] { caret-color: #5DBECC; }
::placeholder { color: rgba(169, 195, 216, 0.46) !important; }

/* ── 排版：标题用宋/明体，正文保持无衬线 ── */
h1, h2, h3, h4 { font-family: var(--sc-serif); letter-spacing: 0.01em; color: #EAF6FF; text-wrap: balance; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.28); }
h1 { letter-spacing: 0.05em; }
p, li, blockquote, td, th { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.32); }
a { color: var(--dsw-alias-brand-text, #7FD8E4); text-underline-offset: 3px; }
hr { border: 0 !important; height: 1px !important; background: linear-gradient(90deg, transparent, rgba(93, 190, 204, 0.30), transparent) !important; }
blockquote {
  border-left: 2px solid rgba(200, 169, 106, 0.55) !important;
  background: linear-gradient(90deg, rgba(200, 169, 106, 0.06), rgba(93, 190, 204, 0.03) 45%, transparent 80%) !important;
  border-radius: 0 8px 8px 0;
}
code:not(pre code) { border: 1px solid rgba(200, 169, 106, 0.16); background: rgba(9, 16, 24, 0.72); }
pre { border: 1px solid rgba(200, 169, 106, 0.10); box-shadow: inset 0 0 0 1px rgba(93, 190, 204, 0.08), 0 8px 24px rgba(0, 0, 0, 0.16); }

/* ── 背景：墨黑、深海蓝 / 青蓝 / 雾紫光晕、青花暗纹 ── */
.sc-bg {
  position: fixed; inset: 0; z-index: -3; overflow: hidden; pointer-events: none;
  background-color: #04060A;
}
.sc-bg::before {
  content: ""; position: absolute; inset: -12%;
  background:
    radial-gradient(58% 46% at 80% 6%, rgba(26, 76, 144, 0.46), transparent 64%),
    radial-gradient(54% 44% at 8% 92%, rgba(75, 73, 112, 0.40), transparent 66%),
    radial-gradient(40% 34% at 68% 18%, rgba(93, 190, 204, 0.14), transparent 70%),
    #04060A;
  filter: blur(8px);
  animation: scAurora 30s ease-in-out infinite alternate;
}
.sc-bg::after {
  content: ""; position: absolute; inset: 0;
  background-image:
    repeating-radial-gradient(circle at 88% 2%, transparent 0 62px, rgba(93, 190, 204, 0.09) 62px 63px, transparent 63px 124px),
    radial-gradient(circle at 50% 50%, rgba(93, 190, 204, 0.14) 0 1.5px, transparent 2px);
  background-size: auto, 26px 26px;
  opacity: 0.62;
  -webkit-mask-image: linear-gradient(158deg, rgba(0, 0, 0, 0.95), transparent 72%);
  mask-image: linear-gradient(158deg, rgba(0, 0, 0, 0.95), transparent 72%);
}
.sc-bg[data-scene="storm"]::before {
  background:
    radial-gradient(64% 52% at 74% 2%, rgba(26, 76, 144, 0.58), transparent 62%),
    radial-gradient(58% 48% at 4% 96%, rgba(93, 190, 204, 0.22), transparent 66%),
    radial-gradient(46% 40% at 48% 44%, rgba(75, 73, 112, 0.34), transparent 74%),
    #04060A;
  animation-duration: 16s;
}
.sc-bg[data-scene="storm"]::after { opacity: 0.82; }
.sc-bg[data-scene="custom"] { background: #04060A; }
.sc-bg[data-scene="custom"]::before { background: rgba(4, 6, 10, 0.34); filter: none; animation: none; }
.sc-bg[data-scene="custom"]::after { opacity: 0.16; }
.sc-bg-image {
  position: absolute; inset: 0; background-position: center; background-size: cover;
  background-attachment: fixed; background-repeat: no-repeat;
  opacity: 1; filter: none;
  transform: none; transition: opacity 0.9s ease;
}
.sc-bg[data-scene="custom"] .sc-bg-image { opacity: 1; }
.sc-bg-sigil {
  position: absolute; right: -12vw; top: 50%; width: min(74vw, 980px);
  transform: translateY(-50%); opacity: 0.12;
  animation: scTurn 190s linear infinite;
}
.sc-bg[data-scene="storm"] .sc-bg-sigil { opacity: 0.18; }
.sc-bg[data-scene="custom"] .sc-bg-sigil { opacity: 0.06; }
.sc-bg-sigil svg { display: block; width: 100%; height: auto; }
.sc-bg-hat {
  position: absolute; left: -6vw; bottom: -5vh; width: min(46vw, 600px);
  opacity: 0.14; filter: drop-shadow(0 0 26px rgba(93, 190, 204, 0.18));
}
.sc-bg[data-scene="storm"] .sc-bg-hat { opacity: 0.20; }
.sc-bg[data-scene="custom"] .sc-bg-hat { opacity: 0.07; }
.sc-bg-hat svg { display: block; width: 100%; height: auto; }
.sc-bg-poem {
  position: absolute; right: 30px; top: 13vh; writing-mode: vertical-rl;
  font-family: var(--sc-serif); font-size: 19px; letter-spacing: 0.42em;
  color: rgba(93, 190, 204, 0.28); text-shadow: 0 0 18px rgba(0, 0, 0, 0.85);
  white-space: nowrap;
}
.sc-bg-poem span { display: block; }

/* 可读性遮罩：左侧墨色更实，右侧给壁纸留空间 */
.sc-veil {
  position: fixed; inset: 0; z-index: -2; pointer-events: none;
  opacity: var(--sc-shade, 0.3);
  background:
    linear-gradient(100deg, rgba(4, 6, 10, 0.84) 0%, rgba(4, 6, 10, 0.60) 34%, rgba(4, 6, 10, 0.28) 68%, rgba(4, 6, 10, 0.08) 100%),
    linear-gradient(180deg, rgba(4, 6, 10, 0.58) 0%, rgba(4, 6, 10, 0.02) 30%, rgba(4, 6, 10, 0.52) 100%),
    radial-gradient(92% 62% at 84% 4%, rgba(93, 190, 204, 0.10), transparent 62%);
}

/* 顶部一线青蓝 */
.sc-rail {
  position: fixed; top: 0; left: 0; right: 0; height: 1px; z-index: 70;
  pointer-events: none; overflow: hidden;
  background: linear-gradient(90deg, transparent, rgba(93, 190, 204, 0.50) 24%, rgba(200, 169, 106, 0.42) 58%, rgba(93, 190, 204, 0.22) 78%, transparent);
  opacity: 0.68;
}
.sc-rail::after {
  content: ""; position: absolute; top: 0; left: -35%; width: 32%; height: 100%;
  background: linear-gradient(90deg, transparent, #EAF6FF, transparent);
  filter: blur(0.4px);
  animation: scSweep 9s ease-in-out infinite;
}

/* ── 控制条（可拖动，竖排青蓝印） ── */
.sc-dock {
  position: fixed; right: 18px; bottom: 22px; z-index: 80;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 5px; border-radius: 22px;
  background: linear-gradient(180deg, rgba(10, 17, 26, 0.88), rgba(4, 7, 11, 0.76));
  border: 1px solid rgba(200, 169, 106, 0.20);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.52), 0 0 0 1px rgba(93, 190, 204, 0.04), inset 0 1px rgba(234, 246, 255, 0.09);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  cursor: grab; user-select: none; -webkit-user-select: none; touch-action: none;
}
.sc-dock.dragging { cursor: grabbing; }
.sc-dock.sc-dock-horizontal {
  flex-direction: row; align-items: center; gap: 4px; border-radius: 18px;
}
.sc-dock.sc-dock-horizontal .sc-dock-mark { margin: 0 2px 0 0; }
.sc-dock.sc-dock-horizontal .sc-btn { width: 36px; }
.sc-dock-mark { width: 22px; height: 22px; opacity: 0.88; cursor: default; display: grid; place-items: center; margin: 1px 0 3px; filter: drop-shadow(0 0 8px rgba(93, 190, 204, 0.18)); }
.sc-dock-mark:hover { opacity: 1; }
.sc-dock-mark svg { width: 100%; height: 100%; display: block; }
.sc-btn {
  position: relative; width: 40px; height: 28px; padding: 0; border-radius: 9px;
  display: grid; place-items: center; cursor: pointer;
  font: 500 10px/1 var(--sc-sans); letter-spacing: 0.02em;
  color: #A9C3D8;
  background: rgba(93, 190, 204, 0.035);
  border: 1px solid rgba(93, 190, 204, 0.14);
  transition: color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, transform 0.16s ease;
}
.sc-btn:hover {
  color: #F5FAFF; border-color: rgba(93, 190, 204, 0.55);
  background: rgba(13, 24, 36, 0.92);
  box-shadow: 0 0 0 1px rgba(200, 169, 106, 0.10), 0 6px 18px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}
.sc-btn.on {
  color: #F7FBFF; border-color: rgba(93, 190, 204, 0.60);
  background: linear-gradient(135deg, rgba(26, 76, 144, 0.95), rgba(10, 30, 55, 0.95));
  box-shadow: inset 2px 0 0 rgba(200, 169, 106, 0.55), inset 0 0 0 1px rgba(200, 169, 106, 0.10), 0 6px 20px rgba(26, 76, 144, 0.28);
}
.sc-btn::after {
  content: attr(data-tip); position: absolute; right: calc(100% + 10px); top: 50%;
  transform: translateY(-50%) translateX(4px); white-space: nowrap; pointer-events: none;
  font: 400 11px/1 var(--sc-sans); letter-spacing: 0.08em;
  color: #EAF6FF; background: rgba(6, 10, 16, 0.96);
  border: 1px solid rgba(200, 169, 106, 0.24); border-radius: 7px; padding: 7px 10px;
  opacity: 0; transition: opacity 0.16s ease, transform 0.16s ease;
}
.sc-btn:hover::after { opacity: 1; transform: translateY(-50%); }

/* ── 「景」面板 ── */
.sc-panel {
  position: fixed; z-index: 81; width: 248px; display: none;
  padding: 16px; border-radius: 16px;
  background: linear-gradient(160deg, rgba(10, 16, 24, 0.97), rgba(4, 7, 11, 0.95));
  border: 1px solid rgba(200, 169, 106, 0.18);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.60), inset 0 1px rgba(234, 246, 255, 0.06), inset 0 0 0 1px rgba(93, 190, 204, 0.03);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  overflow: hidden;
}
.sc-panel::before {
  content: ""; position: absolute; top: 0; left: 16px; right: 16px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200, 169, 106, 0.48), rgba(93, 190, 204, 0.24), transparent);
  pointer-events: none;
}
.sc-panel.open { display: block; animation: scPanelIn 0.18s ease; }
.sc-panel-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin-bottom: 14px; padding-bottom: 10px;
  border-bottom: 1px solid rgba(200, 169, 106, 0.12);
}
.sc-panel-title { font: 500 13px/1.2 var(--sc-serif); letter-spacing: 0.28em; color: #F1F7FC; }
.sc-panel-title::before {
  content: ""; display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: var(--sc-gold); box-shadow: 0 0 8px rgba(200, 169, 106, 0.55);
  margin-right: 8px; vertical-align: 2px;
}
.sc-panel-close {
  width: 22px; height: 22px; padding: 0; border-radius: 6px; cursor: pointer;
  color: #A9C3D8; background: rgba(200, 169, 106, 0.06);
  border: 1px solid rgba(200, 169, 106, 0.18); font-size: 12px; line-height: 1;
}
.sc-panel-close:hover { color: #EAF6FF; background: rgba(200, 169, 106, 0.14); }
.sc-panel-label { font: 400 9.5px/1 var(--sc-sans); letter-spacing: 0.22em; color: rgba(200, 169, 106, 0.82); margin: 0 0 8px; }
.sc-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 14px; }
.sc-seg-btn {
  height: 30px; padding: 0 5px; border-radius: 7px; cursor: pointer;
  font: 400 11.5px/1 var(--sc-sans); color: #A9C3D8;
  background: rgba(93, 190, 204, 0.035); border: 1px solid rgba(93, 190, 204, 0.14);
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}
.sc-seg-btn:hover:not(:disabled) { background: rgba(93, 190, 204, 0.10); color: #F5FAFF; border-color: rgba(93, 190, 204, 0.34); }
.sc-seg-btn.active {
  color: #F7FBFF; border-color: rgba(93, 190, 204, 0.58);
  background: linear-gradient(160deg, rgba(26, 76, 144, 0.95), rgba(10, 30, 55, 0.95));
  box-shadow: 0 4px 14px rgba(26, 76, 144, 0.35), inset 0 0 0 1px rgba(200, 169, 106, 0.08);
}
.sc-seg-btn:disabled { opacity: 0.32; cursor: not-allowed; }
.sc-panel-row { display: flex; gap: 7px; margin-top: 8px; }
.sc-panel-btn {
  flex: 1; height: 32px; border-radius: 8px; cursor: pointer;
  font: 400 11.5px/1 var(--sc-sans); color: #A9C3D8;
  background: rgba(93, 190, 204, 0.045); border: 1px solid rgba(93, 190, 204, 0.16);
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}
.sc-panel-btn:hover { background: rgba(93, 190, 204, 0.12); color: #EAF6FF; border-color: rgba(93, 190, 204, 0.32); }
.sc-panel-btn.sc-danger { color: #FF8DA2; border-color: rgba(255, 107, 133, 0.28); background: rgba(255, 107, 133, 0.06); }
.sc-panel-btn.sc-danger:hover { background: rgba(255, 107, 133, 0.14); }
.sc-panel-btn:disabled { opacity: 0.32; cursor: not-allowed; }
.sc-panel-hint { margin-top: 11px; font: 400 9.5px/1.7 var(--sc-sans); color: #6F8297; letter-spacing: 0.03em; }
.sc-wallpaper-preview {
  position: relative; width: 100%; aspect-ratio: 16 / 9; margin: 2px 0 13px;
  overflow: hidden; border-radius: 11px; background: #04060A;
  border: 1px solid rgba(200, 169, 106, 0.18);
  box-shadow: inset 0 0 0 1px rgba(93, 190, 204, 0.04), 0 8px 22px rgba(0, 0, 0, 0.32);
}
.sc-wallpaper-preview::after {
  content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(180deg, transparent 58%, rgba(4, 6, 10, 0.58) 100%);
}
.sc-wallpaper-thumb {
  display: none; width: 100%; height: 100%; object-fit: contain;
  background: #04060A;
}
.sc-wallpaper-thumb.on { display: block; }
.sc-wallpaper-empty {
  position: absolute; inset: 0; z-index: 2; display: grid; place-items: center;
  font: 400 10px/1.6 var(--sc-sans); letter-spacing: 0.14em; color: #7E93A8;
}
.sc-wallpaper-empty.hide { display: none; }
.sc-wp-brightness { display: flex; align-items: center; gap: 10px; margin: 2px 0 12px; }
.sc-wallpaper-range { width: auto; flex: 1; margin: 0; }
.sc-range-val { width: 38px; text-align: right; font: 500 10px/1 var(--sc-sans); letter-spacing: 0.04em; color: var(--sc-gold); }
.sc-wallpaper-tag {
  position: absolute; left: 10px; bottom: 8px; z-index: 2;
  font: 400 8.5px/1 var(--sc-sans); letter-spacing: 0.20em; color: rgba(234, 246, 255, 0.58);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
}
.sc-panel.sc-controls {
  width: 300px;
  max-height: min(520px, calc(100vh - 240px));
  overflow-y: auto;
}
.sc-wp-gallery {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
  margin: 6px 0 12px;
}
.sc-wp-item {
  position: relative; aspect-ratio: 16 / 9; padding: 0; overflow: hidden;
  border-radius: 7px; cursor: pointer; background: #04060A;
  border: 1px solid rgba(93, 190, 204, 0.14); outline: none;
}
.sc-wp-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sc-wp-item.active {
  border-color: var(--sc-gold);
  box-shadow: 0 0 0 1px rgba(200, 169, 106, 0.35), 0 4px 12px rgba(0, 0, 0, 0.30);
}
.sc-wp-item.selected:not(.active) { border-color: rgba(200, 169, 106, 0.42); }
.sc-wp-check {
  position: absolute; top: 4px; right: 4px; z-index: 3;
  width: 16px; height: 16px; padding: 0; border-radius: 50%;
  display: grid; place-items: center; cursor: pointer;
  color: transparent; font: 700 9px/1 var(--sc-sans);
  background: rgba(4, 6, 10, 0.72);
  border: 1px solid rgba(200, 169, 106, 0.55);
}
.sc-wp-item.selected .sc-wp-check { color: #04060A; background: var(--sc-gold); border-color: var(--sc-gold); }
.sc-wp-video {
  position: absolute; left: 5px; bottom: 5px; z-index: 2;
  width: 15px; height: 15px; border-radius: 50%;
  display: grid; place-items: center;
  background: rgba(4, 6, 10, 0.72); color: #EAF6FF;
  font: 7px/1 var(--sc-sans); padding-left: 1px;
}
.sc-wp-selected {
  margin: 2px 0 6px; font: 400 10px/1.4 var(--sc-sans);
  letter-spacing: 0.04em; color: var(--sc-gold); text-align: right;
}
.sc-panel.sc-controls::-webkit-scrollbar { width: 4px; }
.sc-panel.sc-controls::-webkit-scrollbar-thumb { background: rgba(200, 169, 106, 0.28); border-radius: 4px; }
.sc-panel-section { display: none; }
.sc-panel-section.active { display: block; }
.sc-seg.sc-seg-2 { grid-template-columns: repeat(2, 1fr); }
.sc-seg.sc-seg-3 { grid-template-columns: repeat(3, 1fr); }
.sc-seg.sc-seg-4 { grid-template-columns: repeat(4, 1fr); }
.sc-seg-btn { white-space: nowrap; }
.sc-btn.sc-btn-word {
  width: 40px; height: 28px; border-radius: 9px; padding: 0;
  font: 500 9.8px/1 var(--sc-sans); letter-spacing: 0.02em;
}
.sc-range {
  -webkit-appearance: none; appearance: none; width: 100%; height: 3px;
  margin: 10px 0 4px; border-radius: 999px; outline: none;
  background: linear-gradient(90deg, #5DBECC, #1A4C90);
}
.sc-range::-webkit-slider-thumb {
  -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%;
  background: #EAF6FF; border: 2px solid #5DBECC; cursor: pointer;
  box-shadow: 0 0 10px rgba(93, 190, 204, 0.6);
}
.sc-range::-moz-range-thumb {
  width: 13px; height: 13px; border-radius: 50%;
  background: #EAF6FF; border: 2px solid #5DBECC; cursor: pointer;
}
.sc-particles {
  position: fixed; inset: 0; z-index: -1; pointer-events: none; display: none;
}
.sc-particles.sc-particles-inner {
  position: absolute; inset: 0; z-index: -1;
  mix-blend-mode: screen; opacity: 0.82;
}

/* ── 开屏雷印（无视频时的回退）── */
body.sc-intro-open { overflow: hidden !important; }
.sc-intro {
  position: fixed; inset: 0; z-index: 9999; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(62% 52% at 50% 42%, #0A1520 0%, #04060A 68%), #04060A;
  opacity: 1; transition: opacity 1.1s ease;
}
.sc-intro::before {
  content: ""; position: absolute; width: 72vmin; height: 72vmin; border-radius: 50%;
  background: radial-gradient(circle, rgba(93, 190, 204, 0.16), rgba(26, 76, 144, 0.06) 48%, transparent 68%);
  filter: blur(26px);
}
.sc-intro.gone { opacity: 0; pointer-events: none; }
.sc-boot {
  position: fixed; inset: 0; z-index: 9998; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  background: radial-gradient(60% 50% at 50% 42%, #0A1520 0%, #04060A 70%), #04060A;
  opacity: 1; transition: opacity 0.5s ease;
}
.sc-boot.gone { opacity: 0; }
.sc-boot-mark { width: 64px; height: 64px; opacity: 0.92; filter: drop-shadow(0 0 24px rgba(93, 190, 204, 0.35)); }
.sc-boot-mark svg { width: 100%; height: 100%; display: block; }
.sc-boot-title { font: 300 26px/1 var(--sc-serif); letter-spacing: 0.40em; padding-left: 0.40em; color: #EAF6FF; }
.sc-boot-line { width: 54px; height: 1px; background: linear-gradient(90deg, transparent, rgba(200, 169, 106, 0.60), transparent); }
.sc-intro-flash {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(58% 46% at 50% 38%, rgba(234, 246, 255, 0.95), rgba(93, 190, 204, 0.40) 42%, transparent 76%);
  opacity: 0; animation: scFlash 1.15s ease-out;
}
.sc-intro-stage { position: relative; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.sc-intro .sc-sigil-svg { width: 148px; height: 148px; filter: drop-shadow(0 0 26px rgba(93, 190, 204, 0.45)); }
.sc-intro .sc-sig-ring { stroke-dasharray: 640; stroke-dashoffset: 640; animation: scDraw 1.5s ease forwards; }
.sc-intro .sc-sig-tomoe { opacity: 0; animation: scSigIn 0.9s 0.35s ease forwards; }
.sc-intro-title {
  font: 300 clamp(42px, 6.4vw, 72px)/1.05 var(--sc-serif);
  letter-spacing: 0.38em; padding-left: 0.38em; color: #EAF6FF;
  text-shadow: 0 0 30px rgba(93, 190, 204, 0.60), 0 0 90px rgba(26, 76, 144, 0.45);
  opacity: 0; animation: scFadeUp 0.9s 0.35s ease forwards;
}
.sc-intro-sub {
  font: 400 10px/1.7 var(--sc-sans); letter-spacing: 0.42em; padding-left: 0.42em;
  color: #5DBECC; text-transform: uppercase;
  opacity: 0; animation: scFadeUp 0.9s 0.65s ease forwards;
}
.sc-intro-line {
  font: 300 13px/1.9 var(--sc-serif); letter-spacing: 0.18em;
  color: #A9C3D8;
  opacity: 0; animation: scFadeUp 0.9s 0.95s ease forwards;
}
.sc-intro-skip {
  position: absolute; right: 22px; bottom: 20px; padding: 7px 14px; cursor: pointer;
  font: 400 11px/1 var(--sc-sans); letter-spacing: 0.18em;
  color: #A9C3D8; background: rgba(6, 10, 16, 0.58);
  border: 1px solid rgba(93, 190, 204, 0.24); border-radius: 6px;
}
.sc-intro-skip:hover { color: #EAF6FF; background: rgba(93, 190, 204, 0.12); }

/* 本地视频开屏：全屏 cover，底部渐变承托控制按钮 */
.sc-intro-video { background: #000000; }
.sc-intro-video::before { display: none; }
.sc-intro-media {
  position: absolute; inset: 0; display: block;
  width: 100%; height: 100%; object-fit: cover; background: #000000;
}
.sc-intro-shade {
  position: absolute; inset: 0; pointer-events: none;
  opacity: var(--sc-shade, 0.3);
  background:
    linear-gradient(180deg,
      rgba(4, 6, 10, 0.46) 0%,
      rgba(4, 6, 10, 0.16) 11%,
      rgba(4, 6, 10, 0.02) 32%,
      rgba(4, 6, 10, 0) 52%,
      rgba(4, 6, 10, 0) 62%,
      rgba(4, 6, 10, 0.06) 76%,
      rgba(4, 6, 10, 0.24) 90%,
      rgba(4, 6, 10, 0.42) 100%),
    radial-gradient(120% 100% at 58% 44%, transparent 58%, rgba(4, 6, 10, 0.26) 100%),
    linear-gradient(100deg,
      rgba(4, 6, 10, 0.42) 0%,
      rgba(4, 6, 10, 0.20) 30%,
      rgba(4, 6, 10, 0.06) 64%,
      rgba(4, 6, 10, 0.02) 100%);
}
.sc-intro-video .sc-intro-skip {
  z-index: 2; color: #EAF6FF; background: rgba(0, 0, 0, 0.38);
  border-color: rgba(234, 246, 255, 0.32);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.sc-intro-video .sc-intro-skip:hover { color: #FFFFFF; background: rgba(0, 0, 0, 0.58); }
.sc-intro-sound {
  position: absolute; left: 22px; bottom: 20px; z-index: 2;
  padding: 7px 14px; cursor: pointer;
  font: 400 11px/1 var(--sc-sans); letter-spacing: 0.14em;
  color: #EAF6FF; background: rgba(0, 0, 0, 0.38);
  border: 1px solid rgba(234, 246, 255, 0.32); border-radius: 6px;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.sc-intro-sound:hover { background: rgba(0, 0, 0, 0.58); }

/* ── 落雷闪光（彩蛋） ── */
.sc-flash {
  position: fixed; inset: 0; z-index: 9998; pointer-events: none;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(58% 46% at 50% 34%, rgba(234, 246, 255, 0.90), rgba(93, 190, 204, 0.18) 46%, transparent 74%);
  animation: scFlash 0.85s ease-out forwards;
}
.sc-flash svg { width: min(34vw, 260px); height: auto; filter: drop-shadow(0 0 30px rgba(93, 190, 204, 0.65)); }

/* ── 动效 ── */
@keyframes scAurora { 0% { transform: translate3d(0, 0, 0) scale(1); } 100% { transform: translate3d(-2.4%, 1.6%, 0) scale(1.05); } }
@keyframes scTurn { to { transform: translateY(-50%) rotate(360deg); } }
@keyframes scSweep { 0%, 62% { left: -35%; opacity: 0; } 68% { opacity: 1; } 82% { left: 105%; opacity: 0.9; } 100% { left: 105%; opacity: 0; } }
@keyframes scPanelIn { from { opacity: 0; transform: translateY(6px) scale(0.985); } to { opacity: 1; transform: none; } }
@keyframes scDraw { to { stroke-dashoffset: 0; } }
@keyframes scSigIn { to { opacity: 0.92; } }
@keyframes scFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes scFlash {
  0% { opacity: 0; } 5% { opacity: 0.95; } 11% { opacity: 0.16; } 17% { opacity: 0.72; } 30% { opacity: 0.05; } 100% { opacity: 0; }
}

/* ── 响应式 / 无障碍 ── */
@media (max-width: 900px) {
  .sc-bg-poem { display: none; }
  .sc-bg-sigil { width: 120vw; right: -40vw; opacity: 0.09; }
  .sc-bg-hat { width: 74vw; left: -18vw; }
  .sc-dock { right: 10px; bottom: 18px; }
}
@media (max-width: 560px), (max-height: 560px) {
  .sc-dock { right: 10px; bottom: 12px; gap: 3px; padding: 4px; border-radius: 18px; }
  .sc-dock-mark { width: 17px; height: 17px; margin: 0 0 1px; }
  .sc-btn { width: 30px; height: 29px; font-size: 10px; border-radius: 8px; }
  .sc-panel { width: min(248px, calc(100vw - 20px)); }
  .sc-panel.sc-controls { width: min(300px, calc(100vw - 20px)); max-height: calc(100vh - 150px); }
  .sc-intro-title { letter-spacing: 0.28em; padding-left: 0.28em; }
}
@media (prefers-reduced-motion: reduce) {
  .sc-rail::after, .sc-intro-flash, .sc-flash { display: none !important; }
  .sc-bg::before, .sc-bg-sigil { animation: none !important; }
  .sc-intro .sc-sig-ring, .sc-intro .sc-sig-tomoe { animation: none !important; }
}
`;
		}

		// ═══════════ 4. 本地素材库（仅存本机浏览器）═══════════
		const IDB_NAME = "dsh-theme-scaramouche";
		function idbOpen() {
			return new Promise((resolve, reject) => {
				if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
				const req = indexedDB.open(IDB_NAME, 1);
				req.onupgradeneeded = () => {
					const db = req.result;
					if (!db.objectStoreNames.contains("assets")) db.createObjectStore("assets", { keyPath: "id" });
				};
				req.onsuccess = () => resolve(req.result);
				req.onerror = () => reject(req.error);
			});
		}
		async function idbGet(id) {
			try {
				const db = await idbOpen();
				return await new Promise((resolve) => {
					const r = db.transaction("assets", "readonly").objectStore("assets").get(id);
					r.onsuccess = () => { db.close(); resolve(r.result || null); };
					r.onerror = () => { db.close(); resolve(null); };
				});
			} catch (e) {
				return null;
			}
		}
		async function idbPut(record) {
			try {
				const db = await idbOpen();
				await new Promise((resolve) => {
					const tx = db.transaction("assets", "readwrite");
					tx.objectStore("assets").put(record);
					tx.oncomplete = () => { db.close(); resolve(); };
					tx.onerror = () => { db.close(); resolve(); };
				});
				return true;
			} catch (e) {
				return false;
			}
		}
		async function idbDelete(id) {
			try {
				const db = await idbOpen();
				await new Promise((resolve) => {
					const tx = db.transaction("assets", "readwrite");
					tx.objectStore("assets").delete(id);
					tx.oncomplete = () => { db.close(); resolve(); };
					tx.onerror = () => { db.close(); resolve(); };
				});
			} catch (e) {}
		}

		function fileToDataURL(file, maxEdge) {
			return new Promise((resolve, reject) => {
				const url = URL.createObjectURL(file);
				const img = new Image();
				img.onload = () => {
					try {
						const scale = Math.min(1, (maxEdge || 1920) / Math.max(img.naturalWidth, img.naturalHeight));
						const w = Math.max(1, Math.round(img.naturalWidth * scale));
						const h = Math.max(1, Math.round(img.naturalHeight * scale));
						const canvas = document.createElement("canvas");
						canvas.width = w;
						canvas.height = h;
						const g = canvas.getContext("2d");
						g.drawImage(img, 0, 0, w, h);
						URL.revokeObjectURL(url);
						resolve(canvas.toDataURL("image/jpeg", 0.84));
					} catch (e) {
						URL.revokeObjectURL(url);
						reject(e);
					}
				};
				img.onerror = () => {
					URL.revokeObjectURL(url);
					reject(new Error("image decode failed"));
				};
				img.src = url;
			});
		}

		function videoPoster(file) {
			return new Promise((resolve) => {
				let url = "";
				let video = null;
				let done = false;
				const finish = (value) => {
					if (done) return;
					done = true;
					if (video) {
						try { video.pause(); } catch (e) {}
						video.removeAttribute("src");
						try { video.load(); } catch (e) {}
					}
					if (url) URL.revokeObjectURL(url);
					resolve(value || "");
				};
				try {
					url = URL.createObjectURL(file);
					video = document.createElement("video");
					video.muted = true;
					video.playsInline = true;
					video.preload = "metadata";
					video.src = url;
					const grab = () => {
						try {
							const vw = video.videoWidth || 640;
							const vh = video.videoHeight || 360;
							const scale = Math.min(1, 960 / Math.max(vw, vh));
							const c = document.createElement("canvas");
							c.width = Math.max(1, Math.round(vw * scale));
							c.height = Math.max(1, Math.round(vh * scale));
							c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
							finish(c.toDataURL("image/jpeg", 0.82));
						} catch (e) {
							finish("");
						}
					};
					video.addEventListener("seeked", grab, { once: true });
					video.addEventListener("loadeddata", () => {
						try {
							const d = isFinite(video.duration) ? video.duration : 1;
							video.currentTime = Math.min(1.2, Math.max(0.05, d * 0.12));
						} catch (e) {
							grab();
						}
					}, { once: true });
					video.addEventListener("error", () => finish(""), { once: true });
					setTimeout(grab, 4200);
				} catch (e) {
					finish("");
				}
			});
		}

		// ═══════════ 5. 背景层 ═══════════
		function startBackground() {
			const host = make("div", "sc-bg");
			host.dataset.scene = "night";
			host.innerHTML =
				'<div class="sc-bg-image"></div>' +
				'<div class="sc-bg-sigil">' + SIGIL_SVG + "</div>" +
				'<div class="sc-bg-hat">' + HAT_SVG + "</div>" +
				'<div class="sc-bg-poem"><span>浮世如雷</span><span>梦醒皆空</span></div>';
			const veil = make("div", "sc-veil");
			document.body.append(host, veil);

			const center = document.querySelector(".mP3x-q_centerCol, [class$='-q_centerCol']");
			let inner = null;
			let innerImage = null;
			let videoEl = null;
			if (center) {
				center.classList.add("sc-has-inner-wallpaper");
				inner = make("div", "sc-wallpaper-inner");
				innerImage = make("div", "sc-wallpaper-image");
				inner.appendChild(innerImage);
				videoEl = make("video", "sc-wallpaper-video");
				videoEl.muted = true;
				videoEl.loop = true;
				videoEl.autoplay = true;
				videoEl.playsInline = true;
				videoEl.preload = "auto";
				videoEl.setAttribute("muted", "");
				videoEl.setAttribute("autoplay", "");
				videoEl.setAttribute("playsinline", "");
				videoEl.addEventListener("canplay", () => {
					if (!videoEl.classList.contains("on") || !videoEl.paused) return;
					const p = videoEl.play();
					if (p && p.catch) p.catch(() => {});
				});
				inner.appendChild(videoEl);
				center.prepend(inner);
			}

			const image = host.querySelector(".sc-bg-image");
			const defaultWallpaper = DEFAULT_WALLPAPER || "";
			let customs = [];
			let mode = lsGet(LS.wpMode, "preset");
			if (mode !== "preset" && mode !== "custom") mode = "preset";
			let active = 0;
			let play = lsGet(LS.wpPlay, "off");
			if (play !== "off" && play !== "once" && play !== "loop") play = "off";
			let shade = Number(lsGet(LS.wpShade, "70"));
			if (!isFinite(shade)) shade = 70;
			shade = Math.max(0, Math.min(100, Math.round(shade)));
			let timer = null;
			let onChange = null;
			let videoUrl = "";
			let videoId = "";

			function normalizeItem(x) {
				// 壁纸只保留静态图片；旧版视频项在加载时丢弃。
				if (!x || !x.data) return null;
				return Object.assign({}, x, { kind: "image", selected: x.selected !== false, data: x.data, poster: x.data });
			}
			function clampActive() {
				if (!customs.length) active = 0;
				else active = Math.max(0, Math.min(customs.length - 1, active));
			}
			function selectedIndexes() {
				return customs.map((x, i) => (x.selected ? i : -1)).filter((i) => i >= 0);
			}
			function getSelectedCount() {
				return customs.filter((x) => x.selected).length;
			}
			function hasWallpaper() {
				return !!defaultWallpaper || customs.length > 0;
			}
			function itemPoster(item) {
				if (!item) return "";
				if (item.kind === "video") return item.poster || VIDEO_PLACEHOLDER;
				return item.data || "";
			}
			function imageSrc() {
				if (mode === "custom" && customs.length) {
					clampActive();
					return itemPoster(customs[active]) || defaultWallpaper;
				}
				return defaultWallpaper;
			}
			function syncVideo() {
				if (!videoEl) return;
				const item = mode === "custom" && customs.length ? customs[active] : null;
				if (item && item.kind === "video" && item.blob) {
					if (videoId !== item.id || !videoUrl) {
						if (videoUrl) URL.revokeObjectURL(videoUrl);
						videoUrl = URL.createObjectURL(item.blob);
						videoId = item.id;
						videoEl.poster = item.poster || VIDEO_PLACEHOLDER;
						videoEl.src = videoUrl;
						try { videoEl.load(); } catch (e) {}
					}
					videoEl.classList.add("on");
					const p = videoEl.play();
					if (p && p.catch) p.catch(() => {});
				} else {
					try { videoEl.pause(); } catch (e) {}
					videoEl.classList.remove("on");
					videoEl.removeAttribute("src");
					try { videoEl.load(); } catch (e) {}
					videoId = "";
					if (videoUrl) {
						URL.revokeObjectURL(videoUrl);
						videoUrl = "";
					}
				}
			}
			function applyImage() {
				const src = imageSrc();
				const css = src ? 'url("' + src + '")' : "none";
				if (innerImage) {
					// 预设和自定义统一：只在聊天中心列内 cover，不铺到侧栏/整个窗口。
					innerImage.style.backgroundImage = css;
					innerImage.style.backgroundAttachment = "scroll";
					image.style.backgroundImage = "none";
				} else {
					image.style.backgroundImage = css;
				}
				if (inner) inner.style.display = src ? "block" : "none";
				syncVideo();
			}
			function applyScene() {
				const effective = hasWallpaper() ? "custom" : "night";
				host.dataset.scene = effective;
				document.body.classList.toggle("sc-scene-custom", effective === "custom");
			}
			function applyShade() {
				document.documentElement.style.setProperty("--sc-shade", String(1 - shade / 100));
			}
			function applyWallpaper() {
				applyImage();
				applyScene();
				applyShade();
			}
			function notify() {
				if (onChange) {
					try { onChange(); } catch (e) {}
				}
			}
			function saveState() {
				lsSet(LS.wpMode, mode);
				lsSet(LS.wpActive, String(active));
				lsSet(LS.wpPlay, play);
			}
			function saveCustoms() {
				return idbPut({
					id: "customs",
					items: customs.map((x) => ({
						id: x.id,
						kind: x.kind,
						data: x.data,
						blob: x.blob,
						poster: x.poster,
						name: x.name,
						at: x.at,
						selected: x.selected !== false,
					})),
				});
			}
			function stopTimer() {
				if (timer) {
					clearInterval(timer);
					timer = null;
				}
			}
			function startTimer() {
				stopTimer();
				if (mode !== "custom" || play === "off") return;
				const list = selectedIndexes();
				if (list.length < 2) return;
				if (!list.includes(active)) {
					active = list[0];
					lsSet(LS.wpActive, String(active));
					applyImage();
				}
				timer = setInterval(() => {
					if (mode !== "custom" || play === "off") {
						stopTimer();
						return;
					}
					const nextList = selectedIndexes();
					if (nextList.length < 2) {
						stopTimer();
						return;
					}
					let at = nextList.indexOf(active);
					if (at < 0) at = 0;
					if (at + 1 >= nextList.length) {
						if (play === "loop") at = 0;
						else {
							stopTimer();
							return;
						}
					} else {
						at++;
					}
					active = nextList[at];
					lsSet(LS.wpActive, String(active));
					applyImage();
					notify();
				}, 20000);
			}
			function setMode(next) {
				mode = next === "custom" && customs.length ? "custom" : "preset";
				saveState();
				applyWallpaper();
				startTimer();
				notify();
			}
			function setShade(next) {
				const v = Number(next);
				shade = Math.max(0, Math.min(100, Math.round(isFinite(v) ? v : 70)));
				lsSet(LS.wpShade, String(shade));
				applyShade();
			}
			function setCustoms(items) {
				customs = (Array.isArray(items) ? items : []).map(normalizeItem).filter(Boolean);
				clampActive();
				if (mode === "custom" && !customs.length) mode = "preset";
				saveState();
				saveCustoms();
				applyWallpaper();
				startTimer();
				notify();
			}
			function addCustom(item) {
				const next = normalizeItem(item);
				if (!next) return;
				next.selected = true;
				customs.push(next);
				active = customs.length - 1;
				mode = "custom";
				saveState();
				saveCustoms();
				applyWallpaper();
				startTimer();
				notify();
			}
			function removeCustom(id) {
				customs = customs.filter((x) => x.id !== id);
				clampActive();
				if (!customs.length) mode = "preset";
				saveState();
				saveCustoms();
				applyWallpaper();
				startTimer();
				notify();
			}
			function setActive(next) {
				const n = Number(next);
				active = isFinite(n) ? Math.round(n) : 0;
				clampActive();
				saveState();
				applyImage();
				notify();
			}
			function setPlay(next) {
				play = next === "once" || next === "loop" ? next : "off";
				saveState();
				startTimer();
				notify();
			}
			function toggleSelected(id) {
				const item = customs.find((x) => x.id === id);
				if (!item) return;
				item.selected = !item.selected;
				saveCustoms();
				startTimer();
				notify();
			}
			function setOnChange(fn) {
				onChange = typeof fn === "function" ? fn : null;
			}

			applyWallpaper();

			// 浏览器可能延迟/拦截 muted 自动播放；用户第一次点页面时补播。
			function resumeVideo() {
				if (!videoEl || !videoEl.classList.contains("on") || !videoEl.src) return;
				if (videoEl.paused) {
					const p = videoEl.play();
					if (p && p.catch) p.catch(() => {});
				}
			}
			document.addEventListener("pointerdown", resumeVideo, true);
			document.addEventListener("keydown", resumeVideo, true);

			(async () => {
				const rec = await idbGet("customs");
				let items = rec && Array.isArray(rec.items) ? rec.items : [];
				if (!items.length) {
					const old = await idbGet("custom");
					if (old && old.data) {
						items = [{ id: "legacy", kind: "image", data: old.data, poster: old.data, selected: true, name: old.name || "legacy", at: old.at || Date.now() }];
						await idbPut({ id: "customs", items });
						await idbDelete("custom");
					}
				}
				const rawCount = items.length;
				customs = items.map(normalizeItem).filter(Boolean);
				if (customs.length !== rawCount) saveCustoms();
				active = Number(lsGet(LS.wpActive, "0"));
				if (!isFinite(active)) active = 0;
				clampActive();
				if (mode === "custom" && !customs.length) mode = "preset";
				applyWallpaper();
				startTimer();
				notify();
			})();

			return {
				el: host,
				veil,
				getMode: () => (mode === "custom" && customs.length ? "custom" : "preset"),
				getWallpaperSrc: imageSrc,
				getCustoms: () => customs.slice(),
				getActive: () => active,
				getPlay: () => play,
				getSelectedCount,
				getShade: () => shade,
				setMode,
				setShade,
				setCustoms,
				addCustom,
				removeCustom,
				setActive,
				setPlay,
				toggleSelected,
				setOnChange,
				hasCustom: () => customs.length > 0,
				hasWallpaper,
				hasDefault: () => !!defaultWallpaper,
				dispose: () => {
					stopTimer();
					document.removeEventListener("pointerdown", resumeVideo, true);
					document.removeEventListener("keydown", resumeVideo, true);
					document.body.classList.remove("sc-scene-custom");
					document.documentElement.style.removeProperty("--sc-shade");
					if (videoEl) {
						try { videoEl.pause(); } catch (e) {}
						videoEl.removeAttribute("src");
						try { videoEl.load(); } catch (e) {}
					}
					if (videoUrl) URL.revokeObjectURL(videoUrl);
					if (inner) {
						inner.remove();
						if (center) center.classList.remove("sc-has-inner-wallpaper");
					}
					host.remove();
					veil.remove();
				},
			};
		}

		function startDock() {
			const dock = make("div", "sc-dock");
			dock.innerHTML = '<div class="sc-dock-mark" aria-hidden="true">' + MARK_SVG + "</div>";
			document.body.appendChild(dock);

			// 恢复位置：按右下角相对距离保存，窗口缩放时跟着右下角走。
			try {
				const raw = lsGet(LS.dock, "");
				if (raw) {
					const pos = JSON.parse(raw);
					if (typeof pos.right === "number" && typeof pos.bottom === "number") {
						dock.style.left = "auto";
						dock.style.top = "auto";
						dock.style.right = Math.max(8, pos.right) + "px";
						dock.style.bottom = Math.max(8, pos.bottom) + "px";
					}
				}
			} catch (e) {}
			// 屏幕尺寸变化后把控制条拉回可视区
			function clamp(x, y) {
				const r = dock.getBoundingClientRect();
				const pad = 8;
				const maxX = Math.max(pad, window.innerWidth - r.width - pad);
				const maxY = Math.max(pad, window.innerHeight - r.height - pad);
				return [Math.min(Math.max(pad, x), maxX), Math.min(Math.max(pad, y), maxY)];
			}
			function clampNow() {
				const r = dock.getBoundingClientRect();
				const pad = 8;
				const maxX = Math.max(pad, window.innerWidth - r.width - pad);
				const maxY = Math.max(pad, window.innerHeight - r.height - pad);
				const left = Math.min(Math.max(pad, r.left), maxX);
				const top = Math.min(Math.max(pad, r.top), maxY);
				if (Math.abs(left - r.left) < 0.5 && Math.abs(top - r.top) < 0.5) return;
				dock.style.left = "auto";
				dock.style.top = "auto";
				dock.style.right = Math.round(window.innerWidth - left - r.width) + "px";
				dock.style.bottom = Math.round(window.innerHeight - top - r.height) + "px";
			}
			clampNow();

			function fitDock() {
				dock.classList.remove("sc-dock-horizontal");
				const r = dock.getBoundingClientRect();
				if (r.height > window.innerHeight - 16) dock.classList.add("sc-dock-horizontal");
			}
			fitDock();

			const panels = [];
			let openPanel = null;
			function placePanel(panel) {
				if (!panel || !panel.classList.contains("open")) return;
				const dr = dock.getBoundingClientRect();
				const pr = panel.getBoundingClientRect();
				let left = dr.left - pr.width - 10;
				if (left < 8) left = Math.min(window.innerWidth - pr.width - 8, dr.right + 10);
				let top = dr.bottom - pr.height;
				top = Math.max(8, Math.min(top, window.innerHeight - pr.height - 8));
				panel.style.left = Math.max(8, left) + "px";
				panel.style.top = top + "px";
			}
			function closePanels(except) {
				for (const p of panels) {
					if (p !== except) p.classList.remove("open");
				}
				if (except) openPanel = except;
				else openPanel = null;
			}
			function registerPanel(panel) {
				panels.push(panel);
				// 面板挂在 body 上：控制条带 backdrop-filter，会成为 fixed 子元素的包含块，
				// 若挂在控制条内部，面板坐标会被错误地按控制条定位。
				document.body.appendChild(panel);
				panel.__scOpen = () => {
					const willOpen = !panel.classList.contains("open");
					closePanels(willOpen ? panel : null);
					panel.classList.toggle("open", willOpen);
					if (willOpen) placePanel(panel);
				};
				panel.__scShow = () => {
					closePanels(panel);
					panel.classList.add("open");
					placePanel(panel);
				};
				return panel;
			}

			// 拖动
			let pid = null, startX = 0, startY = 0, origL = 0, origT = 0, dragging = false, moved = false, suppressUntil = 0;
			const onDown = (e) => {
				if (e.button !== undefined && e.button !== 0) return;
				const r = dock.getBoundingClientRect();
				pid = e.pointerId;
				startX = e.clientX;
				startY = e.clientY;
				origL = r.left;
				origT = r.top;
				dragging = true;
				moved = false;
			};
			const onMove = (e) => {
				if (!dragging || e.pointerId !== pid) return;
				const dx = e.clientX - startX;
				const dy = e.clientY - startY;
				if (!moved && Math.hypot(dx, dy) < 4) return;
				if (!moved) {
					moved = true;
					dock.classList.add("dragging");
					try { dock.setPointerCapture(pid); } catch (err) {}
				}
				const p = clamp(origL + dx, origT + dy);
				dock.style.left = p[0] + "px";
				dock.style.top = p[1] + "px";
				dock.style.right = "auto";
				dock.style.bottom = "auto";
				if (openPanel) placePanel(openPanel);
			};
			const onUp = (e) => {
				if (e.pointerId !== pid) return;
				dragging = false;
				dock.classList.remove("dragging");
				try { if (dock.hasPointerCapture(pid)) dock.releasePointerCapture(pid); } catch (err) {}
				if (moved) {
					const r = dock.getBoundingClientRect();
					const right = Math.max(8, Math.round(window.innerWidth - r.right));
					const bottom = Math.max(8, Math.round(window.innerHeight - r.bottom));
					dock.style.left = "auto";
					dock.style.top = "auto";
					dock.style.right = right + "px";
					dock.style.bottom = bottom + "px";
					lsSet(LS.dock, JSON.stringify({ right, bottom }));
					suppressUntil = Date.now() + 280;
				}
				pid = null;
			};
			const onClickCapture = (e) => {
				if (Date.now() < suppressUntil) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			const onDocDown = (e) => {
				if (!openPanel) return;
				if (dock.contains(e.target) || openPanel.contains(e.target)) return;
				closePanels(null);
			};
			let viewportRaf = 0;
			const onViewport = () => {
				if (viewportRaf) return;
				viewportRaf = requestAnimationFrame(() => {
					viewportRaf = 0;
					fitDock();
					clampNow();
					if (openPanel) placePanel(openPanel);
				});
			};
			const onEsc = (e) => {
				if (e.key === "Escape" && openPanel) closePanels(null);
			};

			dock.addEventListener("pointerdown", onDown);
			window.addEventListener("pointermove", onMove);
			window.addEventListener("pointerup", onUp);
			window.addEventListener("pointercancel", onUp);
			dock.addEventListener("click", onClickCapture, true);
			document.addEventListener("pointerdown", onDocDown, true);
			window.addEventListener("resize", onViewport);
			window.addEventListener("orientationchange", onViewport);
			document.addEventListener("fullscreenchange", onViewport);
			if (window.visualViewport) window.visualViewport.addEventListener("resize", onViewport);
			document.addEventListener("keydown", onEsc);

			return {
				el: dock,
				addButton(char, tip) {
					const btn = make("button", String(char).length > 1 ? "sc-btn sc-btn-word" : "sc-btn");
					btn.type = "button";
					btn.textContent = char;
					btn.dataset.tip = tip;
					btn.setAttribute("aria-label", tip);
					dock.appendChild(btn);
					fitDock();
					clampNow();
					return btn;
				},
				registerPanel,
				closePanels: () => closePanels(null),
				dispose() {
					dock.removeEventListener("pointerdown", onDown);
					window.removeEventListener("pointermove", onMove);
					window.removeEventListener("pointerup", onUp);
					window.removeEventListener("pointercancel", onUp);
					dock.removeEventListener("click", onClickCapture, true);
					document.removeEventListener("pointerdown", onDocDown, true);
					window.removeEventListener("resize", onViewport);
					window.removeEventListener("orientationchange", onViewport);
					document.removeEventListener("fullscreenchange", onViewport);
					if (window.visualViewport) window.visualViewport.removeEventListener("resize", onViewport);
					if (viewportRaf) cancelAnimationFrame(viewportRaf);
					document.removeEventListener("keydown", onEsc);
					for (const p of panels) p.remove();
					dock.remove();
				},
			};
		}

		// ═══════════ 7. 开屏视频原声（循环播放） ═══════════
		function startMusic() {
			const src = MUSIC_AUDIO || "";
			let preset = lsGet(LS.music, "off");
			if (preset !== "off" && preset !== "song") preset = "off";
			let volume = Number(lsGet(LS.musicVol, "45"));
			if (!isFinite(volume)) volume = 45;
			volume = Math.max(0, Math.min(100, volume));
			let audio = null;
			let playing = false;

			function hasAudio() {
				return !!src;
			}
			function ensure() {
				if (!src) return false;
				if (!audio) {
					try {
						audio = new Audio(src);
						audio.loop = true;
						audio.preload = "auto";
						audio.volume = volume / 100;
						audio.addEventListener("play", () => { playing = true; });
						audio.addEventListener("pause", () => { playing = false; });
						audio.addEventListener("error", () => { playing = false; });
					} catch (e) {
						audio = null;
						return false;
					}
				}
				return true;
			}
			function startPlayback() {
				if (!ensure()) return;
				const p = audio.play();
				if (p && typeof p.catch === "function") {
					p.catch(() => { playing = false; });
				}
			}
			function setPreset(next) {
				preset = next === "song" ? "song" : "off";
				lsSet(LS.music, preset);
				if (preset === "off") {
					if (audio) audio.pause();
					playing = false;
					return;
				}
				if (!ensure()) return;
				try { audio.currentTime = 0; } catch (e) {}
				startPlayback();
			}
			function toggle() {
				if (!hasAudio()) return;
				if (playing) {
					if (audio) audio.pause();
					return;
				}
				if (preset !== "song") {
					preset = "video";
					lsSet(LS.music, preset);
				}
				startPlayback();
			}
			function setVolume(next) {
				const v = Number(next);
				volume = Math.max(0, Math.min(100, isFinite(v) ? v : 45));
				lsSet(LS.musicVol, String(Math.round(volume)));
				if (audio) audio.volume = volume / 100;
			}

			return {
				hasAudio,
				getPreset: () => preset,
				isPlaying: () => playing,
				setPreset,
				toggle,
				setVolume,
				getVolume: () => Math.round(volume),
				dispose() {
					if (audio) {
						try { audio.pause(); } catch (e) {}
						try {
							audio.removeAttribute("src");
							audio.load();
						} catch (e) {}
					}
					audio = null;
					playing = false;
				},
			};
		}

		// ═══════════ 8. 粒子层（Canvas，位于 UI 下方） ═══════════
		function startParticles() {
			const canvas = make("canvas", "sc-particles");
			canvas.setAttribute("aria-hidden", "true");
			const center = document.querySelector(".mP3x-q_centerCol, [class$='-q_centerCol']");
			const host = center || document.body;
			if (center) canvas.classList.add("sc-particles-inner");
			host.appendChild(canvas);
			const c = canvas.getContext("2d");
			let mode = lsGet(LS.particles, "off");
			if (mode !== "off" && mode !== "cyan" && mode !== "storm" && mode !== "snow") mode = "off";
			// 粒子是用户显式选择的效果：不跟随系统 reduced-motion 自动关闭，
			// 否则 Windows 关闭动画效果时会出现“选了粒子但完全看不到”。
			const reduce = false;
			let w = 0, h = 0, dpr = 1;
			let parts = [];
			let raf = 0;
			let last = 0;
			let bolt = null;
			let nextBolt = 0;
			let ro = null;

			function resize() {
				dpr = Math.min(2, window.devicePixelRatio || 1);
				w = Math.max(1, host === document.body ? window.innerWidth : host.clientWidth);
				h = Math.max(1, host === document.body ? window.innerHeight : host.clientHeight);
				canvas.width = Math.max(1, Math.floor(w * dpr));
				canvas.height = Math.max(1, Math.floor(h * dpr));
				canvas.style.width = w + "px";
				canvas.style.height = h + "px";
				c.setTransform(dpr, 0, 0, dpr, 0, 0);
				seed();
			}
			function seed() {
				parts = [];
				if (mode === "off" || reduce) return;
				const n = mode === "snow" ? 90 : mode === "cyan" ? 70 : 55;
				for (let i = 0; i < n; i++) {
					parts.push({
						x: Math.random() * w,
						y: Math.random() * h,
						vx: (Math.random() - 0.5) * (mode === "storm" ? 0.55 : 0.25),
						vy: mode === "snow" ? 0.16 + Math.random() * 0.42 : mode === "cyan" ? -(0.08 + Math.random() * 0.28) : 0.03 + Math.random() * 0.18,
						r: mode === "snow" ? 1.0 + Math.random() * 1.8 : 1.1 + Math.random() * 2.2,
						a: 0.34 + Math.random() * 0.38,
						phase: Math.random() * Math.PI * 2,
					});
				}
			}
			function makeBolt() {
				const x = Math.random() * (w * 0.7) + w * 0.15;
				const pts = [{ x, y: -20 }];
				let cx = x;
				for (let i = 0; i < 7; i++) {
					cx += (Math.random() - 0.5) * 54;
					pts.push({ x: cx, y: (h * (i + 1)) / 7 + (Math.random() - 0.5) * 24 });
				}
				return { pts, t: performance.now() };
			}
			function drawBolt(now) {
				if (!bolt) return;
				const age = (now - bolt.t) / 650;
				if (age > 1) {
					bolt = null;
					return;
				}
				c.save();
				c.strokeStyle = "rgba(190, 244, 255, " + (1 - age) * 0.60 + ")";
				c.lineWidth = 1.4;
				c.shadowColor = "rgba(93, 190, 204, 1)";
				c.shadowBlur = 12;
				c.beginPath();
				bolt.pts.forEach((pt, i) => {
					if (i === 0) c.moveTo(pt.x, pt.y);
					else c.lineTo(pt.x, pt.y);
				});
				c.stroke();
				c.restore();
			}
			function frame(now) {
				raf = 0;
				if (mode === "off" || reduce || !c) return;
				const dt = Math.min(64, now - last || 16);
				last = now;
				c.clearRect(0, 0, w, h);
				const t = now / 1000;
				for (const p of parts) {
					p.x += p.vx + Math.sin(t + p.phase) * 0.04;
					p.y += p.vy * (dt / 16);
					if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
					if (p.y > h + 8) { p.y = -8; p.x = Math.random() * w; }
					if (p.x < -8) p.x = w + 8;
					if (p.x > w + 8) p.x = -8;
					const col = mode === "snow" ? "234, 246, 255" : mode === "storm" ? "127, 216, 228" : "93, 190, 204";
					c.fillStyle = "rgba(" + col + "," + p.a + ")";
					c.shadowColor = "rgba(" + col + ", 0.85)";
					c.shadowBlur = mode === "snow" ? 7 : 9;
					c.beginPath();
					c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
					c.fill();
					c.shadowBlur = 0;
				}
				if (mode === "storm") {
					if (now > nextBolt) {
						bolt = makeBolt();
						nextBolt = now + 2600 + Math.random() * 3800;
					}
					drawBolt(now);
				}
				raf = requestAnimationFrame(frame);
			}
			function start() {
				if (raf || mode === "off" || reduce) return;
				last = performance.now();
				raf = requestAnimationFrame(frame);
			}
			function stop() {
				if (raf) cancelAnimationFrame(raf);
				raf = 0;
				if (c) c.clearRect(0, 0, w, h);
			}
			function setMode(next) {
				mode = next === "cyan" || next === "storm" || next === "snow" ? next : "off";
				lsSet(LS.particles, mode);
				canvas.style.display = mode === "off" || reduce ? "none" : "block";
				if (mode === "off" || reduce) stop();
				else {
					seed();
					start();
				}
			}
			window.addEventListener("resize", resize);
			if (center && typeof ResizeObserver === "function") {
				ro = new ResizeObserver(resize);
				ro.observe(center);
			}
			resize();
			canvas.style.display = mode === "off" || reduce ? "none" : "block";
			if (mode !== "off" && !reduce) start();

			return {
				getMode: () => mode,
				setMode,
				dispose() {
					stop();
					window.removeEventListener("resize", resize);
					if (ro) ro.disconnect();
					canvas.remove();
				},
			};
		}

		// ═══════════ 9. 右侧四个控制入口 ═══════════
		function startControls(dock, bg, intro, music, particles) {
			const panel = make("div", "sc-panel sc-controls");
			panel.innerHTML =
				'<div class="sc-panel-head">' +
				'<div class="sc-panel-title">壁纸</div>' +
				'<button class="sc-panel-close" type="button" aria-label="收起">—</button>' +
				"</div>" +
				'<section class="sc-panel-section" data-sec="wallpaper">' +
				'<div class="sc-wallpaper-preview"><img class="sc-wallpaper-thumb" alt=""><span class="sc-wallpaper-empty">无壁纸</span></div>' +
				'<p class="sc-panel-label">遮罩透明度</p>' +
				'<div class="sc-wp-brightness">' +
				'<input class="sc-range sc-wallpaper-range" type="range" min="0" max="100" step="5" value="70" aria-label="遮罩透明度">' +
				'<span class="sc-range-val">70%</span>' +
				"</div>" +
				'<div class="sc-seg sc-seg-2">' +
				'<button class="sc-seg-btn" type="button" data-wp="preset">预设</button>' +
				'<button class="sc-seg-btn" type="button" data-wp="custom">自定义</button>' +
				"</div>" +
				'<div class="sc-panel-row">' +
				'<button class="sc-panel-btn sc-import" type="button">导入壁纸</button>' +
				'<button class="sc-panel-btn sc-danger sc-clear" type="button">移除</button>' +
				"</div>" +
				'<div class="sc-wp-gallery"></div>' +
				'<p class="sc-wp-selected">已选 0 张</p>' +
				'<div class="sc-seg sc-seg-3 sc-wp-play">' +
				'<button class="sc-seg-btn" type="button" data-play="off">关闭</button>' +
				'<button class="sc-seg-btn" type="button" data-play="once">轮切</button>' +
				'<button class="sc-seg-btn" type="button" data-play="loop">循环</button>' +
				"</div>" +
				"</section>" +
				'<section class="sc-panel-section" data-sec="opening">' +
				'<div class="sc-seg sc-seg-2">' +
				'<button class="sc-seg-btn" type="button" data-open="video">视频</button>' +
				'<button class="sc-seg-btn" type="button" data-open="off">关闭</button>' +
				"</div>" +
				'<p class="sc-panel-label">声音</p>' +
				'<div class="sc-seg sc-seg-2">' +
				'<button class="sc-seg-btn" type="button" data-sound="on">开启</button>' +
				'<button class="sc-seg-btn" type="button" data-sound="off">静音</button>' +
				"</div>" +
				'<div class="sc-panel-row">' +
				'<button class="sc-panel-btn sc-replay" type="button">重播</button>' +
				"</div>" +
				"</section>" +
				'<section class="sc-panel-section" data-sec="music">' +
				'<div class="sc-seg sc-seg-2">' +
				'<button class="sc-seg-btn" type="button" data-music="off">关闭</button>' +
				'<button class="sc-seg-btn" type="button" data-music="song">九彻生识</button>' +
				"</div>" +
				'<div class="sc-panel-row">' +
				'<button class="sc-panel-btn sc-music-toggle" type="button">播放</button>' +
				"</div>" +
				'<p class="sc-panel-label">音量</p>' +
				'<input class="sc-range" type="range" min="0" max="100" value="45" aria-label="音乐音量">' +
				"</section>" +
				'<section class="sc-panel-section" data-sec="particles">' +
				'<div class="sc-seg sc-seg-4">' +
				'<button class="sc-seg-btn" type="button" data-particles="off">关闭</button>' +
				'<button class="sc-seg-btn" type="button" data-particles="cyan">青蓝</button>' +
				'<button class="sc-seg-btn" type="button" data-particles="storm">雷光</button>' +
				'<button class="sc-seg-btn" type="button" data-particles="snow">雪</button>' +
				"</div>" +
				"</section>";
			dock.registerPanel(panel);

			const file = make("input");
			file.type = "file";
			file.accept = "image/*";
			file.multiple = true;
			file.style.display = "none";
			panel.appendChild(file);

			const title = panel.querySelector(".sc-panel-title");
			const sections = Array.from(panel.querySelectorAll(".sc-panel-section"));
			const titles = { wallpaper: "壁纸", opening: "开屏", music: "音乐", particles: "粒子" };
			let current = "wallpaper";
			const dockButtons = {};

			// 壁纸
			const wpBtns = Array.from(panel.querySelectorAll("[data-wp]"));
			const presetBtn = panel.querySelector('[data-wp="preset"]');
			const customBtn = panel.querySelector('[data-wp="custom"]');
			const importBtn = panel.querySelector(".sc-import");
			const clearBtn = panel.querySelector(".sc-clear");
			const thumb = panel.querySelector(".sc-wallpaper-thumb");
			const empty = panel.querySelector(".sc-wallpaper-empty");
			const brightRange = panel.querySelector(".sc-wallpaper-range");
			const brightVal = panel.querySelector(".sc-range-val");
			const gallery = panel.querySelector(".sc-wp-gallery");
			const selectedLabel = panel.querySelector(".sc-wp-selected");
			const playBox = panel.querySelector(".sc-wp-play");
			const playBtns = Array.from(panel.querySelectorAll("[data-play]"));
			let busy = false;
			let galleryKey = "";

			function renderGallery(customs) {
				const key = customs.map((x) => x.id + ":" + (x.selected ? "1" : "0")).join("|") + "#" + bg.getActive();
				if (key === galleryKey) return;
				galleryKey = key;
				gallery.innerHTML = "";
				customs.forEach((item, i) => {
					const b = make("div", "sc-wp-item");
					b.tabIndex = 0;
					b.setAttribute("role", "button");
					b.title = item.name || "自定义壁纸";
					const img = document.createElement("img");
					img.src = item.data || VIDEO_PLACEHOLDER;
					img.alt = "";
					b.appendChild(img);
					const check = make("button", "sc-wp-check");
					check.type = "button";
					check.textContent = "✓";
					check.setAttribute("aria-label", item.selected ? "取消选择" : "选择加入轮播");
					check.addEventListener("click", (e) => {
						e.stopPropagation();
						bg.toggleSelected(item.id);
						syncWallpaper();
					});
					b.appendChild(check);
					b.classList.toggle("active", i === bg.getActive());
					b.classList.toggle("selected", !!item.selected);
					const openItem = () => {
						bg.setMode("custom");
						bg.setActive(i);
						syncWallpaper();
					};
					b.addEventListener("click", openItem);
					b.addEventListener("keydown", (e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							openItem();
						}
					});
					gallery.appendChild(b);
				});
			}
			function syncWallpaper() {
				const mode = bg.getMode();
				const customs = bg.getCustoms();
				wpBtns.forEach((b) => b.classList.toggle("active", b.dataset.wp === mode));
				presetBtn.disabled = !bg.hasDefault();
				customBtn.disabled = customs.length === 0;
				clearBtn.disabled = customs.length === 0;
				const src = bg.getWallpaperSrc();
				if (src) {
					if (thumb.getAttribute("src") !== src) thumb.setAttribute("src", src);
					thumb.classList.add("on");
					empty.classList.add("hide");
				} else {
					thumb.removeAttribute("src");
					thumb.classList.remove("on");
					empty.classList.remove("hide");
				}
				const shade = bg.getShade();
				brightRange.value = String(shade);
				brightVal.textContent = shade + "%";
				const selected = bg.getSelectedCount();
				selectedLabel.style.display = customs.length ? "" : "none";
				selectedLabel.textContent = "已选 " + selected + " 张";
				const canPlay = selected > 1;
				playBox.style.display = canPlay ? "grid" : "none";
				playBtns.forEach((b) => {
					b.disabled = !canPlay;
					b.classList.toggle("active", b.dataset.play === bg.getPlay());
				});
				gallery.style.display = customs.length ? "grid" : "none";
				renderGallery(customs);
			}
			thumb.addEventListener("error", () => {
				thumb.classList.remove("on");
				empty.textContent = "壁纸加载失败";
				empty.classList.remove("hide");
			});
			thumb.addEventListener("load", () => {
				empty.textContent = "无壁纸";
			});
			brightRange.addEventListener("input", () => {
				const v = Number(brightRange.value);
				bg.setShade(v);
				brightVal.textContent = v + "%";
			});
			brightRange.addEventListener("change", () => {
				bg.setShade(Number(brightRange.value));
			});
			playBtns.forEach((b) => {
				b.addEventListener("click", () => {
					bg.setPlay(b.dataset.play);
					syncWallpaper();
				});
			});
			presetBtn.addEventListener("click", () => {
				bg.setMode("preset");
				syncWallpaper();
			});
			customBtn.addEventListener("click", () => {
				if (!bg.hasCustom()) {
					file.value = "";
					file.click();
					return;
				}
				bg.setMode("custom");
				syncWallpaper();
			});
			importBtn.addEventListener("click", () => {
				if (busy) return;
				file.value = "";
				file.click();
			});
			file.addEventListener("change", async () => {
				const files = Array.from(file.files || []);
				if (!files.length) return;
				busy = true;
				importBtn.disabled = true;
				importBtn.textContent = "处理中…";
				try {
					for (let i = 0; i < files.length; i++) {
						const f = files[i];
						if (f.type && f.type.indexOf("video/") === 0) continue;
						const id = "wp-" + Date.now() + "-" + i + "-" + Math.random().toString(36).slice(2, 7);
						const data = await fileToDataURL(f, 1920);
						await bg.addCustom({
							id,
							kind: "image",
							data,
							poster: data,
							name: f.name || "",
							at: Date.now(),
							selected: true,
						});
					}
				} catch (e) {
					console.warn("[scaramouche] wallpaper import failed", e);
				} finally {
					busy = false;
					importBtn.disabled = false;
					importBtn.textContent = "导入壁纸";
					syncWallpaper();
				}
			});
			clearBtn.addEventListener("click", async () => {
				const customs = bg.getCustoms();
				const item = customs[bg.getActive()];
				if (item) await bg.removeCustom(item.id);
				syncWallpaper();
			});

			// 开屏
			const openBtns = Array.from(panel.querySelectorAll("[data-open]"));
			const soundBtns = Array.from(panel.querySelectorAll("[data-sound]"));
			const replayBtn = panel.querySelector(".sc-replay");
			function syncOpening() {
				const mode = intro.getMode();
				openBtns.forEach((b) => b.classList.toggle("active", b.dataset.open === mode));
				const sound = intro.getSound();
				soundBtns.forEach((b) => b.classList.toggle("active", (b.dataset.sound === "on") === sound));
				openBtns.forEach((b) => {
					if (b.dataset.open === "video") b.disabled = !intro.hasVideo();
				});
			}
			openBtns.forEach((b) => {
				b.addEventListener("click", () => {
					intro.setMode(b.dataset.open);
					syncOpening();
				});
			});
			soundBtns.forEach((b) => {
				b.addEventListener("click", () => {
					intro.setSound(b.dataset.sound === "on");
					syncOpening();
				});
			});
			replayBtn.addEventListener("click", () => {
				const mode = intro.getMode();
				dock.closePanels();
				intro.play(mode === "off" ? "video" : mode);
			});

			// 音乐
			const musicBtns = Array.from(panel.querySelectorAll("[data-music]"));
			const musicToggle = panel.querySelector(".sc-music-toggle");
			const range = panel.querySelector(".sc-range:not(.sc-wallpaper-range):not(.sc-wp-count)");
			function syncMusic() {
				const preset = music.getPreset();
				musicBtns.forEach((b) => b.classList.toggle("active", b.dataset.music === preset));
				const has = music.hasAudio();
				const songBtn = panel.querySelector('[data-music="song"]');
				if (songBtn) songBtn.disabled = !has;
				musicToggle.disabled = !has;
				range.disabled = !has;
				musicToggle.textContent = music.isPlaying() ? "暂停" : "播放";
				range.value = String(music.getVolume());
			}
			musicBtns.forEach((b) => {
				b.addEventListener("click", () => {
					music.setPreset(b.dataset.music);
					syncMusic();
				});
			});
			musicToggle.addEventListener("click", () => {
				music.toggle();
				syncMusic();
			});
			range.addEventListener("input", () => music.setVolume(range.value));

			// 粒子
			const particleBtns = Array.from(panel.querySelectorAll("[data-particles]"));
			function syncParticles() {
				const mode = particles.getMode();
				particleBtns.forEach((b) => b.classList.toggle("active", b.dataset.particles === mode));
			}
			particleBtns.forEach((b) => {
				b.addEventListener("click", () => {
					particles.setMode(b.dataset.particles);
					syncParticles();
				});
			});

			function syncAll() {
				syncWallpaper();
				syncOpening();
				syncMusic();
				syncParticles();
			}
			function setSection(key) {
				current = key;
				title.textContent = titles[key];
				sections.forEach((s) => s.classList.toggle("active", s.dataset.sec === key));
				syncAll();
			}
			function updateDockState() {
				const open = panel.classList.contains("open");
				for (const key of Object.keys(dockButtons)) {
					dockButtons[key].classList.toggle("on", open && current === key);
				}
			}
			function toggleSection(key) {
				if (panel.classList.contains("open") && current === key) {
					dock.closePanels();
					updateDockState();
					return;
				}
				setSection(key);
				panel.__scShow();
				updateDockState();
			}
			[["壁纸", "wallpaper"], ["开屏", "opening"], ["音乐", "music"], ["粒子", "particles"]].forEach(([label, key]) => {
				const btn = dock.addButton(label, label);
				dockButtons[key] = btn;
				btn.addEventListener("click", (e) => {
					e.stopPropagation();
					toggleSection(key);
				});
			});
			panel.querySelector(".sc-panel-close").addEventListener("click", () => {
				dock.closePanels();
				updateDockState();
			});
			const mo = new MutationObserver(updateDockState);
			mo.observe(panel, { attributes: true, attributeFilter: ["class"] });
			bg.setOnChange(syncWallpaper);
			setSection("wallpaper");
			updateDockState();
			setTimeout(syncWallpaper, 80);

			return {
				dispose() {
					mo.disconnect();
					file.remove();
				},
			};
		}

		function openingSources() {
			return [INTRO_VIDEO, INTRO_VIDEO_FALLBACK].filter(Boolean);
		}
		function getOpeningMode() {
			const fallback = openingSources().length ? "video" : "off";
			let mode = lsGet(LS.opening, fallback);
			if (mode !== "video" && mode !== "sigil" && mode !== "off") mode = fallback;
			// 不再使用自定义三巴纹开场：没有视频就直接关闭。
			if (mode === "sigil") mode = fallback;
			if (mode === "video" && !openingSources().length) mode = "off";
			return mode;
		}
		function setOpeningMode(mode) {
			lsSet(LS.opening, mode === "off" ? "off" : "video");
		}
		function getIntroSound() {
			return lsGet(LS.introSound, "1") !== "0";
		}
		function setIntroSound(on) {
			lsSet(LS.introSound, on ? "1" : "0");
		}

		function playIntro(forceMode) {
			if (prefersReduced()) return false;
			if (document.querySelector(".sc-intro")) return false;
			const mode = forceMode || getOpeningMode();
			if (mode !== "video") return false;
			const sources = openingSources();
			if (!sources.length) return false;
			return playVideoIntro(sources, getIntroSound());
		}

		// 本地视频开屏：主视频失败自动切备用视频；两个都失败时不回三巴纹，直接收起
		function playVideoIntro(sources, soundOn) {
			const withSound = soundOn !== false;
			const ov = make("div", "sc-intro sc-intro-video");
			ov.innerHTML =
				'<video class="sc-intro-media" autoplay playsinline preload="auto" aria-hidden="true"></video>' +
				'<div class="sc-intro-shade"></div>' +
				'<button class="sc-intro-sound" type="button" aria-label="' + (withSound ? "关闭声音" : "开启声音") + '" aria-pressed="' + (withSound ? "true" : "false") + '">' + (withSound ? "关闭声音" : "开启声音") + "</button>" +
				'<button class="sc-intro-skip" type="button">点击跳过</button>';
			document.body.appendChild(ov);
			document.body.classList.add("sc-intro-open");

			const video = ov.querySelector(".sc-intro-media");
			const sound = ov.querySelector(".sc-intro-sound");
			let done = false;
			let timer = null;
			let sourceIndex = 0;
			let attempt = 0;

			const onKey = (e) => {
				if (e.key === "Escape") finish();
			};
			function cleanup() {
				if (done) return;
				done = true;
				if (timer) clearTimeout(timer);
				document.removeEventListener("keydown", onKey);
				document.body.classList.remove("sc-intro-open");
				// 保留最后一帧参与淡出；等 overlay 移除时再随节点一起释放源。
				try { video.pause(); } catch (e) {}
				ov.classList.add("gone");
				setTimeout(() => ov.remove(), 1300);
			}
			function finish() {
				cleanup();
			}
			function updateSound() {
				const on = !video.muted;
				sound.textContent = on ? "关闭声音" : "开启声音";
				sound.setAttribute("aria-label", sound.textContent);
				sound.setAttribute("aria-pressed", on ? "true" : "false");
			}
			updateSound();

			// 依次尝试主视频 / 备用视频；用 token 防止旧 source 的 error 回调重复推进
			function nextSource() {
				if (done) return;
				if (sourceIndex >= sources.length) {
					cleanup();
					return;
				}
				const token = ++attempt;
				const src = sources[sourceIndex++];
				const fail = () => {
					if (done || token !== attempt) return;
					nextSource();
				};
				video.addEventListener("error", fail, { once: true });
				video.src = src;
				try { video.load(); } catch (e) {}
				// 按设置决定有声或静音；有声被自动播放策略拦截时再静音重试
				video.muted = !withSound;
				video.volume = 1;
				updateSound();
				const playing = video.play();
				if (playing && typeof playing.catch === "function") {
					playing.catch(() => {
						if (done || token !== attempt) return;
						if (!withSound) {
							fail();
							return;
						}
						video.muted = true;
						updateSound();
						const retry = video.play();
						if (retry && typeof retry.catch === "function") retry.catch(fail);
					});
				}
			}

			video.addEventListener("ended", () => setTimeout(finish, 220), { once: true });
			sound.addEventListener("click", (e) => {
				e.stopPropagation();
				video.muted = !video.muted;
				updateSound();
				if (!video.muted) {
					video.play().catch(() => {});
				}
			});
			ov.querySelector(".sc-intro-skip").addEventListener("click", (e) => {
				e.stopPropagation();
				finish();
			});
			ov.addEventListener("click", finish);
			document.addEventListener("keydown", onKey);
			timer = setTimeout(finish, 15000);
			nextSource();
			return true;
		}

		// 没有视频时的原生开屏：三巴纹描线 + 题字
		function playSigilIntro() {
			const ov = make("div", "sc-intro");
			ov.innerHTML =
				'<div class="sc-intro-flash"></div>' +
				'<div class="sc-intro-stage">' +
				SIGIL_SVG +
				'<div class="sc-intro-title">散兵</div>' +
				'<div class="sc-intro-sub">The Balladeer · 愚人众第六席</div>' +
				'<div class="sc-intro-line">「我曾三次遭到背叛。」</div>' +
				"</div>" +
				'<button class="sc-intro-skip" type="button">点击跳过</button>';
			document.body.appendChild(ov);
			document.body.classList.add("sc-intro-open");

			let done = false;
			let timer = null;
			const onKey = (e) => {
				if (e.key === "Escape") finish();
			};
			function finish() {
				if (done) return;
				done = true;
				if (timer) clearTimeout(timer);
				document.removeEventListener("keydown", onKey);
				document.body.classList.remove("sc-intro-open");
				ov.classList.add("gone");
				setTimeout(() => ov.remove(), 1300);
			}
			ov.addEventListener("click", finish);
			ov.querySelector(".sc-intro-skip").addEventListener("click", (e) => {
				e.stopPropagation();
				finish();
			});
			document.addEventListener("keydown", onKey);
			timer = setTimeout(finish, 3000);
			return true;
		}

		function flashScreen() {
			if (prefersReduced()) return;
			const el = make("div", "sc-flash");
			el.innerHTML =
				'<svg viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
				'<defs><linearGradient id="sc-flash-grad" x1="0" y1="0" x2=".4" y2="1">' +
				'<stop offset="0" stop-color="#EAF6FF"/><stop offset=".5" stop-color="#5DBECC"/><stop offset="1" stop-color="#1A4C90"/>' +
				"</linearGradient>" +
				'<filter id="sc-flash-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
				'<path d="M118 6 58 134h40L76 294l94-166h-48L150 6Z" fill="url(#sc-flash-grad)" filter="url(#sc-flash-glow)"/>' +
				"</svg>";
			document.body.appendChild(el);
			setTimeout(() => el.remove(), 950);
		}

		// ═══════════ 9. 彩蛋 ═══════════
		function startEasterEgg() {
			let last = 0;
			const onKey = (e) => {
				if (e.key !== "Enter") return;
				const t = e.target;
				if (!t || (t.tagName !== "INPUT" && t.tagName !== "TEXTAREA")) return;
				const value = (t.value || "").trim().toLowerCase();
				if (!value) return;
				if (["散兵", "scara", "scaramouche", "balladeer", "倾奇者"].indexOf(value) >= 0) {
					const now = Date.now();
					if (now - last < 1500) return;
					last = now;
					playIntro();
					return;
				}
				if (value === "雷") flashScreen();
			};
			document.addEventListener("keydown", onKey, true);
			return () => document.removeEventListener("keydown", onKey, true);
		}

		// ═══════════ 10. apply ═══════════
		function apply(ctx) {
			ctx.effect(() => {
				if (!document.body) return;

				// 旧实例/HMR 先清掉，避免重复控制条、重复面板。
				document.querySelectorAll(".sc-dock, .sc-panel.sc-controls, .sc-rail, .sc-bg, .sc-veil, .sc-particles, .sc-wallpaper-inner, .sc-boot, .sc-intro").forEach((n) => n.remove());
				document.querySelectorAll("style[data-sc-theme]").forEach((n) => n.remove());
				document.body.classList.remove("sc-scene-custom", "sc-intro-open");

				// 1) 身份层样式
				const style = document.createElement("style");
				style.dataset.scTheme = THEME_ID;
				style.textContent = identityCSS();
				document.head.appendChild(style);
				document.body.dataset.scTheme = THEME_ID;

				// 2) 注册并激活主题
				let disposeTheme = null;
				try {
					if (ctx.theme && typeof ctx.theme.register === "function") {
						disposeTheme = ctx.theme.register({
							id: THEME_ID,
							colorScheme: "dark",
							tokens: TOKENS,
						});
						ctx.theme.setTheme(THEME_ID);
					}
				} catch (e) {
					console.warn("[dsh-theme-scaramouche] theme registration failed", e);
				}

				// 3) 锁深色：本主题是墨黑底
				document.documentElement.style.colorScheme = "dark";
				document.body.toggleAttribute("data-ds-dark-theme", true);
				const darkObserver = new MutationObserver(() => {
					document.documentElement.style.colorScheme = "dark";
					if (!document.body.hasAttribute("data-ds-dark-theme")) {
						document.body.toggleAttribute("data-ds-dark-theme", true);
					}
				});
				darkObserver.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });

				// 4) 身份层挂载
				const bg = startBackground();
				const rail = make("div", "sc-rail");
				document.body.appendChild(rail);
				const music = startMusic();
				const particles = startParticles();
				const dock = startDock();
				const intro = {
					getMode: getOpeningMode,
					setMode: setOpeningMode,
					getSound: getIntroSound,
					setSound: setIntroSound,
					hasVideo: () => openingSources().length > 0,
					play: playIntro,
				};
				const controls = startControls(dock, bg, intro, music, particles);

				// 5) 开场：不再铺自定义纹饰启动页，首个窗口直接播视频
				let seen = false;
				try {
					seen = sessionStorage.getItem(SS_INTRO) === "1";
				} catch (e) {}
				const openingMode = getOpeningMode();
				let introTimer = null;
				if (!seen && openingMode === "video") {
					introTimer = setTimeout(() => {
						if (playIntro()) {
							try {
								sessionStorage.setItem(SS_INTRO, "1");
							} catch (e) {}
						}
					}, 0);
				}

				// 6) 彩蛋

				const stopEgg = startEasterEgg();

				return () => {
					if (introTimer) clearTimeout(introTimer);
					stopEgg();
					controls.dispose();
					dock.dispose();
					music.dispose();
					particles.dispose();
					rail.remove();
					bg.dispose();
					darkObserver.disconnect();
					if (disposeTheme) {
						try { disposeTheme(); } catch (e) {}
					}
					document.querySelectorAll("style[data-sc-theme]").forEach((s) => s.remove());
					document.querySelectorAll(".sc-intro, .sc-flash").forEach((s) => s.remove());
					if (document.body) {
						delete document.body.dataset.scTheme;
						document.body.classList.remove("sc-intro-open");
						document.documentElement.style.colorScheme = "";
					}
				};
			}, "dsh-theme-scaramouche: apply");
		}

		exports.isPlugin = true;
		exports.inject = ["theme"];
		exports.apply = apply;
		return module.exports;
	},
});
