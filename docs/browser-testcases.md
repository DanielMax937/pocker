# 浏览器手工测试用例列表（Pocker）

本文档依据当前代码中的页面路由与组件交互整理，供测试人员在浏览器中按路径与步骤执行验证。  
**默认开发地址：** `http://localhost:3040`（见 `package.json` 中 `dev` / `start` 端口）。

---

## 全局导航（所有页面顶栏）

| ID | 路径/入口 | 操作步骤 | 预期结果 |
|----|-----------|----------|----------|
| NAV-01 | 任意页 | 点击 **Home** | 进入 `/` |
| NAV-02 | 任意页 | 点击 **Play** | 进入 `/play` |
| NAV-03 | 任意页 | 点击 **Game History** | 进入 `/games` |

说明：`/stats` 在 `app/layout.tsx` 中**未**放入顶栏，需直接输入 URL 或从 Stats 页内链进入（见下文）。

---

## 首页 `/`（`app/page.tsx`）

| ID | 场景 | 操作步骤 | 预期结果 |
|----|------|----------|----------|
| HOME-01 | 首屏加载 | 打开 `/` | 显示 Next.js 模板页（logo、说明列表、Deploy / Read docs 等） |
| HOME-02 | 外链 | 点击 **Deploy now**、**Read our docs**、页脚 **Learn** / **Examples** / **Go to nextjs.org** | 新标签页打开对应外部站点 |
| HOME-03 | 与扑克功能衔接 | 通过顶栏进入 **Play** 或 **Game History** | 离开首页进入对应应用页 |

---

## 对局页 `/play`（`app/play/page.tsx`）

### 开局前（非复盘模式）

| ID | 场景 | 操作步骤 | 预期结果 |
|----|------|----------|----------|
| PLAY-01 | 初始状态 | 打开 `/play`，等待加载 | 标题为 **Poker Game**；显示 **Start New Game** 按钮；牌桌与玩家位展示（`initializeGame` 后） |
| PLAY-02 | 开始游戏 | 点击 **Start New Game** | 请求 `POST /api/games`；成功后进入活跃对局：发牌、底池、盲注日志、轮到玩家或 AI |
| PLAY-03 | 开局失败/超时 | 模拟 API 失败或超时后再次点击 **Start New Game** | 页面上方出现错误提示（`role="alert"` 区域）；按钮在 **Starting…** 期间禁用 |

### 对局中 — 操作区（`app/components/ActionControls.tsx`）

仅在 **当前轮到人类玩家** 时显示完整操作区；否则显示 “Waiting for other players...”。

| ID | 场景 | 操作步骤 | 预期结果 |
|----|------|----------|----------|
| ACT-01 | 等待态 | AI 行动时观察操作区 | 显示等待文案，无 Fold/Check 等主操作（或不可操作） |
| ACT-02 | 弃牌 | 轮到自己时点击 **Fold** | 执行弃牌，日志更新，流程继续 |
| ACT-03 | 看牌 | 可 Check 时（`canCheck`）点击 **Check** | 执行看牌 |
| ACT-04 | 跟注 | 需跟注时点击 **Call $X** | 跟注；筹码不足时按钮应禁用（`opacity-50`） |
| ACT-05 | 下注 | 无底注轮次拖动 **Bet Amount** 滑块后点击 **Bet $X** | 按滑块金额下注 |
| ACT-06 | 加注 | 有底注时拖动 **Raise Amount** 滑块后点击 **Raise to $X** | 加注；金额不大于当前底注时按钮禁用 |
| ACT-07 | 全下 | 点击 **All-In $X** | 执行全下 |
| ACT-08 | 滑块边界 | 拖动下注/加注滑块至最小/最大 | 最小为 `minimumBet`（有底注时为 `currentBet * 2`，否则 20）；最大不超过剩余筹码 |

### 对局中 — 游戏日志（`app/components/GameLog.tsx`）

| ID | 场景 | 操作步骤 | 预期结果 |
|----|------|----------|----------|
| LOG-01 | 日志展示 | 对局进行中观察右下角 | **Game Log** 面板显示盲注、行动等记录 |
| LOG-02 | 关闭日志 | 点击日志标题栏 **×** | 日志面板关闭（`isVisible` 为 false 后不再渲染） |

### 对局结束 — 结果弹窗（`app/components/GameResult.tsx`）

| ID | 场景 | 操作步骤 | 预期结果 |
|----|------|----------|----------|
| RES-01 | 结算展示 | 一手结束后 | 全屏遮罩弹窗；标题为 **You Won!** 或 **{赢家} Wins!**；展示获胜牌型描述与底池 |
| RES-02 | 复盘手牌 | 非复盘模式点击 **Review Hand** | 打开行动复盘（`setShowActionReplay(true)`） |
| RES-03 | 动作回放 | 存在 `gameId` 时点击 **Replay Actions** | 打开 `ActionReplay` 组件 |
| RES-04 | 再玩一手 | 点击 **Play Again** | 执行 `startNewHand`：清除上一手展示、轮换庄家或重新初始化 |
| RES-05 | 复盘模式按钮文案 | 在 `mode=review` 下结束流程后 | 主按钮文案为 **Start New Hand**（与 `isReviewMode` 一致） |

