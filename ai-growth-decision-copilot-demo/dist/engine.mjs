export function parseCSV(text) {
  const rows=[]; let row=[], cell='', quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v!==''))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('CSV引号未闭合');
  if(cell!==''||row.length){row.push(cell);rows.push(row);}
  if(!rows.length)throw new Error('CSV为空');
  const head=rows.shift();
  if(new Set(head).size!==head.length)throw new Error('重复字段');
  return rows.map((r,i)=>{if(r.length!==head.length)throw new Error(`CSV第${i+2}行列数不一致`);return Object.fromEntries(head.map((h,j)=>[h,r[j]]));});
}
export function coerce(rows,schema){return rows.map(r=>Object.fromEntries(schema.fields.map(f=>{let v=r[f.name];if(v===undefined)throw new Error(`缺少字段 ${f.name}`);if(v===''){if(!f.nullable)throw new Error(`字段 ${f.name}不能为空`);return[f.name,null];}if(f.type!=='string'){v=Number(v);if(!Number.isFinite(v)||(f.type==='integer'&&!Number.isInteger(v)))throw new Error(`字段 ${f.name}数值无效`);}return[f.name,v];})));}
const sum=(rows,k)=>rows.reduce((a,r)=>a+r[k],0);
export function summarize(data,asOf='2026-10-12'){
 const phase=p=>{const rows=data.users.filter(u=>u.cohort_phase===p&&u.repeat_14d_eligible===1),n=rows.length,r=sum(rows,'repeat_14d');return{n,repeats:r,rate:n?r/n:null};};
 const baseline=phase('baseline'),post=phase('post_rebuild'),nu=data.users.filter(u=>u.segment==='New');
 const currentEligible=data.users.filter(u=>{const days=(Date.parse(asOf)-Date.parse(u.first_participation_date))/86400000;return days>=0&&days<14;});
 const categories=[...new Set(data.campaigns.map(c=>c.category))].map(category=>{const cs=data.campaigns.filter(c=>c.category===category),n=sum(cs,'repeat_14d_eligible_new_users'),r=sum(cs,'repeat_14d_new_users');return{category,n,repeats:r,rate:r/n,registrationRate:sum(cs,'registrations')/sum(cs,'landing_page_unique_visitors')};});
 return{baseline,post,deltaPP:(post.rate-baseline.rate)*100,relativeLift:post.rate/baseline.rate-1,newCount:nu.length,newRepeats:sum(nu,'repeat_14d'),newMarketing:sum(nu,'marketing_opt_in'),newPersonalization:sum(nu,'personalization_opt_in'),currentEligible:currentEligible.length,categories,counts:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length]))};
}
const templates={
 EXP001:{name:'48h 相关推荐',hypothesis:'首次体验后及时提供相关下一场活动，可能减少再次参与的决策成本。',action:'首次到场48小时内，向已同意触达的新用户发送一条相关活动推荐；对照组保留当前标准流程。',design:'用户级随机分配；排除当前链路已包含相同推荐的重复测试。',priority:1},
 EXP002:{name:'随机邀请加入兴趣群',hypothesis:'兴趣群邀请可能帮助用户建立持续连接，但历史入群者的意向偏高。',action:'随机分配一次自愿入群邀请；按是否被分配邀请分析，不按最终是否入群筛选。',design:'随机邀请，按分配组分析；记录实际入群作为执行度指标。',priority:3},
 EXP003:{name:'个性化内容推荐',hypothesis:'自愿提供的兴趣信息可能提高内容相关性。',action:'仅对明确同意个性化的用户做兴趣推荐；保留原历史方案的medium工程要求。',design:'用户级随机试点；若改成人工规则，须作为新变体重新估算。',priority:4},
 EXP004:{name:'人工 follow-up',hypothesis:'个别跟进可能帮助解决参与障碍，但强依赖人力。',action:'对随机选中的已同意用户做一次人工跟进，记录总人时与退订。',design:'新试验采用随机分配；历史匹配观察不能证明净增量。',priority:6},
 EXP005:{name:'二次参与优惠',hypothesis:'有限补贴可能降低再次参与门槛，但持续性未知。',action:'随机分配有上限的二次参与优惠；统一有效期与活动供给。',design:'用户级随机试验；报告补贴成本，不将参与提升等同于收入ROI。',priority:5},
 EXP006:{name:'活动后深度内容触达',hypothesis:'与活动相关的深度内容可能延续兴趣，以较低成本提供下一次参与入口。',action:'发送一份相关深度内容及一个活动入口；对照组保持当前标准触达。',design:'用户级随机试点；主指标仍为首次参与后14天内实际再次到场。',priority:2},
 EXP007:{name:'通用 newsletter',hypothesis:'统一内容提醒可能产生有限增量，历史信号很弱。',action:'测试一封通用newsletter；避免与其他试验在同一用户上叠加。',design:'用户级随机分配；区间跨0不能直接解读为已证明无效。',priority:7},
 EXP008:{name:'高频提醒',hypothesis:'多次提醒可能增加点击，但也可能造成打扰。',action:'原高频方案保留为反例；不建议沿用，降低频率后须作为新候选。',design:'高退订与投诉需先修订策略，不能用点击提升代替主指标。',priority:8}
};
export function generate(data){return data.experiments.map(e=>{const t=templates[e.experiment_id];if(!t)throw new Error('未知实验模板');return{id:'C'+e.experiment_id.slice(3),sourceId:e.experiment_id,...t,experiment:e,metric:'首次实际参与后 (0,14] 天内再次实际参加活动',target:'未来首次参与、符合触达同意要求的新用户',cost:e.cash_cost_cad,hours:e.staff_hours,staff:e.peak_staff_required,engineering:e.engineering_effort,expectedIncrementalEffect:null,estimateType:'historical_placeholder',evidenceRefs:[{table:'experiments',rowId:e.experiment_id,fields:['study_design','treatment_n','treatment_repeat_14d','comparison_n','comparison_repeat_14d','cash_cost_cad','staff_hours','peak_staff_required','limitations']}]};});}
export function reflect(c,config){
 const e=c.experiment,issues=[];const add=(severity,title,detail)=>issues.push({severity,title,detail});
 if(config.existingActions?.includes(c.sourceId))add('block','已在当前链路中使用','必须明确新增干预差异；当前Demo不自动将原动作当成新实验。');
 if(e.study_design!=='randomized_pilot')add('warning','观察性证据','比较组未随机分配；已知和未知意向差异都可能影响结果。');
 if(e.treatment_n<50||e.comparison_n<50)add('warning','小样本','每组不足50人，点估计不稳定；需重新设计未来样本量。');
 if(e.descriptive_diff_ci95_low_pp<=0&&e.descriptive_diff_ci95_high_pp>=0)add('note','效果方向尚不确定','描述性95%区间跨0，不等于证明没有效果。');
 if(c.engineering!=='low')add('block','工程投入超出约束','当前仅允许low；原方案为medium。修改方案后必须重新评估。');
 if(e.ux_risk==='high')add('block','用户体验风险高','原方案退订及投诉偏高，不纳入本轮推荐组合。');
 if(config.privacy==='conservative'&&e.privacy_risk!=='low')add('block','隐私方案需修订','当前保守隐私模式仅放行low风险历史方案；同意不自动消除风险。');
 if(c.cost>config.budget)add('block','超出单项预算',`历史现金占位${c.cost} CAD高于当前预算。`);
 if(c.staff>config.team)add('block','超出峰值人数',`峰值${c.staff}人，高于当前核心执行人数。`);
 if(config.hours!==null&&c.hours>config.hours)add('block','超出可用人时',`历史占位${c.hours}人时，高于本轮输入。`);
 if(config.weeks<4)add('block','排期需要重做','本版安排包含准备、入组和14天完整观察；少于4周未提供压缩方案。');
 if(c.sourceId==='EXP002')add('warning','干预已改为随机邀请','这是修订方案；历史成本仅作参考，邀请随机化的额外成本未知。');
 if(c.sourceId==='EXP001')add('warning','核实当前链路','重构后可能已包含相关推荐，必须确认未来试验测试的是新增变化。');
 if(c.sourceId==='EXP004')add('warning','人工机会成本','历史总投入100人时；不能仅凭现金预算内就判断可执行。');
 add('note','可迁移性未知','历史比较组约20%，重构后观察基线31%；不能把历史差异直接加到31%。');
 return{...c,issues,status:issues.some(i=>i.severity==='block')?'revise':'pass_with_conditions'};
}
export function validateConfig(c){
 for(const [k,min,max]of [['budget',0,100000],['team',1,20],['parallel',1,3],['weeks',1,12]])if(!Number.isFinite(c[k])||c[k]<min||c[k]>max||!Number.isInteger(c[k]))throw new Error(`${k}输入超出范围或不是整数`);
 for(const k of ['hours','futureUsers'])if(c[k]!==null&&(!Number.isFinite(c[k])||c[k]<0||!Number.isInteger(c[k])))throw new Error(`${k}须为非负整数或留空`);
 if(!['balanced','evidence','cost'].includes(c.preference))throw new Error('未知排序策略');
 if(c.existingActions!==undefined&&(!Array.isArray(c.existingActions)||c.existingActions.some(id=>!templates[id])))throw new Error('已有策略无效');
 if(c.privacy!=='conservative')throw new Error('本版仅支持保守隐私');
}
export function rank(reviewed,c){
 validateConfig(c);
 const scored=reviewed.map(x=>scoreCandidate(x,c));
 const comparisons=[];
 for(let i=0;i<scored.length;i++)for(let j=i+1;j<scored.length;j++){
  const a=scored[i],b=scored[j],margin=+(a.totalScore-b.totalScore).toFixed(3);
  comparisons.push({a:a.id,b:b.id,winner:Math.abs(margin)<0.05?null:margin>0?a.id:b.id,margin,reason:'六维加权分比较；差距小于0.05视为并列，不是独立模型裁判'});
 }
 const order=scored.sort((a,b)=>b.totalScore-a.totalScore||a.id.localeCompare(b.id));
 let cost=0,hours=0,staff=0;const selected=[],decisions=[];
 for(const x of order){let reason;
  if(x.status==='revise')reason='需修订：'+x.issues.filter(i=>i.severity==='block').map(i=>i.title).join('、');
  else if(c.futureUsers===0)reason='已设未来新用户为0，无法形成新试验';
  else if(selected.length>=c.parallel)reason='已达到本轮试验数量上限';
  else if(cost+x.cost>c.budget)reason='加入后组合现金超限';
  else if(staff+x.staff>c.team)reason='加入后并行峰值人数超限';
  else if(c.hours!==null&&hours+x.hours>c.hours)reason='加入后组合人时超限';
  else {selected.push(x);cost+=x.cost;hours+=x.hours;staff+=x.staff;reason='进入条件性组合';}
  decisions.push({candidateId:x.id,sourceId:x.sourceId,selected:selected.includes(x),reason});
 }
 const unknown=['未来正式成本与准备工作报价','按最小有意义差异确定样本量与分配','未来活动供给与14天完整观察安排','入组时有效同意和预先约定的体验护栏'];
 if(c.hours===null)unknown.push('核心团队实际可用人时');
 if(c.futureUsers===null)unknown.push('未来符合条件的新用户供给');
 if(selected.some(x=>x.sourceId==='EXP001'))unknown.push('相关推荐是否已属于重构后默认流程');
 return{ordered:order,comparisons,weights:weightsFor(c.preference),selected,decisions,totals:{cost,hours,staff,count:selected.length},unknown,launchReady:false,method:'六维启发式评分与两两分差比较，随后检查组合约束；不是独立模型锦标赛，不保证全局最优，不相加历史效果。',planningOnly:true};
}
export const DEFAULT_CONFIG=Object.freeze({budget:1500,team:5,hours:null,futureUsers:null,parallel:3,weeks:4,privacy:'conservative',preference:'balanced'});
export const ACTIVITY_CATEGORIES=Object.freeze(['heritage_experience','academic_deep_dive','interest_social','career_cultural_exchange','experimental']);
export function validateActivity(a,config){
 if(!a||typeof a.id!=='string'||!a.id||a.id.length>100)throw new Error('活动标识无效');
 for(const [key,label,max]of [['name','活动名称',80],['audience','目标人群',160]])if(typeof a[key]!=='string'||!a[key].trim()||a[key].length>max)throw new Error(`${label}不能为空，且最多${max}字`);
 if(a.scope!==undefined&&!['activity','community'].includes(a.scope))throw new Error('任务范围无效');
 if(!ACTIVITY_CATEGORIES.includes(a.category))throw new Error('请选择有效的活动类型');
 if(a.date!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(a.date)||!Number.isFinite(Date.parse(a.date))||new Date(a.date).toISOString().slice(0,10)!==a.date))throw new Error('活动日期无效');
 if(a.expectedNewUsers!==null&&(!Number.isInteger(a.expectedNewUsers)||a.expectedNewUsers<0||a.expectedNewUsers>1000000))throw new Error('预计首次参与人数应为非负整数，未知请留空');
 if(config){validateConfig(config);if(a.expectedNewUsers!==null&&config.futureUsers!==null&&config.futureUsers>a.expectedNewUsers)throw new Error('可入组新用户不能超过预计首次参与人数');}
}
export function createPlan(activity,config={...DEFAULT_CONFIG}){
 validateActivity(activity,config);
 return{activity:{scope:activity.scope??'activity',id:activity.id,name:activity.name.trim(),category:activity.category,date:activity.date,audience:activity.audience.trim(),expectedNewUsers:activity.expectedNewUsers},config:{...config},lastRun:null,savedAt:null};
}
export function updatePlan(plan,activity,config){
 if(activity.id!==plan.activity.id)throw new Error('不可更改活动标识');
 const next=createPlan(activity,config);return{...next,lastRun:plan.lastRun,savedAt:plan.savedAt};
}
const inputKey=(activity,config)=>JSON.stringify([activity.id,activity.name,activity.category,activity.date,activity.audience,activity.expectedNewUsers,config.budget,config.team,config.hours,config.futureUsers,config.parallel,config.weeks,config.privacy,config.preference,config.existingActions??[],activity.scope??'activity']);
export function isPlanStale(plan){return!!plan.lastRun&&inputKey(plan.activity,plan.config)!==inputKey(plan.lastRun.activity,plan.lastRun.config);}
export function recordRun(plan,at=new Date().toISOString()){
 validateActivity(plan.activity,plan.config);return{...plan,savedAt:null,lastRun:{activity:{...plan.activity},config:{...plan.config},createdAt:at}};
}
export function serializeWorkspace(plans,activeId){return JSON.stringify({version:2,activeId,plans});}
export function restoreWorkspace(raw){
 const s=JSON.parse(raw);if(s.version!==2||!Array.isArray(s.plans)||!s.plans.length||s.plans.length>100)throw new Error('保存的工作台格式无效');
 const plans=s.plans.map(p=>{const valid=createPlan(p.activity,p.config);if(p.lastRun){validateActivity(p.lastRun.activity,p.lastRun.config);if(p.lastRun.activity.id!==valid.activity.id)throw new Error('方案与活动不匹配');valid.lastRun={activity:{...p.lastRun.activity},config:{...p.lastRun.config},createdAt:typeof p.lastRun.createdAt==='string'?p.lastRun.createdAt:null};}valid.savedAt=typeof p.savedAt==='string'?p.savedAt:null;return valid;});
 if(new Set(plans.map(p=>p.activity.id)).size!==plans.length)throw new Error('存在重复活动');
 return{plans,activeId:plans.some(p=>p.activity.id===s.activeId)?s.activeId:plans[0].activity.id};
}
export function activityContext(data,a){
 const rows=data.campaigns.filter(c=>a.scope==='community'||c.category===a.category),n=sum(rows,'repeat_14d_eligible_new_users'),r=sum(rows,'repeat_14d_new_users');
 const context={activity:{...a},historicalReference:{count:rows.length,eligibleNewUsers:n,repeatNewUsers:r,repeatRate:n?r/n:null,rowIds:rows.map(c=>c.campaign_id)},repeatWindowEnd:a.date?new Date(Date.parse(a.date)+14*86400000).toISOString().slice(0,10):null};
 return context;
}
function initialRun(data,config,activity=null){
 validateConfig(config);if(activity)validateActivity(activity,config);
 const context=activity?activityContext(data,activity):null;
 const generated=generate(data).map(c=>context?{...c,activityId:activity.id,target:`${activity.audience}；仅纳入其中首次参与且符合触达同意要求的用户`,evidenceRefs:[...c.evidenceRefs,{table:'campaigns',rowIds:context.historicalReference.rowIds,fields:['category','new_attendees','repeat_14d_new_users','repeat_14d_eligible_new_users'],relationship:'同类型历史参考，不是该干预的因果证据'}]}:c);
 const reviewed=generated.map(c=>{const r=reflect(c,config);if(activity?.expectedNewUsers===0)r.issues.push({severity:'block',title:'预计首次参与人数为0',detail:'没有本指标的目标人群；请修改计划或另选业务目标。'});if(activity?.date&&activity.date<'2026-10-12')r.issues.push({severity:'block',title:'计划日期早于分析日期',detail:'本工作台用于未来新活动，请更新计划日期。'});if(r.issues.some(i=>i.severity==='block'))r.status='revise';return r;});
 const ranking=rank(reviewed,config);
 if(activity&&!activity.date)ranking.unknown.push('活动日期及准备期尚未确定');
 if(activity&&activity.expectedNewUsers===null)ranking.unknown.push('本活动预计首次参与人数');
 return{version:'demo-2.0',mode:'deterministic_offline_rules',isSynthetic:true,analysisDate:'2026-10-12',config:{...config},activity:activity?{...activity}:null,context,summary:summarize(data),generated,reviewed,ranking};
}

