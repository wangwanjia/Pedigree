import {
  loadData,
  saveData,
  resetToDefault,
  uploadImage,
  getPerson,
  getParent,
  getGeneration,
  generateId,
  validateData,
  formatDateShort
} from './data.js';
import { isLoggedIn, login, logout } from './auth.js';

const loginPanel = document.getElementById('loginPanel');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const loginPassword = document.getElementById('loginPassword');
const logoutBtn = document.getElementById('logoutBtn');
const memberTree = document.getElementById('memberTree');
const statsOverview = document.getElementById('statsOverview');
const generationFilter = document.getElementById('generationFilter');
const treeSearch = document.getElementById('treeSearch');
const addMemberBtn = document.getElementById('addMemberBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const resetDataBtn = document.getElementById('resetDataBtn');
const memberModal = document.getElementById('memberModal');
const memberModalClose = document.getElementById('memberModalClose');
const memberForm = document.getElementById('memberForm');
const memberFormTitle = document.getElementById('memberFormTitle');
const mId = document.getElementById('mId');
const mName = document.getElementById('mName');
const mGender = document.getElementById('mGender');
const mBirth = document.getElementById('mBirth');
const mDeath = document.getElementById('mDeath');
const mSpouse = document.getElementById('mSpouse');
const mAddress = document.getElementById('mAddress');
const mParent = document.getElementById('mParent');
const mParentSearch = document.getElementById('mParentSearch');
const mParentList = document.getElementById('mParentList');
const mPhotoFile = document.getElementById('mPhotoFile');
const mPhoto = document.getElementById('mPhoto');
const mPhotoPreview = document.getElementById('mPhotoPreview');
const mBio = document.getElementById('mBio');
const mNotes = document.getElementById('mNotes');
const deleteMemberBtn = document.getElementById('deleteMemberBtn');
const cancelMemberBtn = document.getElementById('cancelMemberBtn');

let data = null;

function updateUI() {
  if (isLoggedIn()) {
    loginPanel.hidden = true;
    adminPanel.hidden = false;
    logoutBtn.hidden = false;
    renderStats();
    renderMemberTree();
    updateStorageStatus();
  } else {
    loginPanel.hidden = false;
    adminPanel.hidden = true;
    logoutBtn.hidden = true;
  }
}

async function updateStorageStatus() {
  const statusEl = document.getElementById('storageStatus');
  if (!statusEl) return;

  try {
    await fetch('/api/data', { method: 'HEAD' });
    statusEl.textContent = '已连接到后端服务，数据和图片都会保存到服务器本地文件夹。';
    statusEl.className = 'storage-status active';
  } catch (e) {
    statusEl.textContent = '未连接到后端服务，数据仅保存在浏览器缓存中。请运行 npm start 启动服务。';
    statusEl.className = 'storage-status unsupported';
  }
}

function getParentCandidates() {
  const currentId = mId.value;
  return data.people.filter(p => p.id !== currentId);
}

function renderParentList(filter = '') {
  const term = filter.trim().toLowerCase();
  const candidates = getParentCandidates().filter(p => p.name.toLowerCase().includes(term));
  mParentList.innerHTML = '';

  if (candidates.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = '无匹配成员';
    mParentList.appendChild(empty);
    return;
  }

  candidates.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name;
    li.dataset.id = p.id;
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      selectParent(p.id, p.name);
    });
    mParentList.appendChild(li);
  });
}

function selectParent(id, name) {
  mParent.value = id;
  mParentSearch.value = name || '';
  mParentList.hidden = true;
}

function clearParentSelection() {
  mParent.value = '';
  mParentSearch.value = '';
}

