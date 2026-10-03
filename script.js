/**
 * VMOS Cloud Console - Main Application Script
 * รองรับการจัดการแพ็กเกจ, สตรีมมิ่งหน้าจอ Android, และการควบคุมอุปกรณ์
 */

// ================= 1. STATE MANAGEMENT =================
const appState = {
    selectedPackage: localStorage.getItem('vmos_pkg_name') || 'Standard Cloud (2 CPU / 4GB)',
    sessionHours: localStorage.getItem('vmos_pkg_hours') || 2,
    streamUrl: localStorage.getItem('vmos_stream_url') || '',
    isConnected: false
};

// ================= 2. INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    initPackageDisplay();
    initStreamUrl();
});

/**
 * แสดงผลแพ็กเกจปัจจุบันที่เลือกไว้บนหน้า Console
 */
function initPackageDisplay() {
    const pkgBadge = document.getElementById('activePkgBadge');
    if (pkgBadge) {
        pkgBadge.innerText = appState.selectedPackage;
        
        // ปรับแต่งสีสีกรณีเลือกแพ็กเกจ Ultra Monster
        if (appState.selectedPackage.includes('1024 CPU') || appState.selectedPackage.includes('Ultra Monster')) {
            pkgBadge.style.background = 'linear-gradient(90deg, #9333ea, #ec4899)';
            pkgBadge.style.color = '#fff';
            pkgBadge.style.fontWeight = 'bold';
        }
    }
}

/**
 * โหลด URL การเชื่อมต่อที่เคยบันทึกไว้
 */
function initStreamUrl() {
    const urlInput = document.getElementById('ngrokUrlInput');
    if (urlInput && appState.streamUrl) {
        urlInput.value = appState.streamUrl;
        connectStream(); // เชื่อมต่ออัตโนมัติถ้ามี URL บันทึกอยู่
    }
}

// ================= 3. PACKAGE SELECTION & NAVIGATION =================

/**
 * เลือกแพ็กเกจจากหน้า Package Selection
 * @param {string} pkgName - ชื่อแพ็กเกจและสเปก
 * @param {number} hours - จำนวนชั่วโมงที่ใช้งานได้
 */
function selectPackage(pkgName, hours) {
    appState.selectedPackage = pkgName;
    appState.sessionHours = hours;

    // บันทึกลง LocalStorage
    localStorage.setItem('vmos_pkg_name', pkgName);
    localStorage.setItem('vmos_pkg_hours', hours);

    showToast(`เลือกแพ็กเกจ ${pkgName} เรียบร้อยแล้ว!`);

    // สลับไปยังหน้า Console
    setTimeout(() => {
        switchPage('consolePage');
        initPackageDisplay();
    }, 500);
}

/**
 * สลับการแสดงผลระหว่างหน้า
 * @param {string} pageId - ID ของหน้าเพจที่ต้องการแสดง ('packagePage' หรือ 'consolePage')
 */
function switchPage(pageId) {
    const pkgPage = document.getElementById('packagePage');
    const consolePage = document.getElementById('consolePage');

    if (pageId === 'consolePage') {
        if (pkgPage) pkgPage.style.display = 'none';
        if (consolePage) consolePage.style.display = 'flex';
    } else {
        if (pkgPage) pkgPage.style.display = 'block';
        if (consolePage) consolePage.style.display = 'none';
    }
}

// ================= 4. STREAM & SCREEN CONTROLLER =================

/**
 * เชื่อมต่อ Ngrok / WebRTC Stream เข้ากับ iFrame หน้าจอ Android
 */
