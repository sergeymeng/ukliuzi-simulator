import { useEffect, useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import "./App.css";

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const money = (n) => `£${Math.round(n)}`;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;

const statLabels = {
  cash: "余额",
  study: "学业",
  sanity: "精神状态",
  action: "行动力",
  social: "社交电量",
  info: "信息差",
  face: "体面值",
  anxiety: "前途焦虑",
};

const baseState = {
  week: 1,
  cash: 800,
  study: 50,
  sanity: 65,
  action: 60,
  social: 45,
  info: 30,
  face: 35,
  anxiety: 40,
  alertness: 20,
  kitchen: 10,
  melonPollution: 0,
  rejectionCount: 0,
  royalMailRage: 0,
  secondHandWins: 0,
  secondHandGhosted: 0,
  secondHandScams: 0,
  mealDealCount: 0,
  cookingCount: 0,
  shoppingCount: 0,
  pdfCount: 0,
  rumorCount: 0,
  sorryCount: 0,
  achievements: [],
  items: [],
  log: [],
  weeklyCostMod: 0,
};

const characters = [
  {
    id: "redbook",
    name: "小红书攻略型",
    desc: "知道很多，但焦虑也很多。",
    stats: { cash: 780, study: 50, sanity: 58, action: 55, social: 42, info: 50, face: 38, anxiety: 52 },
    item: "小红书收藏夹",
    passive: "信息差高。攻略/求职信息类事件会额外增加前途焦虑。",
  },
  {
    id: "academic",
    name: "学术卷王型",
    desc: "学业启动快，精神掉得也快。",
    stats: { cash: 800, study: 65, sanity: 55, action: 65, social: 35, info: 32, face: 32, anxiety: 50 },
    item: "降噪耳塞",
    passive: "学习类选择额外学业 +3，但精神状态 -2。",
  },
  {
    id: "freshers",
    name: "社牛Freshers型",
    desc: "社交收益高，但钱包漏风。",
    stats: { cash: 720, study: 48, sanity: 68, action: 62, social: 68, info: 35, face: 48, anxiety: 38 },
    item: "新生周手环",
    passive: "社交类选择额外信息差 +3、体面值 +3，但余额 -£8。",
  },
  {
    id: "introvert",
    name: "社恐自救型",
    desc: "省电稳定，但社交费劲。",
    stats: { cash: 820, study: 55, sanity: 62, action: 58, social: 25, info: 35, face: 28, anxiety: 45 },
    item: "降噪耳塞",
    passive: "独处/回血类选择精神状态 +3，社交类选择额外社交电量 -5。",
  },
  {
    id: "chinesemarket",
    name: "中超依赖型",
    desc: "冰箱里有饺子，人生就还有希望。",
    stats: { cash: 760, study: 50, sanity: 70, action: 55, social: 42, info: 40, face: 32, anxiety: 40 },
    item: "速冻饺子",
    passive: "中超/做饭/火锅类选择精神状态 +5，但中超购物额外花 £10。",
  },
  {
    id: "minimal",
    name: "低欲望省钱型",
    desc: "经济稳，体面值低。",
    stats: { cash: 950, study: 52, sanity: 63, action: 60, social: 38, info: 34, face: 22, anxiety: 35 },
    item: "Excel 记账表",
    passive: "省钱/二手群/Meal Deal类选择额外节省 £10，购物旅行体面收益降低。",
  },
  {
    id: "face",
    name: "体面工程型",
    desc: "朋友圈很好看，真实状态另说。",
    stats: { cash: 700, study: 48, sanity: 60, action: 52, social: 52, info: 38, face: 62, anxiety: 48 },
    item: "朋友圈九宫格模板",
    passive: "朋友圈/旅行/购物/LinkedIn类选择体面值 +5，大额消费前途焦虑 +4。",
  },
  {
    id: "londonaware",
    name: "伦敦警觉型",
    desc: "避坑强，但快乐打折。",
    stats: { cash: 820, study: 50, sanity: 58, action: 58, social: 40, info: 45, face: 35, anxiety: 42 },
    item: "防盗手机绳",
    passive: "手机飞升、换汇诈骗、二手群诈骗概率降低。",
  },
];

const traits = [
  { name: "带了两箱行李", text: "开局多几个生活道具，但行动力 -5。", effect: { action: -5 }, items: ["转换插头", "保温杯"] },
  { name: "只带一个登机箱", text: "行动力 +8，但前三周购物欲更强。", effect: { action: 8, cash: -30 } },
  { name: "汇率9.8入学", text: "余额 -£80，前途焦虑 +8。", effect: { cash: -80, anxiety: 8 } },
  { name: "宿舍离学校8分钟", text: "行动力 +5，余额 -£40。", effect: { action: 5, cash: -40 } },
  { name: "宿舍离学校40分钟", text: "余额 +£60，行动力 -8。", effect: { cash: 60, action: -8 } },
  { name: "室友是厨房战神", text: "厨房熟练度 +8，但火警故事概率上升。", effect: { kitchen: 8, sanity: -2 } },
  { name: "室友是安静NPC", text: "精神状态 +5，社交电量 -3。", effect: { sanity: 5, social: -3 } },
  { name: "开局认识学长学姐", text: "信息差 +10，社交电量 +3。", effect: { info: 10, social: 3 } },
];

const shopItems = [
  // Tesco：基础续命
  { id: "meal", name: "Tesco Meal Deal", place: ["Tesco"], price: 4, effect: { action: 5, sanity: 3, mealDealCount: 1 }, tag: "资本主义三件套，稳定但没灵魂" },
  { id: "coffee", name: "便利店咖啡", place: ["Tesco"], price: 3, effect: { action: 10, study: 3, anxiety: 4 }, tag: "短暂获得人类启动权限" },
  { id: "tesco_pasta", name: "Tesco意面套装", place: ["Tesco"], price: 6, effect: { cash: 8, kitchen: 3, sanity: 2, cookingCount: 1 }, tag: "便宜、能吃、像在生活" },
  { id: "tesco_dessert", name: "打折甜品", place: ["Tesco"], price: 3, effect: { sanity: 5, face: 1 }, tag: "黄标区捡到的小确幸" },

  // Boots：治疗和续命
  { id: "vitd", name: "维生素D", place: ["Boots"], price: 6, effect: { sanity: 8 }, tag: "英国冬天精神补丁" },
  { id: "lemsip", name: "Lemsip感冒冲剂", place: ["Boots"], price: 5, effect: { action: 8, sanity: 2 }, tag: "英区神水，喝完感觉能再撑一天" },
  { id: "plasters", name: "创可贴和常备药", place: ["Boots"], price: 8, effect: { sanity: 4, alertness: 4 }, tag: "成年人的安全感" },
  { id: "boots_342", name: "Boots 3 for 2", place: ["Boots"], price: 22, effect: { sanity: 6, info: 2, cash: -4 }, tag: "为了省钱买了三个不需要的东西" },

  // 中超：精神回血
  { id: "dumpling", name: "速冻饺子", place: ["中超"], price: 7, effect: { sanity: 10, action: 3 }, tag: "冰箱里有饺子，人生就还有希望" },
  { id: "hotpot", name: "火锅底料", place: ["中超"], price: 4, effect: { sanity: 10, social: 8, kitchen: 2 }, tag: "一包底料召唤半个朋友圈" },
  { id: "laoganma", name: "老干妈", place: ["中超"], price: 3, effect: { sanity: 5, kitchen: 3 }, tag: "留子饭桌基础设施" },
  { id: "instant_noodle", name: "出前一丁", place: ["中超"], price: 5, effect: { sanity: 6, action: 4, cookingCount: 1 }, tag: "不健康，但很懂你" },
  { id: "milk_tea_powder", name: "奶茶粉", place: ["中超"], price: 5, effect: { sanity: 7, anxiety: 2 }, tag: "精神回血，糖分背锅" },
  { id: "ricecooker", name: "小绿锅", place: ["中超", "二手群"], price: 25, effect: { sanity: 4, kitchen: 8, weeklyCostMod: -6 }, tag: "文明之光，米饭自由" },

  // 二手群：高风险高收益
  { id: "second_monitor", name: "二手显示器", place: ["二手群"], price: 20, effect: { study: 10, action: 5, secondHandWins: 1 }, tag: "宿舍工位升级，前提是卖家不鸽" },
  { id: "second_airfryer", name: "二手空气炸锅", place: ["二手群"], price: 20, effect: { sanity: 5, kitchen: 6, weeklyCostMod: -4, secondHandWins: 1 }, tag: "留子厨房现代化" },
  { id: "second_printer", name: "二手打印机", place: ["二手群"], price: 10, effect: { study: 3, info: 5, sanity: -4 }, tag: "机器便宜，墨盒开始收割" },
  { id: "second_bike", name: "二手自行车", place: ["二手群"], price: 40, effect: { action: 8, info: 2, secondHandWins: 1 }, tag: "通勤自由，但修车另算" },
  { id: "second_lamp", name: "宜家台灯", place: ["二手群"], price: 5, effect: { study: 3, sanity: 2, secondHandWins: 1 }, tag: "毕业急出，灯泡不包" },
  { id: "blacklist", name: "二手群黑名单", place: ["二手群"], price: 0, effect: { alertness: 10, info: 5 }, tag: "避雷也是信息差" },

  // Amazon：实用工具，不卖玄学
  { id: "phonecord", name: "防盗手机绳", place: ["Amazon"], price: 8, effect: { face: -3, alertness: 8 }, tag: "丑，但活着" },
  { id: "adapter", name: "转换插头", place: ["Amazon"], price: 8, effect: { action: 3, alertness: 2 }, tag: "刚落地时的通关文牒" },
  { id: "powerbank", name: "移动电源", place: ["Amazon"], price: 18, effect: { action: 4, alertness: 5 }, tag: "旅行和迷路时的底气" },
  { id: "umbrella", name: "雨伞", place: ["Amazon", "Tesco"], price: 10, effect: { sanity: 3 }, tag: "大风天另说" },
  { id: "noise_headphone", name: "降噪耳机", place: ["Amazon"], price: 90, effect: { study: 8, sanity: 5, face: 4 }, tag: "图书馆、室友、火警之后的自救" },
  { id: "monitor_new", name: "新显示器", place: ["Amazon"], price: 85, effect: { study: 10, action: 5, face: 3 }, tag: "不便宜，但不用和二手群卖家斗智斗勇" },

  // Primark：冬天装备
  { id: "heattech", name: "Heattech", place: ["primark"], price: 20, effect: { sanity: 6, action: 3 }, tag: "🥶" },
  { id: "primark_puffer", name: "primark羽绒服", place: ["primark"], price: 80, effect: { sanity: 10, face: 8 }, tag: "冷是真的冷，体面可以先放一放" },
  { id: "primark_socks", name: "袜子三件套", place: ["primark"], price: 10, effect: { sanity: 3, action: 2 }, tag: "你不知道为什么总是缺袜子" },

  // M&S：网红零食和情绪价值
  { id: "ms_grapes", name: "M&S网红葡萄", place: ["M&S"], price: 6, effect: { sanity: 8, face: 5, shoppingCount: 1 }, tag: "小红书说好吃，你决定相信一次" },
  { id: "ms_strawberry_tart", name: "草莓塔", place: ["M&S"], price: 5, effect: { sanity: 9, face: 6, shoppingCount: 1 }, tag: "甜品治不了DDL，但可以暂停痛苦" },
  { id: "ms_butter_biscuit", name: "黄油饼干", place: ["M&S"], price: 4, effect: { sanity: 6, face: 3 }, tag: "配茶以后突然有点英式" },
  { id: "ms_tea", name: "M&S茶包", place: ["M&S"], price: 4, effect: { sanity: 5, face: 3 }, tag: "你开始理解下午茶精神疗法" },
  { id: "ms_dinein", name: "M&S Dine In套餐", place: ["M&S"], price: 12, effect: { sanity: 10, face: 8, cash: -4 }, tag: "看似省钱，实则体面消费" },

  // Waitrose：中产观光
  { id: "waitrose_shortrib", name: "Short Rib", place: ["Waitrose"], price: 9, effect: { sanity: 10, face: 8, kitchen: 4, shoppingCount: 1 }, tag: "你开始假装自己很会生活" },
  { id: "waitrose_elderflower", name: "接骨木苹果汁", place: ["Waitrose"], price: 4, effect: { sanity: 6, face: 5 }, tag: "喝完感觉自己住在英剧里" },
  { id: "waitrose_berries", name: "Waitrose莓果", place: ["Waitrose"], price: 5, effect: { sanity: 6, face: 5 }, tag: "价格告诉你它来自中产世界" },
  { id: "waitrose_dessert", name: "Waitrose甜品", place: ["Waitrose"], price: 5, effect: { sanity: 7, face: 5 }, tag: "你只是想买点开心" },
];

const shops = ["跳过", "Tesco", "Boots", "中超", "二手群", "TK Maxx", "M&S", "Waitrose", "Amazon", "Primark"];

const mainEvents = [
  {
    title: "落地新手村",
    text: "你拖着箱子落地英国，手机电量 12%，Google Maps显示还要转两趟车。",
    choices: [
      { text: "先去宿舍放行李", type: "solo", effect: { action: -6, sanity: 6, info: 2 } },
      { text: "先买电话卡和生活用品", type: "info", effect: { cash: -35, action: -8, info: 8 } },
      { text: "先拍照发朋友圈报平安", type: "face", effect: { face: 10, sanity: 3, action: -3 } },
    ],
  },
  {
    title: "银行卡与地址证明",
    text: "银行、学校、宿舍系统拥有三个平行宇宙地址。你开始理解proof of address的威力。",
    choices: [
      { text: "自己硬刚系统", type: "info", effect: { action: -10, info: 8, sanity: -3 } },
      { text: "问学长学姐怎么弄", type: "social", effect: { social: -5, info: 10, sanity: 2 } },
      { text: "先放着，之后再说", type: "rest", effect: { action: 4, anxiety: 7 } },
    ],
  },
  {
    title: "Freshers Week 幻觉",
    text: "你加了12个society，感觉自己即将拥有丰富人生。",
    choices: [
      { text: "参加社交活动", type: "social", effect: { social: -12, face: 8, info: 5, cash: -25 } },
      { text: "躲在宿舍熟悉环境", type: "solo", effect: { sanity: 8, action: 3, social: -4 } },
      { text: "加满微信群/学联群/二手群", type: "info", effect: { info: 12, sanity: -4, anxiety: 4 } },
    ],
  },
  {
    title: "第一次 Lecture",
    text: "教授讲得很快，你的录播列表开始变得很长。",
    choices: [
      { text: "坚持去线下课", type: "study", effect: { study: 10, action: -7, sanity: -4 } },
      { text: "看录播，1.5倍速自救", type: "study", effect: { study: 7, action: -4, sanity: 2 } },
      { text: "先收藏资料，等状态好再学", type: "info", effect: { info: 5, study: -5, action: -3, anxiety: 8 } },
    ],
  },
  {
    title: "第一次 DDL",
    text: "你的桌面出现了final、final2、final_REAL三个文件。",
    choices: [
      { text: "提前三天开始写", type: "study", effect: { study: 13, action: -12, sanity: -7, anxiety: -3 } },
      { text: "找同学对答案/对数据", type: "social", effect: { study: 8, social: -7, info: 6 } },
      { text: "最后一晚极限爆肝", type: "study", achievement: "DDL 怨灵", effect: { study: 6, sanity: -15, action: -10, anxiety: 8 } },
    ],
  },
  {
    title: "吃饭系统解锁",
    text: "你看着银行卡余额，又看了看 Tesco 冷柜和外卖平台服务费。",
    choices: [
      { text: "Tesco Meal Deal续命", type: "save", effect: { cash: -4, sanity: 4, action: 3, mealDealCount: 1 } },
      { text: "去中超大采购", type: "chinesemarket", effect: { cash: -45, sanity: 12, info: 4 } },
      { text: "自己做一锅咖喱吃三天", type: "save", effect: { cash: 25, action: -8, sanity: -3, kitchen: 5, cookingCount: 1 } },
    ],
  },
  {
    title: "小组作业启动",
    text: "队友A很积极，队友B只会sounds good，队友C像传说人物。",
    choices: [
      { text: "主动当coordinator", type: "study", effect: { study: 12, action: -12, social: -10, anxiety: 3 } },
      { text: "只负责自己那部分", type: "study", effect: { study: 6, sanity: 2, face: -2 } },
      { text: "等大家先动", type: "rest", effect: { study: -8, sanity: -5, anxiety: 12 } },
    ],
  },
  {
    title: "Reading Week 人格测试",
    text: "名义上是自学周，实际上是人格测试。",
    choices: [
      { text: "补课整理笔记", type: "study", effect: { study: 15, action: -12, sanity: -5, anxiety: -4 } },
      { text: "去欧洲/伦敦玩", type: "travel", effect: { cash: -160, sanity: 15, face: 15, study: -5, shoppingCount: 1 } },
      { text: "每天说今天开始", type: "rest", effect: { sanity: 5, study: -10, anxiety: 14 } },
    ],
  },
  {
    title: "申根 / 欧洲 / 比斯特",
    text: "你开始在欧洲体验卡和比斯特经济学之间摇摆。",
    choices: [
      { text: "申根只给15天，也要去", type: "travel", achievement: "欧洲体验卡持有人", effect: { cash: -180, face: 16, sanity: 10, action: -8 } },
      { text: "去比斯特证明自己省钱", type: "shopping", achievement: "比斯特经济学家", effect: { cash: -250, face: 20, sanity: 10, anxiety: 4, shoppingCount: 1 } },
      { text: "留在宿舍回血", type: "solo", effect: { sanity: 10, face: -3, study: 5 } },
    ],
  },
  {
    title: "二手群大乱斗",
    text: "二手群里同时出现了 £15 显示器、换汇哥、刀客和毕业急出。英区黑市开门了。",
    choices: [
      { text: "蹲一个真大漏", type: "secondhand", effect: { cash: -20, action: -10, info: 6, secondHandWins: 1 } },
      { text: "研究Bank switch offer，试图薅羊毛", type: "save", effect: { cash: 50, info: 5, alertness: 4, anxiety: 5 } },
      { text: "退出群聊保平安", type: "solo", effect: { sanity: 6, action: 3, face: -2 } },
    ],
  },
  {
    title: "英区生活随机暴击",
    text: "Royal Mail、洗衣房、火警、暖气玄学开始轮流刷新。",
    choices: [
      { text: "该办的事今天全办了", type: "info", effect: { action: -12, info: 8, sanity: -4 } },
      { text: "能拖就拖", type: "rest", effect: { sanity: 5, anxiety: 6, action: 2 } },
      { text: "在群里问大家怎么处理", type: "social", effect: { info: 8, social: -4, sanity: 2 } },
    ],
  },
  {
    title: "前途焦虑启动",
    text: "你刷到别人已经拿Spring Week/Internship面试。",
    choices: [
      { text: "修改CV和LinkedIn", type: "career", achievement: "LinkedIn 炼金术士", effect: { face: 12, anxiety: 5, action: -7, info: 7 } },
      { text: "投几个internship试试水", type: "career", effect: { anxiety: 8, action: -9, info: 6 } },
      { text: "先不想，保命重要", type: "rest", effect: { sanity: 8, anxiety: -4, face: -3 } },
    ],
  },
  {
    title: "老师照读PPT",
    text: "你花了国际生学费，老师把slides念了一遍，然后说everything is on Canvas。",
    choices: [
      { text: "继续听，试图尊重学费", type: "study", effect: { study: 4, sanity: -6 } },
      { text: "回去看YouTube速成课", type: "study", effect: { study: 8, info: 4, sanity: 2 } },
      { text: "填课程反馈狠狠开麦", type: "info", effect: { action: -5, sanity: 5, info: 3 }, achievement: "Course Evaluation战士" },
    ],
  },
  {
    title: "Lecture Recording失踪",
    text: "你本来指望录播拯救人生，结果系统显示Recording unavailable。",
    choices: [
      { text: "问同学要笔记", type: "social", effect: { social: -5, info: 8, study: 5 } },
      { text: "去office hour问", type: "social", effect: { social: -8, study: 8, sanity: -4 } },
      { text: "去YouTube找印度老师", type: "study", effect: { study: 10, info: 4, sanity: 2 } },
    ],
  },
  {
    title: "GP预约地狱",
    text: "你想约GP，网站让你早上8点抢号。8点01分，系统告诉你今天没号了。",
    choices: [
      { text: "第二天继续抢", type: "info", effect: { action: -8, sanity: -5, info: 5 } },
      { text: "去Boots问药剂师", type: "info", effect: { cash: -5, action: 3, info: 4 } },
      { text: "先喝Lemsip顶着", type: "rest", effect: { action: 5, sanity: 2 } },
    ],
  },
  {
    title: "下学期租房焦虑",
    text: "群里突然开始讨论明年房子。你还没活明白这学期，已经要开始抢下一年的房了。",
    choices: [
      { text: "立刻找房", type: "info", effect: { info: 10, action: -10, anxiety: 8 } },
      { text: "找朋友合租", type: "social", effect: { social: -8, sanity: 5, info: 5 } },
      { text: "先等等", type: "rest", effect: { sanity: 4, anxiety: 5 } },
    ],
  },
  {
    title: "厨房政治学",
    text: "厨房水槽里出现了未知盘子。垃圾袋满了三天，群里没人承认。",
    choices: [
      { text: "主动清理", type: "rest", effect: { action: -6, sanity: -5, social: 3 } },
      { text: "在群里礼貌提醒", type: "social", effect: { social: -6, sanity: -2, info: 3 } },
      { text: "装作没看见", type: "solo", effect: { sanity: -4, action: 3 } },
    ],
  },
  {
    title: "洗衣房倒计时",
    text: "App显示还有1分钟。你冲到洗衣房，发现有人已经把你的衣服拿出来了。",
    choices: [
      { text: "忍了", type: "solo", effect: { sanity: -5, alertness: 3 } },
      { text: "在群里开麦", type: "social", effect: { social: -6, sanity: 3 } },
      { text: "以后定闹钟", type: "info", effect: { info: 4, action: -2 } },
    ],
  },
  {
    title: "QS排名之夜",
    text: "QS排名更新。学校涨了，朋友圈开始喜报；学校跌了，大家开始说排名不重要。与此同时，评论区排名警察开始出动。",
    choices: [
      { text: "学校涨了，立刻转发喜报", type: "face", effect: { face: 10, sanity: 4, anxiety: -2 }, achievement: "QS精神股东" },
      { text: "学校跌了，开始说排名不重要", type: "rest", effect: { sanity: -3, anxiety: 5, info: 3 } },
      { text: "查隔壁学校和美国top50排名", type: "melon", effect: { anxiety: 8, action: -4, info: 6, melonPollution: 1 } },
    ],
  },
  {
    title: "抖音评论区开庭",
    text: "你只是发了条留学日常，评论区突然开始判案：水硕、镀金、有钱就能去、回来也找不到工作。你看了两分钟，血压开始参与英区生活。",
    choices: [
      { text: "认真解释学校和专业", type: "melon", effect: { action: -8, sanity: -10, info: 3, melonPollution: 1 }, achievement: "不要和评论区讲道理" },
      { text: "直接删评论拉黑", type: "solo", effect: { sanity: 6, alertness: 5 } },
      { text: "发给朋友吐槽", type: "social", effect: { social: 4, sanity: 4, melonPollution: 1 } },
    ],
  },
  {
    title: "小红书留学样板间",
    text: "你刷到别人住studio、做brunch、拿offer、去瑞士滑雪。你看了看自己的速冻饺子，沉默了。",
    choices: [
      { text: "继续刷", type: "melon", effect: { info: 6, sanity: -8, anxiety: 8, melonPollution: 1 } },
      { text: "关掉软件", type: "solo", effect: { sanity: 5, action: 3 } },
      { text: "也发一条精选生活", type: "face", effect: { face: 12, sanity: 2 } },
    ],
  },
  {
    title: "课程群爆炸",
    text: "有人问这个作业怎么写，有人说别问了自己看rubric，有人开始阴阳怪气。课程群变成了小型社会实验。",
    choices: [
      { text: "潜水看戏", type: "melon", effect: { info: 4, melonPollution: 1, sanity: -2 } },
      { text: "发有用信息", type: "social", effect: { face: 5, social: -4, info: 3 } },
      { text: "退群保命", type: "solo", effect: { sanity: 5, info: -4 } },
    ],
  },
  {
    title: "留学圈学历斗兽场",
    text: "英本、美本、港硕、欧陆、澳洲八大开始互相比较。没有人真的关心学习，大家只想证明自己那条路线最值钱。",
    choices: [
      { text: "认真参与讨论", type: "melon", effect: { sanity: -8, action: -6, info: 5, melonPollution: 1 } },
      { text: "截图发给朋友看乐子", type: "social", effect: { social: 4, sanity: 2, melonPollution: 1 } },
      { text: "退出战场", type: "solo", effect: { sanity: 6, action: 2 } },
    ],
  },
  {
    title: "赛博瓜田污染",
    text: "群里开始流传爆料 PDF，评论区还有一群人复读恶臭黄谣黑话。",
    choices: [
      { text: "点开吃瓜PDF", type: "melon", effect: { info: 4, sanity: -6, action: -5, anxiety: 3, melonPollution: 1, pdfCount: 1 } },
      { text: "划走，不给垃圾内容流量", type: "solo", achievement: "赛博空气净化器", effect: { sanity: 5, action: 3, alertness: 4 } },
      { text: "发给朋友吐槽", type: "social", effect: { social: 4, sanity: 3, face: -2, melonPollution: 1, rumorCount: 1 } },
    ],
  },
  {
    title: "考试复习期",
    text: "你突然理解：考试不是考知识，是考考古。YouTube 速成课也开始变得眉清目秀。",
    choices: [
      { text: "刷题总结题型", type: "study", achievement: "考古型复习选手", effect: { study: 17, action: -14, sanity: -7 } },
      { text: "看YouTube上的速成课", type: "study", effect: { study: 10, sanity: 2, info: 3 } },
      { text: "先做完美复习计划", type: "face", effect: { face: 4, study: 1, anxiety: 10 } },
    ],
  },
  {
    title: "考试周",
    text: "咖啡因、公式表和玄学押题在你的桌面上形成生态系统。",
    choices: [
      { text: "稳住节奏，睡眠优先", type: "study", effect: { sanity: 10, study: 8, anxiety: -4 } },
      { text: "极限冲刺", type: "study", effect: { study: 14, sanity: -15, action: -10 } },
      { text: "约朋友吃饭回血", type: "social", effect: { sanity: 14, social: 8, cash: -30, study: 3 } },
    ],
  },
  {
    title: "寒假分叉",
    text: "回国、欧洲旅行、留英回血、伦敦跨年，你的钱包和精神状态都需要做选择。",
    choices: [
      { text: "回国回血", type: "rest", effect: { sanity: 18, cash: -120, anxiety: -5 } },
      { text: "欧洲特种兵旅行", type: "travel", effect: { face: 20, sanity: 8, cash: -260, action: -12, shoppingCount: 1 } },
      { text: "留英躺平修复", type: "solo", effect: { sanity: 12, action: 6, face: -4, cash: 20 } },
    ],
  },
  {
    title: "结算前夜",
    text: "你站在第一学期末，看着这几个月的雨水、DDL、二手群和赛博垃圾。",
    choices: [
      { text: "认真整理下学期计划", type: "study", effect: { study: 8, action: -5, anxiety: -5, face: 3 } },
      { text: "发一条精选朋友圈", type: "face", effect: { face: 15, sanity: 3, action: -3 } },
      { text: "什么都不干，好好睡一觉", type: "rest", effect: { sanity: 15, action: 8, anxiety: -3 } },
    ],
  },
];

const randomEvents = [
  {
    title: "TK Maxx淘宝藏",
    text: "你在混乱衣架里发现一件 Ralph Lauren，尺码居然能穿。",
    rarity: "medium",
    effect: { cash: -45, face: 15, sanity: 8, shoppingCount: 1 },
    achievement: "TK Maxx 淘金王",
  },
  {
    title: "二手群£15显示器大漏",
    text: "卖家说今晚必须自取，地点离你 47 分钟公交。",
    rarity: "medium",
    effect: { cash: -15, action: -12, study: 8, sanity: -3, secondHandWins: 1 },
    achievement: "大漏圣体",
  },
  {
    title: "二手群鸽子",
    text: "对方说on my way，三个小时后说今天不来了。",
    rarity: "small",
    effect: { action: -8, sanity: -6, secondHandGhosted: 1 },
    achievement: "鸽子饲养员",
  },
  {
    title: "比支付宝汇率好",
    text: "群里有人说：今天英镑现货，比支付宝汇率好，先款秒到，量大更优。",
    rarity: "danger",
    risk: "exchange",
  },
  {
    title: "手机飞升",
    text: "你在伦敦低头看导航，一辆电动车丝滑路过。",
    rarity: "danger",
    risk: "phone",
  },
  {
    title: "布莱顿海鸥审判",
    text: "你拿着薯条，天空突然安静。",
    rarity: "medium",
    effect: { sanity: -6, info: 6, face: 4 },
    achievement: "海鸥外交失败",
  },
  {
    title: "Turnitin 27%",
    text: "引用很规范，心跳不规范。",
    rarity: "medium",
    effect: { sanity: -8, study: 2, anxiety: 6 },
    achievement: "Turnitin 心跳挑战者",
  },
  {
    title: "教授说不会考",
    text: "全班松了一口气，但你感到一丝东方玄学危险。",
    rarity: "small",
    effect: { sanity: 6, anxiety: 4 },
  },
  {
    title: "油烟报警器Boss战",
    text: "你只是煎了个蛋，整栋楼都知道你会做饭了。",
    rarity: "medium",
    effect: { sanity: -6, kitchen: 5 },
    achievement: "厨房火警传说",
  },
  {
    title: "How are you礼仪陷阱",
    text: "你认真回答了 45 秒，对方只是路过。",
    rarity: "small",
    effect: { sanity: -3, info: 3 },
    achievement: "How Are You 认真答题者",
  },
  {
    title: "Sorry反射",
    text: "别人撞了你，你先说 sorry。",
    rarity: "small",
    effect: { face: 3, sorryCount: 1 },
  },
  {
    title: "Boots 3 for 2 陷阱",
    text: "为了省钱，你买了三个本来不需要的东西。",
    rarity: "small",
    effect: { cash: -22, sanity: 6, info: 2 },
    achievement: "Boots药剂师",
  },
  {
    title: "Waitrose误入",
    text: "你只是想买牛奶，却接受了一次英国中产价格教育。",
    rarity: "small",
    effect: { cash: -12, face: 4, anxiety: 3 },
    achievement: "Waitrose观光客",
  },
  {
    title: "Ryanair 行李审判",
    text: "你的背包看起来比规定大 0.5 厘米。",
    rarity: "medium",
    effect: { action: -6, sanity: -4, face: -3 },
    achievement: "廉航特种兵",
  },
  {
    title: "Unfortunately 开头",
    text: "邮件第一句已经剧透。",
    rarity: "medium",
    effect: { sanity: -7, anxiety: 6, rejectionCount: 1 },
  },
  {
    title: "Career Fair灵魂一问",
    text: "你排队 20 分钟，最后问出：Do you sponsor visa?",
    rarity: "medium",
    effect: { info: 8, anxiety: 8, face: 4 },
  },
  {
    title: "Royal Mail二次暴击",
    text: "你第二次被系统判定为“不在家”。",
    rarity: "medium",
    effect: { sanity: -7, royalMailRage: 1 },
    achievement: "量子在家",
  },
  {
    title: "申根体验卡",
    text: "材料厚得像毕业论文，签证短得像试玩版。",
    rarity: "medium",
    effect: { cash: -120, face: 12, sanity: 6 },
    achievement: "欧洲体验卡持有人",
  },
  {
    title: "伦敦房租教育",
    text: "你以为看到的是月租，结果发现是周租。",
    rarity: "small",
    effect: { sanity: -8, anxiety: 8, info: 5 },
  },
  {
    title: "瓜田 PDF 流出",
    text: "群里突然流传出一份 38 页爆料 PDF，标题像论文，内容像厕所隔间录音整理。",
    rarity: "medium",
    effect: { info: 5, sanity: -7, action: -5, melonPollution: 1, pdfCount: 1 },
    achievement: "PDF 瓜田考古学家",
  },
  {
    title: "留学区造谣机",
    text: "某主播又开始锐评女留学生，标题像掌握了世界真相，内容像从incel群聊里腌出来的。",
    rarity: "medium",
    effect: { sanity: -7, action: -4, anxiety: 4, melonPollution: 1, rumorCount: 1 },
    achievement: "瓜田观察员",
  },
  {
    title: "评论区复读机",
    text: "你刷到一个女留子的正常生活视频，评论区却混进一群人复读下流黑话。",
    rarity: "medium",
    effect: { sanity: -6, action: -3, alertness: 5, melonPollution: 1 },
    achievement: "不要和粪坑辩论",
  },
  {
    title: "代写中介私聊",
    text: "你刚进资源群，就有人问你：essay/report/lab 都能做，保证原创，Turnitin 可控。",
    rarity: "medium",
    effect: { info: 5, alertness: 8, sanity: 2 },
    achievement: "学术诚信守门员",
  },
  {
    title: "二手打印机经济学",
    text: "你£10买了台打印机，第二天发现墨盒£38。",
    rarity: "small",
    effect: { cash: -10, sanity: -5, info: 8 },
    achievement: "打印机经济学受害者",
  },
  {
    title: "老师照读PPT",
    text: "这节lecture的核心内容是：老师把slides上的字念了一遍，并在最后说everything is on Canvas。",
    rarity: "small",
    effect: { study: -3, sanity: -5, anxiety: 4 },
    achievement: "Canvas自学选手",
  },
  {
    title: "Office Hour玄学",
    text: "你准备了五个问题，进去之后只问出一句：Could you explain this part again?",
    rarity: "small",
    effect: { info: 5, study: 4, social: -4, sanity: -3 },
    achievement: "Office Hour社恐挑战者",
  },
  {
    title: "老师说自己看书",
    text: "你问这个知识点怎么理解，老师慈祥地说：I recommend have a look at the Canvas。",
    rarity: "small",
    effect: { study: 2, sanity: -6, info: 4 },
  },
  {
    title: "QS排名上涨",
    text: "学校QS排名涨了。朋友圈校友开始转发，仿佛你的均分也一起涨了。",
    rarity: "small",
    effect: { face: 8, sanity: 3, anxiety: -2 },
    achievement: "QS精神股东",
  },
  {
    title: "QS排名下跌",
    text: "学校QS排名跌了。你嘴上说排名不重要，手已经开始查隔壁学校。",
    rarity: "small",
    effect: { face: -5, anxiety: 6, info: 3 },
  },
  {
    title: "村驴老师做饭救命",
    text: "你点开村驴老师的视频，终于解锁了小绿锅完全体。",
    rarity: "small",
    effect: { kitchen: 8, sanity: 8, cash: 12, cookingCount: 1 },
    achievement: "村驴门徒",
  },
  {
    title: "外卖平台服务费刺客",
    text: "菜£11.99，结账£19.47。你开始理解资本主义的层层封装。",
    rarity: "small",
    effect: { cash: -20, sanity: 6, anxiety: 3 },
  },
  {
    title: "学长学姐资源群",
    text: "群里有资料、有避雷、有二手信息，也有代写中介和不知道真假的瓜。",
    rarity: "medium",
    effect: { info: 10, social: -3, melonPollution: 1 },
  },
  {
    title: "二手群刀客",
    text: "你£20出空气炸锅，对方问：£5可以送到我楼下吗？",
    rarity: "small",
    effect: { sanity: -4, social: -4, alertness: 3 },
    achievement: "二手群血压挑战者",
  },
  {
    title: "宿舍暖气玄学",
    text: "暖气不是太冷就是太热，中间态不存在。你开始怀疑它是不是英国哲学的一部分。",
    rarity: "small",
    effect: { sanity: -4, action: -2 },
  },
  {
    title: "美本排名警察",
    text: "你只是说了句牛剑挺好，旁边有人立刻开始科普：其实美国top50综合体验更强。你第一次见到排名鄙视链可以精确到呼吸。",
    rarity: "small",
    effect: { sanity: -4, anxiety: 3, info: 3, melonPollution: 1 },
    achievement: "排名鄙视链受害者",
  },
  {
    title: "牛剑不如top50争论",
    text: "群里有人说牛剑也就那样，不如美国top50。你看了一眼发言记录，发现他已经把世界大学排名当成了人生主线任务。",
    rarity: "medium",
    effect: { sanity: -6, action: -3, melonPollution: 1, info: 4 },
    achievement: "排名嘴炮观察员",
  },
  {
    title: "水硕警察出动",
    text: "你发了一条日常，评论区有人开始鉴定学历含水量。你明明没提学历，他已经替你开庭。",
    rarity: "medium",
    effect: { sanity: -8, melonPollution: 1, alertness: 4 },
    achievement: "水硕警察受害者",
  },
  {
    title: "家里亲戚转发短视频",
    text: "标题是留学生回国就业真相。你妈问你怎么看，你开始思考怎么用一句话结束这场家庭会议。",
    rarity: "small",
    effect: { anxiety: 8, sanity: -5, face: -2 },
  },
  {
    title: "Seminar沉默局",
    text: "tutor问any thoughts，整个教室进入静音模式。你听见了英国教育体系的回声。",
    rarity: "small",
    effect: { study: 2, social: -4, sanity: -3 },
  },
  {
    title: "Feedback像谜语",
    text: "tutor给你写了good attempt，但分数像bad attempt。",
    rarity: "medium",
    effect: { study: 3, sanity: -8, anxiety: 5 },
    achievement: "Feedback解码失败",
  },
  {
    title: "Rubric玄学",
    text: "你逐字阅读rubric，仍然不知道它到底想要什么。",
    rarity: "small",
    effect: { info: 3, sanity: -5, anxiety: 3 },
  },
  {
    title: "村驴老师做饭救命",
    text: "你看完村驴老师的视频学会一道菜，突然觉得自己在英国能活。",
    rarity: "small",
    effect: { kitchen: 8, sanity: 8, cash: 10, cookingCount: 1 },
    achievement: "村驴门徒",
  },
  {
    title: "玛莎葡萄上头",
    text: "你本来不信网红零食，直到你买了第二盒。",
    rarity: "small",
    effect: { cash: -6, sanity: 8, face: 5, shoppingCount: 1 },
  },
  {
    title: "Evri玄学派送",
    text: "包裹显示delivered，你和门口都没有见过它。",
    rarity: "medium",
    effect: { sanity: -8, royalMailRage: 1, alertness: 4 },
  },
  {
    title: "英国水垢震撼",
    text: "水壶底部出现白色遗迹。你第一次理解英国水质也能参与生活叙事。",
    rarity: "small",
    effect: { info: 4, sanity: -2 },
  },
  {
    title: "霉菌黑点",
    text: "窗边出现了英国特色生态系统。你开始研究除霉喷雾。",
    rarity: "small",
    effect: { sanity: -6, action: -4, info: 5 },
  },
  {
    title: "二手群回血成功",
    text: "你把一个闲置小电器挂到二手群，居然没有被刀，也没有被鸽。",
    rarity: "small",
    effect: { cash: 35, sanity: 5, secondHandWins: 1 },
    achievement: "二手群回血选手",
  },
  {
    title: "Bank Switch Offer到账",
    text: "你按攻略切了银行，几周后奖励到账。英国银行终于不是只会发验证邮件了。",
    rarity: "medium",
    effect: { cash: 120, sanity: 8, info: 5 },
    achievement: "英区薅羊毛大师",
  },
  {
    title: "退款奇迹",
    text: "你本来已经放弃了，结果某个平台突然退款成功。钱不多，但像天降正义。",
    rarity: "small",
    effect: { cash: 30, sanity: 6 },
  },
  {
    title: "朋友请饭",
    text: "朋友说今天他请。你表面客气，内心已经恢复了半管血。",
    rarity: "small",
    effect: { cash: 20, sanity: 8, social: 4 },
  },
  {
    title: "黄标区大胜利",
    text: "你在超市黄标区精准出手，买到了今晚和明天的快乐。",
    rarity: "small",
    effect: { cash: 18, sanity: 5, info: 3 },
    achievement: "黄标区猎人",
  },
  {
    title: "学校小奖学金到账",
    text: "一笔你几乎忘了申请过的小奖学金突然到账，你第一次觉得学校系统也能做人。",
    rarity: "medium",
    effect: { cash: 180, sanity: 10, anxiety: -5 },
    achievement: "奖学金捡漏王",
  },
];

function addAchievement(state, achievement) {
  if (!achievement) return state;
  if (state.achievements.includes(achievement)) return state;
  return { ...state, achievements: [...state.achievements, achievement] };
}

function applyEffect(state, effect = {}, character = null, type = "") {
  let next = { ...state };
  let mod = { ...effect };

  if (character?.id === "academic" && type === "study") {
    mod.study = (mod.study || 0) + 3;
    mod.sanity = (mod.sanity || 0) - 2;
  }
  if (character?.id === "freshers" && type === "social") {
    mod.info = (mod.info || 0) + 3;
    mod.face = (mod.face || 0) + 3;
    mod.cash = (mod.cash || 0) - 8;
  }
  if (character?.id === "introvert" && type === "social") {
    mod.social = (mod.social || 0) - 5;
  }
  if (character?.id === "introvert" && (type === "solo" || type === "rest")) {
    mod.sanity = (mod.sanity || 0) + 3;
  }
  if (character?.id === "chinesemarket" && (type === "chinesemarket" || type === "save")) {
    mod.sanity = (mod.sanity || 0) + 5;
  }
  if (character?.id === "chinesemarket" && type === "chinesemarket") {
    mod.cash = (mod.cash || 0) - 10;
  }
  if (character?.id === "minimal" && (type === "save" || type === "secondhand")) {
    mod.cash = (mod.cash || 0) + 10;
  }
  if (character?.id === "face" && ["face", "travel", "shopping", "career"].includes(type)) {
    mod.face = (mod.face || 0) + 5;
  }
  if (character?.id === "face" && (mod.cash || 0) <= -100) {
    mod.anxiety = (mod.anxiety || 0) + 4;
  }
  if (character?.id === "londonaware" && ["travel", "shopping"].includes(type)) {
    mod.sanity = (mod.sanity || 0) - 3;
  }
  if (character?.id === "redbook" && ["info", "career", "melon"].includes(type)) {
    mod.anxiety = (mod.anxiety || 0) + 3;
  }

  Object.entries(mod).forEach(([key, value]) => {
    if (key === "cash") next.cash = Math.max(0, next.cash + value);
    else if (key === "achievements" || key === "items" || key === "log") return;
    else if (["alertness", "kitchen", "melonPollution", "rejectionCount", "royalMailRage", "secondHandWins", "secondHandGhosted", "secondHandScams", "mealDealCount", "cookingCount", "shoppingCount", "pdfCount", "rumorCount", "sorryCount", "weeklyCostMod"].includes(key)) {
      next[key] = Math.max(0, (next[key] || 0) + value);
    } else {
      next[key] = clamp((next[key] || 0) + value);
    }
  });

  return next;
}

function effectText(effect = {}) {
  const parts = [];
  Object.entries(effect).forEach(([k, v]) => {
    if (["alertness", "kitchen", "melonPollution", "mealDealCount", "cookingCount", "shoppingCount", "pdfCount", "rumorCount", "weeklyCostMod"].includes(k)) return;
    const label = statLabels[k];
    if (!label) return;
    if (k === "cash") parts.push(`${label} ${v > 0 ? "+" : ""}${money(v)}`);
    else parts.push(`${label} ${v > 0 ? "+" : ""}${v}`);
  });
  return parts.join(" · ");
}

function runRiskEvent(state, event, character) {
  let next = { ...state };
  let text = "";
  let achievement = null;

  if (event.risk === "exchange") {
    let risk = 0.65 - next.info / 220 - next.alertness / 180;
    if (character?.id === "londonaware") risk -= 0.2;
    risk = Math.max(0.08, risk);

    if (chance(risk)) {
      next = applyEffect(next, {
        cash: -300,
        sanity: -30,
        alertness: 20,
        secondHandScams: 1,
      });
      achievement = "诈骗案例本人";
      text = "你相信了“比支付宝汇率好”。钱没了，但警觉性拉满。";
    } else {
      next = applyEffect(next, {
        info: 8,
        alertness: 8,
        sanity: 2,
      });
      achievement = "高汇率诱捕器";
      text = "你识破了高汇率诱饵。少赚一点没关系，没被骗就是赚。";
    }
  }

  if (event.risk === "phone") {
    const hasCord = next.items.includes("防盗手机绳");

    let risk = 0.4 - next.alertness / 180 - next.info / 260;
    if (character?.id === "londonaware") risk -= 0.2;
    if (hasCord) risk -= 0.35;
    risk = Math.max(0.03, risk);

    if (chance(risk)) {
      next = applyEffect(next, {
        cash: -250,
        sanity: -25,
        alertness: 30,
      });
      achievement = "伦敦低头族受害者";
      text = "手机飞升。你失去了一部手机，获得了永久警觉。";
    } else {
      next = applyEffect(next, {
        alertness: 8,
        sanity: 2,
      });
      achievement = hasCord ? "手机绳真香" : null;
      text = hasCord
        ? "防盗手机绳保住了手机。丑，但真的有用。"
        : "你及时把手机收了起来。伦敦没有放过你，但这次你躲过了。";
    }
  }

  next = addAchievement(next, achievement);

  return { next, result: text, achievement };
}


function chooseRandomEvent(state, contextType = "") {
  let roll = Math.random();
  let pool = randomEvents;

  if (contextType === "secondhand") {
    pool = randomEvents.filter((e) => e.title.includes("二手") || e.title.includes("换汇") || e.title.includes("打印机"));
  }

  if (contextType === "travel") {
    pool = randomEvents.filter((e) => ["手机飞升", "布莱顿海鸥审判", "Ryanair 行李审判", "申根体验卡"].includes(e.title));
  }

  if (contextType === "melon") {
    pool = randomEvents.filter((e) => e.title.includes("瓜") || e.title.includes("造谣") || e.title.includes("评论区"));
  }

  if (!pool.length) pool = randomEvents;

  const noEventChance = ["secondhand", "travel", "melon", "career"].includes(contextType) ? 0.12 : 0.22;
  if (roll < noEventChance) return null;

  const danger = pool.filter((e) => e.rarity === "danger");
  const medium = pool.filter((e) => e.rarity === "medium");
  const small = pool.filter((e) => e.rarity === "small");

  if (roll > 0.94 && danger.length) return pick(danger);
  if (roll > 0.62 && medium.length) return pick(medium);
  return pick(small.length ? small : pool);
}

function getShopItems(place) {
  if (place === "跳过") return [];

  if (place === "TK Maxx") {
    return [
      { id: "rl", name: "Ralph Lauren大漏", place: ["TK Maxx"], price: 45, effect: { face: 15, sanity: 8, shoppingCount: 1 }, tag: "翻久了真的会出现" },
      { id: "candle", name: "神秘香薰", place: ["TK Maxx"], price: 12, effect: { face: 5, sanity: 4 }, tag: "你本来不需要，但它闻起来很体面" },
      { id: "homeware", name: "打折锅具/餐具", place: ["TK Maxx"], price: 18, effect: { kitchen: 4, sanity: 2 }, tag: "你本来只是想看看衣服" },
      { id: "tk_socks", name: "奇怪但便宜的袜子", place: ["TK Maxx"], price: 8, effect: { sanity: 3, face: 2 }, tag: "便宜是真的，审美另说" },
      { id: "tk_mug", name: "过度可爱的马克杯", place: ["TK Maxx"], price: 6, effect: { sanity: 4, face: 3 }, tag: "宿舍体面值+1" },
    ];
  }

  const list = shopItems.filter((item) => item.place.includes(place));

  if (place === "二手群") {
    return [...list].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  return list.slice(0, 6);
}
function getEnding(state) {
  if (state.cash <= 20) return { title: "余额保卫战失败", rank: "C", text: "你终于理解了为什么 Meal Deal 是英区留子的基础设施。" };
  if (state.sanity < 25) return { title: "稳定地不稳定", rank: "C", text: "你没有崩溃，你只是以一种很稳定的方式不稳定着。" };
  if (state.study < 45) return { title: "补考边缘人", rank: "C", text: "你和 pass 之间，只隔着一次玄学 marking。" };
  if (state.anxiety >= 90) return { title: "前途焦虑完全体", rank: "C", text: "你还没毕业，但已经同时焦虑了三种人生路线。" };
  if (state.secondHandScams > 0) return { title: "诈骗案例本人", rank: "C", text: "你用一笔钱，买到了英区生活第一课。" };
  if (state.melonPollution >= 5 && state.sanity <= 45) return { title: "赛博瓜田受害者", rank: "B", text: "你本来只是想看看留学生活，结果被爆料 PDF、造谣主播和评论区复读机联合上了一课：互联网不是信息高速路，是情绪化粪池。" };
  if (state.study >= 80 && state.sanity >= 40) return { title: "一等学位预备役", rank: "S", text: "你真的学了，而且还活着。" };
  if (state.study >= 70 && state.action >= 55 && state.anxiety <= 65) return { title: "英区时间管理大师", rank: "A", text: "你居然没有把所有事情拖到最后一晚，这在留子界已经算超能力。" };
  if (state.achievements.includes("比斯特经济学家") && (state.cash <= 220 || state.face >= 70)) return { title: "比斯特经济学家", rank: "B", text: "你花 £500 证明自己省了 £1200。" };
  if (state.secondHandWins >= 2) return { title: "英区垃圾佬", rank: "A", text: "你的宿舍看起来像样板间，来源全是“毕业急出，今晚自取”。" };
  if (state.face >= 80 && state.sanity <= 50) return { title: "朋友圈留学样板间", rank: "B", text: "别人以为你在欧洲岁月静好，其实你在厨房吃第四天咖喱。" };
  if (state.rejectionCount >= 3) return { title: "拒信收藏家", rank: "B", text: "Unfortunately 已经成为你的英语启蒙读物。" };
  if (state.face >= 75 && state.anxiety >= 70) return { title: "LinkedIn 体面大师", rank: "B", text: "你的 profile 很亮，但 inbox 很安静。" };
  if (state.mealDealCount >= 3 && state.cash <= 180) return { title: "Meal Deal 资本主义囚徒", rank: "B", text: "你被 £3.90 的快乐长期收编。" };
  if (state.melonPollution <= 1 && state.sanity >= 60 && state.alertness >= 35) return { title: "互联网免疫者", rank: "A", text: "你练成了稀有技能：看见赛博垃圾，不捡，不闻，不转发。" };
  return { title: "普通但真实的留子", rank: "B", text: "你没有成为传说，但你撑过来了。这已经很厉害。" };
}

function getPersonaTags(state) {
  const candidates = [
    [state.study >= 75, "学术求生者"],
    [state.mealDealCount >= 2, "Meal Deal 研究员"],
    [state.cookingCount >= 2 || state.items.includes("速冻饺子"), "冷冻饺子守护者"],
    [state.secondHandWins >= 1, "二手群大漏圣体"],
    [state.secondHandGhosted >= 1, "鸽子饲养员"],
    [state.face >= 70, "朋友圈样板间"],
    [state.anxiety >= 70, "LinkedIn 中毒患者"],
    [state.royalMailRage >= 1, "Royal Mail 量子态居民"],
    [state.melonPollution >= 2, "赛博瓜田受害者"],
    [state.alertness >= 50, "英区警觉性进化者"],
    [state.cash <= 150, "余额保卫战选手"],
    [state.shoppingCount >= 2, "消费主义幸存者"],
    [state.sorryCount >= 2, "Sorry 反射完全体"],
    [state.info >= 75 && state.action <= 40, "攻略收藏型人格"],
  ];

  const tags = candidates.filter(([ok]) => ok).map(([, tag]) => tag);
  while (tags.length < 3) tags.push(pick(["普通但真实", "英区随机事件受害者", "精神状态维修中", "雨天适应者"]));
  return tags.slice(0, 3);
}

const SAVE_KEY = "liuzi-simulator-save-v1";
function App() {
  const savedGame = (() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [screen, setScreen] = useState(savedGame?.screen || "start");
  const [character, setCharacter] = useState(savedGame?.character || null);
  const [trait, setTrait] = useState(savedGame?.trait || null);
  const [state, setState] = useState(savedGame?.state || baseState);
  const [phase, setPhase] = useState(savedGame?.phase || "event");
  const [lastResult, setLastResult] = useState(savedGame?.lastResult || null);
  const [selectedShop, setSelectedShop] = useState(savedGame?.selectedShop || "Tesco");
  const [titleClicks, setTitleClicks] = useState(savedGame?.titleClicks || 0);
  const [creditHint, setCreditHint] = useState(savedGame?.creditHint || "");
  const [lastContext, setLastContext] = useState(savedGame?.lastContext || "");

  useEffect(() => {
    const saveData = {
      screen,
      character,
      trait,
      state,
      phase,
      lastResult,
      selectedShop,
      titleClicks,
      creditHint,
      lastContext,
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  }, [
    screen,
    character,
    trait,
    state,
    phase,
    lastResult,
    selectedShop,
    titleClicks,
    creditHint,
    lastContext,
  ]);

  const finished = state.week > mainEvents.length;
  const currentEvent = finished ? null : mainEvents[state.week - 1];
  const ending = useMemo(() => (finished ? getEnding(state) : null), [finished, state]);
  const tags = useMemo(() => (finished ? getPersonaTags(state) : []), [finished, state]);

  function startGame(ch) {
    const t = pick(traits);
    let next = {
      ...baseState,
      ...ch.stats,
      achievements: [],
      items: [ch.item],
      log: [],
    };
    next = applyEffect(next, t.effect);
    if (t.items) next.items = [...next.items, ...t.items];

    setCharacter(ch);
    setTrait(t);
    setState(next);
    setLastResult({
      title: `开局：${ch.name}`,
      text: `随机标签：${t.name}。${t.text}`,
      changes: "",
    });
    setScreen("game");
    setPhase("event");
  }

  function handleChoice(choice) {
    let next = { ...state };

    const weeklyCost = Math.max(18, 32 + (next.weeklyCostMod || 0));
    next.cash = Math.max(0, next.cash - weeklyCost);

    next = applyEffect(next, choice.effect, character, choice.type);
    next = addAchievement(next, choice.achievement);

    const logEntry = {
      week: state.week,
      title: currentEvent.title,
      action: choice.text,
      result: effectText(choice.effect),
    };

    next.log = [logEntry, ...next.log].slice(0, 8);

    setState(next);
    setLastResult({
      title: currentEvent.title,
      text: `你选择了：${choice.text}。本周基础生活费 ${money(weeklyCost)}。`,
      changes: effectText(choice.effect),
    });
    setLastContext(choice.type);
    setPhase("shop");
  }

  function buyItem(item) {
    if (state.cash < item.price) {
      setLastResult({ title: "余额不足", text: "你想买，但钱包说不行。", changes: "" });
      return;
    }

    let next = { ...state };
    next.cash -= item.price;
    next = applyEffect(next, item.effect || {}, character, "shopping");

    if (!next.items.includes(item.name)) next.items = [...next.items, item.name];

    const achievement = item.name.includes("Ralph") ? "TK Maxx 淘金王" : null;
    next = addAchievement(next, achievement);

    next.log = [
      { week: state.week, title: "补给阶段", action: `购买：${item.name}`, result: item.tag },
      ...next.log,
    ].slice(0, 8);

    setState(next);
    setLastResult({
      title: `买到了：${item.name}`,
      text: item.tag,
      changes: effectText({ cash: -item.price, ...(item.effect || {}) }),
    });
  }

  function finishWeek() {
    let next = { ...state };
    const event = chooseRandomEvent(next, lastContext);

    if (event) {
      if (event.risk) {
        const riskResult = runRiskEvent(next, event, character);
        next = riskResult.next;
        next.log = [
          { week: state.week, title: event.title, action: "随机事件", result: riskResult.result },
          ...next.log,
        ].slice(0, 8);
        setLastResult({
          title: event.title,
          text: `${event.text} ${riskResult.result}`,
          changes: "",
        });
      } else {
        next = applyEffect(next, event.effect || {});
        next = addAchievement(next, event.achievement);
        next.log = [
          { week: state.week, title: event.title, action: "随机事件", result: effectText(event.effect) },
          ...next.log,
        ].slice(0, 8);
        setLastResult({
          title: event.title,
          text: event.text,
          changes: effectText(event.effect),
        });
      }
    } else {
      setLastResult({
        title: "本周无大事发生",
        text: "英国生活短暂放过了你。",
        changes: "",
      });
    }

    if (next.sorryCount >= 3) next = addAchievement(next, "Sorry 反射完全体");
    if (next.mealDealCount >= 3) next = addAchievement(next, "Meal Deal 哲学家");
    if (next.rejectionCount >= 3) next = addAchievement(next, "拒信收藏家");
    if (next.royalMailRage >= 2) next = addAchievement(next, "Royal Mail 量子态居民");
    if (next.secondHandGhosted >= 2) next = addAchievement(next, "鸽子饲养员");

    next.week += 1;
    setState(next);
    setPhase("event");
    setSelectedShop("Tesco");
  }
  function handleCreditClick() {
    const nextClicks = titleClicks + 1;
    setTitleClicks(nextClicks);

    if (nextClicks < 5) {
      setCreditHint(`点到了什么🤔：${nextClicks}/5`);
      return;
    }

    if (nextClicks === 5) {
      setCreditHint("隐藏彩蛋触发：作者Sergey Meng出现了。精神状态+6，体面值+3");

      let next = applyEffect(state, { sanity: 6, face: 3 });
      next = addAchievement(next, "发现作者彩蛋");
      setState(next);

      setLastResult({
        title: "隐藏彩蛋触发",
        text: "你连续点击署名，召唤出了作者Sergey Meng。精神状态+6，体面值+3。",
        changes: "精神状态 +6 · 体面值 +3",
      });
    }

    if (nextClicks > 5) {
      setCreditHint("别点了别点了，作者在final周做出来了这个，精神状态确实不太美好。");
    }
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY);

    setScreen("start");
    setCharacter(null);
    setTrait(null);
    setState(baseState);
    setPhase("event");
    setLastResult(null);
    setSelectedShop("Tesco");
    setTitleClicks(0);
    setCreditHint("");
    setLastContext("");
  }


  if (screen === "start") {
    return (
      <main className="page">
        <Analytics />
        <section className="hero">
          <h1>英区留子随机事件模拟器</h1>
          <p>你只是想读个书，英国生活却开始随机出题。</p>
          <div className="credit-wrap">
            <button className="credit credit-button" onClick={handleCreditClick}>
              Made by Sergey Meng
            </button>
            {creditHint && <span className="credit-hint">{creditHint}</span>}
          </div>
        </section>

        <section className="panel">
          <h2>选择你的开局人设</h2>
          <div className="character-grid">
            {characters.map((ch) => (
              <button className="character-card" key={ch.id} onClick={() => startGame(ch)}>
                <h3>{ch.name}</h3>
                <p>{ch.desc}</p>
                <small>开局道具：{ch.item}</small>
                <small>{ch.passive}</small>
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="page">
        <Analytics />
        <section className="ending-card">
          <div className="rank">结局 {ending.rank}</div>
          <h1>{ending.title}</h1>
          <p>{ending.text}</p>

          <div className="portrait">
            <h3>你的留子画像</h3>
            <div className="tag-row">
              {tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </div>

          <div className="final-stats">
            {Object.entries(statLabels).map(([key, label]) => (
              <div key={key}>
                <span>{label}</span>
                <b>{key === "cash" ? money(state[key]) : state[key]}</b>
              </div>
            ))}
          </div>

          <div className="achievements">
            <h3>获得成就</h3>
            {state.achievements.length ? (
              <div className="tag-row">{state.achievements.map((a) => <span className="tag" key={a}>{a}</span>)}</div>
            ) : (
              <p>没有特别成就，但能活下来已经很强。</p>
            )}
          </div>
          <p className="easter-egg">
            彩蛋：如果你在英区随机事件里活下来了，请给作者Sergey加一点精神状态。
          </p>
          <button className="primary" onClick={reset}>再来一局</button>
        </section>
      </main>
    );
  }

  return (
    <main className="game">
      <section className="main-col">
        <div className="topbar">
          <div>
            <div className="pill">第 {state.week} / {mainEvents.length} 周</div>
            <h1 onClick={handleCreditClick} className="clickable-title">
              {currentEvent.title}
            </h1>
          </div>
          <button className="ghost" onClick={reset}>重开</button>
        </div>

        {lastResult && (
          <div className="result-card">
            <b>{lastResult.title}</b>
            <p>{lastResult.text}</p>
            {lastResult.changes && <small>{lastResult.changes}</small>}
          </div>
        )}

        {phase === "event" && (
          <section className="event-card">
            <p className="event-text">{currentEvent.text}</p>
            <div className="choice-list">
              {currentEvent.choices.map((choice) => (
                <button key={choice.text} className="choice" onClick={() => handleChoice(choice)}>
                  <span>{choice.text}</span>
                  <small>{effectText(choice.effect) || "隐藏影响"}</small>
                </button>
              ))}
            </div>
          </section>
        )}

        {phase === "shop" && (
          <section className="event-card">
            <h2>补给阶段</h2>
            <p className="event-text">本周补给。可以买实用道具，也可以买一点情绪价值。英区生活不只看余额，也看你在哪个超市破防。</p>
            <div className="shop-tabs">
              {shops.map((s) => (
                <button
                  key={s}
                  className={selectedShop === s ? "tab active" : "tab"}
                  onClick={() => {
                    if (s === "跳过") {
                      finishWeek();
                    } else {
                      setSelectedShop(s);
                    }
                  }}
                >
                  {s === "跳过" ? "跳过补给" : s}
                </button>
              ))}
            </div>

            {selectedShop === "跳过" ? (
              <button className="primary" onClick={finishWeek}>跳过购物，进入下周</button>
            ) : (
              <>
                <div className="item-grid">
                  {getShopItems(selectedShop).map((item) => (
                    <button key={item.id} className="item-card" onClick={() => buyItem(item)}>
                      <h3>{item.name}</h3>
                      <p>{item.tag}</p>
                      <small>{money(item.price)} · {effectText(item.effect)}</small>
                    </button>
                  ))}
                </div>
                <button className="primary" onClick={finishWeek}>结束本周</button>
              </>
            )}
          </section>
        )}
      </section>

      <aside className="side-col">
        <section className="side-card">
          <h3>{character.name}</h3>
          <p>{character.desc}</p>
          <small>随机标签：{trait.name}</small>
        </section>

        <section className="side-card">
          <h3>当前状态</h3>
          {Object.entries(statLabels).map(([key, label]) => (
            <div className="stat" key={key}>
              <div className="stat-head">
                <span>{label}</span>
                <b>{key === "cash" ? money(state[key]) : state[key]}</b>
              </div>
              {key !== "cash" && (
                <div className="bar">
                  <div
                    className={key === "anxiety" ? "fill danger" : "fill"}
                    style={{ width: `${clamp(state[key])}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="side-card">
          <h3>道具</h3>
          <div className="tag-row">
            {state.items.map((item) => <span className="tag" key={item}>{item}</span>)}
          </div>
        </section>

        <section className="side-card">
          <h3>成就</h3>
          {state.achievements.length ? (
            <div className="tag-row">
              {state.achievements.slice(-8).map((a) => <span className="tag" key={a}>{a}</span>)}
            </div>
          ) : (
            <p>暂无。英国生活还在加载。</p>
          )}
        </section>

        <section className="side-card">
          <h3>最近记录</h3>
          <div className="log-list">
            {state.log.map((l, i) => (
              <div className="log" key={i}>
                <b>第 {l.week} 周 · {l.title}</b>
                <span>{l.action}</span>
                <small>{l.result}</small>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </main>
  );

}
export default App;