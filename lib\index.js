/**
 * dsh-theme-scaramouche — 服务端占位。
 *
 * 主题的全部逻辑在浏览器端（lib/client.js）：注册 --dsw-* 设计令牌，
 * 并注入背景、开屏、粒子、控制条等身份层。这里只保留一个空的 apply，
 * 让 cordis loader 能正常挂载本行（没有 apply 的行会导致 boot 扫描失败）。
 */
export function apply() {}
