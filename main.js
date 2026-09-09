// ============================================
// DATABASE: Thẻ bài & mô hình 3D tương ứng
// ============================================
const cardsDatabase = [
    { id: 0, url: 'assets/pokemon/charizard.glb',   theme: 'theme-pokemon', scale: 0.05 },
    { id: 1, url: 'assets/pokemon/pikachu.glb',     theme: 'theme-pokemon', scale: 0.05 },
    { id: 2, url: 'assets/pokemon/rayquaza.glb',    theme: 'theme-pokemon', scale: 0.05 },
    { id: 3, url: 'assets/pokemon/mew.glb',         theme: 'theme-pokemon', scale: 0.05 },
    { id: 4, url: 'assets/yugioh/animated_blue-_eyes_white_dragon_yugioh.glb', theme: 'theme-yugioh', scale: 0.05 },
    { id: 5, url: 'assets/yugioh/dark_magician.glb', theme: 'theme-yugioh', scale: 0.05 }
];

// ============================================
// KHỞI ĐỘNG AR (MindAR THREE.js - 1 WebGL context)
// ============================================
const { MindARThree } = window.MINDAR.IMAGE;

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

// Loader GLB (THREE.GLTFLoader is set globally by three@0.148.0/examples/js/loaders/GLTFLoader.js)
const loader = new THREE.GLTFLoader();
const mixers = [];
const clock = new THREE.Clock();

// Load model cho từng thẻ bài
const scanningOverlay = document.getElementById('scanning-overlay');
const scanningText = document.getElementById('scanning-text');

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
    }, undefined, (err) => {
        console.warn('Model load error:', card.url, err);
    });

    // Tự động đổi theme UI khi quét đúng thẻ
    anchor.onTargetFound = () => {
        scanningOverlay.style.display = 'none';
        const btn = document.querySelector(`.nav-tab[data-theme="${card.theme}"]`);
        if (btn) btn.click();
    };

    anchor.onTargetLost = () => {
        scanningOverlay.style.display = 'flex';
    };
});

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
