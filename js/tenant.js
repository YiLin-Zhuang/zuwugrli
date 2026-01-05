// --- 房客 (Tenant) 相關邏輯 ---

function initTenantView(res) {
    document.getElementById("app-main").style.display = "block";
                
    currentCommunityId = res.tenant.community_id;
    document.getElementById("profile-name").innerText = res.tenant.name;
    document.getElementById("profile-community").innerText = res.tenant.community_id;
    document.getElementById("profile-nid").innerText = res.tenant.national_id;

    if (res.bills) separateAndRenderBills(res.bills);
}

function switchTab(tabName, navEl) {
    document.getElementById('tab-home').style.display = 'none';
    document.getElementById('tab-history').style.display = 'none';
    document.getElementById('tab-profile').style.display = 'none';
    document.getElementById('tab-' + tabName).style.display = 'block';
    document.querySelectorAll("#app-main .bottom-nav .nav-item").forEach(el => el.classList.remove('active'));
    navEl.classList.add('active');
}

function separateAndRenderBills(bills) {
    const homeContainer = document.getElementById("current-bills-container");
    const historyContainer = document.getElementById("history-container");
    homeContainer.innerHTML = "";
    historyContainer.innerHTML = "";
    let hasCurrent = false;
    let hasHistory = false;

    bills.forEach(bill => {
        if (bill.status === "已完成") {
            hasHistory = true;
            historyContainer.innerHTML += `
            <div class="tenant-list-item" style="cursor:default;">
                <div><h6 class="mb-0 fw-bold text-secondary">${bill.month}</h6><small class="text-muted">總額 $${formatMoney(bill.total)}</small></div>
                <span class="badge badge-pill bg-gradient-green">已繳費</span>
            </div>`;
        } else {
            hasCurrent = true;
            renderTenantHomeCard(bill, homeContainer);
        }
    });

    if (!hasCurrent) document.getElementById("home-empty").style.display = "block";
    if (!hasHistory) document.getElementById("history-empty").style.display = "block";
}

function renderTenantHomeCard(bill, container) {
    let headerClass = bill.status === "待繳費" ? "bg-gradient-red" : "bg-gradient-yellow";
    let btnHtml = "";

    if (bill.status === "待繳費") {
        btnHtml = `<hr class="opacity-10"><button onclick="doPay('${bill.bill_id}')" class="btn btn-action btn-danger text-white bg-gradient-red"><i class="fa-solid fa-coins me-2"></i>已匯款</button>`;
    } else {
        btnHtml = `<div class="text-center mt-3 text-warning"><i class="fa-solid fa-spinner fa-spin me-1"></i> 房東確認中</div>`;
    }

    const html = `
        <div class="bill-card">
            <div class="bill-header ${headerClass} text-white">
                <span><i class="fa-regular fa-calendar-check me-2"></i>${bill.month}</span>
                <span class="badge bg-white text-dark bg-opacity-75 rounded-pill">${bill.status}</span>
            </div>
            <div class="bill-body">
                <div class="row-kv"><span>房租</span><span class="fw-bold text-dark">$${formatMoney(bill.rent)}</span></div>
                <div class="row-kv"><span>水費 <small>(${bill.water_usage}度)</small></span><span class="fw-bold text-dark">$${formatMoney(bill.water_amt)}</span></div>
                <div class="row-kv"><span>電費 <small>(${bill.elec_usage}度)</small></span><span class="fw-bold text-dark">$${formatMoney(bill.elec_amt)}</span></div>
                <div class="d-flex justify-content-between mt-3 pt-2 border-top">
                    <span class="fw-bold text-dark">應繳金額</span>
                    <span class="text-big-amt text-red">$${formatMoney(bill.total)}</span>
                </div>
                ${btnHtml}
            </div>
        </div>`;
    container.innerHTML += html;
}

function doPay(billId) {
    if(!confirm("確認已完成匯款？")) return;
    if(!currentCommunityId) { alert("系統錯誤：無法識別社區"); return; }
    
    ApiService.payBill(currentUser, billId, currentCommunityId)
    .then(res => {
        if(res.success) { alert("已通知房東！"); location.reload(); }
        else { alert("錯誤：" + res.message); }
    });
}