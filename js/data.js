const STORAGE_KEY = 'family_tree_data';
const API_BASE = '';

const defaultData = {
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

function getPathToAncestor(data, fromId, ancestorId) {
  const path = [];
  let current = getPerson(data, fromId);
  while (current) {
    path.push(current);
    if (current.id === ancestorId) return path;
    const parent = getParent(data, current.id);
    if (!parent) return null;
    current = parent;
  }
  return null;
}

function findLCA(data, id1, id2) {
  const ancestors = new Set();
  let current = getPerson(data, id1);
  while (current) {
    ancestors.add(current.id);
    const parent = getParent(data, current.id);
    if (!parent) break;
    current = parent;
  }
  current = getPerson(data, id2);
  while (current) {
    if (ancestors.has(current.id)) return current;
    const parent = getParent(data, current.id);
    if (!parent) break;
    current = parent;
  }
  return null;
}

function compareAge(data, id1, id2) {
  const p1 = getPerson(data, id1);
  const p2 = getPerson(data, id2);
  if (!p1 || !p2 || !p1.birth || !p2.birth) return 0;
  const y1 = parseInt(extractYear(p1.birth), 10);
  const y2 = parseInt(extractYear(p2.birth), 10);
  if (isNaN(y1) || isNaN(y2)) return 0;
  return y1 - y2;
}

function getAncestorTerm(path) {
  const depth = path.length - 1;
  const target = path[path.length - 1];
  const isFemale = target.gender === 'female';

  if (depth === 1) return isFemale ? '母亲' : '父亲';

  if (depth === 2) {
    const parent = path[1];
    if (parent.gender === 'male') {
      return isFemale ? '奶奶' : '爷爷';
    }
    return isFemale ? '外婆' : '外公';
  }

  if (depth === 3) {
    const parent = path[1];
    const prefix = parent.gender === 'female' ? '外' : '';
    return prefix + (isFemale ? '曾祖母' : '曾祖父');
  }

  if (depth === 4) {
    const parent = path[1];
    const prefix = parent.gender === 'female' ? '外' : '';
    return prefix + (isFemale ? '高祖母' : '高祖父');
  }

  if (depth === 5) {
    const parent = path[1];
    const prefix = parent.gender === 'female' ? '外' : '';
    return prefix + (isFemale ? '天祖母' : '天祖父');
  }

  const parent = path[1];
  const prefix = parent.gender === 'female' ? '外' : '';
  return prefix + (isFemale ? '远祖奶奶' : '远祖爷爷');
}

function getDescendantTerm(path) {
  const depth = path.length - 1;
  const target = path[0];
  const isFemale = target.gender === 'female';

  if (depth === 1) return isFemale ? '女儿' : '儿子';
  if (depth === 2) return isFemale ? '孙女' : '孙子';
  if (depth === 3) return isFemale ? '曾孙女' : '曾孙';
  if (depth === 4) return isFemale ? '玄孙女' : '玄孙';
  return isFemale ? `第${depth}世孙女` : `第${depth}世孙`;
}

function getCollateralTerm(data, viewerPath, targetPath) {
  const vDepth = viewerPath.length - 1;
  const tDepth = targetPath.length - 1;
  const viewer = viewerPath[0];
  const target = targetPath[0];
  const viewerParent = viewerPath[1];
  const targetParent = targetPath[1];

  if (vDepth === 1 && tDepth === 1) {
    const ageDiff = compareAge(data, viewer.id, target.id);
    if (target.gender === 'male') {
      return ageDiff > 0 ? '哥哥' : '弟弟';
    }
    return ageDiff > 0 ? '姐姐' : '妹妹';
  }

  if (vDepth === 1 && tDepth === 2) {
    if (targetParent.gender === 'male') {
      return target.gender === 'male' ? '侄子' : '侄女';
    }
    return target.gender === 'male' ? '外甥' : '外甥女';
  }

  if (vDepth === 2 && tDepth === 1) {
    if (viewerParent.gender === 'male') {
      if (target.gender === 'male') {
        const ageDiff = compareAge(data, viewerParent.id, target.id);
        return ageDiff > 0 ? '伯父' : '叔叔';
      }
      return '姑姑';
    }
    if (target.gender === 'male') return '舅舅';
    return '姨妈';
  }

  if (vDepth === 2 && tDepth === 2) {
    const ageDiff = compareAge(data, viewer.id, target.id);
    const paternal = viewerParent.gender === 'male' && targetParent.gender === 'male';
    if (paternal) {
      if (target.gender === 'male') {
        return ageDiff > 0 ? '堂哥' : '堂弟';
      }
      return ageDiff > 0 ? '堂姐' : '堂妹';
    }
    if (target.gender === 'male') {
      return ageDiff > 0 ? '表哥' : '表弟';
    }
    return ageDiff > 0 ? '表姐' : '表妹';
  }

  return '远房亲戚';
}

function getKinshipTerm(data, viewerId, targetId) {
  if (viewerId === targetId) return '自己';

  const viewer = getPerson(data, viewerId);
  const target = getPerson(data, targetId);
  if (!viewer || !target) return null;

  const ancestorPath = getPathToAncestor(data, viewerId, targetId);
  if (ancestorPath) return getAncestorTerm(ancestorPath);

  const descendantPath = getPathToAncestor(data, targetId, viewerId);
  if (descendantPath) return getDescendantTerm(descendantPath);

  const lca = findLCA(data, viewerId, targetId);
  if (!lca) return null;

  const viewerPath = getPathToAncestor(data, viewerId, lca.id);
  const targetPath = getPathToAncestor(data, targetId, lca.id);
  return getCollateralTerm(data, viewerPath, targetPath);
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

function isPhotoUrlSafe(url) {
  if (!url) return false;
  if (url.startsWith('/images/')) return true;
  if (url.startsWith('data:image/')) return true;
  return false;
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
  getKinshipTerm,
  generateId,
  validateData,
  extractYear,
  formatDate,
  formatDateShort,
  isPhotoUrlSafe
};
