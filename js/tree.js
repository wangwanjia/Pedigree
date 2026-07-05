import { extractYear } from './data.js';

const NODE_WIDTH = 120;
const NODE_HEIGHT = 130;
const LEVEL_GAP = 160;
const SIBLING_GAP = 40;

function buildTree(data) {
  const map = new Map(data.people.map(p => [p.id, { ...p, children: [] }]));
  let root = null;
  data.people.forEach(p => {
    const node = map.get(p.id);
    node.children = (p.children || []).map(cid => map.get(cid)).filter(Boolean);
    if (p.id === data.rootId) {
      root = node;
    }
  });
  return root;
}

function calculateLayout(root) {
  if (!root) return { nodes: [], links: [], width: 0, height: 0, minX: 0 };

  const nodes = [];
  const links = [];

  function setDepthAndSize(node, depth) {
    node.depth = depth;
    node.y = depth * (NODE_HEIGHT + LEVEL_GAP);
    if (!node.children || node.children.length === 0) {
      node.subtreeWidth = NODE_WIDTH;
      return;
    }
    node.children.forEach(child => setDepthAndSize(child, depth + 1));
    const childrenWidth = node.children.reduce((sum, c) => sum + c.subtreeWidth, 0) +
      (node.children.length - 1) * SIBLING_GAP;
    node.subtreeWidth = Math.max(NODE_WIDTH, childrenWidth);
  }

  function setRelativeX(node) {
    node.relX = 0;
    if (!node.children || node.children.length === 0) return;

    node.children.forEach(child => setRelativeX(child));
    const totalWidth = node.children.reduce((sum, c) => sum + c.subtreeWidth, 0) +
      (node.children.length - 1) * SIBLING_GAP;

    let start = -totalWidth / 2;
    node.children.forEach(child => {
      child.relX = start + child.subtreeWidth / 2;
      start += child.subtreeWidth + SIBLING_GAP;
    });
  }

  function flatten(node, parentX, depth) {
    node.x = parentX + (node.relX || 0);
    nodes.push({ id: node.id, x: node.x, y: node.y, depth, data: node });

    node.children.forEach(child => {
      flatten(child, node.x, depth + 1);
      links.push({
        from: { x: node.x, y: node.y + NODE_HEIGHT },
        to: { x: child.x, y: child.y }
      });
    });
  }

  setDepthAndSize(root, 0);
  setRelativeX(root);
  flatten(root, 0, 0);

  const minX = Math.min(...nodes.map(n => n.x), 0);
  const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH));
  const width = maxX - minX;
  const height = Math.max(...nodes.map(n => n.y + NODE_HEIGHT));

  return { nodes, links, width, height, minX };
}

function renderTree(container, linksSvg, data, onNodeClick) {
  const root = buildTree(data);
  const layout = calculateLayout(root);

  container.innerHTML = '';
  linksSvg.innerHTML = '';

  const minX = layout.minX;
  const minY = 0;

  const positions = new Map();

  layout.nodes.forEach(n => {
    const x = n.x - minX;
    const y = n.y - minY;
    positions.set(n.id, { x, y, data: n.data });

    const node = document.createElement('div');
    node.className = `tree-node ${n.data.gender || ''}`;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.dataset.id = n.id;
    node.tabIndex = 0;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `${n.data.name}，点击查看详情`);

    const photo = n.data.photo || '';
    const img = photo
      ? `<img class="node-photo" src="${photo}" alt="${n.data.name}" loading="lazy" />`
      : `<img class="node-photo" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23f0ebe4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='20'%3E${n.data.name.charAt(0)}%3C/text%3E%3C/svg%3E" alt="${n.data.name}" />`;

    const life = [extractYear(n.data.birth), extractYear(n.data.death) || '今'].filter(Boolean).join(' - ');
    const generation = n.depth + 1;

    node.innerHTML = `
      <span class="node-generation">第${generation}世</span>
      ${img}
      <p class="node-name">${n.data.name}</p>
      ${life ? `<p class="node-life">${life}</p>` : ''}
    `;

    node.addEventListener('click', () => onNodeClick(n.data));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNodeClick(n.data);
      }
    });

    container.appendChild(node);
  });

  layout.links.forEach(l => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const sx = l.from.x - minX + NODE_WIDTH / 2;
    const sy = l.from.y - minY;
    const ex = l.to.x - minX + NODE_WIDTH / 2;
    const ey = l.to.y - minY;
    const my = (sy + ey) / 2;
    path.setAttribute('d', `M ${sx} ${sy} C ${sx} ${my}, ${ex} ${my}, ${ex} ${ey}`);
    path.setAttribute('class', 'tree-link');
    linksSvg.appendChild(path);
  });

  linksSvg.setAttribute('width', layout.width + NODE_WIDTH);
  linksSvg.setAttribute('height', layout.height + NODE_HEIGHT);

  return { width: layout.width + NODE_WIDTH, height: layout.height + NODE_HEIGHT, positions };
}

export { renderTree, NODE_WIDTH, NODE_HEIGHT };
