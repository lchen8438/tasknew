var appRootScope;
var appState;
var appIonicLoading;
var myPopup;
runService = function ($http, $ionicLoading, $ionicPopup, url, bizObj, successFun, errorFun) {

	//解决开发环境和生产环境 代码兼容问题,以后只需要在config.js里面设置"enviroment"变量值,dev 代表开发环境,produ代表生产环境
	if (AmApp.config.enviroment == 'dev') {
		// 兼容处理
		if (typeof ($ionicPopup) == 'string') {
			errorFun = successFun;
			successFun = bizObj;
			bizObj = url;
			url = $ionicPopup;
			$ionicPopup = undefined;
		}
		// if (navigator && navigator.connection && Connection.NONE &&
		// navigator.connection.type==Connection.NONE) {
		// AmApp.callErrorFunction(errorFun,"网络不可用",0,undefined,$ionicPopup);
		// }
		// else{
		// if ($ionicLoading)
		// 	$ionicLoading.show({
		// 		template : '正在处理中...'
		// 	});
		var params = {};
		params.deviceType = AmApp.config.DeviceType;
		bizObj.UUID = "00:9a:cd:50:dd:42";
		params.RequestParams = bizObj;
		$http.post(AmApp.config.ServiceRootPath + url, params, {
			'timeout': AmApp.config.ServiceTimout
		}).success(
			function (data, status, header, config) {
				// if ($ionicLoading)
				// 	$ionicLoading.hide();
				if (status == 200) {
					if (typeof (data) == 'string') {
						AmApp.callErrorFunction(errorFun, data, status,
							$ionicLoading, $ionicPopup);
					} else {
						if (data.returnCode == 'SUCCESS') {
							var ResponseParams = data.ResponseParams;
							if (ResponseParams.Result == "N" && !(ResponseParams.userID == "")) {
								var errMsg = ResponseParams.ErrorMsg;

								if (errMsg == "No Permission") {
									appIonicLoading.hide();
									AmApp.callErrorFunction(errorFun,
										"该用户已在别处登录", status, $ionicLoading, $ionicPopup);
									appState.go('logon', {});
								}

								if (errMsg == "ReLogon") {
									// $timeout(function () {
									appIonicLoading.hide();
									appState.go('logon', {});
									// },1000);
								}

							} else {
								successFun.call(this, data.ResponseParams, status);
								//								appRootScope.$digest();
							}

						} else {
							appIonicLoading.hide();
							// AmApp.callErrorFunction(errorFun, data.returnCode,
							// 		status, $ionicLoading, $ionicPopup);
							AmApp.callErrorFunction(errorFun, '应用服务器断开，请尝试重新登录或联系管理员',
								status, $ionicLoading, $ionicPopup);
						}
					}
				} else {
					appIonicLoading.hide();
					AmApp.callErrorFunction(errorFun, "数据获取错误", status,
						$ionicLoading, $ionicPopup);
				}
			}).error(
			function (data, status, header, config) {
				if (status == 500) {
					AmApp.callErrorFunction(errorFun, "检测到服务状态异常", status, $ionicLoading, $ionicPopup);
				} else if (status == 0) {
					AmApp.callErrorFunction(errorFun, url + "连接超时，请检查网络连接是否正常", status, $ionicLoading, $ionicPopup);
				} else {
					AmApp.callErrorFunction(errorFun, "网络连接错误", status, $ionicLoading, $ionicPopup);
				}
			});
	} else if (AmApp.config.enviroment == 'produ') {

		// 兼容处理
		if (typeof ($ionicPopup) == 'string') {
			errorFun = successFun;
			successFun = bizObj;
			bizObj = url;
			url = $ionicPopup;
			$ionicPopup = undefined;
		}

		var params = {};
		params.deviceType = AmApp.config.DeviceType;
		bizObj.UUID = AmApp.UUID;
		params.RequestParams = bizObj;
		window.encrypt([JSON.stringify(params), "qazwUIUY45gftyu7689014dv"], function (msg) {
			params = msg;
			$http.post(AmApp.config.ServiceRootPath + url, params, {
				'timeout': AmApp.config.ServiceTimout
			}).success(
				function (data, status, header, config) {
					if ($ionicLoading)
						$ionicLoading.hide();
					if (status == 200) {
						window.decrypt([data, "qazwUIUY45gftyu7689014dv"], function (msg) {
							var obj = JSON.parse(msg);
							if (obj.returnCode == 'SUCCESS') {
								var ResponseParams = obj.ResponseParams;
								if (ResponseParams.Result == "N" && !(ResponseParams.userID == "")) {
									var errMsg = ResponseParams.ErrorMsg;
									if (errMsg == "No Permission") {
										appIonicLoading.hide();
										AmApp.callErrorFunction(errorFun, "该用户已在别处登录", status, $ionicLoading, $ionicPopup);
										appState.go('logon', {});
									}

									if (errMsg == "ReLogon") {
										appIonicLoading.hide();
										// 自定义弹窗
										if (myPopup == undefined) {
											myPopup = $ionicPopup.show({
												title: '提示信息',
												template: '连接超时,是否重新登录?',
												buttons: [{
														text: '否'
													},
													{
														text: '<b>是</b>',
														type: 'button-positive',
														onTap: function (e) {
															myPopup = undefined;
															appState.go('logon', {});
														}
													},
												]
											});
											myPopup.then(function (res) {
												myPopup = undefined;
											});
										}
									}
								} else {
									successFun.call(this, obj.ResponseParams, status);
									appRootScope.$digest();
								}

							} else {
								if (url != 'getversion') {
									AmApp.callErrorFunction(errorFun, obj.returnCode, status, $ionicLoading, $ionicPopup);
								}
							}
						}, function (err) {})

					} else {
						AmApp.callErrorFunction(errorFun, "数据获取错误", status, $ionicLoading, $ionicPopup);
					}
				}).error(function (data, status, header, config) {
				if ($ionicLoading)
					$ionicLoading.hide();
				if (status == 500) {
					AmApp.callErrorFunction(errorFun, "检测到服务状态异常", status, $ionicLoading, $ionicPopup);
				} else if (status == 0) {
					AmApp.callErrorFunction(errorFun, url + "连接超时，请检查网络连接是否正常", status, $ionicLoading, $ionicPopup);
				} else {
					AmApp.callErrorFunction(errorFun, "网络连接错误", status, $ionicLoading, $ionicPopup);
				}
			});
		}, function (err) {});
	}
};

