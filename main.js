// ==========================================
// LOGIC GIAO DIỆN & TƯƠNG TÁC
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

    // Camera Switch Logic (Vá lỗi đổi Camera)
    const cameraSwitchBtn = document.getElementById('camera-switch-btn');
    let currentCamera = 'user'; // Mặc định là cam trước
    
    cameraSwitchBtn.addEventListener('click', () => {
        const sceneEl = document.querySelector('a-scene');
        if (sceneEl.systems && sceneEl.systems['mindar-image-system']) {
            const arSystem = sceneEl.systems['mindar-image-system'];
            try {
                // Tạm dừng hệ thống AR
                arSystem.stop();
                
                // Đổi biến camera
                currentCamera = currentCamera === 'user' ? 'environment' : 'user';
                
                // Cập nhật lại thuộc tính cho A-Frame
                sceneEl.setAttribute('mindar-image', `imageTargetSrc: assets/targets.mind; filterMinCF:0.0001; filterBeta: 0.001; facingMode: ${currentCamera};`);
                
                // Khởi động lại hệ thống AR với camera mới
                arSystem.start();
            } catch (err) {
                console.error("Camera switch error:", err);
            }
        }
    });
});
