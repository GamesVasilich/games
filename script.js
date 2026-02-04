// Ждём полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  // Находим все кубики
  const cubes = document.querySelectorAll('.cube');

  // Для каждого кубика добавляем обработчик клика
  cubes.forEach(cube => {
    cube.addEventListener('click', () => {
      // Получаем номер игры из атрибута data-game
      const gameId = cube.getAttribute('data-game');
      
      // Выводим сообщение (можно заменить на переход к игре)
      alert(`Запускается Игра ${gameId}!`);
      
      // Пример перехода на страницу игры:
      // window.location.href = `game${gameId}.html`;
    });
  });
});