runServiceWithSession = function ($http, $ionicLoading, $ionicPopup, $state,
	url, bizObj, successFun, errorFun) {
	// amApp传参
	
	runService($http, $ionicLoading, $ionicPopup, url, bizObj, successFun,
		function (msg, data) {
			if (msg == 'account.session.timeout' || msg == 'account.session.invalid' ||
				msg.indexOf('need login') > -1) {
				$state.go('logon', {});
			} else {
				AmApp.callErrorFunction(errorFun, msg, status,
					$ionicLoading, $ionicPopup);
			}
		});
};

AmApp.callErrorFunction = function (errorFun, msg, status, $ionicLoading, $ionicPopup) {
	appIonicLoading.hide();

	if (errorFun) {
		errorFun.call(this, msg, status);
	} else if ($ionicLoading) {
		if (AmApp.errors[msg]) {
			// $ionicLoading.show({template: AmApp.errors[msg],duration:2000});
			if ($ionicPopup) {
				$ionicPopup.alert({
					title: '出错了',
					template: AmApp.errors[msg]
				});
			} else {
				alert(AmApp.errors[msg]);
			}
		} else {
			// $ionicLoading.show({template: msg,duration:2000});
			if ($ionicPopup) {
				// 自定义弹窗
				if (myPopup == undefined) {
					myPopup = $ionicPopup.show({
						title: '提示信息',
						template: '连接超时,是否重新登录?',
						buttons: [{
								text: '否'
							},
							{
								text: '<b>是</b>',
								type: 'button-positive',
								onTap: function (e) {
									myPopup = undefined;
									appState.go('logon', {});
								}
							},
						]
					});
					myPopup.then(function (res) {
						myPopup = undefined;
					});
				}
			} else {
				alert(msg);
			}
		}

	} else {
		if ($ionicPopup) {
			$ionicPopup.alert({
				title: '出错了',
				template: msg
			});
		} else {
			alert(msg);
		}
	}
};
AmApp.sendSMS = function ($scope, $timeout, smsAction) {
	var initTimeout = 10;
	var smsTimeout = initTimeout;
	var canSend = true;
	$scope.sendMsg = smsTimeout + "秒后重发";
	var updateSendMsg = function () {
		smsTimeout--;
		if (smsTimeout < 0) {
			canSend = true;
			smsTimeout = initTimeout;
			$scope.sendMsg = smsTimeout + "秒后重发";
			return;
		}
		$scope.sendMsg = smsTimeout + "秒后重发";
		canSend = false;
		$timeout(updateSendMsg, 1000);
	};
	$scope.sendSMS = function () {
		if (canSend == false)
			return;
		canSend = false;
		// 发送短信
		if (smsAction)
			smsAction.call(this);
		// 开始计数
		$timeout(updateSendMsg, 1000);
	};
};

