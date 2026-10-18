let scene, camera, renderer;
let socket;
let myId = null;
let players = {};
let moveX = 0, moveZ = 0;
let camY = 0, camX = 0;
let playerPos = new THREE.Vector3(0, 1.5, 0);
let playerHp = 100;
let isDead = false;
let pingTimer = null;
let lastPongTime = Date.now();

let weapons = [
    { name: "Пистолет", damage: 25, maxAmmo: 7, ammo: 7, reloadTime: 1200 },
    { name: "Дробовик", damage: 60, maxAmmo: 2, ammo: 2, reloadTime: 2000 },
    { name: "Автомат", damage: 15, maxAmmo: 30, ammo: 30, reloadTime: 1500 }
];
let currentWeaponIndex = 0;
let isReloading = false;
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const clock = new THREE.Clock();

function startJoin() {
    let rawIp = document.getElementById('server-ip').value;
    let name = document.getElementById('player-name').value;

    localStorage.setItem("gb_player_name", name);
    localStorage.setItem("gb_server_ip", rawIp);
    saveToHistory(rawIp);

    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';

    if (isMobile) {
        document.getElementById('joystick-zone').style.display = 'block';
        document.getElementById('reload-btn').style.display = 'flex';
    }

    initEngine();
    initControls();

    socket = io(`http://${rawIp}`);

    socket.on('connect', () => {
        myId = socket.id;
        socket.emit('join', { name: name, x: playerPos.x, y: playerPos.y, z: playerPos.z });
        startHeartbeat();
    });

    socket.on('server_pong', () => {
        lastPongTime = Date.now();
    });

    socket.on('currentPlayers', (serverPlayers) => {
        for (let id in serverPlayers) {
            if (id !== myId) addRemotePlayer(id, serverPlayers[id]);
        }
    });

    socket.on('newPlayer', (data) => {
        if (data.id !== myId) addRemotePlayer(data.id, data);
    });

    socket.on('playerMoved', (data) => {
        if (players[data.id]) {
            players[data.id].targetPos.set(data.x, data.y, data.z);
        }
    });

    socket.on('playerShoot', () => {
        triggerScreenFlash('#551111');
    });

    socket.on('playerDamaged', (data) => {
        if (data.id === myId) {
            playerHp = data.hp;
            document.getElementById('hp-val').innerText = playerHp;
            triggerScreenFlash('#aa0000');
        }
    });

    socket.on('playerKilled', (data) => {
        if (data.id === myId) {
            isDead = true;
            document.getElementById('death-screen').style.display = 'flex';
            document.getElementById('game-ui').style.display = 'none';
            if (document.pointerLockElement) document.exitPointerLock();
        }
    });

    socket.on('playerRespawned', (data) => {
        if (data.id === myId) {
            playerPos.set(data.x, data.y || 1.5, data.z);
            playerHp = data.hp;
            document.getElementById('hp-val').innerText = playerHp;
            isDead = false;
            document.getElementById('death-screen').style.display = 'none';
            document.getElementById('game-ui').style.display = 'block';
        }
    });



    socket.on('disconnectPlayer', (id) => {
        if (players[id]) {
            scene.remove(players[id].mesh);
            delete players[id];
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const savedName = localStorage.getItem("gb_player_name");
    const savedIp = localStorage.getItem("gb_server_ip");

    if (savedName) document.getElementById('player-name').value = savedName;
    if (savedIp) document.getElementById('server-ip').value = savedIp;

    renderServerHistory();
});

function renderServerHistory() {
    const historyContainer = document.getElementById('server-history');
    if (!historyContainer) return;

    historyContainer.innerHTML = "";
    let history = JSON.parse(localStorage.getItem("gb_server_history") || "[]");

    if (history.length === 0) {
        historyContainer.innerHTML = '<div style="color:#555; text-align:center; font-size:12px;">История пуста</div>';
        return;
    }

    history.forEach(ip => {
        let item = document.createElement('div');
        item.className = 'history-item';
        item.innerText = ip;
        item.onclick = () => {
            document.getElementById('server-ip').value = ip;
        };
        historyContainer.appendChild(item);
    });
}

function saveToHistory(ip) {
    if (!ip || ip.trim() === "") return;

    let cleanedIp = ip.trim();
    let history = JSON.parse(localStorage.getItem("gb_server_history") || "[]");

    history = history.filter(item => item !== cleanedIp);
    history.unshift(cleanedIp);

    if (history.length > 5) {
        history.pop();
    }

    localStorage.setItem("gb_server_history", JSON.stringify(history));
    renderServerHistory(); 
}


function startHeartbeat() {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
        if (!socket) return;
        lastPongTime = Date.now();
        socket.emit('client_ping');

        setTimeout(() => {
            if (Date.now() - lastPongTime > 10000) {
                alert('Ошибка: Потеряно соединение с сервером! Возврат в меню.');
                disconnectToMenu();
            }
        }, 3000);
    }, 10000);
}

