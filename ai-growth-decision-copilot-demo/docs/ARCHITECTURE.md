# 架构与职责

## 当前运行架构

浏览器 → app.mjs交互层 → engine.mjs确定性规则 → 四张CSV及schema。localStorage保存任务及输入快照；报告保存本次计算结果。无后端、无模型API、无真实Agent间通信。刷新恢复时根据保存输入重新计算；更新规则版本可能使恢复结果变化，需用导出报告保留旧决策。

## 目标架构（未实现）

前端任务表单 → 服务端编排器 → 数据验证/证据读取 → Generation → Diversity → Reflection → Ranking → Evolution → Re-ranking → Quality Gate → Meta-review → 结果看板。

Quality Gate不通过时，Iteration Controller按具体问题返回Generation、Reflection或Evolution等相关步骤，最多额外一轮；超限后报告未解决事项。硬性限制不能被模型或Meta-review覆盖。原图底部“约5步”是粗略计数，编号主流程以6步为准。

## 责任边界

| 模块 | 输入 | 输出 | 不应做的事 |
|---|---|---|---|
| Generation | 目标、背景、当前动作、证据 | 5–8个带ID的可检验假设 | 将观察相关性写成已证实因果 |
| Diversity | 候选集合 | 去重、聚类、保留理由 | 为多样性加入偏离目标的方案 |
| Reflection | 候选、来源、约束 | 逐项问题、严重度、修订建议 | 修改原始证据 |
| Ranking | 审查结果、评分标准 | 六维分、两两比较、排序、取舍 | 高分绕过硬性限制 |
| Evolution | 优先候选及批评 | 父版本ID、V2、逐项改动 | 宣称新变体已有验证结果 |
| Re-ranking | V1/V2及同一标准 | 更新排序及变化原因 | 默认V2一定优于V1 |
| Quality Gate | 最终结果 | 状态、具体失败项、返回步骤 | 将未知字段当通过 |
| Meta-review | 全部阶段与质量结果 | 四字段决策总结 | 新增方案、重排、覆盖门槛 |

## 最终输出约定

每个推荐需包含ID、目标人群、假设、推荐理由、来源、执行动作、主指标、验证计划、成本与风险、证据信心。分开表达观察证据、推断、未知、建议；最多三个，不足时解释。

Meta-review输出：

```json
{
  "cross_hypothesis_insights": [],
  "shared_risks": [],
  "critical_evidence_gaps": [],
  "final_decision_rationale": ""
}
```

完整输入设计还包含产品目标、产品描述、目标用户、当前策略、预算/时间/资源、可选数据与优化偏好。目前Demo固定14天二次参与目标，不能声称支持任意业务指标。
