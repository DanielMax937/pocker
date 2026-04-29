# Pocker 浏览器验证 Todo 清单（Agent 执行用）

本文档由 `docs/browser-testcases.md` 展开为**可逐项勾选**的待办列表。  
**约定：** 未完成用 `- [ ]`，验证通过后将同一行改为 `- [x]`。按章节顺序执行；同一章节内按自上而下顺序，除非条目注明依赖前置数据。

**环境前置（执行任意条目前先确认）：**

- [ ] **ENV-01** 本地已启动应用：`pnpm dev` 或 `npm run dev`，可访问 `http://localhost:3040`（端口以 `package.json` 为准）。

**Agent 操作提示：** 使用浏览器自动化或手动时，每完成一条将对应复选框改为 `[x]`，并在会话中简要记录结果（通过 / 失败及原因）。

---

## 1. 全局导航（顶栏）

- [ ] **NAV-01** 在任意页面点击顶栏 **Home** → 地址栏路径为 `/`，首屏为 Next 模板首页。
- [ ] **NAV-02** 在任意页面点击顶栏 **Play** → 路径为 `/play`，标题含 **Poker Game**（非复盘时）。
- [ ] **NAV-03** 在任意页面点击顶栏 **Game History** → 路径为 `/games`。

---

## 2. 首页 `/`

- [ ] **HOME-01** 打开 `http://localhost:3040/` → 可见 logo、说明列表、Deploy / Read docs 等模板内容。
- [ ] **HOME-02** 依次点击 **Deploy now**、**Read our docs**、页脚 **Learn** / **Examples** / **Go to nextjs.org** → 各链接在新标签打开对应站点（或符合浏览器安全策略的行为）。
- [ ] **HOME-03** 从首页用顶栏进入 **Play** 与 **Game History** → 分别进入 `/play` 与 `/games`。

---

## 3. 对局页 `/play` — 开局

- [ ] **PLAY-01** 打开 `/play` → 标题 **Poker Game**；可见 **Start New Game**；牌桌与玩家位已展示。
- [ ] **PLAY-02** 点击 **Start New Game** → 进入活跃对局（发牌、底池、盲注相关日志、轮到玩家或 AI）。*失败则记下网络/API 错误。*
- [ ] **PLAY-03**（可选，需模拟失败）在 `POST /api/games` 失败或超时后再次点击 **Start New Game** → 页面上方 `role="alert"` 区域有错误文案；点击后至结束请求前按钮为 **Starting…** 且禁用。

---

## 4. 对局页 — 操作区（轮到「You」时）

*说明：若单局内无法覆盖全部动作，可多开几局或等到对应街道。*

- [ ] **ACT-01** 在 AI 行动时查看操作区 → 显示 **Waiting for other players...**，无完整 Fold/Check 主操作区（或等价不可操作）。
- [ ] **ACT-02** 轮到自己时点击 **Fold** → 弃牌生效，Game Log 更新，流程继续。
- [ ] **ACT-03** 在可 **Check** 时点击 **Check** → 看牌生效。
- [ ] **ACT-04** 在需跟注时点击 **Call $X** → 跟注生效；若故意使筹码不足，**Call** 应为禁用态。
- [ ] **ACT-05** 在 `currentBet === 0` 时拖动 **Bet Amount** 滑块并点击 **Bet $X** → 下注金额与滑块一致。
- [ ] **ACT-06** 在有底注时拖动 **Raise Amount** 并点击 **Raise to $X** → 加注生效；滑块金额 ≤ `currentBet` 时 **Raise** 禁用。
- [ ] **ACT-07** 点击 **All-In $X** → 全下生效。
- [ ] **ACT-08** 拖动下注/加注滑块到最小与最大 → 最小符合规则（无底注时最小下注相关逻辑、有底注时最小为 `currentBet * 2` 等）；最大不超过当前筹码。

---

## 5. 对局页 — 游戏日志

- [ ] **LOG-01** 对局进行中观察右下角 **Game Log** → 可见盲注与行动等记录。
- [ ] **LOG-02** 点击日志标题栏 **×** → 日志面板关闭且不再显示。

---

## 6. 对局页 — 结算弹窗（`GameResult`）

