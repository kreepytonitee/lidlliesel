document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('link-wall');
  const unlockBtn = document.getElementById('unlock-btn');
  const content = document.getElementById('chapter-content');
  const banner = document.getElementById('affiliate-banner');

  fetch('/data/affiliates.json')
    .then(res => res.json())
    .then(links => {
      const randomLink = links[Math.floor(Math.random() * links.length)];

      banner.innerHTML = `
        <a href="${randomLink.link_url}" target="_blank">
          <img src="${randomLink.image_url}" alt="${randomLink.alt_text}">
          <span>${randomLink.product_name}</span>
        </a>
      `;

      unlockBtn.onclick = () => {
        window.open(randomLink.link_url, '_blank');
        overlay.style.display = 'none';
        content.style.display = 'block';
      };
    });
});
