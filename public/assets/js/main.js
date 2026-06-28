// ================================
// CRIMINALLY PROLIFIC — main.js
// ================================

// ── Video Modal ──
function openModal(url) {
  document.getElementById('videoIframe').src = url;
  document.getElementById('videoModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('videoModal').classList.remove('open');
  document.getElementById('videoIframe').src = '';
  document.body.style.overflow = '';
}
document.addEventListener('DOMContentLoaded', function () {
  var modal = document.getElementById('videoModal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
  }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

// ── Mobile Nav ──
function toggleNav() {
  var nav = document.getElementById('navMobile');
  if (nav) nav.classList.toggle('open');
}

// ── Toggle Interviews ──
function toggleInterviews() {
  var more = document.getElementById('moreInterviews');
  var btn = document.getElementById('showMoreBtn');
  if (!more || !btn) return;
  if (more.classList.contains('visible')) {
    more.classList.remove('visible');
    btn.textContent = 'Show all interviews ↓';
  } else {
    more.classList.add('visible');
    btn.textContent = 'Show fewer ↑';
  }
}
