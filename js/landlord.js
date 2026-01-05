// --- 房東 (Admin) 相關邏輯 ---

function initLandlordView() {
    document.getElementById("view-admin").style.display = "block";
    ApiService.getLandlordData().then(res => {
        renderDashboard(res.data.list, res.data.stats);
        renderTenantList(res.data.list);
    });
}

function renderDashboard(list, stats) {
    document.getElementById("stat-collected").innerText = "$" + formatMoney(stats.collected);
    document.getElementById("stat-pending").innerText = "$" + formatMoney(stats.total_rent - stats.collected);
    
    const container = document.getElementById("admin-todo-list");
    container.innerHTML = "";
    let hasTodo = false;

    list.forEach(item => {
        if (item.bill.status === "待查核") {
            hasTodo = true;
            const html = `
            <div class="bill-card p-3 border-start border-4 border-warning">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h6 class="fw-bold mb-0">${item.tenant.community_id} <span class="small text-muted">(${item.tenant.name})</span></h6>
                        <small class="text-muted">${item.bill.month} 帳單</small>
                    </div>
                    <span class="badge badge-pill bg-gradient-yellow">待查核</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-dark fs-5">$${formatMoney(item.bill.total)}</span>
                    <button onclick="verifyPayment('${item.tenant.community_id}', '${item.bill.bill_id}')" class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm">
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
    if(!confirm("確認已收到款項？")) return;
    ApiService.post({ action: "verify", communityId: cid, billId: bid })
    .then(() => { alert("已收款"); initLandlordView(); });
}

function triggerAutoBill() {
    if(!confirm("確定要執行「本月自動開單」嗎？")) return;
    ApiService.post({ action: "triggerAutoBill" })
    .then(res => alert(res.message));
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