//const container = document.getElementById('stars-container');

//if (container) {
//  // Убеждаемся, что контейнер растянут на весь экран и блокирует мышь
//  container.style.position = 'fixed';
//  container.style.top = '0';
//  container.style.left = '0';
//  container.style.width = '100vw';
//  container.style.height = '100vh';
//  container.style.overflow = 'hidden';
//  container.style.zIndex = '-1';
//  container.style.pointerEvents = 'none';

//  for (let i = 0; i < 60; i++) {
//    const star = document.createElement('div');
//    star.className = 'stars';
//    const size = Math.random() * 2 + 1;
//    star.style.width = `${size}px`;
//    star.style.height = `${size}px`;
//    star.style.left = `${Math.random() * 100}%`;
//    star.style.setProperty('--o', Math.random() * 0.7);
//    star.style.setProperty('--d', `${15 + Math.random() * 25}s`);
//    star.style.animationDelay = `${Math.random() * 15}s`;
//    container.appendChild(star);
//  }
//}