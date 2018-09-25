var AmDes3 = {
    encrypt :function(text,success,fail){
        return cordova.exec(success, fail, "AmDes3", "encrypt", [text]);
    },
    decrypt :function(text,success,fail){
        return cordova.exec(success, fail, "AmDes3", "decrypt", [text]);
    }
};
var SecuStore = {
	//加密帐号信息保存到本地存储
    saveData:function(text,success,fail){
        return cordova.exec(success, fail, "SecuStore", "saveData", [text]);
    },
    //获取帐号信息
    getData:function(success,fail){
        return cordova.exec(success, fail, "SecuStore", "getData", []);
    },
    creteGesturePasswordView:function(success,fail){
        return cordova.exec(success, fail, "SecuStore", "creteGesturePasswordView", []);
    }
}
/*
var SecuStore = {
	//加密帐号信息保存到本地存储
    saveData:function(text,storeName,success,fail){
        return cordova.exec(success, fail, "SecuStore", "saveData", [text,storeName]);
    },
    //获取帐号信息
    getData:function(storeName,success,fail){
        return cordova.exec(success, fail, "SecuStore", "getData", [storeName]);
    },
    //保存手势密码
    saveGesturePwd:function(text,storeName,success,fail){
    		return cordova.exec(success, fail, "SecuStore", "saveGesturePwd", [text,storeName]);
    },
    //校验手势密码,返回值true,false,出错时返回E5表示输入超过此数
    validGesturePwd:function(text,storeName,success,fail){
    		return cordova.exec(success, fail, "SecuStore", "validGesturePwd", [text,storeName]);
    },
    //判断手势密码是否为空
    emptyGesturePwd:function(storeName,success,fail){
    		return cordova.exec(success, fail, "SecuStore", "emptyGesturePwd", [storeName]);
    	}
}
*/