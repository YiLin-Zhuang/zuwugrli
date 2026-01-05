// --- 主程式入口 (Router & Init) ---

window.onload = function() {
    if (typeof liff === 'undefined') { 
        hideLoading();
        alert("LIFF SDK 載入失敗"); return; 
    }
    liff.init({ liffId: LIFF_ID }).then(() => {
        if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
        } else {
            currentUser = liff.getDecodedIDToken().sub;
            fetchStatus(); // 開始判斷身份
        }
    }).catch(err => {
        hideLoading();
        alert("Init Error: " + err);
    });
};

function fetchStatus() {
    ApiService.getStatus(currentUser)
    .then(res => {
        hideLoading();

        // 1. 房東模式
        if (res.isAdmin) {
            initLandlordView(); 
        }
        // 2. 房客模式 (已綁定)
        else if (res.registered && res.tenant) {
            initTenantView(res);
        }
        // 3. 未綁定
        else {
            document.getElementById("view-bind").style.display = "block";
        }
    })
    .catch(err => {
        hideLoading();
        alert("連線錯誤: " + err);
    });
}

function doBind() {
    const nid = document.getElementById("input-nid").value;
    if(!nid) return alert("請輸入身分證");
    
    const btn = document.getElementById("btn-bind");
    btn.innerText = "處理中...";
    btn.disabled = true;

    ApiService.bindUser(currentUser, nid)
    .then(res => {
        if(res.success) { alert("綁定成功！"); location.reload(); }
        else { 
            alert(res.message); 
            btn.innerText = "驗證綁定"; 
            btn.disabled = false;
        }
    });
}