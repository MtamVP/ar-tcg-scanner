// ==========================================
// 1. DATABASE: SỔ DANH BẠ QUẢN LÝ THẺ BÀI
// ==========================================
const cardsDatabase = [
    { id: 0, name: "Charizard",   url: "assets/pokemon/charizard.glb", theme: "theme-pokemon", scale: "0.05 0.05 0.05" },
    { id: 1, name: "Pikachu",     url: "assets/pokemon/pikachu.glb",   theme: "theme-pokemon", scale: "0.05 0.05 0.05" },
    { id: 2, name: "Rayquaza",    url: "assets/pokemon/rayquaza.glb",  theme: "theme-pokemon", scale: "0.05 0.05 0.05" },
    { id: 3, name: "Mew",         url: "assets/pokemon/mew.glb",       theme: "theme-pokemon", scale: "0.05 0.05 0.05" },
    { id: 4, name: "Blue Eyes",   url: "assets/yugioh/animated_blue-_eyes_white_dragon_yugioh.glb", theme: "theme-yugioh", scale: "0.05 0.05 0.05" },
    { id: 5, name: "Dark Magician", url: "assets/yugioh/dark-magician.glb", theme: "theme-yugioh", scale: "0.05 0.05 0.05" }
];

// ==========================================
// 2. TỰ ĐỘNG BƠM (INJECT) THẺ BÀI VÀO HTML
// ==========================================
// Để tránh lỗi ngầm của A-Frame khi bơm code, ta gán trực tiếp link 3D vào mô hình
const sceneEl = document.querySelector('a-scene');

cardsDatabase.forEach(card => {
    // Bơm thẻ AR Target để nhận diện hình ảnh
    const targetEl = document.createElement('a-entity');
    targetEl.setAttribute('mindar-image-target', `targetIndex: ${card.id}`);
    targetEl.classList.add('tracking-target');
    targetEl.setAttribute('data-theme', card.theme); // Lưu lại theme để đổi giao diện

    // Bơm mô hình 3D đứng lên trên tấm thẻ (Dùng thẳng URL để tránh lỗi Assets)
    const modelEl = document.createElement('a-gltf-model');
    modelEl.setAttribute('src', card.url);
    modelEl.setAttribute('rotation', '90 0 0');
    modelEl.setAttribute('position', '0 0 0');
    modelEl.setAttribute('scale', card.scale);
    modelEl.setAttribute('animation-mixer', '');
    
    targetEl.appendChild(modelEl);
    sceneEl.appendChild(targetEl);
});

// ==========================================
// 3. LOGIC GIAO DIỆN & TƯƠNG TÁC
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    const scanningOverlay = document.getElementById('scanning-overlay');
    const scanningText = document.getElementById('scanning-text');
    const targets = document.querySelectorAll('.tracking-target');
    const tabs = document.querySelectorAll('.nav-tab');
    
    let activeTargets = 0;

    // Handle UI Tab Switching manually
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const theme = tab.getAttribute('data-theme');
            document.body.className = theme;
            
            if (theme === 'theme-pokemon') {
                scanningText.textContent = "Scanning for Pokémon TCG cards...";
            } else if (theme === 'theme-yugioh') {
                scanningText.textContent = "Scanning for Yu-Gi-Oh! TCG cards...";
            }
        });
    });

    // Handle AR Tracking Events (Tự động đổi theme khi quét đúng thẻ)
    targets.forEach(target => {
        target.addEventListener("targetFound", () => {
            activeTargets++;
            scanningOverlay.style.display = 'none';
            
            // Tự động nhấn vào tab Pokemon hoặc Yugioh tương ứng
            const theme = target.getAttribute('data-theme');
            document.querySelector(`[data-theme="${theme}"]`).click();
        });
        
        target.addEventListener("targetLost", () => {
            activeTargets--;
            if (activeTargets <= 0) {
                activeTargets = 0;
                scanningOverlay.style.display = 'flex';
            }
        });
    });

    // Camera Switch Logic
    const cameraSwitchBtn = document.getElementById('camera-switch-btn');
    cameraSwitchBtn.addEventListener('click', () => {
        if (sceneEl.systems && sceneEl.systems['mindar-image-system']) {
            const arSystem = sceneEl.systems['mindar-image-system'];
            try {
                arSystem.switchCamera();
            } catch (err) {
                console.error("Camera switch error:", err);
            }
        }
    });
});
