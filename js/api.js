// 封裝 API 請求
const ApiService = {
    post: function(bodyData) {
        return fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(bodyData)
        }).then(r => r.json());
    },

    getStatus: function(userId) {
        return this.post({ action: "getStatus", userId: userId });
    },

    getLandlordData: function() {
        return this.post({ action: "getLandlordData" });
    },
    
    bindUser: function(userId, nid) {
        return this.post({ action: "bind", userId: userId, nationalId: nid });
    },

    payBill: function(userId, billId, communityId) {
        return this.post({ action: "pay", userId: userId, billId: billId, communityId: communityId });
    }
};