function connectStream() {
    const urlInput = document.getElementById('ngrokUrlInput');
    const streamFrame = document.getElementById('cloudPhoneStream');
    const placeholder = document.getElementById('screenPlaceholder');

    if (!urlInput || !streamFrame) return;

    let url = urlInput.value.trim();

    if (!url) {
        showToast('กรุณากรอก URL ngrok หรือ IP ของเซิร์ฟเวอร์ก่อน!', 'error');
        return;
    }

    // เติม http:// หรือ https:// ให้อัตโนมัติหากไม่ได้ระบุ
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
        urlInput.value = url;
    }

    // บันทึก URL
    appState.streamUrl = url;
    localStorage.setItem('vmos_stream_url', url);

    // แสดงผล Stream
    streamFrame.src = url;
    streamFrame.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

    appState.isConnected = true;
    showToast('เชื่อมต่อสตรีมหน้าจอสำเร็จ!');
}

/**
 * รีโหลดหน้าจอ Stream
 */
function reloadStream() {
    const streamFrame = document.getElementById('cloudPhoneStream');
    if (streamFrame && appState.isConnected) {
        const currentSrc = streamFrame.src;
        streamFrame.src = '';
        setTimeout(() => {
            streamFrame.src = currentSrc;
            showToast('ทำการรีเฟรชหน้าจอเรียบร้อย');
        }, 300);
    } else {
        showToast('ยังไม่ได้เชื่อมต่อสตรีมหน้าจอ', 'error');
    }
}

/**
 * เปิดการแสดงผลแบบเต็มหน้าจอ (Fullscreen)
 */
function toggleFullscreen() {
    const container = document.querySelector('.phone-frame');
    if (!container) return;

    if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ================= 5. ANDROID NAVIGATION CONTROLS =================

/**
 * ส่งคำสั่งปุ่มควบคุม Android (Home, Back, Recent Apps)
 * @param {string} action - Action command ('back', 'home', 'recents')
 */
function sendAndroidKey(action) {
    if (!appState.isConnected) {
        showToast('กรุณาเชื่อมต่ออุปกรณ์ก่อนส่งคำสั่ง', 'error');
        return;
    }

    console.log(`[Android Key Event]: ${action}`);
    showToast(`ส่งคำสั่ง: ${action.toUpperCase()}`);

    // สำหรับขยายระบบ ADB WebSocket หรือ PostMessage API ในอนาคต
    const streamFrame = document.getElementById('cloudPhoneStream');
    if (streamFrame && streamFrame.contentWindow) {
        streamFrame.contentWindow.postMessage({ type: 'ANDROID_KEY', key: action }, '*');
    }
}

/**
 * รีสตาร์ทอินสแตนซ์ Android (Reboot Device)
 */
function restartDevice() {
    if (confirm('คุณต้องการรีสตาร์ทเครื่อง Android ใช่หรือไม่?')) {
        showToast('กำลังรีสตาร์ทระบบ Android Cloud...');
        const placeholder = document.getElementById('screenPlaceholder');
        const streamFrame = document.getElementById('cloudPhoneStream');

        if (streamFrame) streamFrame.style.display = 'none';
        if (placeholder) {
            placeholder.style.display = 'flex';
            placeholder.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><p>กำลังเริ่มระบบใหม่...</p>';
        }

        setTimeout(() => {
            if (placeholder) {
                placeholder.innerHTML = '<i class="fa-solid fa-mobile-screen"></i><p>รอนำเข้า URL ngrok / WebRTC เพื่อสตรีมหน้าจอ</p>';
            }
            if (appState.streamUrl) connectStream();
        }, 5000);
    }
}

// ================= 6. UTILITY FUNCTIONS =================

/**
 * แสดงการแจ้งเตือน Toast Message
 * @param {string} message - ข้อความแจ้งเตือน
 * @param {string} type - ประเภทการแจ้งเตือน ('success' หรือ 'error')
 */
function showToast(message, type = 'success') {
    // ลบ Toast เก่าถ้ามี
    const oldToast = document.getElementById('vmosToast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'vmosToast';
    toast.innerText = message;
    
    // สไตล์ของ Toast Notification
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '8px',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '14px',
        zIndex: '9999',
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        transition: 'all 0.3s ease',
        background: type === 'error' ? '#ef4444' : 'linear-gradient(90deg, #0088ff, #00d2ff)'
    });

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
