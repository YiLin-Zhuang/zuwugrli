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