function respawnPlayer() {
    if (socket) {
        socket.emit('respawnMe');
    }
}


function returnToMenu() {
    if (socket) socket.disconnect();
    if (pingTimer) clearInterval(pingTimer);
    location.reload();
}

function disconnectToMenu() {
    if (socket) socket.disconnect();
    if (pingTimer) clearInterval(pingTimer);
    location.reload();
}

function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.FogExp2(0x1a1a1a, 0.012);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(playerPos);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    let dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    let floor = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 300),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    let wallMat = new THREE.MeshStandardMaterial({ color: 0x551111, roughness: 0.5 });
    let w1 = new THREE.Mesh(new THREE.BoxGeometry(300, 10, 2), wallMat); w1.position.set(0, 5, -150); scene.add(w1);
    let w2 = new THREE.Mesh(new THREE.BoxGeometry(300, 10, 2), wallMat); w2.position.set(0, 5, 150); scene.add(w2);
    let w3 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 300), wallMat); w3.position.set(-150, 5, 0); scene.add(w3);
    let w4 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 300), wallMat); w4.position.set(150, 5, 0); scene.add(w4);

    for (let i = 0; i < 40; i++) {
        let box = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            new THREE.MeshStandardMaterial({ color: 0x8b0000 })
        );
        box.position.set((Math.random() - 0.5) * 260, 2, (Math.random() - 0.5) * 260);
        scene.add(box);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    clock.getDelta(); 
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    let delta = clock.getDelta();

    if (!isDead) {
        let speed = 5.0;
        playerPos.x += moveX * speed * delta;
        playerPos.z += moveZ * speed * delta;

        camera.position.copy(playerPos);

        if (socket && socket.connected && (moveX !== 0 || moveZ !== 0)) {
            socket.emit('move', { x: playerPos.x, y: playerPos.y, z: playerPos.z });
        }
    }
    for (let id in players) {
        let p = players[id];
        p.mesh.position.lerp(p.targetPos, 0.2);
    }

    renderer.render(scene, camera);
}

function addRemotePlayer(id, data) {
    let group = new THREE.Group();
    let body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.8, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xe74c3c })
    );
    body.position.y = -0.6;
    group.add(body);
    group.position.set(data.x, data.y || 1.5, data.z);
    scene.add(group);

    players[id] = {
        mesh: group,
        targetPos: new THREE.Vector3(data.x, data.y || 1.5, data.z)
    };
}


function selectWeapon(index) {
    if (isReloading || isDead) return;
    currentWeaponIndex = index;
    document.querySelectorAll('.weapon-slot').forEach((el, idx) => {
        el.classList.toggle('active', idx === index);
    });
    let w = weapons[currentWeaponIndex];
    document.getElementById('weapon-val').innerText = w.name;
    document.getElementById('ammo-val').innerText = `${w.ammo} / ${w.maxAmmo}`;
}

function reloadWeapon() {
    let w = weapons[currentWeaponIndex];
    if (isReloading || w.ammo === w.maxAmmo || isDead) return;
    isReloading = true;
    let notif = document.getElementById('notification');
    notif.innerText = `Перезарядка ${w.name}... скрип-треск!`;
    notif.style.display = 'block';

    setTimeout(() => {
        w.ammo = w.maxAmmo;
        document.getElementById('ammo-val').innerText = `${w.ammo} / ${w.maxAmmo}`;
        notif.style.display = 'none';
        isReloading = false;
    }, w.reloadTime);
}

function shootWeapon() {
    if (!socket || isReloading || isDead) return;
    let w = weapons[currentWeaponIndex];
    if (w.ammo <= 0) { reloadWeapon(); return; }

    w.ammo--;
    document.getElementById('ammo-val').innerText = `${w.ammo} / ${w.maxAmmo}`;
    socket.emit('shoot');
    triggerScreenFlash('#553311');

    let ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);

    let targets = [];
    for (let id in players) targets.push(players[id].mesh.children[0]);

    let hits = ray.intersectObjects(targets);
    if (hits.length > 0 && hits[0].distance < 45) {
        let hitMesh = hits[0].object;
        for (let id in players) {
            if (players[id].mesh.children[0] === hitMesh) {
                socket.emit('hitPlayer', { id: id, damage: w.damage });
            }
        }
    }
}

