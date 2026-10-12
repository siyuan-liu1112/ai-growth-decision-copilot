> V3 来源说明：基于用户确认的真实业务统计构建的演示数据。当前 CSV 逐行记录由程序生成，未与原始业务记录逐条核验。下文 synthetic / 合成指生成记录。

# AI Growth Decision Copilot — 模拟数据集 v1

全部数据均为合成数据，不是汉学社或任何组织的真实记录。来源：用户已确认业务设定及参考对话 ai作品；生成日期2026-10-12，固定种子20261012。

## 四张表

|文件|粒度|行数|主键|
|---|---|---:|---|
|users.csv|one user|800|user_id|
|campaigns.csv|one event|24|campaign_id|
|contents.csv|one content item|72|content_id|
|experiments.csv|one historical experiment|8|experiment_id|

CSV为UTF-8 BOM、逗号分隔、CRLF行尾；英文snake_case字段，中文说明。日期YYYY-MM-DD；率为0–1小数（如0.31），仅diff_pp字段用百分点。空单元格表示未覆盖/不适用，不能填0。计数为整数，率保留6位，汇总须从计数重算。schema.json是机器可读数据字典；scenario_config.json是下一轮决策约束，不是第五张业务表。

## 指标口径与边界

- baseline：2026年5月首次参与的200人，36人14天内再次实际参加活动，36/200=18%。
- post_rebuild：2026年9月24场活动带来的600名首次参与用户，186人14天内再次参与，186/600=31%。绝对变化13个百分点，相对变化72.22%（约70%）。均完整观察14天，非注册到报名转化。
- 两期为不同人群、不同时间的前后观察，季节性、活动结构、渠道与用户意向均可能混杂；不能将72.22%解释为链路重构的已识别因果效应。
- 当前New 280、Active 240、Loyal 160、Dormant 120为模拟CRM快照业务标签，并非由首次参与时间或14天结果确定的生命周期规则；尤其New并不意味着未二次参与。历史新用户KPI必须按cohort_phase统计全部当时新用户，不只筛当前New。真实接入时需另定CRM分群规则。
- 24场活动仅覆盖post_rebuild首次活动。baseline首次活动不在表中，其first_campaign_id为空。users是800名首次参与cohort成员，不是全部到场者清单；活动老用户到场可跨场重复。
- campaigns的new_attendees、repeat_14d_new_users与users按first_campaign_id严格对账。到场总数还包含老用户，不能与800直接比较。
- 本版没有报名、触达与参与流水表，也没有完整第二次活动目录；second_participation_date只保留14天内实际二次参与日期，不能据此复建全量活动图。
- 内容相关活动ID仅是编辑关系。内容展示/点击为次数；曝光用户在不同内容可重叠，不能相加为独立人数。内容人群是独立聚合样本，不能与users逐行对账。内容repeat窗口从曝光日起14天计算，与首次参与KPI不同。
- 历史实验为2026年1–4月独立汇总案例，可跨实验重叠；不要累加样本量当作独立人数或与800用户硬关联。每个实验使用自己的比较组，不强行共享18%基线。
- 随机试点也只是模拟证据。95%区间是未校正的独立比例差正态近似，只描述计数不确定性；小样本覆盖不稳，且不能消除观察研究的选择偏差、多重比较或跨期差异。
- 兴趣群同期加入与复参与有关联；不能将其用于无偏预测或当作干预净效果。内容高意向关系由模拟参数生成，不能据此宣称内容导致留存。

## 下一轮资源约束

```json
{
  "total_team_size": 20,
  "experiment_core_team": 5,
  "budget_cad": 1500,
  "implementation_window_weeks": 4,
  "max_engineering_effort": "low",
  "privacy_tolerance": "conservative",
  "max_parallel_experiments": 3,
  "preferred_experiment_duration_days": 14
}
```

CAD1,500是下一轮组合现金预算；历史活动/内容/实验累计支出不受该上限约束。人工成本只以人时列示，没有假造工资率或收入ROI；核心5人不等于5个全职岗位，未来需补充可用人时。并行最多3个、偏好14天、总实施4周；排期需计入准备与复盘。个性化推荐历史工程投入medium，在当前low约束下需要简化才可能可行。保守隐私下须限定自愿提供的兴趣和明确同意范围。

