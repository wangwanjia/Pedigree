const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'family.json');
const IMAGES_DIR = path.join(__dirname, 'images');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  writeData(getDefaultData());
}

function getDefaultData() {
  return {
    familyName: '冲口王氏宗族',
    rootId: 'p1',
    people: [
      {
        id: 'p1',
        name: '王德祖',
        gender: 'male',
        birth: '1900-01-15',
        death: '1985-06-20',
        spouse: '李氏',
        children: ['p2', 'p3', 'p4'],
        photo: '',
        bio: '家族始祖，早年迁居此地，勤俭持家，育有三子一女。',
        notes: '葬于南山公墓'
      },
      {
        id: 'p2',
        name: '王文昌',
        gender: 'male',
        birth: '1923-08-12',
        death: '2001-11-05',
        spouse: '王氏',
        children: ['p5', 'p6'],
        photo: '',
        bio: '长子，一生从事教育工作，桃李满天下。',
        notes: ''
      },
      {
        id: 'p3',
        name: '王武盛',
        gender: 'male',
        birth: '1926-04-30',
        death: '1998-09-18',
        spouse: '陈氏',
        children: ['p7'],
        photo: '',
        bio: '次子，军人出身，性格刚毅。',
        notes: ''
      },
      {
        id: 'p4',
        name: '王秀兰',
        gender: 'female',
        birth: '1931-12-03',
        death: '2010-07-22',
        spouse: '赵建国',
        children: ['p8'],
        photo: '',
        bio: '长女，温婉贤淑，晚年移居省城。',
        notes: ''
      },
      {
        id: 'p5',
        name: '王明远',
        gender: 'male',
        birth: '1952-06-18',
        death: '',
        spouse: '刘氏',
        children: ['p9', 'p10'],
        photo: '',
        bio: '文昌长子，工程师，现居北京。',
        notes: ''
      },
      {
        id: 'p6',
        name: '王明珠',
        gender: 'female',
        birth: '1955-03-09',
        death: '',
        spouse: '孙志强',
        children: [],
        photo: '',
        bio: '文昌长女，医生，已退休。',
        notes: ''
      },
      {
        id: 'p7',
        name: '王志强',
        gender: 'male',
        birth: '1958-11-26',
        death: '',
        spouse: '周敏',
        children: ['p11'],
        photo: '',
        bio: '武盛独子，经营家族生意。',
        notes: ''
      },
      {
        id: 'p8',
        name: '赵小燕',
        gender: 'female',
        birth: '1960-01-14',
        death: '',
        spouse: '钱伟',
        children: [],
        photo: '',
        bio: '秀兰独女，从事艺术创作。',
        notes: ''
      },
      {
        id: 'p9',
        name: '王浩宇',
        gender: 'male',
        birth: '1980-04-02',
        death: '',
        spouse: '吴婷',
        children: [],
        photo: '',
        bio: '明远长子，互联网从业者。',
        notes: ''
      },
      {
        id: 'p10',
        name: '王思琪',
        gender: 'female',
        birth: '1985-09-21',
        death: '',
        spouse: '',
        children: [],
        photo: '',
        bio: '明远次女，留学归国后创办设计工作室。',
        notes: ''
      },
      {
        id: 'p11',
        name: '王俊豪',
        gender: 'male',
        birth: '1988-07-07',
        death: '',
        spouse: '',
        children: [],
        photo: '',
        bio: '志强独子，热爱户外运动。',
        notes: ''
      }
    ]
  };
}

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const text = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(text);
    }
  } catch (e) {
    console.error('读取数据文件失败', e);
  }
  return getDefaultData();
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('写入数据文件失败', e);
    return false;
  }
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/images', express.static(IMAGES_DIR));
app.use(express.static(__dirname));

app.get('/api/data', (req, res) => {
  res.json(readData());
});

app.post('/api/data', (req, res) => {
  const data = req.body;
  if (!data || !Array.isArray(data.people)) {
    return res.status(400).json({ error: '数据格式不正确' });
  }
  if (writeData(data)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

function formatTimestamp(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const Y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${Y}${M}${D}${h}${m}${s}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const generation = String(req.body.generation || '0').replace(/[^0-9]/g, '');
    const safeName = `G${generation || '0'}-${formatTimestamp()}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' });
  }
  const imagePath = `/images/${req.file.filename}`;
  res.json({ path: imagePath });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

app.listen(PORT, () => {
  console.log(`族谱网站服务已启动：http://localhost:${PORT}`);
  console.log(`数据文件：${DATA_FILE}`);
  console.log(`图片目录：${IMAGES_DIR}`);
});
