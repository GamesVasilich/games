// Глобальные переменные
let renderer, scene, camera, controls;
let raycaster, mouse;
let blocks = {}; // Хэш: 'x,y,z' → THREE.Mesh
const BLOCK_SIZE = 1;
const WORLD_SIZE = 32;
const textures = {};
const keys = {};

// Инициализация Three.js
function init() {
  // Рендерер
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x87ceeb); // Небо
  document.body.appendChild(renderer.domElement);

  // Сцена и камера
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 5);

  // Управление (захват указателя)
  controls = new THREE.PointerLockControls(camera, document.body);
  document.body.addEventListener('click', () => controls.lock());

  // Освещение
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5, 10, 7).normalize();
  scene.add(directional);

  // Луч для взаимодействия
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Текстуры (замещаем на цветные материалы, если нет доступа к ресурсам)
  ['grass', 'dirt', 'stone'].forEach(name => {
    // Если загрузка не удалась — используем сплошной цвет
    const loader = new THREE.TextureLoader();
    loader.load(
      `https://threejs.org/examples/textures/${name}.png`,
      tex => { textures[name] = tex; },
      () => { textures[name] = new THREE.Color(getColorFor(name)); }
    );
  });

  // Генерация ландшафта
  generateTerrain();

  // Обработчики событий
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  window.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

  // Запуск анимации
  animate();
}

// Генерация ландшафта
function generateTerrain() {
  const perlin = new PerlinNoise();
  
  for (let x = -WORLD_SIZE; x < WORLD_SIZE; x++) {
    for (let z = -WORLD_SIZE; z < WORLD_SIZE; z++) {
      const height = Math.floor(perlin.noise(x * 0.1, z * 0.1) * 5 + 5);
      
      for (let y = 0; y < height; y++) {
        const material = new THREE.MeshPhongMaterial({
          map: textures[y === height - 1 ? 'grass' : 'dirt']
        });
        
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE),
          material
        );
        block.position.set(x, y, z);
        scene.add(block);
        blocks[`${x},${y},${z}`] = block;
      }
    }
  }
}

// Добавление блока
function addBlock(pos) {
  const material = new THREE.MeshPhongMaterial({ map: textures.stone });
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE),
    material
  );
  block.position.copy(pos);
  scene.add(block);
  blocks[`${pos.x},${pos.y},${pos.z}`] = block;
}

// Удаление блока
function removeBlock(pos) {
  const key = `${pos.x},${pos.y},${pos.z}`;
  if (blocks[key]) {
    scene.remove(blocks[key]);
    delete blocks[key];
  }
}

// Обработка клика мыши
function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(Object.values(blocks));

  if (intersects.length > 0) {
    const point = intersects[0].point;
    const pos = new THREE.Vector3(
      Math.round(point.x),
      Math.round(point.y),
      Math.round(point.z)
    );

    if (event.button === 0) { // ЛКМ — удалить
      removeBlock(pos);
    } else if (event.button === 2) { // ПКМ — добавить над блоком
      addBlock(pos.clone().add(new THREE.Vector3(0, 1, 0)));
    }
  }
}

// Движение игрока
function updatePlayer() {
  const speed = 0.2;
  const jumpHeight = 0.5;

  if (keys['w']) controls.moveForward(speed);
  if (keys['s']) controls.moveForward(-speed);
  if (keys['a']) controls.moveRight(-speed);
  if (keys['d']) controls.moveRight(speed);
  
  // Прыжок (только если на земле)
  if (keys[' '] && Math.abs(camera.position.y - 10) < 0.1) {
    camera.position.y += jumpHeight;
  }

  // Гравитация (плавно опускаем на высоту 10)
  if (camera.position.y > 10) {
    camera.position.y -= 0.05;
  }
}

// Анимация
function animate() {
  requestAnimationFrame(animate);

  updatePlayer();
  controls.update();
  renderer.render(scene, camera);

  // Обновляем высоту в интерфейсе (если есть элемент #height)
  const heightEl = document.getElementById('height');
  if (heightEl) {
    heightEl.textContent = Math.floor(camera.position.y - 10); // Относительно земли
  }
}

// Адаптация под размер окна
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Цвета для замены текстур (если загрузка не удалась)
function getColorFor(name) {
  switch (name) {
    case 'grass': return 0x228B22;
    case 'dirt': return 0xA0522D;
    case 'stone': return 0x808080;
    default: return 0xffffff;
  }
}

// Запуск
window.addEventListener('load', init);