### 行动回放（`app/components/ActionReplay.tsx`）

从对局结束弹窗进入，或复盘模式加载后自动出现（`play/page.tsx` 中 `setShowActionReplay(true)`）。

| ID | 场景 | 操作步骤 | 预期结果 |
|----|------|----------|----------|
| ARP-01 | 加载 | 打开回放 | 先可能显示 **Loading actions...**，成功后展示 **Action Replay** 标题与内容 |
| ARP-02 | 加载失败 | API 失败时 | 红色错误文案，可点击 **Close** 关闭 |
| ARP-03 | 进度条 | 拖动顶部 **range** 滑块 | 当前步数 **n / total** 与画面状态同步 |
| ARP-04 | 上一手/下一手 | 点击 **← Prev**、**Next →** | 在首尾时对应按钮禁用 |
| ARP-05 | 自动播放 | 点击 **▶ Play** / **⏸ Pause** | 自动步进；到最后一步时自动停止自动播放 |
| ARP-06 | 播放速度 | 下拉选择 **0.5s ~ 3s** | 自动播放间隔改变 |
| ARP-07 | 键盘 | 聚焦页面按 **←** **→**、**Space**、**Esc** | 上一步/下一步、播放暂停、关闭（与界面提示一致） |
| ARP-08 | 关闭 | 点击标题旁 **✕** | 关闭回放层 |

---

## 复盘入口 `/play?gameId={id}&mode=review`（`app/play/page.tsx`）

| ID | 场景 | 操作步骤 | 预期结果 |
|----|------|----------|----------|
| REV-01 | 进入复盘 | 从战绩页带参打开或手动输入 URL | 标题为 **Game Review**；显示 **Back to Games** |
| REV-02 | 加载历史 | 等待 `GET /api/games/{gameId}` | 恢复玩家、公共牌、底池、阶段等；自动打开行动回放 |
| REV-03 | 返回列表 | 点击 **Back to Games** | 进入 `/games` |

---

## 战绩列表 `/games`（`app/games/page.tsx`）

| ID | 场景 | 操作步骤 | 预期结果 |
|----|------|----------|----------|
| GH-01 | 加载中 | 打开 `/games` | 显示 **Loading games...** |
| GH-02 | 列表成功 | API 正常返回 | 标题 **Game History**；每条显示对局 ID 前缀、日期、玩家与赢家高亮 |
| GH-03 | 空列表 | 无任何对局时 | 文案 **No games played yet**；可点击 **Start your first game** 进入 `/play` |
| GH-04 | 新开局 | 点击 **Play New Game** | 进入 `/play` |
| GH-05 | 复盘对局 | 点击某条的 **Review Game** | 进入 `/play?gameId={id}&mode=review` |
| GH-06 | 请求失败/超时 | 模拟 `GET /api/games` 失败或超时 | 红色错误区域展示错误信息（含超时提示文案） |

---

## 统计页 `/stats`（`app/stats/page.tsx`）

**注意：** 顶栏无 **Stats** 链接，测试需直接访问 `/stats` 或从本页底部导航离开。

| ID | 场景 | 操作步骤 | 预期结果 |
|----|------|----------|----------|
| STA-01 | 加载 | 打开 `/stats` | 先显示 **Loading statistics...** |
| STA-02 | 数据展示 | API 成功 | 深色背景；**Poker Statistics**；概览卡片（总对局、完成、活跃、总行动数）；行动分布；玩家表（有数据时） |
| STA-03 | 去游戏 | 点击 **Play Now** | 进入 `/play` |
| STA-04 | 去战绩 | 点击 **← View Game History** | 进入 `/games` |
| STA-05 | 回首页 | 点击 **← Back to Home** | 进入 `/` |
| STA-06 | 错误态 | `GET /api/stats` 失败 | 居中红色 **Error: ...** |

---

## 端到端自动化对照（`e2e/game-flow.spec.ts`）

Playwright 用例与下列手工路径对应，便于回归对照：

| 自动化步骤 | 建议手工覆盖 |
|------------|--------------|
| 打开 `/play` | PLAY-01 |
| 点击 **Start**（正则匹配 Start/开始） | PLAY-02 |
| 若可见则点击 **Fold** | ACT-02 |

---

## 附录：路由一览（代码内页面）

| 路径 | 说明 |
|------|------|
| `/` | 默认首页（Next 模板） |
| `/play` | 主游戏 |
| `/play?gameId=&mode=review` | 复盘 |
| `/games` | 战绩 |
| `/stats` | 统计（仅直链） |

API 行为（`app/api/**`）的接口级测试可单独列出；本表聚焦**浏览器内可见路径与交互**。
