import { formatDate, getGeneration } from './data.js';

function openModal(person, data) {
  const overlay = document.getElementById('modalOverlay');
  const photo = document.getElementById('modalPhoto');
  const name = document.getElementById('modalName');
  const generationEl = document.getElementById('modalGeneration');
  const life = document.getElementById('modalLife');
  const spouse = document.getElementById('modalSpouse');
  const address = document.getElementById('modalAddress');
  const bio = document.getElementById('modalBio');
  const notes = document.getElementById('modalNotes');

  photo.src = person.photo || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250'%3E%3Crect width='400' height='250' fill='%23f0ebe4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='48'%3E${person.name.charAt(0)}%3C/text%3E%3C/svg%3E`;
  photo.alt = person.name;
  name.textContent = person.name;

  const generation = data ? getGeneration(data, person.id) : 0;
  generationEl.textContent = generation > 0 ? `第 ${generation} 世` : '';
  generationEl.style.display = generation > 0 ? 'block' : 'none';

  const lifeText = [formatDate(person.birth), formatDate(person.death) || '今'].filter(Boolean).join(' - ');
  life.textContent = lifeText ? `生卒：${lifeText}` : '';
  life.style.display = lifeText ? 'block' : 'none';

  const spouseText = Array.isArray(person.spouse)
    ? person.spouse.join('、')
    : person.spouse || '';
  spouse.textContent = spouseText ? `配偶：${spouseText}` : '';
  spouse.style.display = spouseText ? 'block' : 'none';

  address.textContent = person.address ? `居住地址：${person.address}` : '';
  address.style.display = person.address ? 'block' : 'none';

  bio.textContent = person.bio || '暂无详细介绍。';

  notes.textContent = person.notes || '';
  notes.style.display = person.notes ? 'block' : 'none';

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}

function initModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  if (!overlay || !closeBtn) return;

  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeModal();
    }
  });
}

export { openModal, closeModal, initModal };
