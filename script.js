document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('stars-container');

    if (container) {
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.overflow = 'hidden';
        container.style.zIndex = '-1';
        container.style.pointerEvents = 'none';

        const starCount = window.innerWidth < 600 ? 35 : 60; 

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'stars';
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.setProperty('--o', Math.random() * 0.7);
            star.style.setProperty('--d', `${15 + Math.random() * 25}s`);
            star.style.animationDelay = `${Math.random() * 15}s`;
            container.appendChild(star);
        }
    }


    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        const catKey = section.getAttribute('data-category');
        if (localStorage.getItem(`collapsed_${catKey}`) === 'true') {
            section.classList.add('collapsed');
        }
    });
});


function toggleCategory(categoryName) {
    const section = document.querySelector(`.category-section[data-category="${categoryName}"]`);
    if (section) {
        section.classList.toggle('collapsed');
        const isCollapsed = section.classList.contains('collapsed');
        localStorage.setItem(`collapsed_${categoryName}`, isCollapsed);
    }
}


function selectGame(cardElement, title, categoryName, imgSrc, link, description) {
    document.querySelectorAll('.game-card').forEach(card => {
        card.classList.remove('active-card');
    });

    if (cardElement) {
        cardElement.classList.add('active-card');
    }

    const previewImg = document.getElementById('preview-img');
    const previewPlaceholder = document.getElementById('preview-placeholder');

    previewImg.src = imgSrc;
    previewImg.style.display = 'block';
    previewPlaceholder.style.display = 'none';

    previewImg.onerror = function () {
        this.style.display = 'none';
        previewPlaceholder.style.display = 'block';
    };

    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-badge').textContent = categoryName.toUpperCase();

    const descElement = document.getElementById('preview-desc');
    descElement.innerHTML = `<strong>Описание:</strong><br>${description}`;

    const playBtn = document.getElementById('play-btn');
    playBtn.setAttribute('href', link);
    playBtn.classList.remove('disabled');
    playBtn.textContent = `Играть в ${title}`;

    if (window.innerWidth <= 850) {
        const sidebar = document.getElementById('game-info-panel');
        sidebar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}