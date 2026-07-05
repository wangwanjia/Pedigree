const STORAGE_KEY = 'family_tree_data';
const API_BASE = '';

const defaultData = {
  familyName: '冲口王氏宗族',
  rootId: 'p1',
  people: [
    {
      id: 'p1',
      name: '张德祖',
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
      name: '张文昌',
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
      name: '张武盛',
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
      name: '张秀兰',
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
      name: '张明远',
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
      name: '张明珠',
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
      name: '张志强',
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
      name: '张浩宇',
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
      name: '张思琪',
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
      name: '张俊豪',
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

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

async function loadData() {
  try {
    return await fetchJson(`${API_BASE}/api/data`);
  } catch (e) {
    console.warn('从服务器读取失败，尝试 localStorage', e);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('读取 localStorage 失败', e);
  }

  return JSON.parse(JSON.stringify(defaultData));
}

async function saveData(data) {
  try {
    await fetchJson(`${API_BASE}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.warn('保存到服务器失败，回退到 localStorage', e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

async function resetToDefault() {
  try {
    await fetchJson(`${API_BASE}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultData)
    });
  } catch (e) {
    console.warn('重置服务器数据失败，回退到 localStorage', e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  }
  return JSON.parse(JSON.stringify(defaultData));
}

async function uploadImage(file, generation = 0) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('generation', String(generation));

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const result = await res.json();
  return result.path;
}

function getPerson(data, id) {
  return data.people.find(p => p.id === id);
}

function getChildren(data, id) {
  return data.people.filter(p => {
    const parent = data.people.find(parent => parent.children.includes(p.id));
    return parent && parent.id === id;
  });
}

function getParent(data, id) {
  return data.people.find(p => p.children.includes(id));
}

function getGeneration(data, id) {
  if (!id) return 0;
  let generation = 1;
  let current = getPerson(data, id);
  while (current) {
    const parent = getParent(data, current.id);
    if (!parent) break;
    generation++;
    current = parent;
  }
  return generation;
}

function generateId(data) {
  const ids = data.people.map(p => parseInt(p.id.replace('p', ''), 10) || 0);
  const max = ids.length ? Math.max(...ids) : 0;
  return `p${max + 1}`;
}

function validateData(data) {
  const errors = [];
  const map = new Map();
  data.people.forEach(p => {
    if (map.has(p.id)) {
      errors.push(`重复的 ID: ${p.id}`);
    }
    map.set(p.id, p);
  });

  data.people.forEach(p => {
    (p.children || []).forEach(cid => {
      if (!map.has(cid)) {
        errors.push(`${p.name} 的子女 ${cid} 不存在`);
      }
    });
  });

  return errors;
}

function extractYear(dateStr) {
  if (!dateStr) return '';
  const m = String(dateStr).match(/^(\d{4})/);
  return m ? m[1] : dateStr;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split(/[-\/]/);
  if (parts.length === 1) return `${parts[0]}年`;
  if (parts.length === 2) return `${parts[0]}年${parts[1]}月`;
  if (parts.length >= 3) return `${parts[0]}年${parts[1]}月${parts[2]}日`;
  return dateStr;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split(/[-\/]/);
  if (parts.length === 1) return parts[0];
  return parts.slice(0, 3).join('.');
}

export {
  loadData,
  saveData,
  resetToDefault,
  uploadImage,
  getPerson,
  getChildren,
  getParent,
  getGeneration,
  generateId,
  validateData,
  extractYear,
  formatDate,
  formatDateShort
};