strEscape = function (str) {
	return unescape(str.replace(/&#x/g, '%u').replace(/;/g, ''));
};


var getApplyListState = function (ftObjectType) {
	var state = 'creditApplyList';
	if (ftObjectType == 'SMEApply') {
		state = 'smeApplyList';
	} else if (ftObjectType == 'Customer') {
		state = 'evaluateApplyList';
	} else if (ftObjectType == 'PutOutApply') {
		state = 'putOutApplyList';
	} else if (ftObjectType == 'PaymentApply') {
		state = 'paymentApplyList'
	} else if (ftObjectType == 'Classify') {
		state = 'classifyApplyList'
	} else if (ftObjectType == 'TransformApply') {
		state = 'transformApplyList'
	} else if (ftObjectType == 'UnLoadGuaranty') {
		state = 'unloadApplyList'
	}
	return state;
};

var transData = function transData(a, idStr, pidStr, chindrenStr) {
	var r = [],
		hash = {},
		id = idStr,
		pid = pidStr,
		children = chindrenStr,
		i = 0,
		j = 0,
		len = a.length;
	for (; i < len; i++) {
		hash[a[i][id]] = a[i];
	}
	for (; j < len; j++) {
		var aVal = a[j],
			hashVP = hash[aVal[pid]];
		if (hashVP) {
			!hashVP[children] && (hashVP[children] = []);
			hashVP[children].push(aVal);
		} else {
			r.push(aVal);
		}
	}
	return r;
};
var MIMETYPE = {
	".3gp": "video/3gpp",
	".apk": "application/vnd.android.package-archive",
	".asf": "video/x-ms-asf",
	".avi": "video/x-msvideo",
	".bin": "application/octet-stream",
	".bmp": "image/bmp",
	".c": "text/plain",
	".class": "application/octet-stream",
	".conf": "text/plain",
	".cpp": "text/plain",
	".doc": "application/msword",
	".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	".xls": "application/vnd.ms-excel",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".exe": "application/octet-stream",
	".gif": "image/gif",
	".gtar": "application/x-gtar",
	".gz": "application/x-gzip",
	".h": "text/plain",
	".htm": "text/html",
	".html": "text/html",
	".jar": "application/java-archive",
	".java": "text/plain",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".js": "application/x-javascript",
	".log": "text/plain",
	".m3u": "audio/x-mpegurl",
	".m4a": "audio/mp4a-latm",
	".m4b": "audio/mp4a-latm",
	".m4p": "audio/mp4a-latm",
	".m4u": "video/vnd.mpegurl",
	".m4v": "video/x-m4v",
	".mov": "video/quicktime",
	".mp2": "audio/x-mpeg",
	".mp3": "audio/x-mpeg",
	".mp4": "video/mp4",
	".mpc": "application/vnd.mpohun.certificate",
	".mpe": "video/mpeg",
	".mpeg": "video/mpeg",
	".mpg": "video/mpeg",
	".mpg4": "video/mp4",
	".mpga": "audio/mpeg",
	".msg": "application/vnd.ms-outlook",
	".ogg": "audio/ogg",
	".pdf": "application/pdf",
	".png": "image/png",
	".pps": "application/vnd.ms-powerpoint",
	".ppt": "application/vnd.ms-powerpoint",
	".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	".prop": "text/plain",
	".rc": "text/plain",
	".rmvb": "audio/x-pn-realaudio",
	".rtf": "application/rtf",
	".sh": "text/plain",
	".tar": "application/x-tar",
	".tgz": "application/x-compressed",
	".txt": "text/plain",
	".wav": "audio/x-wav",
	".wma": "audio/x-ms-wma",
	".wmv": "audio/x-ms-wmv",
	".wps": "application/vnd.ms-works",
	".xml": "text/plain",
	".z": "application/x-compress",
	".zip": "application/x-zip-compressed",
	"": "*/*"
};

function getMimeType(path) {
	var type = path.substr(path.lastIndexOf(".")).toLowerCase();
	return MIMETYPE[type];
}

AmApp.getCookieExpTime = function () {
	var exp = new Date();
	exp.setTime(exp.getTime() + 365 * 24 * 3600 * 1000); //过期时间
	return exp;
}

AmApp.setCookie = function ($cookies, name, value) {
	$cookies.put(name, value, {
		'expires': AmApp.getCookieExpTime()
	});
}

var locationTimer;
var startGetLocation = function ($interval) {
	locationTimer = $interval(getCurrentLoction, 60 * 1000);
}

function stopGetLocation($interval) {
	$interval.cancel(locationTimer);
}

var rootHttp;

function getCurrentLoction() {
	if (ionic.Platform.isAndroid()) {
		setTimeout(function () {
			window.getCurrentLocation([], function (location) {
				var obj = eval("(" + location + ")");
				obj.OrgId = AmApp.orgID;
				// var obj = {Latitude:'31.332535',Longitude:'120.426952',Address:'苏州市',OrgId:'11010090',UserId:AmApp.UserId};
				// alert(JSON.stringify(obj));
				runService(rootHttp, null, null, 'locationInfoUpload', obj,
					function (data, status) {
						// alert(JSON.stringify(data));
					})
			});
		}, 5000);
	} else {
		window.getCurrentLocation([''], function (location) {
			var obj = location;
			obj.OrgId = AmApp.orgID;
			runService(rootHttp, null, null, 'locationInfoUpload', obj, function (data, status) {

			});
		}, function (error) {
			alert(error);
		});
	}

}


function loading(info, time) {
	var content = '<div style="display: -webkit-box;"><div>' + info + '</div> &nbsp;&nbsp;<ion-spinner icon="ios" class="spinner-calm"></ion-spinner></div>';
	if (time == 0) {
		appIonicLoading.show({
			template: content
		});
	} else {
		appIonicLoading.show({
			template: content,
			duration: time
		});
	}
}

//校验账号为全部数字
function CheckAccountNo(svalue) {
	var reg = new RegExp("^[0-9]*$");
	if (!reg.test(svalue)) {
		return false;
	}
	return true;
}