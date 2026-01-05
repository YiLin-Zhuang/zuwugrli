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
    const nid = document.getElementById("input-nid").value.trim();

    // 驗證輸入
    if(!nid) {
        showToast("請輸入身分證字號", "warning");
        return;
    }

    // 簡單格式驗證（第一碼英文 + 9碼數字）
    const idPattern = /^[A-Z][0-9]{9}$/i;
    if(!idPattern.test(nid)) {
        showToast("身分證格式不正確（例：A123456789）", "error");
        return;
    }

    const btn = document.getElementById("btn-bind");
    setButtonLoading(btn, true);

    ApiService.bindUser(currentUser, nid)
    .then(res => {
        if(res.success) {
            showToast("綁定成功！正在載入...", "success");
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(res.message, "error");
            setButtonLoading(btn, false);
        }
    })
    .catch(err => {
        showToast("連線錯誤，請稍後再試", "error");
        setButtonLoading(btn, false);
    });
}