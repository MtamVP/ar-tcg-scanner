import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from 'mindar-image-three';

// ============================================
// DATABASE: Thẻ bài & mô hình 3D tương ứng
// ============================================
const cardsDatabase = [
    { id: 0, url: 'assets/pokemon/charizard.glb',   theme: 'theme-pokemon', scale: 0.1 },
    { id: 1, url: 'assets/pokemon/pikachu.glb',     theme: 'theme-pokemon', scale: 0.15 },
    { id: 2, url: 'assets/pokemon/rayquaza.glb',    theme: 'theme-pokemon', scale: 0.08 },
    { id: 3, url: 'assets/pokemon/mew.glb',         theme: 'theme-pokemon', scale: 0.12 },
    { id: 4, url: 'assets/yugioh/animated_blue-_eyes_white_dragon_yugioh.glb', theme: 'theme-yugioh', scale: 0.1 },
    { id: 5, url: 'assets/yugioh/dark_magician.glb', theme: 'theme-yugioh', scale: 0.1 }
];

// ============================================
// KHỞI ĐỘNG AR (MindAR THREE.js - 1 WebGL context)
// ============================================
const mindarThree = new MindARThree({
    container: document.querySelector('#ar-container'),
    imageTargetSrc: 'assets/targets.mind',
    filterMinCF: 0.0001,
    filterBeta: 0.001,
});

const { renderer, scene, camera } = mindarThree;

// Ánh sáng
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(0.5, 1, 1);
scene.add(dirLight);

// Loader GLB (using imported ES Module GLTFLoader)
const loader = new GLTFLoader();
const mixers = [];
const clock = new THREE.Clock();

// Load model cho từng thẻ bài
const scanningOverlay = document.getElementById('scanning-overlay');
const scanningText = document.getElementById('scanning-text');

// Lưu trữ model để xoay
const activeModels = new Set();
const loadedModels = {};

cardsDatabase.forEach(card => {
    const anchor = mindarThree.addAnchor(card.id);

    loader.load(card.url, (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(card.scale);
        model.rotation.x = Math.PI / 2; // Đứng thẳng lên
        anchor.group.add(model);

        // Animation
        if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach(clip => mixer.clipAction(clip).play());
            mixers.push(mixer);
        }
        
        loadedModels[card.id] = model;
    }, undefined, (err) => {
        console.warn('Model load error:', card.url, err);
    });

    // Tự động đổi theme UI khi quét đúng thẻ
    anchor.onTargetFound = () => {
        activeModels.add(card.id);
        scanningOverlay.style.display = 'none';
        const btn = document.querySelector(`.nav-tab[data-theme="${card.theme}"]`);
        if (btn) btn.click();
    };

    anchor.onTargetLost = () => {
        activeModels.delete(card.id);
        if (activeModels.size === 0) {
            scanningOverlay.style.display = 'flex';
        }
    };
});

// ============================================
// TƯƠNG TÁC: Xoay mô hình
// ============================================
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

document.addEventListener('pointerdown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.offsetX, y: e.offsetY };
});

document.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y
    };
    
    // Xoay tất cả model đang hiện trên màn hình
    activeModels.forEach(id => {
        const model = loadedModels[id];
        if (model) {
            // Xoay quanh trục Z của màn hình (trục Y của model nằm dọc)
            model.rotation.y += deltaMove.x * 0.01;
            // Cho phép xoay lên xuống một chút (trục X)
            model.rotation.x += deltaMove.y * 0.01;
        }
    });

    previousMousePosition = { x: e.offsetX, y: e.offsetY };
});

document.addEventListener('pointerup', () => { isDragging = false; });
document.addEventListener('pointercancel', () => { isDragging = false; });

// ============================================
// GIAO DIỆN: Tab switching
// ============================================
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const theme = tab.getAttribute('data-theme');
        document.body.className = theme;
        scanningText.textContent = theme === 'theme-pokemon'
            ? 'Scanning for Pokémon TCG cards...'
            : 'Scanning for Yu-Gi-Oh! TCG cards...';
    });
});

// ============================================
// KHỞI ĐỘNG & CAMERA SWITCH
// ============================================
const cameraSwitchBtn = document.getElementById('camera-switch-btn');
let facingMode = 'environment';

const startAR = async () => {
    try {
        await mindarThree.start();
        cameraSwitchBtn.style.opacity = '1';

        // Vòng lặp render
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();
            mixers.forEach(m => m.update(delta));
            renderer.render(scene, camera);
        });
    } catch (err) {
        console.error('AR start failed:', err);
        scanningText.textContent = '❌ Không thể mở Camera. Hãy cấp quyền và thử lại!';
    }
};

cameraSwitchBtn.addEventListener('click', async () => {
    if (cameraSwitchBtn.style.opacity === '0.4') return;
    try {
        renderer.setAnimationLoop(null);
        await mindarThree.stop();
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        
        // Tạo lại MindAR với camera mới
        const newMindar = new MindARThree({
            container: document.querySelector('#ar-container'),
            imageTargetSrc: 'assets/targets.mind',
            filterMinCF: 0.0001,
            filterBeta: 0.001,
            facingMode: facingMode,
        });
        Object.assign(mindarThree, newMindar);
        await startAR();
    } catch (err) {
        console.error('Camera switch error:', err);
    }
});

startAR();