function triggerScreenFlash(color) {
    document.body.style.backgroundColor = color;
    setTimeout(() => document.body.style.backgroundColor = '#1a1a1a', 60);
}

function initControls() {
    let keys = {};
    window.addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'KeyR') reloadWeapon(); });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    window.addEventListener('mousedown', (e) => { if (e.button === 0 && !isMobile && !isDead) shootWeapon(); });
    camera.rotation.order = 'YXZ';

    window.addEventListener('mousemove', (e) => {
        if (!isMobile && !isDead && document.pointerLockElement === renderer.domElement) {
            camY -= e.movementX * 0.002;
            camX -= e.movementY * 0.002;
            camX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camX));
        }
    });

    renderer.domElement.addEventListener('click', () => {
        if (!isMobile && !isDead) renderer.domElement.requestPointerLock();
    });

    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    let touchId = null;
    let center = { x: 60, y: 60 };

    if (zone) {
        zone.addEventListener('touchstart', (e) => { touchId = e.changedTouches[0].identifier; });
        zone.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                let t = e.changedTouches[i];
                if (t.identifier === touchId) {
                    let rect = zone.getBoundingClientRect();
                    let x = t.clientX - rect.left - center.x;
                    let y = t.clientY - rect.top - center.y;
                    let dist = Math.hypot(x, y);
                    let max = 35;
                    if (dist > max) { x = (x / dist) * max; y = (y / dist) * max; }
                    knob.style.transform = `translate(${x}px, ${y}px)`;
                    moveX = x / max;
                    moveZ = y / max;
                }
            }
        });
        zone.addEventListener('touchend', () => {
            touchId = null;
            if (knob) knob.style.transform = `translate(0px, 0px)`;
            moveX = 0; moveZ = 0;
        });
    }
    let lastX = 0, lastY = 0;
    window.addEventListener('touchstart', (e) => {
        if (e.target.closest('#joystick-zone') || e.target.closest('.action-btns') || e.target.closest('#weapon-selector')) return;
        if (e.touches.length > 0) {
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (e.target.closest('#joystick-zone') || e.target.closest('.action-btns') || e.target.closest('#weapon-selector')) return;
        if (e.touches.length > 0) {
            let t = e.touches[0]; 
            camY -= (t.clientX - lastX) * 0.005;
            camX -= (t.clientY - lastY) * 0.005;
            camX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camX));

            lastX = t.clientX;
            lastY = t.clientY;
        }
    });

    window.pcKeys = keys;
}

function animate() {
    requestAnimationFrame(animate);

    if (!isDead) {
        let speed = 0.15;
        let fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), camY);
        let right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), camY);

        let mX = 0;
        let mZ = 0;

        if (!isMobile && window.pcKeys && (
            window.pcKeys['KeyW'] || window.pcKeys['ArrowUp'] ||
            window.pcKeys['KeyS'] || window.pcKeys['ArrowDown'] ||
            window.pcKeys['KeyA'] || window.pcKeys['ArrowLeft'] ||
            window.pcKeys['KeyD'] || window.pcKeys['ArrowRight']
        )) {
            if (window.pcKeys['KeyW'] || window.pcKeys['ArrowUp']) mZ = -1;
            if (window.pcKeys['KeyS'] || window.pcKeys['ArrowDown']) mZ = 1;
            if (window.pcKeys['KeyA'] || window.pcKeys['ArrowLeft']) mX = -1;
            if (window.pcKeys['KeyD'] || window.pcKeys['ArrowRight']) mX = 1;
        } else {
            mX = moveX;
            mZ = moveZ;
        }

        playerPos.add(fwd.clone().multiplyScalar(-mZ * speed));
        playerPos.add(right.clone().multiplyScalar(mX * speed));
        playerPos.x = Math.max(-145, Math.min(145, playerPos.x));
        playerPos.z = Math.max(-145, Math.min(145, playerPos.z));

        camera.position.copy(playerPos);
        camera.rotation.y = camY;
        camera.rotation.x = camX;
        camera.rotation.z = 0;

        if (socket && (mX !== 0 || mZ !== 0)) {
            socket.emit('move', { x: playerPos.x, y: playerPos.y, z: playerPos.z });
        }
    }
    for (let id in players) {
        let p = players[id];
        if (p && p.mesh && p.targetPos) {
            p.mesh.position.lerp(p.targetPos, 0.2);
        }
    }

    renderer.render(scene, camera);
}

