// Kiểm tra file .mind có load được không trước khi khởi động AR
fetch('assets/targets.mind', { method: 'HEAD' })
    .then(res => {
        if (!res.ok) {
            alert(`❌ Lỗi: Không tìm thấy file targets.mind (HTTP ${res.status}). Vui lòng kiểm tra lại thư mục assets!`);
        }
    })
    .catch(() => alert('❌ Lỗi mạng: Không thể truy cập file targets.mind!'));

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

    // Camera Switch Logic - Chờ AR sẵn sàng mới cho bấm
    const cameraSwitchBtn = document.getElementById('camera-switch-btn');
    let currentFacingMode = 'environment'; // Mặc định: cam sau (cho điện thoại)
    let arSystemReady = false;

    const sceneEl = document.querySelector('a-scene');

    // Lắng nghe sự kiện AR khởi động xong mới kích hoạt nút
    sceneEl.addEventListener('arReady', () => {
        arSystemReady = true;
        cameraSwitchBtn.style.opacity = '1';
    });

    cameraSwitchBtn.style.opacity = '0.4'; // Mờ khi chưa sẵn sàng

    cameraSwitchBtn.addEventListener('click', () => {
        if (!arSystemReady) return; // Bỏ qua nếu AR chưa xong

        const arSystem = sceneEl.systems['mindar-image-system'];
        if (!arSystem) return;

        try {
            arSystem.stop();
            currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
            sceneEl.setAttribute('mindar-image', `imageTargetSrc: assets/targets.mind; filterMinCF:0.0001; filterBeta: 0.001; facingMode: ${currentFacingMode};`);
            setTimeout(() => arSystem.start(), 300);
        } catch (err) {
            console.error("Camera switch error:", err);
        }
    });
});