- [ ] **RES-01** 一手结束后 → 全屏遮罩；标题为 **You Won!** 或 **{赢家} Wins!**；展示牌型描述与底池。
- [ ] **RES-02** 非复盘模式下点击 **Review Hand** → 出现行动复盘界面（`ActionReplay`）。
- [ ] **RES-03** 当存在 `gameId` 时点击 **Replay Actions** → 打开 `ActionReplay`。
- [ ] **RES-04** 点击 **Play Again** → 进入下一手或重新初始化（`startNewHand` 行为），上一手结算 UI 关闭或更新。
- [ ] **RES-05** 使用 `/play?gameId=…&mode=review` 完成一手后 → 主按钮文案为 **Start New Hand**（非 **Play Again**）。

---

## 7. 行动回放 `ActionReplay`

*可从 RES-02/RES-03 或复盘自动打开进入。*

- [ ] **ARP-01** 打开回放 → 可能出现 **Loading actions...**，随后显示 **Action Replay** 标题与内容。
- [ ] **ARP-02**（可选，需模拟 `GET .../actions` 失败）→ 红色错误信息，**Close** 可关闭。
- [ ] **ARP-03** 拖动顶部进度 **range** → **n / total** 与画面状态一致。
- [ ] **ARP-04** 点击 **← Prev**、**Next →** → 在第一步 Prev 禁用，最后一步 Next 禁用。
- [ ] **ARP-05** 点击 **▶ Play** 再 **⏸ Pause** → 自动步进；到最后一步自动停止自动播放。
- [ ] **ARP-06** 切换自动播放速度 **0.5s～3s** → 步进间隔明显变化。
- [ ] **ARP-07** 页面聚焦时按 **←** **→**、**Space**、**Esc** → 与界面提示一致（上一步/下一步、播放暂停、关闭）。
- [ ] **ARP-08** 点击标题旁 **✕** → 回放层关闭。

---

## 8. 复盘 `/play?gameId={id}&mode=review`

- [ ] **REV-01** 从 `/games` 点击某局 **Review Game** 或手动输入带 `gameId` 与 `mode=review` 的 URL → 标题 **Game Review**，可见 **Back to Games**。
- [ ] **REV-02** 等待加载 → 恢复牌局状态，并自动打开行动回放（与代码一致）。
- [ ] **REV-03** 点击 **Back to Games** → 进入 `/games`。

---

## 9. 战绩 `/games`

- [ ] **GH-01** 打开 `/games`（可硬刷新）→ 短暂出现 **Loading games...**（若过快可多次节流网络复现）。
- [ ] **GH-02** API 正常时 → 标题 **Game History**；列表项含对局 ID 前缀、日期、玩家与赢家样式。
- [ ] **GH-03** 无对局数据时 → **No games played yet**，**Start your first game** 可进 `/play`。
- [ ] **GH-04** 点击 **Play New Game** → 进入 `/play`。
- [ ] **GH-05** 点击某条 **Review Game** → URL 为 `/play?gameId=...&mode=review`。
- [ ] **GH-06**（可选）模拟 `GET /api/games` 失败或超时 → 红色错误区域，含超时等相关文案。

---

## 10. 统计 `/stats`

*顶栏无入口，地址栏输入 `/stats` 或从 Stats 页内链进入。*

- [ ] **STA-01** 打开 `/stats` → 先出现 **Loading statistics...**（或极短可接受）。
- [ ] **STA-02** API 成功 → 深色主题、**Poker Statistics**、概览卡片、行动分布、有数据时玩家表。
- [ ] **STA-03** 点击 **Play Now** → `/play`。
- [ ] **STA-04** 点击 **← View Game History** → `/games`。
- [ ] **STA-05** 点击 **← Back to Home** → `/`。
- [ ] **STA-06**（可选）模拟 `GET /api/stats` 失败 → 居中红色 **Error: ...**。

---

## 11. 与 E2E 对齐（可选快速冒烟）

*对应 `e2e/game-flow.spec.ts`，用于回归时快速跑通主路径。*

- [ ] **E2E-01** 打开 `/play` → 对应 PLAY-01。
- [ ] **E2E-02** 点击 **Start New Game**（或匹配 Start/开始）→ 对应 PLAY-02。
- [ ] **E2E-03** 若 **Fold** 可见则点击 → 对应 ACT-02。

---

## 完成度统计（Agent 自检）

在全部必选条目打勾后，填写：

- 完成日期：__________
- 失败/跳过条目 ID 及原因：__________
- 构建/提交信息（可选）：__________

**必选条目：** ENV-01、§1～§3 中除 PLAY-03 外、§4～§10 中除标注「可选」外、§11 可选。  
**可选条目：** PLAY-03、ARP-02、GH-06、STA-06（用于异常与网络容错验证）。
