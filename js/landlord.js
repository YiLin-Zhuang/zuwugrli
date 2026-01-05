// --- 房東 (Admin) 相關邏輯 ---

function initLandlordView() {
    document.getElementById("view-admin").style.display = "block";
    ApiService.getLandlordData().then(res => {
        renderDashboard(res.data.list, res.data.stats);
        renderTenantList(res.data.list);
    });
}

function renderDashboard(list, stats) {
    // 使用數字滾動動畫
    const collectedEl = document.getElementById("stat-collected");
    const pendingEl = document.getElementById("stat-pending");

    animateNumber(collectedEl, 0, stats.collected);
    animateNumber(pendingEl, 0, stats.total_rent - stats.collected);
    
    const container = document.getElementById("admin-todo-list");
    container.innerHTML = "";
    let hasTodo = false;

    list.forEach(item => {
        if (item.bill.status === "待查核") {
            hasTodo = true;
            const html = `
            <div class="bill-card p-3 border-start border-4 border-warning" data-bill-id="${item.bill.bill_id}" data-community-id="${item.tenant.community_id}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h6 class="fw-bold mb-0">${item.tenant.community_id} <span class="small text-muted">(${item.tenant.name})</span></h6>
                        <small class="text-muted">${item.bill.month} 帳單</small>
                    </div>
                    <span class="badge badge-pill bg-gradient-yellow">待查核</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-dark fs-5">$${formatMoney(item.bill.total)}</span>
                    <button onclick="verifyPayment('${item.tenant.community_id}', '${item.bill.bill_id}')" class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm btn-verify">
                        <i class="fa-solid fa-check me-1"></i>確認收款
                    </button>
                </div>
            </div>`;
            container.innerHTML += html;
        }
    });
    if(!hasTodo) document.getElementById("admin-todo-empty").style.display = "block";
}

function renderTenantList(list) {
    const container = document.getElementById("tenant-list-container");
    container.innerHTML = "";
    list.forEach(item => {
        const colors = ['#0984e3', '#00b894', '#6c5ce7', '#e17055'];
        const color = colors[item.tenant.name.length % colors.length];
        
        container.innerHTML += `
        <div class="tenant-list-item" onclick="openTenantDetail('${item.tenant.community_id}', '${item.tenant.name}')">
            <div class="d-flex align-items-center">
                <div class="avatar-circle" style="background:${color}20; color:${color}">${item.tenant.community_id.substring(0,1)}</div>
                <div>
                    <div class="fw-bold text-dark">${item.tenant.community_id}</div>
                    <div class="text-muted small">${item.tenant.name}</div>
                </div>
            </div>
            <div class="d-flex align-items-center">
                <span class="badge badge-pill ${item.bill.status==='待繳費'?'bg-gradient-red text-white':'bg-light text-muted'} me-2">
                    ${item.bill.status==='無帳單'?'正常':item.bill.status}
                </span>
                <i class="fa-solid fa-chevron-right text-muted opacity-25"></i>
            </div>
        </div>`;
    });
}

function switchAdminTab(tab, el) {
    document.getElementById("admin-tab-dash").style.display = "none";
    document.getElementById("admin-tab-tenants").style.display = "none";
    document.getElementById("admin-tab-news").style.display = "none";
    document.getElementById("admin-tab-" + tab).style.display = "block";
    
    document.querySelectorAll("#view-admin .bottom-nav .nav-item").forEach(item => item.classList.remove("active"));
    el.classList.add("active");
}

