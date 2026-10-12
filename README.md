<div align="center">

# AI Growth Decision Copilot

### 从增长假设，到值得优先验证的实验

Evidence-backed growth experiment design & prioritization

**交互式产品 Demo · 多 Agent 工作流设计 · 可追溯的决策依据**

[在线 Demo](https://growth-decision-copilot.netlify.app/) · [快速体验](#quickstart) · [产品预览](#preview) · [流程架构](#workflow) · [实现状态](#status) · [后续规划](ai-growth-decision-copilot-demo/docs/ROADMAP.md)

</div>

---

## 为什么做这个产品？

社区运营并不缺增长想法，难的是判断：**下一步该验证什么，为什么值得做，现有资源能否支撑？**

AI Growth Decision Copilot 面向负责活动和用户留存的社区运营人员，将目标、业务背景、历史证据与资源限制组织为一套可解释的决策流程，输出最多三个条件性推荐实验，并说明方案之间的取舍。

> **当前版本：** 可运行的规则驱动 Demo。六步流程、质量检查及综合复核均可交互查看；大模型调用、独立多 Agent 协作和实验结果回填属于后续规划。

## 产品能帮用户做什么？

| 用户的问题 | 产品给出的回答 |
|---|---|
| 下一轮先做什么？ | 顶部直接显示推荐实验名称、资源参考与下一步 |
| 为什么推荐它？ | 展示历史依据、六维评分和未入选原因 |
| 哪些地方不可靠？ | 标记小样本、选择偏差、未知成本及体验风险 |
| 方案怎样变得更好？ | 对照V1与V2，解释修改回应了哪些批评 |
| 现在可以执行了吗？ | 区分条件性推荐与执行就绪，保留未解决事项 |

<a id="preview"></a>

## 产品预览

![Decision Dashboard — 推荐实验与资源取舍](ai-growth-decision-copilot-demo/assets/dashboard.png)

**先看行动 → 再看理由 → 按需展开完整判断流程。**

首页包含决策摘要、推荐实验卡片、六维对比与Meta-review。输入和调整入口保留在顶部，完整流程默认折叠，避免让用户先阅读大量Agent输出。

<a id="workflow"></a>

## 工作流架构

[![AI Growth Decision Copilot — 原始工作流设计](flow%20chart.png)](flow%20chart.png)

*点击图片查看大图。上图是目标架构；当前Demo的实现范围见下方状态表。图中编号主流程以六步为准。*

| 阶段 | 主要职责 |
|---|---|
| **01 · Generation** | 围绕目标提出可检验的增长假设 |
| **02 · Diversity Check** | 识别重复想法，保留不同增长机制 |
| **03 · Reflection** | 审查证据、因果、可行性、成本和风险 |
| **04 · Ranking** | 六维评价，比较优先级与资源取舍 |
| **05 · Evolution** | 根据批评改进候选方案，形成V2 |
| **06 · Re-ranking** | 重新评价，与原方案比较 |
| **Quality Gate** | 判断是否达到质量要求，最多触发一轮针对性复核 |
| **Meta-review** | 总结跨方案洞察、共同风险、证据缺口和最终推荐理由 |

原图未单列的 **Meta-review** 是后续补充的综合复核层，位于质量检查之后、最终输出之前；它不生成新假设、不重新排序、不覆盖硬性限制。

**Evolution 是执行前的方案改进。** 执行后回填结果、更新历史证据属于独立的后续反馈闭环。

## 决策设计

| 评价维度 | 默认权重 | 关注点 |
|---|---:|---|
| Impact | 25% | 对目标指标的改善潜力 |
| Evidence Strength | 20% | 研究设计、样本与不确定性 |
| Business Value | 20% | 与业务目标的关联 |
| Feasibility | 15% | 工程、人力及实施难度 |
| Cost Efficiency | 10% | 资源负担与成本取舍 |
| Risk Safety | 10% | 隐私、用户体验及风险可控性 |

- **目标约束：** 当前Demo聚焦首次参与后14天再次实际参与。
- **有界迭代：** 最多额外一轮，未解决的问题继续展示。
- **证据不自动变强：** 改进文案不等于获得新观测，V2不保证加分。
- **推荐不强凑数量：** 预算、人力或证据不足时，允许少于三个甚至不推荐。
- **评分可解释：** 当前为启发式规则，非校准后的效果预测或收入ROI。

<a id="quickstart"></a>

## 快速体验

**无需API密钥或安装依赖。**

1. 下载仓库：点击 **Code → Download ZIP**，然后解压。
2. 用浏览器打开 **`ai-growth-decision-copilot-demo/index.html`**。
3. 生成示例推荐；试着降低预算，或将某个策略标记为“已实施”。
4. 查看推荐变化、方案改进及综合复核，按需导出决策报告。

在线打开：**[Growth Decision Copilot Demo](https://growth-decision-copilot.netlify.app/)**。

<a id="status"></a>

## 已实现与规划

| 能力 | 当前Demo | 后续设计，尚未实现 |
|---|---|---|
| Generation | 8个案例模板与上下文关联 | 大模型动态生成5–8个假设 |
| Diversity | 精确去重、预定义机制分组 | 语义相似度与跨人群多样性 |
| Reflection | 证据、资源、隐私、体验等字段规则 | 多视角模型审查、必要时检索外部证据 |
| Ranking | 六维启发式加权分与两两分差比较 | 独立裁判的pairwise tournament |
| Evolution | 前三候选补充执行及验证计划 | 结合批评生成新变体并重估资源 |
| Re-ranking | 同一规则重算，保留V1/V2对比 | 独立复评与排名稳定性评估 |
| Quality Gate / Iteration | 三类触发条件，最多一轮规则复核 | 更全面门槛与定向Agent调度 |
| Meta-review | 四字段规则汇总，不改排序 | 基于过程证据的模型综合复核 |
| 保存 | 当前浏览器与报告导出 | 账户、云端存储、结果回填 |

没有自动执行实验、在线学习或模型训练功能。评分是可解释的演示判断，不是经过校准的效果预测。


## 业务背景与数据

项目源于“体验获客 → 社群沉淀 → 深度内容 → 会员留存”的业务问题。作者确认的业务背景为新用户14天二次参与率约18%→31%，相对变化约72%，对应“约70%”的业务表述。**历史业务成果不归因于这个Demo。**

| 数据或资源 | 演示设定 |
|---|---|
| 用户 | 800：New 280 / Active 240 / Loyal 160 / Dormant 120 |
| 活动 / 内容 / 历史实验 | 24 / 72 / 8 |
| 团队 | 组织20人；核心执行5人 |
| 预算与周期 | CAD 1,500；4周；偏好14天实验周期 |
| 其他约束 | 最多并行3个实验；低工程投入；保守隐私模式 |

CSV是**基于真实业务统计构建的生成式演示记录**，并非逐条核验或脱敏后的业务原始记录。历史相关关系不直接证明因果，未来净提升保持未知。详见[数据字典](ai-growth-decision-copilot-demo/dist/data/README.md)。

## 开发与验证

源代码位于 `ai-growth-decision-copilot-demo/dist/`，不依赖前端框架。开发预览：

```sh
cd ai-growth-decision-copilot-demo
python3 -m http.server 8765 --directory dist
```

在上述项目子目录中，使用Node.js运行检查：

```sh
npm test
```

修改源代码后，重新生成离线版：

```sh
python3 scripts/build_standalone.py
```

当前23项自动检查通过；主要浏览器交互已核对。尚未开展正式用户研究或完整跨设备测试。方案仅保存在当前浏览器；报告导出不等于云端同步。

## 文档与下一步

| 文档 | 内容 |
|---|---|
| [Architecture](ai-growth-decision-copilot-demo/docs/ARCHITECTURE.md) | 当前运行架构、目标架构与模块职责 |
| [Agent Prompts](ai-growth-decision-copilot-demo/docs/AGENT_PROMPTS.md) | 尚未接入运行的角色提示词草案 |
| [Implementation](ai-growth-decision-copilot-demo/docs/IMPLEMENTATION.md) | 当前规则、评分公式及实现边界 |
| [Roadmap](ai-growth-decision-copilot-demo/docs/ROADMAP.md) | 模型接入、语义去重、独立对阵、云端保存与结果反馈 |

<details>
<summary><strong>项目目录</strong></summary>

```text
├── README.md
├── flow chart.png          # 原始流程图
└── ai-growth-decision-copilot-demo/
    ├── index.html          # 可直接打开的离线Demo
    ├── assets/                 # 产品截图与原始流程图
    ├── dist/                   # 网页源码与演示数据
    ├── docs/                   # 架构、角色设计与规划
    ├── scripts/                # 离线版打包
    └── tests/                  # 自动检查
```

</details>

---

本项目使用AI辅助实现，展示产品问题定义、决策流程设计和可交互原型。规划中的模型与多Agent能力未作为已上线功能呈现。
