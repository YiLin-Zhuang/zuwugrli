// 工具函式
function formatMoney(num) {
    return Number(num).toLocaleString();
}

function showLoading() {
    document.getElementById("loading").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

// ===== Toast 通知系統 =====
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;

    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    toast.innerHTML = `
        <i class="fa-solid ${icons[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // 動畫：進入
    setTimeout(() => toast.classList.remove('toast-enter'), 10);

    // 動畫：退出
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===== 自訂確認對話框 =====
function showConfirmModal({ title, message, confirmText = '確認', cancelText = '取消', onConfirm, confirmClass = 'btn-confirm' }) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <i class="fa-solid fa-circle-info"></i>
                <h5>${title}</h5>
            </div>
            <div class="modal-body">${message}</div>
            <div class="modal-footer">
                <button class="btn btn-cancel">${cancelText}</button>
                <button class="btn ${confirmClass}">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 綁定事件
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.btn-cancel').onclick = closeModal;
    modal.querySelector('.modal-backdrop').onclick = closeModal;
    modal.querySelector('.btn-confirm').onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };

    // 進入動畫
    setTimeout(() => modal.classList.add('show'), 10);
}

// ===== 按鈕 Loading 狀態控制 =====
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        const textSpan = button.querySelector('.btn-text');
        const spinnerSpan = button.querySelector('.btn-spinner');
        if (textSpan) textSpan.style.visibility = 'hidden';
        if (spinnerSpan) spinnerSpan.style.display = 'inline-flex';
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        const textSpan = button.querySelector('.btn-text');
        const spinnerSpan = button.querySelector('.btn-spinner');
        if (textSpan) textSpan.style.visibility = 'visible';
        if (spinnerSpan) spinnerSpan.style.display = 'none';
    }
}

// ===== Loading 疊加層 =====
function showLoadingOverlay(message = '處理中...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">
                <i class="fa-solid fa-spinner fa-spin"></i>
            </div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 10);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.style.display = 'none', 300);
    }
}

function updateLoadingOverlay(message, showSuccess = false) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        const content = overlay.querySelector('.loading-content');
        if (showSuccess) {
            content.innerHTML = `
                <div class="loading-spinner success">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
                <div class="loading-text">${message}</div>
            `;
        } else {
            content.querySelector('.loading-text').textContent = message;
        }
    }
}

// ===== 數字滾動動畫 =====
function animateNumber(element, start, end, duration = 1000) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = '$' + Math.round(current).toLocaleString();
    }, 16);
}