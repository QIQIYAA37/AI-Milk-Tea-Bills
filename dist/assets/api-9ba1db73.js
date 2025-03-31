const E="sk-18ad8739c9054f5eb56a01cb7b8d5c48",k="https://api.deepseek.com";async function j(e,i,s,n){try{console.log("开始AI分析，准备建立连接..."),s&&(console.log("触发初始化回调，清空UI"),s());const r=Date.now().toString();console.log("生成会话ID:",r);const t=`
作为一名专业的奶茶健康分析师，请根据以下用户的消费和健康数据，提供严格分离的两部分内容：(1)健康分析报告和(2)奶茶推荐：

## 用户数据
- 本周卡路里摄入: ${e.calories} 卡路里
- 本周糖分摄入: ${e.sugar}g
- 本周咖啡因摄入: ${e.caffeine}mg
- 本周消费金额: ¥${e.cost}

## 用户设定的健康目标
- 预算目标: 每周不超过 ¥${e.budgetGoal}
- 糖分目标: 每周不超过 ${e.sugarGoal}g
- 咖啡因目标: 每周不超过 ${e.caffeineGoal}mg

请严格按照以下格式响应，使用Markdown格式：

---HEALTH_ANALYSIS_START---
# 奶茶健康分析报告

## 当前状态分析

✅/⚠️/❌ **预算控制状态**：¥${e.cost}/¥${e.budgetGoal} (百分比)
✅/⚠️/❌ **糖分摄入状态**：${e.sugar}g/${e.sugarGoal}g (百分比)
✅/⚠️/❌ **咖啡因摄入状态**：${e.caffeine}mg/${e.caffeineGoal}mg (百分比)

## 营养成分摄入评价

请对用户的营养成分摄入情况进行评价，特别是糖分和咖啡因的摄入量。如果某项营养成分摄入过多，请给出具体的评价和改善建议。例如：

${e.sugar>e.sugarGoal*.9?"⚠️ **糖分摄入过多**：您本周的糖分摄入接近或超过了健康目标。长期过量摄入糖分可能导致肥胖、糖尿病等健康问题。":""}

${e.caffeine>e.caffeineGoal*.9?"⚠️ **咖啡因摄入过多**：您本周的咖啡因摄入接近或超过了健康目标。过量摄入咖啡因可能导致失眠、心悸等问题。":""}

## 营养成分摄入建议

${e.sugar>e.sugarGoal*.9?"- **减少糖分摄入**：推荐选择低糖或无糖饮品，如无糖绿茶、微糖奶茶等。每周减少一杯全糖奶茶可降低约20-30g的糖分摄入。":""}

${e.caffeine>e.caffeineGoal*.9?"- **减少咖啡因摄入**：推荐选择低咖啡因饮品，如果茶、花草茶或无咖啡因的水果茶。建议晚上6点后避免含咖啡因的饮品。":""}

## 综合建议

针对用户数据的1-2条健康建议，包括预算、糖分和咖啡因摄入的平衡等。
---HEALTH_ANALYSIS_END---
`;console.log("使用DeepSeek API进行流式分析...");const o=await fetch(`${k}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${E}`},body:JSON.stringify({model:"deepseek-chat",messages:[{role:"system",content:"你是一名专业的奶茶健康分析师，擅长根据用户数据提供个性化的健康分析和奶茶推荐。请严格按照指定格式返回结果。"},{role:"user",content:t}],stream:!0})});if(!o.ok)throw new Error(`DeepSeek API请求失败: ${o.status}`);const l=o.body.getReader(),g=new TextDecoder;let m="",a="",c=!1;for(;;){const{done:y,value:N}=await l.read();if(y)break;const O=g.decode(N);m+=O;const u=m.split(`
`);m="";for(const b of u){const $=b.trim();if($.startsWith("data: ")){const A=$.slice(6);if(A==="[DONE]"){console.log("流式输出完成");break}try{const f=JSON.parse(A);if(f.choices&&f.choices[0].delta&&f.choices[0].delta.content){const d=f.choices[0].delta.content;if(d.includes("---HEALTH_ANALYSIS_START---")){c=!0;continue}else if(d.includes("---HEALTH_ANALYSIS_END---")){c=!1;continue}c&&(a+=d,i&&i(d))}}catch(f){console.error("解析DeepSeek流式响应出错:",f,A);continue}}else $&&(m=$)}}return console.log("分析完成，存储会话数据"),localStorage.setItem(`analysis_${r}`,a),r}catch(r){console.error("AI分析失败:",r),n&&n("分析过程发生错误: "+r.message);const t=`
# 奶茶健康分析报告

## 当前状态分析

⚠️ **预算控制状态**：¥${e.cost}/¥${e.budgetGoal} (${Math.round(e.cost/e.budgetGoal*100)}%)
⚠️ **糖分摄入状态**：${e.sugar}g/${e.sugarGoal}g (${Math.round(e.sugar/e.sugarGoal*100)}%)
⚠️ **咖啡因摄入状态**：${e.caffeine}mg/${e.caffeineGoal}mg (${Math.round(e.caffeine/e.caffeineGoal*100)}%)

## 综合建议

建议控制每周奶茶摄入频次，选择低糖低咖啡因选项，有助于保持健康和控制预算。
锻炼和健康饮食习惯同样重要，可以帮助平衡偶尔的奶茶带来的额外摄入。
`;s&&s();const o=t.split(`
`);for(const l of o)await new Promise(g=>setTimeout(g,100)),i&&i(l+`
`);return Date.now().toString()}}async function J(e,i){try{console.log("获取智能推荐，使用会话ID:",i);const s=`
作为一名专业的奶茶健康分析师，请为以下用户提供个性化的奶茶推荐：

## 用户数据
- 本周卡路里摄入: ${e.calories} 卡路里
- 本周糖分摄入: ${e.sugar}g
- 本周咖啡因摄入: ${e.caffeine}mg
- 本周消费金额: ¥${e.cost}

## 用户设定的健康目标
- 预算目标: 每周不超过 ¥${e.budgetGoal}
- 糖分目标: 每周不超过 ${e.sugarGoal}g
- 咖啡因目标: 每周不超过 ${e.caffeineGoal}mg

${e.preferences?`## 用户偏好
${e.preferences.map(o=>`- ${o.preference}: ${o.value}`).join(`
`)}`:""}
${e.favoredBrand?`## 偏好品牌
- ${e.favoredBrand}`:""}
${e.healthGoal?`## 健康目标
- ${e.healthGoal}`:""}

请以JSON格式返回三类奶茶推荐：预算友好型、健康平衡型和有助睡眠型。每类推荐2个具体奶茶选项，包含品牌、名称、描述和购买建议。

返回格式：
{
  "budgetFriendly": {
    "description": "基于用户消费习惯，推荐价格合理且符合预算的奶茶选项",
    "recommendations": [
      { "name": "品牌名 - 奶茶名", "description": "具体价格和特点描述" },
      { "name": "品牌名 - 奶茶名", "description": "具体价格和特点描述" }
    ],
    "tip": "选择这些产品的好处"
  },
  "healthyBalance": {
    "description": "推荐健康平衡的奶茶选项，帮助控制糖分和卡路里摄入",
    "recommendations": [
      { "name": "品牌名 - 奶茶名", "description": "具体健康特点描述" },
      { "name": "品牌名 - 奶茶名", "description": "具体健康特点描述" }
    ],
    "tip": "健康方面的好处"
  },
  "sleepFriendly": {
    "description": "推荐低咖啡因的奶茶选项，有助于改善睡眠质量",
    "recommendations": [
      { "name": "品牌名 - 奶茶名", "description": "咖啡因相关特点" },
      { "name": "品牌名 - 奶茶名", "description": "咖啡因相关特点" }
    ],
    "tip": "对睡眠的帮助"
  }
}
`,n=await fetch(`${k}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${E}`},body:JSON.stringify({model:"deepseek-chat",messages:[{role:"system",content:"你是一名专业的奶茶健康分析师，擅长提供个性化奶茶推荐。请以JSON格式返回推荐结果。"},{role:"user",content:s}],response_format:{type:"json_object"}})});if(!n.ok)throw new Error(`DeepSeek API请求失败: ${n.status}`);const t=(await n.json()).choices[0].message.content;try{const o=JSON.parse(t);return console.log("成功获取智能推荐数据"),o}catch(o){throw console.error("解析推荐JSON失败:",o),new Error("无法解析推荐数据")}}catch(s){return console.error("获取智能推荐失败:",s),{budgetFriendly:{description:"价格实惠、性价比高的奶茶选择",recommendations:[{name:"蜜雪冰城 - 椰香奶茶",description:"¥12，经济实惠的选择"},{name:"茶百道 - 珍珠奶茶",description:"¥15，性价比极高的经典选择"}],tip:"选择这些产品可以节省约¥20/周"},healthyBalance:{description:"健康平衡的奶茶选项，控制糖分和卡路里",recommendations:[{name:"喜茶 - 多肉葡萄",description:"无糖选项，减少约35g糖分摄入"},{name:"奈雪的茶 - 满杯红柚",description:"低糖选项，减少约30g糖分摄入"}],tip:"这些选择可以帮助您减少约30%的糖分和热量摄入"},sleepFriendly:{description:"低咖啡因的奶茶选项，有助于改善睡眠质量",recommendations:[{name:"茶百道 - 芝士茉莉",description:"无咖啡因，晚上饮用也安心"},{name:"喜茶 - 多肉芒芒",description:"无咖啡因，不影响睡眠"}],tip:"晚上6点后尽量避免高咖啡因饮品，选择果茶或花草茶"}}}}async function z(e,i,s,n,r){var t,o,l,g,m,a;try{let A=function(d){u=[],i&&i();const p=d.split(`

`);for(const I of p){const w=I.trim();if(w){const h=f(w);h&&(u.push(h),s&&s(h))}}},f=function(d){let p=d.replace(/[.。!！?？]+$/,"").trim();return p=p.replace(/^[0-9]+[\.\、\:]?\s*/,""),p=p.replace(/\n/g," "),p.trim()};console.log("开始流式营养分析，奶茶数据:",e),i&&i();const c=`
作为一名专业的奶茶营养师，请针对以下奶茶的营养成分，提供专业的健康分析和建议：

## 奶茶信息
- 名称: ${e.name}
- 品牌: ${e.brand}
- 规格: ${e.size}
- 甜度: ${e.sweetness}%
- 添加配料: ${e.toppings.join(", ")||"无"}

## 营养成分
- 热量: ${((t=e.nutrition)==null?void 0:t.calories)||0} 卡路里 (占每日推荐摄入的 ${((o=e.nutrition)==null?void 0:o.caloriesPercentage)||0}%)
- 糖分: ${((l=e.nutrition)==null?void 0:l.sugar)||0}g (占每日推荐摄入的 ${((g=e.nutrition)==null?void 0:g.sugarPercentage)||0}%)
- 脂肪: ${((m=e.nutrition)==null?void 0:m.fat)||0}g
- 咖啡因: ${((a=e.nutrition)==null?void 0:a.caffeine)||0}mg

## 分析要求
请基于上述信息，特别关注这款 ${e.name} 的特点和营养成分，提供5-7条专业且实用的健康小贴士。
考虑用户已选择的甜度(${e.sweetness}%)，以及计算得出的营养数据。

请覆盖以下方面：
1. 这款奶茶对健康的影响
2. 如何调整搭配使其更健康
3. 适合搭配的食物或活动建议
4. 适合/不适合饮用的人群
5. 饮用时间和频率建议

## 输出格式要求
- 每条建议控制在40字以内
- 使用简洁明了的语言
- 不要使用序号或标点符号结尾
- 每条建议必须独立成行，每条之间用双换行符分隔(\\n\\n)
- 不要在建议末尾添加句号或其他标点符号

示例格式（注意没有句号结尾，每条贴士之间有空行）：
这款奶茶含糖量适中，适量饮用对健康影响不大

建议选择少糖或无糖，可减少30%热量摄入

餐后半小时饮用有助于减轻对血糖的影响

搭配水果或坚果可增加膳食纤维，平衡营养

每周饮用次数建议不超过2次
`;console.log("直接使用DeepSeek API，创建流式请求...");const y=await fetch(`${k}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${E}`},body:JSON.stringify({model:"deepseek-chat",messages:[{role:"system",content:"你是一名专业的奶茶营养师，擅长分析饮品的营养成分并提供健康建议。请确保每条建议独立成行，并用空行分隔不同的建议。"},{role:"user",content:c}],stream:!0})});if(!y.ok)throw new Error(`DeepSeek API请求失败: ${y.status}`);const N=y.body.getReader(),O=new TextDecoder;let u=[],b="",$="";for(console.log("开始读取流式响应...");;){const{done:d,value:p}=await N.read();if(d)break;const w=O.decode(p).split(`
`).filter(h=>h.trim());for(const h of w){if(!h.startsWith("data: "))continue;const G=h.substring(6);if(G.trim()==="[DONE]"){console.log("流式输出完成"),A($),n&&n(u);continue}try{const S=JSON.parse(G);if(S.choices&&S.choices[0].delta&&S.choices[0].delta.content){const P=S.choices[0].delta.content;if($+=P,b+=P,b.includes(`

`)){const C=b.split(`

`);b=C.pop()||"";for(const M of C){const L=M.trim();if(L){const T=f(L);T&&(u.push(T),s&&s(T))}}}}}catch(S){console.error("解析DeepSeek流式响应出错:",S);continue}}}return console.log("流式响应处理完成，共收集到",u.length,"条提示"),{tips:u}}catch(c){return console.error("营养分析失败:",c),r&&r("API请求失败: "+c.message),{tips:[]}}}function _(e,i){const s=["喜茶","奈雪的茶","HEYTEA","奈雪","星巴克","Starbucks","茶百道","乐乐茶","LELECHA"],n=["COCO","CoCo","一点点","贡茶","益禾堂","沪上阿姨","古茗"],r=["蜜雪冰城","书亦烧仙草","甘茗城","茶颜悦色"];let t=18;const o=e.toLowerCase(),l=s.some(c=>o.includes(c.toLowerCase())),g=n.some(c=>o.includes(c.toLowerCase())),m=r.some(c=>o.includes(c.toLowerCase()));l?t=25+Math.floor(Math.random()*8):g?t=18+Math.floor(Math.random()*7):m?t=9+Math.floor(Math.random()*6):t=15+Math.floor(Math.random()*10);const a=i.toLowerCase();return a.includes("大")||a.includes("large")||a.includes("l")?t+=4+Math.floor(Math.random()*3):(a.includes("小")||a.includes("small")||a.includes("s"))&&(t-=2+Math.floor(Math.random()*3)),t=Math.max(6,t),parseFloat(t.toFixed(1))}async function B(e){try{console.log("使用AI搜索奶茶信息:",e);const i=`
作为一名奶茶营养专家，请提供以下奶茶的详细营养信息和介绍：${e}

请分析该款奶茶的营养成分和详细介绍，并以JSON格式返回以下信息：
- 名称 (name)
- 品牌 (brand)
- 规格 (size)：默认使用中杯
- 价格 (price)：单位为元，应该是一个合理的数字，例如中杯奶茶通常在15-30元之间
- 热量 (baseCalories)：单位为卡路里，应该是一个整数
- 糖分 (baseSugar)：单位为克，应该是一个整数或小数
- 脂肪 (baseFat)：单位为克，应该是一个整数或小数
- 咖啡因 (baseCaffeine)：单位为毫克，应该是一个整数
- 介绍 (introduction)：包含以下内容的对象:
  - 简介 (summary): 简短描述该奶茶的特点和风味
  - 材料 (ingredients): 数组，每项包含名称(name)和描述(description)
  - 特点 (features): 数组，每项包含标题(title)和描述(description)

请基于你对市场上奶茶产品的了解，提供最准确的估计值。数据应尽量精确，特别是糖分含量需要合理估计，避免过高或过低。标准中杯奶茶的糖分通常在30-50克之间，热量在300-450卡路里之间，请参考这个范围。价格应根据品牌定位合理估计，高端品牌如喜茶、奈雪的茶通常在25-35元，中端品牌如COCO、一点点通常在18-25元，平价品牌如蜜雪冰城通常在10-15元。

请严格按照以下JSON格式响应，不要包含任何额外的文字解释:
{
  "name": "奶茶名称",
  "brand": "品牌名称",
  "size": "中杯/大杯/小杯",
  "price": 数字,
  "baseCalories": 数字,
  "baseSugar": 数字,
  "baseFat": 数字,
  "baseCaffeine": 数字,
  "introduction": {
    "summary": "简介文字",
    "ingredients": [
      {"name": "材料名称1", "description": "材料描述1"},
      {"name": "材料名称2", "description": "材料描述2"},
      {"name": "材料名称3", "description": "材料描述3"}
    ],
    "features": [
      {"title": "特点标题1", "description": "特点描述1"},
      {"title": "特点标题2", "description": "特点描述2"},
      {"title": "特点标题3", "description": "特点描述3"}
    ]
  }
}
`,s=n=>(console.error("DeepSeek API请求失败:",n),{success:!1,error:n.message||"搜索奶茶信息失败",data:null});try{const n=await fetch(`${k}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${E}`},body:JSON.stringify({model:"deepseek-chat",messages:[{role:"system",content:"你是一名专业的奶茶营养师，擅长分析各种奶茶的营养成分和提供详细的产品介绍。请以JSON格式提供准确的数据和丰富的描述。"},{role:"user",content:i}],response_format:{type:"json_object"}})});if(!n.ok)return s(new Error(`请求失败 (${n.status}): ${n.statusText}`));const r=await n.json();if(!r.choices||!r.choices[0]||!r.choices[0].message||!r.choices[0].message.content)return s(new Error("API返回数据格式不正确，无法提取内容"));const t=r.choices[0].message.content;try{const o=JSON.parse(t),l={id:Date.now(),name:o.name||e,brand:o.brand||"未知品牌",size:o.size||"中杯",baseCalories:Number(o.baseCalories)||350,baseSugar:Number(o.baseSugar)||35,baseFat:Number(o.baseFat)||4,baseCaffeine:Number(o.baseCaffeine)||30,price:Number(o.price)||_(o.brand||"未知品牌",o.size||"中杯"),isAIGenerated:!0,introduction:o.introduction||{summary:`${o.name||e}是一款深受喜爱的奶茶饮品。`,ingredients:[{name:"茶底",description:"使用优质茶叶精心冲泡而成"},{name:"奶制品",description:"加入新鲜牛奶或奶精"},{name:"甜度",description:"可根据个人喜好调整"}],features:[{title:"口感",description:"香醇顺滑，回味甘甜"},{title:"特色",description:"独特配方，经典口味"},{title:"健康建议",description:"适量饮用，每周不超过3次"}]}};return console.log("AI成功生成奶茶信息:",l),{success:!0,data:l}}catch(o){return console.error("解析AI返回的奶茶数据失败:",o,"原始内容:",t),s(new Error("无法解析返回的数据格式，请尝试更明确的搜索词"))}}catch(n){return s(n)}}catch(i){return console.error("搜索奶茶时发生未知错误:",i),{success:!1,error:"发生未知错误: "+(i.message||String(i)),data:null}}}export{j as a,J as b,z as g,B as s};