export const SCORE_LABELS={impact:'影响潜力',evidence:'证据强度',business:'业务价值',feasibility:'可行性',cost:'成本效率',risk:'风险可控性'};
export function weightsFor(preference){
 const w={impact:.25,evidence:.20,business:.20,feasibility:.15,cost:.10,risk:.10};
 if(preference==='evidence')Object.assign(w,{impact:.15,evidence:.30});
 if(preference==='cost')Object.assign(w,{impact:.10,cost:.25});
 return w;
}
export function scoreCandidate(c,config){
 const e=c.experiment,n=Math.min(e.treatment_n,e.comparison_n),clamp=x=>Math.max(0,Math.min(10,x));
 const scores={impact:clamp(4+e.observed_diff_pp*.22),evidence:clamp((e.study_design==='randomized_pilot'?6:3)+(n>=100?1:n<50?-1:0)+(e.descriptive_diff_ci95_low_pp>0?1:0)),business:8,feasibility:clamp(10-c.hours/20-(c.engineering==='low'?0:3)),cost:clamp(10-c.cost/150),risk:clamp(10-(e.privacy_risk==='low'?0:3)-(e.ux_risk==='high'?6:e.ux_risk==='medium'?2:0))};
 const reasons={impact:'历史观察差异映射到潜力分，不能解释为预计提升',evidence:'依据随机化、每组样本量及区间；改进方案不增加新证据',business:'当前候选均针对14天二次参与，统一8分；不是收入ROI',feasibility:'历史人时与工程等级；未来执行成本尚未核实',cost:'历史现金成本映射，仅衡量现金负担，未估算收益',risk:'历史隐私和体验风险；提出缓解措施不等于风险已消除'};
 const weights=weightsFor(config.preference),totalScore=Object.keys(scores).reduce((n,k)=>n+scores[k]*weights[k],0);
 return{...c,scores,scoreReasons:reasons,totalScore:+totalScore.toFixed(3)};
}
const levers={EXP001:'相关活动推荐',EXP002:'社群连接',EXP003:'内容相关性',EXP004:'人工服务',EXP005:'参与激励',EXP006:'内容延续',EXP007:'通用触达',EXP008:'通用触达'};
export function diversityCheck(candidates){
 const seen=new Set(),removed=[],kept=[];
 for(const c of candidates){const signature=[c.action,c.target,c.metric].join('|').replace(/\s/g,'');if(seen.has(signature))removed.push({id:c.id,reason:'干预、人群与主指标完全相同'});else{seen.add(signature);kept.push(c);}}
 const groups=Object.entries(levers).reduce((a,[id,lever])=>{const c=kept.find(c=>c.sourceId===id);if(c)(a[lever]??=[]).push(c.id);return a;},{});
 return{kept,removed,groups,method:'按干预、人群和指标精确去重；按预定义增长机制分组，不是语义向量相似度',warnings:Object.entries(groups).filter(([,ids])=>ids.length>1).map(([lever])=>lever+'存在近似候选：保留频率差异，执行时避免用户池重叠')};
}
const refinements={
 EXP001:'先核对标准链路。若已有48h推荐，仅测试推荐相关性或入口差异；不得重复测试既有动作。',
 EXP002:'按随机邀请分组分析，保留未入群者；记录邀请送达与入群率，避免只比较自愿入群者。',
 EXP003:'设计低工程人工规则变体，仅使用自愿提供的兴趣；工程、人时与隐私评估重新报价后才可放行。',
 EXP004:'提出限制跟进次数与人数的变体；记录每次耗时，重新核算人时和隐私风险。',
 EXP005:'固定优惠上限和有效期；同时观察无补贴后再次参与，不能把补贴点击视为留存。',
 EXP006:'固定一份相关深度内容与一个活动入口；按原分组观察14天实际参与，点击仅作辅助指标。',
 EXP007:'限制为一次发送，预先约定最小有意义差异；结果不确定时不宣称策略有效。',
 EXP008:'提出单次提醒变体，加入退订入口；原高频风险标签保留，完成重新评估前不得推荐。'};