function renderStats() {
  if (!statsOverview) return;

  let maxGeneration = 0;
  data.people.forEach(p => {
    const gen = getGeneration(data, p.id);
    if (gen > maxGeneration) maxGeneration = gen;
  });

  updateGenerationFilterOptions(maxGeneration);

  const selectedGen = generationFilter ? generationFilter.value : 'all';
  const selectedGenNum = selectedGen === 'all' ? null : parseInt(selectedGen, 10);

  const filtered = data.people.filter(p => {
    if (selectedGenNum === null) return true;
    return getGeneration(data, p.id) === selectedGenNum;
  });

  const total = filtered.length;
  const male = filtered.filter(p => p.gender === 'male').length;
  const female = filtered.filter(p => p.gender === 'female').length;
  const unknown = total - male - female;

  const malePercent = total ? Math.round((male / total) * 100) : 0;
  const femalePercent = total ? Math.round((female / total) * 100) : 0;

  const scopeLabel = selectedGenNum === null ? '全部' : `第${selectedGenNum}世`;

  statsOverview.innerHTML = `
    <div class="stat-card">
      <span class="stat-value">${total}</span>
      <span class="stat-label">${scopeLabel}人员</span>
    </div>
    <div class="stat-card">
      <span class="stat-value stat-male">${male}</span>
      <span class="stat-label">男性</span>
    </div>
    <div class="stat-card">
      <span class="stat-value stat-female">${female}</span>
      <span class="stat-label">女性</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${maxGeneration}</span>
      <span class="stat-label">繁衍世代</span>
    </div>
    <div class="stat-card stat-wide">
      <div class="gender-bar" title="${scopeLabel}：男 ${male} 人 · 女 ${female} 人 · 未填写 ${unknown} 人">
        <div class="gender-bar-male" style="width: ${malePercent}%"></div>
        <div class="gender-bar-female" style="width: ${femalePercent}%"></div>
      </div>
      <div class="gender-bar-labels">
        <span class="gender-label-male">男 ${malePercent}%</span>
        <span class="gender-label-female">女 ${femalePercent}%</span>
      </div>
    </div>
  `;
}

function updateGenerationFilterOptions(maxGeneration) {
  if (!generationFilter) return;
  const currentValue = generationFilter.value;
  let options = '<option value="all">全部世代</option>';
  for (let i = 1; i <= maxGeneration; i++) {
    options += `<option value="${i}">第${i}世</option>`;
  }
  generationFilter.innerHTML = options;
  if (currentValue && [...generationFilter.options].some(o => o.value === currentValue)) {
    generationFilter.value = currentValue;
  }
}

function renderMemberTree() {
  memberTree.innerHTML = '';
  const map = new Map(data.people.map(p => [p.id, { ...p, children: [] }]));
  let root = null;
  data.people.forEach(p => {
    const node = map.get(p.id);
    node.children = (p.children || []).map(cid => map.get(cid)).filter(Boolean);
    if (p.id === data.rootId) root = node;
  });

  if (!root) {
    memberTree.innerHTML = '<p class="tree-empty">暂无成员，点击“添加成员”开始。</p>';
    return;
  }

  const treeEl = document.createElement('ul');
  treeEl.className = 'admin-tree';
  renderNode(treeEl, root, 0);
  memberTree.appendChild(treeEl);
}

function renderNode(container, node, depth) {
  const li = document.createElement('li');
  li.className = 'admin-tree-node';
  li.dataset.name = node.name;

  const photo = node.photo || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23f0ebe4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16'%3E${node.name.charAt(0)}%3C/text%3E%3C/svg%3E`;
  const life = [formatDateShort(node.birth) || '?', formatDateShort(node.death) || '今'].join(' - ');
  const generation = depth + 1;

  const row = document.createElement('div');
  row.className = 'admin-tree-row';
  row.style.setProperty('--depth', depth);
  row.innerHTML = `
    <img class="admin-tree-photo" src="${photo}" alt="${node.name}" />
    <div class="admin-tree-info">
      <span class="admin-tree-name">${node.name}</span>
      <span class="admin-tree-generation">第${generation}世</span>
      <span class="admin-tree-life">${life}</span>
    </div>
    <div class="admin-tree-actions">
      <button type="button" class="btn-action btn-edit" data-action="edit" title="编辑">编辑</button>
      <button type="button" class="btn-action btn-add-child" data-action="add-child" title="添加子女">添加子女</button>
      <button type="button" class="btn-action btn-delete" data-action="delete" title="删除">删除</button>
    </div>
  `;

  row.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openMemberModal(node.id);
  });

  row.querySelector('[data-action="add-child"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openMemberModal('', node.id);
  });

  row.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteMember(node.id);
  });

  li.appendChild(row);

  if (node.children && node.children.length) {
    const ul = document.createElement('ul');
    ul.className = 'admin-tree-children';
    node.children.forEach(child => renderNode(ul, child, depth + 1));
    li.appendChild(ul);
  }

  container.appendChild(li);
}