## 预置的决策冲突

- 体验类获客率高，学术类首次转化较弱但二次参与率更高；不跨类型直接推因果。
- 兴趣群表观差异大，但自选择偏差明显，证据low。
- 个性化推荐只有24+24样本，正向且证据medium，但区间宽、工程/隐私要求更高。
- 人工follow-up表观差异最大，现金1,150、人时100、峰值5人，容易挤占整个实验组合。
- 深度内容低现金投入、提升温和；newsletter差异很小；高频提醒点击较多但复参与下降，退订与投诉高。
- 不预填唯一排名或因果ROI，供Generation提出方案、Reflection质疑偏差、Ranking按资源组合权衡。

## 字段字典

### users

|字段|类型|可空|含义 / 公式|
|---|---|---|---|
|user_id|string|否|用户主键；模拟匿名ID|
|segment|string|否|当前 CRM 分群：New/Active/Loyal/Dormant；独立于历史首次参与 cohort，不用于反推历史分群|
|primary_interest|string|否|主兴趣；限定六个标签|
|secondary_interest|string|否|次兴趣；限定六个标签且不同于主兴趣|
|acquisition_channel|string|否|获客渠道|
|first_participation_date|string|否|首次实际参加活动日期，非注册日期|
|first_campaign_id|string|是|首次活动外键；仅 post_rebuild 有值，baseline 活动在本次24场之外|
|cohort_phase|string|否|首次参与阶段：baseline/post_rebuild|
|repeat_14d_eligible|integer|否|完整观察14天，1=是；本版全部为1|
|repeat_14d|integer|否|首次参与后(0,14]天内再次实际参加活动，1/0|
|second_participation_date|string|是|14天内第二次实际参与日期；未复参与为空，不表示终身没有再参与|
|joined_interest_group_14d|integer|否|首次参与后14天内加入兴趣群，1/0；与结果同期观察，禁止作为无偏前置特征|
|marketing_opt_in|integer|否|当前营销触达同意，1/0|
|personalization_opt_in|integer|否|当前个性化同意，1/0；为1时营销同意也为1|
|snapshot_date|string|否|CRM 分群及同意状态快照日期|

### campaigns

|字段|类型|可空|含义 / 公式|
|---|---|---|---|
|campaign_id|string|否|活动主键|
|title|string|否|模拟活动标题|
|category|string|否|活动类型；枚举见README|
|event_date|string|否|活动日期|
|cohort_phase|string|否|首次参与阶段：baseline/post_rebuild|
|landing_page_unique_visitors|integer|否|该活动落地页去重访客；跨活动不可去重相加|
|registrations|integer|否|该活动报名人数|
|attendees|integer|否|该活动到场人数；包括新老用户|
|new_attendees|integer|否|该活动首次参与本社区人数；与users按first_campaign_id严格对账|
|repeat_14d_eligible_new_users|integer|否|新到场者中观察完整14天人数|
|repeat_14d_new_users|integer|否|上述分母中14天内复参与人数|
|registration_rate|number|否|registrations / landing_page_unique_visitors|
|attendance_rate|number|否|attendees / registrations|
|new_attendee_share|number|否|new_attendees / attendees|
|new_user_repeat_14d_rate|number|否|repeat_14d_new_users / repeat_14d_eligible_new_users|
|event_cost_cad|integer|否|单场历史直接现金成本CAD；不包含人工机会成本|
|measurement_end|string|否|完整14天观察窗截止日（活动日期/内容发布日期+14）|

### contents

