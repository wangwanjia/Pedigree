import { loadData } from './data.js';
import { renderTree, NODE_WIDTH, NODE_HEIGHT } from './tree.js';
import { openModal, initModal } from './modal.js';

const stage = document.getElementById('treeStage');
const canvas = document.getElementById('treeCanvas');
const nodesContainer = document.getElementById('treeNodes');
const linksSvg = document.getElementById('treeLinks');
const familyNameEl = document.getElementById('familyName');
const resetBtn = document.getElementById('resetView');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

let data = null;
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let initialTranslateX = 0;
let initialTranslateY = 0;
let nodePositions = new Map();

function updateTransform() {
  canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function fitToScreen(treeSize) {
  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;
  const padding = 40;

  scale = Math.min(
    (stageW - padding * 2) / treeSize.width,
    (stageH - padding * 2) / treeSize.height,
    1
  );
  scale = Math.max(scale, 0.3);

  translateX = (stageW - treeSize.width * scale) / 2;
  translateY = padding;
  updateTransform();
}

function render() {
  const treeInfo = renderTree(nodesContainer, linksSvg, data, (person) => {
    document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`.tree-node[data-id="${person.id}"]`);
    if (active) active.classList.add('active');
    openModal(person, data);
  });

  nodePositions = treeInfo.positions || new Map();
  fitToScreen(treeInfo);
}

stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomIntensity = 0.001;
  const delta = -e.deltaY * zoomIntensity;
  const newScale = Math.min(Math.max(scale + delta, 0.2), 3);

  const rect = stage.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  translateX = mouseX - (mouseX - translateX) * (newScale / scale);
  translateY = mouseY - (mouseY - translateY) * (newScale / scale);
  scale = newScale;
  updateTransform();
}, { passive: false });

stage.addEventListener('mousedown', (e) => {
  if (e.target.closest('.tree-node')) return;
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialTranslateX = translateX;
  initialTranslateY = translateY;
  stage.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  translateX = initialTranslateX + (e.clientX - startX);
  translateY = initialTranslateY + (e.clientY - startY);
  updateTransform();
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  stage.style.cursor = 'grab';
});

stage.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    initialTranslateX = translateX;
    initialTranslateY = translateY;
  }
}, { passive: false });

stage.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && isDragging) {
    e.preventDefault();
    translateX = initialTranslateX + (e.touches[0].clientX - startX);
    translateY = initialTranslateY + (e.touches[0].clientY - startY);
    updateTransform();
  }
}, { passive: false });

stage.addEventListener('touchend', () => {
  isDragging = false;
});

resetBtn.addEventListener('click', () => {
  const treeSize = {
    width: parseFloat(linksSvg.getAttribute('width')) || NODE_WIDTH,
    height: parseFloat(linksSvg.getAttribute('height')) || NODE_HEIGHT
  };
  fitToScreen(treeSize);
});

function performSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q || !data) return [];
  return data.people.filter(p => p.name.toLowerCase().includes(q));
}

function renderSearchResults(matches) {
  searchResults.innerHTML = '';
  if (matches.length === 0) {
    searchResults.hidden = true;
    return;
  }

  matches.forEach(person => {
    const li = document.createElement('li');
    li.textContent = person.name;
    li.tabIndex = 0;
    li.setAttribute('role', 'option');
    li.addEventListener('click', () => focusNode(person));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') focusNode(person);
    });
    searchResults.appendChild(li);
  });

  searchResults.hidden = false;
}

function focusNode(person) {
  const pos = nodePositions.get(person.id);
  if (!pos) return;

  searchResults.hidden = true;
  searchInput.value = '';

  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;

  scale = 1.2;
  translateX = stageW / 2 - (pos.x + NODE_WIDTH / 2) * scale;
  translateY = stageH / 2 - (pos.y + NODE_HEIGHT / 2) * scale;
  updateTransform();

  document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active'));
  const active = document.querySelector(`.tree-node[data-id="${person.id}"]`);
  if (active) active.classList.add('active');

  openModal(person, data);
}

searchInput.addEventListener('input', () => {
  renderSearchResults(performSearch(searchInput.value));
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchResults.hidden = true;
    searchInput.value = '';
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#headerSearch')) {
    searchResults.hidden = true;
  }
});

window.addEventListener('resize', () => {
  const treeSize = {
    width: parseFloat(linksSvg.getAttribute('width')) || NODE_WIDTH,
    height: parseFloat(linksSvg.getAttribute('height')) || NODE_HEIGHT
  };
  fitToScreen(treeSize);
});

async function init() {
  data = await loadData();
  familyNameEl.textContent = data.familyName || '族谱';
  initModal();
  render();
}

init();