function verifyPayment(cid, bid) {
    // 使用自訂確認對話框
    showConfirmModal({
        title: '確認收款',
        message: '確認已經收到這筆款項了嗎？<br>確認後將標記為已完成。',
        confirmText: '確認收款',
        confirmClass: 'btn-confirm',
        onConfirm: () => {
            // 樂觀更新：立即更新 UI
            const cardElement = document.querySelector(`[data-bill-id="${bid}"]`);
            if (cardElement) {
                cardElement.classList.add('processing');

                const btn = cardElement.querySelector('.btn-verify');
                if (btn) {
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>處理中';
                    btn.disabled = true;
                }
            }

            // API 請求
            ApiService.post({ action: "verify", communityId: cid, billId: bid })
            .then(res => {
                if (res.success || !res.message) {
                    // 成功：卡片滑出動畫
                    if (cardElement) {
                        cardElement.style.transform = 'translateX(100%)';
                        cardElement.style.opacity = '0';
                        cardElement.style.transition = 'all 0.3s ease-out';

                        setTimeout(() => {
                            cardElement.remove();

                            // 檢查是否還有待辦事項
                            const remaining = document.querySelectorAll('#admin-todo-list .bill-card');
                            if (remaining.length === 0) {
                                document.getElementById('admin-todo-empty').style.display = 'block';
                            }

                            showToast('收款確認成功', 'success');

                            // 重新載入統計數據
                            updateDashboardStats();
                        }, 300);
                    }
                } else {
                    throw new Error(res.message);
                }
            })
            .catch(err => {
                // 失敗：還原狀態
                if (cardElement) {
                    cardElement.classList.remove('processing');
                    const btn = cardElement.querySelector('.btn-verify');
                    if (btn) {
                        btn.innerHTML = '<i class="fa-solid fa-check me-1"></i>確認收款';
                        btn.disabled = false;
                    }
                }
                showToast('操作失敗，請重試', 'error');
            });
        }
    });
}

// 只更新統計數據，不重新載入整個頁面
function updateDashboardStats() {
    ApiService.getLandlordData().then(res => {
        const stats = res.data.stats;
        animateNumber(document.getElementById("stat-collected"), 0, stats.collected);
        animateNumber(document.getElementById("stat-pending"), 0, stats.total_rent - stats.collected);
    });
}

function triggerAutoBill() {
    // 使用自訂確認對話框
    showConfirmModal({
        title: '自動出帳',
        message: '確定要執行本月自動開單嗎？<br>系統將為所有租客產生基礎帳單。',
        confirmText: '執行開單',
        confirmClass: 'btn-confirm',
        onConfirm: () => {
            // 顯示 loading 疊加層
            showLoadingOverlay('自動出帳中...');

            ApiService.post({ action: "triggerAutoBill" })
            .then(res => {
                if (res.success) {
                    updateLoadingOverlay('出帳完成！', true);

                    setTimeout(() => {
                        hideLoadingOverlay();

                        // 顯示詳細結果
                        if (res.message) {
                            showToast(res.message, 'success', 5000);
                        }

                        // 重新載入頁面以顯示新帳單
                        setTimeout(() => location.reload(), 1000);
                    }, 1500);
                } else {
                    hideLoadingOverlay();
                    showToast(res.message || '出帳失敗', 'error');
                }
            })
            .catch(() => {
                hideLoadingOverlay();
                showToast('連線錯誤，請稍後再試', 'error');
            });
        }
    });
}

// 租客詳情頁控制
function openTenantDetail(communityId, name) {
    document.getElementById("detail-title").innerText = `${communityId} - ${name}`;
    document.getElementById("view-tenant-detail").style.display = "block";
    document.getElementById("detail-history-list").innerHTML = '<div class="text-center mt-5"><span class="spinner-border text-primary"></span></div>';
    
    ApiService.post({ action: "getTenantHistory", communityId })
    .then(res => {
        const container = document.getElementById("detail-history-list");
        container.innerHTML = "";
        res.history.forEach(bill => {
            let badgeClass = "bg-light text-muted";
            if(bill.status === "已完成") badgeClass = "bg-gradient-green";
            else if(bill.status === "待繳費") badgeClass = "bg-gradient-red";
            else if(bill.status === "待查核") badgeClass = "bg-gradient-yellow";

            const html = `
            <div class="bill-card p-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold mb-0 text-secondary">${bill.month}</h6>
                    <span class="badge badge-pill ${badgeClass}">${bill.status}</span>
                </div>
                <div class="row-kv"><small>房租</small> <span>$${formatMoney(bill.rent)}</span></div>
                ${bill.elec_amt > 0 ? `<div class="row-kv"><small>電費</small> <span>$${formatMoney(bill.elec_amt)}</span></div>` : ''}
                ${bill.water_amt > 0 ? `<div class="row-kv"><small>水費</small> <span>$${formatMoney(bill.water_amt)}</span></div>` : ''}
                <div class="border-top mt-2 pt-2 d-flex justify-content-between align-items-center">
                    <span class="small text-muted">總計</span>
                    <span class="fw-bold text-dark fs-5">$${formatMoney(bill.total)}</span>
                </div>
            </div>`;
            container.innerHTML += html;
        });
    });
}

function closeDetail() {
    document.getElementById("view-tenant-detail").style.display = "none";
}