|字段|类型|可空|含义 / 公式|
|---|---|---|---|
|content_id|string|否|内容主键|
|content_type|string|否|内容类型；枚举见README|
|related_campaign_id|string|否|相关活动外键；编辑关联而非因果归因|
|publish_date|string|否|发布日期|
|channel|string|否|发布渠道|
|primary_interest|string|否|主兴趣；限定六个标签|
|impressions|integer|否|展示次数，非独立用户|
|clicks|integer|否|点击次数，非独立用户|
|engagement_actions|integer|否|互动次数，可含分享；不可与分享相加|
|shares|integer|否|分享次数|
|ctr|number|否|clicks / impressions|
|engagement_rate|number|否|engagement_actions / impressions|
|share_rate|number|否|shares / impressions|
|exposed_eligible_new_users|integer|否|发布当日处于首次参与14天内、被曝光且有完整后续14天观察的用户数；独立内容汇总样本|
|exposed_repeat_14d_users|integer|否|上述曝光用户中曝光后14天内再次参与活动人数；窗口不同于首次参与KPI|
|exposed_repeat_14d_rate|number|否|exposed_repeat_14d_users / exposed_eligible_new_users；关联指标|
|production_cost_cad|integer|否|内容制作直接现金成本CAD|
|measurement_end|string|否|完整14天观察窗截止日（活动日期/内容发布日期+14）|
|evidence_note|string|否|内容观察性证据限制|

### experiments

|字段|类型|可空|含义 / 公式|
|---|---|---|---|
|experiment_id|string|否|实验主键|
|experiment_name|string|否|历史实验名称|
|study_design|string|否|randomized_pilot/self_selected_comparison/matched_observational|
|target_segment|string|否|入组时目标分群，均为New|
|sample_scope|string|否|独立历史汇总；不与users按ID关联|
|start_date|string|否|历史入组日期；模拟单日入组|
|duration_days|integer|否|入组后观察天数，均为14|
|treatment_n|integer|否|处理组符合条件且完整观察人数|
|treatment_repeat_14d|integer|否|处理组14天内复参与人数|
|comparison_n|integer|否|比较组符合条件且完整观察人数|
|comparison_repeat_14d|integer|否|比较组14天内复参与人数|
|treatment_repeat_rate|number|否|treatment_repeat_14d / treatment_n|
|comparison_repeat_rate|number|否|comparison_repeat_14d / comparison_n|
|observed_diff_pp|number|否|(处理组率-比较组率)*100；单位百分点|
|observed_relative_lift|number|否|处理组率/比较组率-1；比例|
|descriptive_diff_ci95_low_pp|number|否|两独立比例差正态近似95%区间下限，百分点；仅描述抽样不确定性|
|descriptive_diff_ci95_high_pp|number|否|上述区间上限；不能修正选择偏差，小样本覆盖可能不足|
|cash_cost_cad|integer|否|历史处理方案直接现金支出CAD，不含人工；不能直接作为未来报价|
|staff_hours|integer|否|处理方案总人时，与现金成本分开|
|peak_staff_required|integer|否|历史峰值同时投入人数；不等于全职人数|
|engineering_effort|string|否|工程投入low/medium/high|
|privacy_risk|string|否|数据使用风险low/medium/high，独立于用户同意|
|evidence_strength|string|否|模拟证据标签low/medium/high；随机小样本最多medium，观察性为low|
|ux_risk|string|否|用户体验风险low/medium/high|
|limitations|string|否|偏差与适用范围|
|treatment_opt_outs|integer|否|处理组14天内退订人数|
|comparison_opt_outs|integer|否|比较组14天内退订人数|
|treatment_unique_clickers|integer|否|处理组14天内至少点击一次人数|
|comparison_unique_clickers|integer|否|比较组14天内至少点击一次人数|
|treatment_complaints|integer|否|处理组14天内投诉人数；可与退订重叠|
|comparison_complaints|integer|否|比较组14天内投诉人数；可与退订重叠|

## 枚举

兴趣标签：traditional_culture、museum_heritage、academic_discussion、music_performance、career_networking、social_community。

活动类型：heritage_experience=非遗/文博；academic_deep_dive=学术/深度；interest_social=兴趣社群/社交；career_cultural_exchange=职业/文化交流；experimental=试验型。

内容类型：event_teaser=活动预热；deep_culture_academic=深度文化/学术；user_community_story=用户故事/社区；event_recap=活动复盘；career_exchange=职业/交流。
