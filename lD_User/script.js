let isEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
    // Звездный фон
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

        for (let i = 0; i < 40; i++) {
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

    loadProfileData();

    document.getElementById('display-thought').addEventListener('input', saveProfileData);
    document.getElementById('display-bio').addEventListener('input', saveProfileData);
});

function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('edit-btn');
    const thoughtBox = document.getElementById('display-thought');
    const bioBox = document.getElementById('display-bio');
    const statusSelect = document.getElementById('user-status-select');
    const birthInput = document.getElementById('user-birthdate');
    const uploadBtn = document.getElementById('upload-photo-ui');

    thoughtBox.contentEditable = isEditMode;
    bioBox.contentEditable = isEditMode;
    statusSelect.disabled = !isEditMode;
    birthInput.disabled = !isEditMode;

    if (isEditMode) {
        editBtn.textContent = '💾 Готово';
        editBtn.classList.add('active');
        uploadBtn.style.display = 'block';
        thoughtBox.focus();
    } else {
        editBtn.textContent = '✏️ Редактировать';
        editBtn.classList.remove('active');
        uploadBtn.style.display = 'none';
        saveProfileData();
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Image = e.target.result;
        localStorage.setItem('hud_user_avatar', base64Image);

        const profileImg = document.getElementById('profile-img');
        const profileEmoji = document.getElementById('profile-emoji');

        profileImg.src = base64Image;
        profileImg.style.display = 'block';
        profileEmoji.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function saveProfileData() {
    const thought = document.getElementById('display-thought').textContent;
    const bio = document.getElementById('display-bio').textContent;
    const status = document.getElementById('user-status-select').value;
    const birthdate = document.getElementById('user-birthdate').value;

    localStorage.setItem('hud_user_thought', thought);
    localStorage.setItem('hud_user_bio', bio);
    localStorage.setItem('hud_user_status', status);
    localStorage.setItem('hud_user_birthdate', birthdate);

    calculateAge(birthdate);
    updateStatsDisplay();
}

function loadProfileData() {
    const savedThought = localStorage.getItem('hud_user_thought');
    const savedBio = localStorage.getItem('hud_user_bio');
    const savedStatus = localStorage.getItem('hud_user_status');
    const savedBirthdate = localStorage.getItem('hud_user_birthdate');
    const savedAvatar = localStorage.getItem('hud_user_avatar');

    if (savedThought !== null) document.getElementById('display-thought').textContent = savedThought;
    else document.getElementById('display-thought').textContent = 'Статус: в разработке...';

    if (savedBio !== null) document.getElementById('display-bio').textContent = savedBio;
    else document.getElementById('display-bio').textContent = 'Описание о себе и идеи...';

    if (savedStatus) document.getElementById('user-status-select').value = savedStatus;
    if (savedBirthdate) document.getElementById('user-birthdate').value = savedBirthdate;

    const profileImg = document.getElementById('profile-img');
    const profileEmoji = document.getElementById('profile-emoji');

    if (savedAvatar) {
        profileImg.src = savedAvatar;
        profileImg.style.display = 'block';
        profileEmoji.style.display = 'none';
    } else {
        profileImg.style.display = 'none';
        profileEmoji.style.display = 'block';
    }

    if (savedBirthdate) calculateAge(savedBirthdate);
    updateStatsDisplay();
}

function calculateAge(birthdateString) {
    const ageBadge = document.getElementById('calculated-age');
    if (!birthdateString) {
        ageBadge.textContent = 'Возраст: --';
        return;
    }

    const birthDate = new Date(birthdateString);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (!isNaN(age) && age >= 0) {
        ageBadge.textContent = `Возраст: ${age} лет`;
    } else {
        ageBadge.textContent = 'Ошибка в дате';
    }
}

function updateStatsDisplay() {
    const statusSelect = document.getElementById('user-status-select');
    const statusTextMap = {
        'online': '🟢 В сети',
        'ingame': '🟣 В игре',
        'offline': '⚪ Не в сети'
    };
    document.getElementById('stat-status-text').textContent = statusTextMap[statusSelect.value] || 'В сети';
}