export function evolveCandidates(ranking){
 return ranking.ordered.slice(0,3).map(c=>({...c,version:2,parentId:c.id,id:c.id+'-v2',action:c.action+' '+refinements[c.sourceId],changes:[{field:'执行与验证计划',before:c.action,after:refinements[c.sourceId],addresses:c.issues.map(i=>i.title)}],validationPlan:{primary:c.metric,allocation:'使用互斥用户池，处理组与对照组随机分配；按原分配分析',success:'执行前确定最小有意义差异及样本量；同时报告区间，不只看点估计',guardrails:'记录退订、投诉和实际人时；停止阈值需负责人确认',schedule:'第1周准备、第2周入组、第3–4周完成每人14天观察'},evidenceChange:'没有新增观测；证据分及历史资源占位保持不变',needsRequote:true}));
}
export function qualityGate(ranking){
 const issues=[];
 if(!ranking.selected.length)issues.push({code:'no_feasible',stage:'Evolution',message:'当前约束下没有可行候选，需要新报价、资源或方案变体'});
 if(ranking.selected.some(c=>c.scores.evidence<6))issues.push({code:'weak_evidence',stage:'Reflection',message:'候选包含较弱证据，需要预先设计验证，不能补写成强证据'});
 const top=ranking.ordered.filter(c=>c.status!=='revise');
 if(top.length>1&&Math.abs(top[0].totalScore-top[1].totalScore)<.3)issues.push({code:'close_scores',stage:'Ranking',message:'前两名分差不足0.3，排序不稳定，应结合资源取舍'});
 return{status:issues.length?'needs_review':'conditional',issues,launchReady:false,meaning:'仅检查决策草案；执行准备另需解决待核实条件'};
}
export function run(data,config,activity=null){
 const r=initialRun(data,config,activity),diversity=diversityCheck(r.generated);
 const initialRanking=rank(r.reviewed.filter(c=>diversity.kept.some(k=>k.id===c.id)),config);
 const evolved=evolveCandidates(initialRanking),variants=r.reviewed.map(c=>evolved.find(v=>v.parentId===c.id)||c);
 let ranking=rank(variants,config);ranking.unknown=[...new Set([...ranking.unknown,...r.ranking.unknown,'改进方案的正式资源报价与审查确认'])];
 const beforeGate=qualityGate(ranking),iteration={maxRounds:1,rounds:[],triggered:beforeGate.issues.length>0};
 if(iteration.triggered){
  const tasks=beforeGate.issues.map(i=>({stage:i.stage,reason:i.message,action:i.code==='weak_evidence'?'补充预注册与按分配组分析要求':i.code==='close_scores'?'重新比较证据优先与成本优先的组合':'重新审查阻断原因；缺少报价时保留阻断'}));
  const revisited=variants.map(c=>({...c,issues:[...c.issues],validationPlan:{...(c.validationPlan||{}),iterationReview:tasks.filter(t=>t.stage!=='Ranking').map(t=>t.action).join('；')},iterationNotes:tasks.filter(t=>t.stage!=='Ranking').map(t=>t.action)}));
  ranking={...rank(revisited,config),unknown:ranking.unknown};
  iteration.rounds.push({round:1,tasks,alternatives:['evidence','cost'].map(preference=>({preference,selected:rank(revisited,{...config,preference}).selected.map(c=>c.id)})),outcome:'已完成一次规则复核；不补造证据或报价，未解决的问题保留'});
 }
 const gate=qualityGate(ranking);
 return{...r,version:'demo-4.0',dataProvenance:'基于用户确认的真实业务统计构建的演示数据；逐行记录为生成数据',diversity,initialRanking,evolved,ranking,metaReview:metaReview(ranking,gate),qualityGate:gate,iteration,versionComparison:evolved.map(v=>({original:v.parentId,variant:v.id,originalScore:initialRanking.ordered.find(c=>c.id===v.parentId).totalScore,variantScore:ranking.ordered.find(c=>c.id===v.id).totalScore,reason:'方案更明确，但没有新观测或资源确认，评分不自动提高'}))};
}

