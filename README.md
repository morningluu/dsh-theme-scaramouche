<div align="center">

<img src="icon.svg" width="92" alt="Scaramouche theme icon" />

# 散兵 · 浮世雷音

**A Scaramouche-inspired dark theme for DeepSeek Harness.**

墨黑潮底 · 深海蓝 × 青蓝 × 雾紫蓝 · 暗金细线 · 只在聊天区显示的静态壁纸 · 可拖动玻璃控制条

[![MIT](https://img.shields.io/badge/license-MIT-5DBECC)](LICENSE)
[![DSH](https://img.shields.io/badge/DeepSeek%20Harness-theme-1A4C90)](https://github.com/deepseek-ai)
[![PRs](https://img.shields.io/badge/PRs-welcome-C8A96A)](https://github.com/morningluu/dsh-theme-scaramouche/pulls)

![theme preview](assets/screenshot-1.png)

*截图使用自定义渐变壁纸；公开仓库不包含任何《原神》官方图片、视频或音频。*

</div>

---

## 简介

这是一个**非官方、非商业**的 DeepSeek Harness 粉丝主题，围绕《原神》角色「散兵 / 流浪者」设计。主题本身不修改 DSH 的侧栏布局，所有壁纸只出现在聊天中心列；右侧提供壁纸、开屏、音乐、粒子四个入口。

- 91 个 `--dsw-*` 设计令牌，`colorScheme: dark`
- 原生 DSH 侧栏，不做 fixed 覆盖、不改 frame 轨道
- 壁纸只在聊天区出现，预设与自定义使用同一套显示层
- 静态壁纸：多张导入、缩略图库、任意勾选、轮切 / 循环、遮罩透明度
- 可选开屏视频与环境音乐：**不自带官方素材**，用你自己的本地媒体构建
- 青蓝光点 / 雷光 / 雪三种粒子
- 右下角可拖动玻璃控制条，小屏自动收紧/横排，窗口缩放按相对右下角跟随
- 暗金细线、窄胶囊、面板收边、缩略图勾选与当前项高亮

## 安装

### 从 GitHub 安装（推荐）

```sh
dsh plugin --profile desktop add github:morningluu/dsh-theme-scaramouche
```

`desktop` 是官方桌面端使用的 profile；普通的 `dsh web` 请换成 `web`，自定义 profile 换成实际名称。

### 从源码安装

```sh
git clone https://github.com/morningluu/dsh-theme-scaramouche.git
cd dsh-theme-scaramouche
dsh plugin --profile desktop add link:"$PWD"
```

安装后**完全退出 DSH 再重开**，让客户端 bundle 重新加载。

## 使用

右侧四个入口：

| 入口 | 内容 |
|---|---|
| **壁纸** | 当前缩略图；预设 / 自定义；多张静态图片导入；缩略图库；勾选任意几张；关闭 / 轮切 / 循环；遮罩透明度；移除 |
| **开屏** | 视频 / 关闭；声音开启 / 静音；重播 |
| **音乐** | 关闭 / 环境音乐；播放 / 暂停；音量 |
| **粒子** | 关闭 / 青蓝 / 雷光 / 雪 |

- **静态壁纸**：只接受图片。导入后可一次选多张，缩略图右上角勾选圈决定哪些进入轮播；轮切按勾选项播完停下，循环回到第一张。
- **壁纸范围**：预设和自定义都只在聊天中心列显示；侧栏保持纯黑，壁纸不会铺到整窗。
- **遮罩透明度**：0–100%，默认 70%。调的是黑色遮罩层透明度，不是图片亮度。
- **控制条**：默认右下角，可整条拖动；位置按距右下角的相对距离保存，窗口缩放/全屏后跟着边缘走。
- **开屏**：没有视频时直接关闭，不播放自制纹饰或品牌启动页。
- **音乐 / 粒子**：分别在面板里开关。

## 可选本地媒体

**公开仓库不包含任何官方素材。** 不构建本地媒体时：

- 开屏直接关闭
- 音乐按钮禁用
- 没有默认壁纸，可以在「壁纸 → 导入壁纸」中使用自己的静态图片

如果你有本地视频/音乐，可自行构建仅限本机使用的媒体版本：

```sh
node scripts/intro-video.cjs \
  --video "/path/to/your-opening.mp4" \
  --fallback "/path/to/your-fallback.mp4" \
  --music "/path/to/your-music.mp3"

node scripts/intro-video.cjs --check
```

脚本会把视频/音频压缩并以 base64 嵌入 `lib/client.js`。生成物、`.cache/` 和媒体文件都在 `.gitignore` 中；**不要提交或分发官方素材**。

发布/提交前恢复干净版本：

```sh
node scripts/intro-video.cjs --clean
```

## 兼容性

- DeepSeek Harness 0.2.x（声明 `engines.dsh >= 0.2.0`）
- 桌面端与 `dsh web` 均可
- 客户端主题需要宿主支持 `dsh.client` / `@deepseek-ai/dsh-client-ui-theme`

## 项目结构

```text
dsh-theme-scaramouche/
├─ lib/
│  ├─ client.js          # 浏览器端主题：令牌、壁纸、开屏、音乐、粒子、控制条
│  └─ index.js           # 服务端占位 apply
├─ locale/
│  ├─ zh.json
│  └─ en.json
├─ scripts/
│  └─ intro-video.cjs    # 本地媒体构建 / 清理
├─ assets/
│  └─ screenshot-1.png   # 无官方素材的预览图
├─ cordis.patch.yml
├─ screenshots.json      # 市场截图声明
├─ package.json
├─ NOTICE.md             # 版权与粉丝内容声明
├─ LICENSE
└─ README.md
```

## 开发

```sh
# 语法检查
node --check lib/client.js

# 查看媒体标记状态
node scripts/intro-video.cjs --check

# 生成干净构建
node scripts/intro-video.cjs --clean
```

主题逻辑集中在 `lib/client.js`；`lib/index.js` 只保留一个空的 `apply`，供 DSH 的 loader 挂载。欢迎 issue 和 PR，但请保持公开仓库**不含**官方媒体。

## 版权与免责声明

- **代码与原创 SVG**：MIT，见 [LICENSE](LICENSE)。
- **非官方粉丝项目**：本项目与米哈游 / HoYoverse、DeepSeek 均无关联，未获官方授权或背书，不用于商业用途。
- **《原神》相关名称与角色**：Genshin Impact、散兵 / Scaramouche / 流浪者 / Wanderer 及相关世界观名称、角色与设定版权归米哈游 / HoYoverse 所有。
- **公开仓库不含官方素材**：仓库不包含《原神》官方图片、视频、音频或字体；预览截图使用自绘渐变壁纸与原创界面。
- **本地媒体**：如果你自行构建并使用开屏视频、最后一帧或音乐，相关素材版权仍归其权利人；请仅限本机个人使用，不要提交、上传或随主题分发。
- **下架**：如权利人认为本项目内容不当，请通过 issue 联系，我们会移除相关内容。
- 本声明不构成法律意见。

完整说明见 [NOTICE.md](NOTICE.md)。

## 致谢

- [DeepSeek Harness](https://github.com/deepseek-ai) 提供插件与主题机制
- [dsh-market](https://github.com/dsh-market/dsh-market) / [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 提供插件市场与收录目录

## License

[MIT](LICENSE) © 2026 Moringluu

