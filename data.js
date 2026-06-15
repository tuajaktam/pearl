// ข้อมูลคำศัพท์ภาษาจีน N1 (เทอม 3 สัปดาห์ 2-7) — รูปภาพดึงมาจากไฟล์ PowerPoint
const CATEGORIES = [
  { id: "all",       zh: "全部",   pinyin: "quánbù",   th: "ทั้งหมด",     emoji: "🌈", color: "#ff8fab" },
  { id: "nature",    zh: "大自然", pinyin: "dà zìrán", th: "ธรรมชาติ",   emoji: "🌤️", color: "#5cc8e8" },
  { id: "plants",    zh: "植物",   pinyin: "zhíwù",    th: "พืช",         emoji: "🌳", color: "#7bc96f" },
  { id: "transport", zh: "交通",   pinyin: "jiāotōng", th: "ยานพาหนะ",   emoji: "🚗", color: "#ffb74d" },
];

const WORDS = [
  // 🌤️ ธรรมชาติ
  { id: "star",     cat: "nature",    zh: "星星", pinyin: "xīng xing", th: "ดาว",          emoji: "⭐", img: "assets/img/star.png" },
  { id: "moon",     cat: "nature",    zh: "月亮", pinyin: "yuè liang", th: "พระจันทร์",     emoji: "🌙", img: "assets/img/moon.png" },
  { id: "sun",      cat: "nature",    zh: "太阳", pinyin: "tài yáng",  th: "พระอาทิตย์",    emoji: "☀️", img: "assets/img/sun.png" },
  { id: "cloud",    cat: "nature",    zh: "白云", pinyin: "bái yún",   th: "เมฆขาว",        emoji: "☁️", img: "assets/img/cloud.png" },
  // 🌳 พืช
  { id: "tree",     cat: "plants",    zh: "大树", pinyin: "dà shù",    th: "ต้นไม้ใหญ่",    emoji: "🌳", img: "assets/img/tree.png" },
  { id: "love",     cat: "plants",    zh: "爱",   pinyin: "ài",        th: "รัก",           emoji: "❤️", img: "assets/img/love.png" },
  { id: "flower",   cat: "plants",    zh: "红花", pinyin: "hóng huā",  th: "ดอกไม้สีแดง",   emoji: "🌺", img: "assets/img/flower.png" },
  { id: "grass",    cat: "plants",    zh: "绿草", pinyin: "lǜ cǎo",    th: "หญ้าสีเขียว",   emoji: "🌿", img: "assets/img/grass.png" },
  // 🚗 ยานพาหนะ
  { id: "airplane", cat: "transport", zh: "飞机", pinyin: "fēi jī",    th: "เครื่องบิน",    emoji: "✈️", img: "assets/img/airplane.png" },
  { id: "boat",     cat: "transport", zh: "小船", pinyin: "xiǎo chuán",th: "เรือ",          emoji: "⛵", img: "assets/img/boat.png" },
  { id: "car",      cat: "transport", zh: "汽车", pinyin: "qì chē",    th: "รถยนต์",        emoji: "🚗", img: "assets/img/car.png" },
  { id: "bus",      cat: "transport", zh: "巴士", pinyin: "bā shì",    th: "รถบัส",         emoji: "🚌", img: "assets/img/bus.png" },
];