export function metaReview(ranking,gate){
 const chosen=ranking.selected,blocked=ranking.decisions.filter(d=>!d.selected);
 const counts=new Map();for(const c of ranking.ordered)for(const i of c.issues)counts.set(i.title,(counts.get(i.title)||0)+1);
 return{
 cross_hypothesis_insights:[`[设计观察] 本轮${ranking.ordered.length}个候选均围绕首次参与到二次参与；不能据此推断获客策略无效。`,chosen.length?`[决策推断] 在当前权重和资源限制下，${chosen.map(c=>c.name).join('、')}组成可进一步验证的组合；不是已证明效果最好的方案。`:'[决策结论] 当前约束下无可推荐组合，需要先调整条件或设计新变体。'],
 shared_risks:[...counts].filter(([,n])=>n>=2).map(([title,n])=>`[审查观察] ${n}个候选涉及“${title}”。`),
 critical_evidence_gaps:[...new Set(['[数据缺口] 当前演示没有足够长期留存数据，不能判断14天再次参与能否持续转化为会员留存。',...ranking.unknown.map(x=>'[待核实] '+x)])],
 final_decision_rationale:chosen.length?`按当前六维权重与组合约束，保留${chosen.length}个候选（${ranking.totals.cost} CAD历史现金占位、${ranking.totals.hours}人时、峰值${ranking.totals.staff}人）。${blocked.map(d=>{const c=ranking.ordered.find(c=>c.id===d.candidateId);return c.name+'：'+d.reason;}).join('；')}。${gate.status==='needs_review'?'质量复核仍有问题，推荐仅为待验证草案。':'草案有条件通过，执行前仍需补齐准备条件。'}`:'没有满足当前条件的组合，不为展示Top 3而强行推荐。'+blocked.map(d=>ranking.ordered.find(c=>c.id===d.candidateId).name+'：'+d.reason).join('；')
 };
}