async function deleteMember(id) {
  const person = getPerson(data, id);
  if (!person) return;
  if (!confirm(`确定删除 ${person.name} 吗？其子女不会随之删除。`)) return;

  data.people = data.people.filter(p => p.id !== id);
  data.people.forEach(p => {
    p.children = p.children.filter(cid => cid !== id);
  });

  await saveData(data);
  renderStats();
  renderMemberTree();
  updateStorageStatus();
}

function filterTree(term) {
  const rows = memberTree.querySelectorAll('.admin-tree-row');
  const value = term.trim().toLowerCase();
  let firstMatch = null;

  rows.forEach(row => {
    const li = row.closest('.admin-tree-node');
    const name = (li.dataset.name || '').toLowerCase();
    const match = value && name.includes(value);
    row.classList.toggle('highlight', match);
    if (match && !firstMatch) {
      firstMatch = row;
    }
  });

  if (firstMatch) {
    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function openMemberModal(id = '', presetParentId = '') {
  memberForm.reset();
  mPhotoPreview.hidden = true;
  mPhotoPreview.src = '';
  mPhoto.value = '';

  if (id) {
    const p = getPerson(data, id);
    if (!p) return;
    memberFormTitle.textContent = '编辑成员';
    mId.value = p.id;
    mName.value = p.name;
    mGender.value = p.gender || 'male';
    mBirth.value = p.birth || '';
    mDeath.value = p.death || '';
    mSpouse.value = Array.isArray(p.spouse) ? p.spouse.join('、') : p.spouse || '';
    mAddress.value = p.address || '';
    mBio.value = p.bio || '';
    mNotes.value = p.notes || '';
    mPhoto.value = p.photo || '';
    if (p.photo) {
      mPhotoPreview.src = p.photo;
      mPhotoPreview.hidden = false;
    }
    const parent = getParent(data, p.id);
    if (parent) {
      selectParent(parent.id, parent.name);
    } else {
      clearParentSelection();
    }
    deleteMemberBtn.hidden = false;
  } else {
    memberFormTitle.textContent = '添加成员';
    mId.value = '';
    clearParentSelection();
    deleteMemberBtn.hidden = true;
    if (presetParentId) {
      const parent = getPerson(data, presetParentId);
      if (parent) selectParent(parent.id, parent.name);
    }
  }

  memberModal.classList.add('open');
  memberModal.setAttribute('aria-hidden', 'false');
}

function closeMemberModal() {
  memberModal.classList.remove('open');
  memberModal.setAttribute('aria-hidden', 'true');
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (login(loginPassword.value)) {
    updateUI();
    loginPassword.value = '';
  } else {
    alert('密码错误');
  }
});

logoutBtn.addEventListener('click', () => {
  logout();
  updateUI();
});

addMemberBtn.addEventListener('click', () => openMemberModal());
memberModalClose.addEventListener('click', closeMemberModal);
cancelMemberBtn.addEventListener('click', closeMemberModal);

generationFilter.addEventListener('change', () => {
  renderStats();
});

treeSearch.addEventListener('input', () => {
  filterTree(treeSearch.value);
});

treeSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    treeSearch.value = '';
    filterTree('');
  }
});

memberModal.addEventListener('click', (e) => {
  if (e.target === memberModal) closeMemberModal();
});

mParentSearch.addEventListener('focus', () => {
  renderParentList(mParentSearch.value);
  mParentList.hidden = false;
});

mParentSearch.addEventListener('input', () => {
  renderParentList(mParentSearch.value);
  mParentList.hidden = false;
});

mParentSearch.addEventListener('blur', () => {
  setTimeout(() => {
    mParentList.hidden = true;
  }, 150);
});

mParentSearch.addEventListener('keydown', (e) => {
  const items = Array.from(mParentList.querySelectorAll('li:not(.empty)'));
  const active = mParentList.querySelector('li.active');
  let index = items.indexOf(active);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    index = Math.min(index + 1, items.length - 1);
    if (index < 0) index = 0;
    items.forEach(i => i.classList.remove('active'));
    items[index].classList.add('active');
    items[index].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    index = Math.max(index - 1, 0);
    items.forEach(i => i.classList.remove('active'));
    items[index].classList.add('active');
    items[index].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (active) {
      selectParent(active.dataset.id, active.textContent);
    }
  } else if (e.key === 'Escape') {
    mParentList.hidden = true;
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#mParentCombobox')) {
    mParentList.hidden = true;
  }
});

mPhotoFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    alert('图片大小不能超过 10MB');
    return;
  }

  let generation = 0;
  const editingId = mId.value;
  if (editingId) {
    generation = getGeneration(data, editingId);
  } else {
    const parentId = mParent.value;
    if (parentId) {
      generation = getGeneration(data, parentId) + 1;
    }
  }

  try {
    const path = await uploadImage(file, generation);
    mPhoto.value = path;
    mPhotoPreview.src = path;
    mPhotoPreview.hidden = false;
  } catch (err) {
    alert('上传到服务器失败：' + (err.message || '未知错误') + '\n已回退为 Base64 嵌入。');
    try {
      const base64 = await readFileAsBase64(file);
      mPhoto.value = base64;
      mPhotoPreview.src = base64;
      mPhotoPreview.hidden = false;
    } catch (e) {
      alert('图片读取失败');
    }
  }
});

memberForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = mId.value || generateId(data);
  const spouseRaw = mSpouse.value.trim();
  const spouse = spouseRaw ? spouseRaw.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : '';

  const person = {
    id,
    name: mName.value.trim(),
    gender: mGender.value,
    birth: mBirth.value.trim(),
    death: mDeath.value.trim(),
    spouse: spouse.length > 1 ? spouse : spouse[0] || '',
    address: mAddress.value.trim(),
    children: [],
    photo: mPhoto.value.trim(),
    bio: mBio.value.trim(),
    notes: mNotes.value.trim()
  };

  const existingIndex = data.people.findIndex(p => p.id === id);
  let parentId = mParent.value;
  const searchName = mParentSearch.value.trim();
  if (!parentId && searchName) {
    const matched = getParentCandidates().find(p => p.name === searchName);
    if (matched) parentId = matched.id;
  }

  if (existingIndex >= 0) {
    const existing = data.people[existingIndex];
    person.children = existing.children;
    data.people[existingIndex] = person;

    // 如果改了父亲，从旧的父节点移除
    const oldParent = getParent(data, id);
    if (oldParent && oldParent.id !== parentId) {
      oldParent.children = oldParent.children.filter(cid => cid !== id);
    }
  } else {
    data.people.push(person);
  }

  // 添加到新的父节点
  if (parentId) {
    const parent = getPerson(data, parentId);
    if (parent && !parent.children.includes(id)) {
      parent.children.push(id);
    }
  }

  const errors = validateData(data);
  if (errors.length) {
    alert('数据校验失败：\n' + errors.join('\n'));
    return;
  }

  await saveData(data);
  closeMemberModal();
  renderStats();
  renderMemberTree();
  updateStorageStatus();
  alert('保存成功');
});

deleteMemberBtn.addEventListener('click', async () => {
  const id = mId.value;
  if (!id) return;
  const person = getPerson(data, id);
  if (!confirm(`确定删除 ${person.name} 吗？其子女不会随之删除。`)) return;

  data.people = data.people.filter(p => p.id !== id);
  data.people.forEach(p => {
    p.children = p.children.filter(cid => cid !== id);
  });

  await saveData(data);
  closeMemberModal();
  renderStats();
  renderMemberTree();
  updateStorageStatus();
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `family-tree-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.people || !Array.isArray(imported.people)) {
        throw new Error('JSON 格式不正确');
      }
      const errors = validateData(imported);
      if (errors.length) {
        alert('导入数据校验失败：\n' + errors.join('\n'));
        return;
      }
      data = imported;
      await saveData(data);
      renderStats();
  renderMemberTree();
      updateStorageStatus();
      alert('导入成功');
    } catch (err) {
      alert('导入失败：' + err.message);
    }
  };
  reader.readAsText(file);
  importBtn.value = '';
});

resetDataBtn.addEventListener('click', async () => {
  if (!confirm('确定恢复示例数据吗？当前数据将被覆盖。')) return;
  data = await resetToDefault();
  renderStats();
  renderMemberTree();
  updateStorageStatus();
  alert('已恢复示例数据');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && memberModal.classList.contains('open')) {
    closeMemberModal();
  }
});

async function init() {
  data = await loadData();
  updateUI();
}

init();
