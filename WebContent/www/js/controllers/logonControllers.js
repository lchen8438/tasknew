angular.module('com.amarsoft.mobile.controllers.logon', [])

    // *******************
    // 登录
    // *******************
    .controller('LogonController', function ($scope, $rootScope, $ionicPopup, $http, $ionicLoading, $timeout, $state,
        basePage, $ionicModal, $cookies, $interval, $ionicNativeTransitions, $cordovaFileTransfer, $cordovaFileOpener2, $cordovaInAppBrowser) {

        appRootScope = $rootScope;
        appState = $state;
        appIonicLoading = $ionicLoading;
        //密码显示隐藏
        $scope.eyeshow = false;
        var attemptLogon = 0; //记录尝试登陆的次数，五次失败将会锁定

        $scope.getfocusUserId = function () {
            $scope.$watch('user.UserId', function (newValue, oldValue, scope) {

                if (newValue != oldValue) {
                    attemptLogon = 0;
                }

                if (newValue == '') {
                    $scope.showCleanUserId = false;
                } else {
                    $scope.showCleanUserId = true;
                }
            })
        };

        $scope.getfocusUserPwd = function () {
            $scope.$watch('user.UserPwd', function (newValue, oldValue, scope) {
                if (newValue != oldValue) {
                    attemptLogon = 0;
                }

                if (newValue == '') {
                    $scope.showCleanUserPwd = false;
                } else {
                    $scope.showCleanUserPwd = true;
                }
            })
        };

        $scope.getblur = function () {
            $scope.showCleanUserId = false;
            $scope.showCleanUserPwd = false;
        };

        $scope.cleanUserId = function () {
            $scope.user.UserId = '';
        };

        $scope.cleanUserPwd = function () {
            $scope.user.UserPwd = '';
        };

        $scope.isShow = "none";
        var loadData = function (ionicLoading) {
            $scope.fail = false;
            $scope.isSave = false;
            $scope.user = {
                UserId: '',
                UserPwd: ''
            };

            //获取用户名密码
            if (localStorage.getItem('logonUser')) {
                $scope.logonUser = localStorage.getItem('logonUser');
                $scope.logonPsw = localStorage.getItem('logonPsw');
                $scope.user = {
                    UserId: $scope.logonUser,
                    UserPwd: $scope.logonPsw
                };
            }
            if (AmApp.loginID)
                $scope.user.UserId = AmApp.loginID;
        };

        var loadAccount = function () {

            //解决开发环境和生产环境 代码兼容问题,以后只需要在config.js里面设置"enviroment"变量值,dev 代表开发环境,produ代表生产环境
            if (AmApp.config.enviroment != 'dev') {
                window.getData([], function (msg) {
                    if (msg.UserName != null && msg.UserName != "") {
                        window.decrypt([msg.UserName, "qazwUIUY45gftyu7689014dv"], function (msg) {
                            $scope.user.UserId = msg;
                        }, function (err) {

                        })

                        if (msg.PassWord != null && msg.PassWord != "") {
                            window.decrypt([msg.PassWord, "qazwUIUY45gftyu7689014dv"], function (msg) {
                                $scope.user.UserPwd = msg;
                                runService($http, $ionicLoading, "logon", $scope.user, function (data, status) {
                                    if (data.Result == 'Y') {
                                        var locationStatus = $cookies.get("LocationStatus");
                                        if (locationStatus == 'true') {
                                            rootHttp = $http;
                                            startGetLocation($interval);
                                            getCurrentLoction();
                                        }
                                        setData(data);
                                        //设置角色信息
                                        $rootScope.userName = data.userName;

                                        /***********判断手势密码的使用状态********************/
                                        window.getGestureStatus([$scope.user.UserId], function (status) {
                                            //已设置 进入校验
                                            if (status == 'set') {
                                                window.verifyGesture([$scope.user.UserId], function (success) {
                                                    //验证失败
                                                    if (success == 'fail') {
                                                        $scope.isSave = false;
                                                        window.cleanGesture([$scope.user.UserId], function (msg) {
                                                            //清除已保存的用户名密码
                                                            window.clearData([], function (msg) {
                                                                $scope.user.UserId = '';
                                                                $scope.user.UserPwd = '';
                                                                $state.go('logon')
                                                            }, function (error) {})
                                                        }, function (err) {})

                                                    } else if (success == 'forget') { //忘记密码 返回登陆界面 清除手势密码以及保存的自动登陆信息 必须重新输入用户名密码后手动登录
                                                        var params = {
                                                            UserName: $scope.user.UserId,
                                                            PassWord: ""
                                                        }
                                                        $scope.user.UserPwd = "";
                                                        //清除手势密码
                                                        window.cleanGesture([$scope.user.UserId], function (success) {
                                                            window.saveData([params], function (msg) {
                                                                $scope.user.UserPwd = '';
                                                                $state.go('logon')
                                                            }, function (err) {

                                                            })
                                                        }, function (err) {

                                                        })
                                                    } else {
                                                        //校验成功
                                                        //根据角色跳转到对应的第一功能点
                                                        $scope.changeState('RFSysSel');
                                                    }
                                                }, function (fail) {
                                                    //校验失败
                                                })
                                            } else if (status == 'unset') { //未设置 进入主界面
                                                //根据角色跳转到对应的第一功能点
                                                $scope.changeState('RFSysSel');
                                            }
                                        }, function (fail) {})
                                        // ----end----
                                    } else {
                                        $scope.isShow = "block";
                                        $timeout($scope.Refresh, 2000);
                                    }
                                });
                            }, function (err) {

                            })
                        } else {}
                    }
                }, function (err) {})
            }
        };

        $scope.selectSave = function ($event) {
            $scope.isSave = $event.target.checked;
        };


        $scope.logon = function () {

            $scope.longinClickable = true;
            if ($scope.modal) {
                $scope.modal.hide();
            }

            $timeout(function () {
                $scope.$apply(function () {
                    $scope.longinClickable = false;
                });
            }, 2000);


            if ($scope.user.UserId == undefined || $scope.user.UserId == '') {
                $ionicLoading.show({
                    template: '请输入账号',
                    duration: 1000
                });
                return false;
            }
            if ($scope.user.UserPwd == undefined || $scope.user.UserPwd == '') {
                $ionicLoading.show({
                    template: '请输入密码',
                    duration: 1000
                });
                return false;
            }

            // loading("正在登录中，请稍后……", 0);
            appIonicLoading.show({
                template: '正在登录中，请稍后……',
                animation: 'fade-in',
                showBackdrop: true,
                duration: 3000
            });
            //解决开发环境和生产环境 代码兼容问题,以后只需要在config.js里面设置"enviroment"变量值,dev 代表开发环境,produ代表生产环境
            if (AmApp.config.enviroment == 'dev') {

                /*****************************************开发环境******************************************/
                runService($http, $ionicLoading, "logon", $scope.user, function (data, status) {

                    if (data.Result == 'Y') {
                        var locationStatus = $cookies.get("LocationStatus");
                        if (locationStatus == 'true') {
                            rootHttp = $http;
                            startGetLocation($interval);
                            getCurrentLoction();
                        }
                        // ----end----

                        //记住密码
                        localStorage.setItem('logonUser', $scope.user.UserId);
                        localStorage.setItem('logonPsw', $scope.user.UserPwd);
                        setData(data);
                        $rootScope.userName = data.userName;

                        $rootScope.userName = data.userName;
                        AmApp.loginID = $scope.user.UserId;
                        //使用原生的方式跳转,可以避免白屏
                        $ionicNativeTransitions.stateGo('RFSysSel', {}, {}, {});

                        appIonicLoading.hide();
                    } else {
                        if (data.UserNotExist === 'Y') {
                            $ionicLoading.show({
                                template: "该用户不存在",
                                duration: 1000
                            });
                        }

                        if (data.UserLock === 'Y') {
                            $ionicLoading.show({
                                template: "该用户已被锁定",
                                duration: 1000
                            });
                        }

                        if (data.WrongPWD === 'Y') {
                            attemptLogon++;
                            if (attemptLogon > 5) {
                                $ionicLoading.show({
                                    template: "您的账户将被锁定",
                                    duration: 1000
                                });
                                attemptLogon = 0;
                            } else {
                                $ionicLoading.show({
                                    template: "账号或密码错误,您已尝试" + attemptLogon + "次，超过5次您的账户将被锁定",
                                    duration: 1000
                                });
                            }
                        }
                    }
                });
                /*****************************************开发环境end******************************************/

            } else {

                /*****************************************生产环境begin******************************************/
                runService($http, $ionicLoading, "logon", $scope.user, function (data, status) {

                    if (data.Result == 'Y') {

                        //记住密码
                        localStorage.setItem('logonUser', $scope.user.UserId);
                        localStorage.setItem('logonPsw', $scope.user.UserPwd);
                        setData(data);
                        $rootScope.userName = data.userName;

                        AmApp.loginID = $scope.user.UserId;
                        var params = {
                            UserName: "",
                            PassWord: ""
                        };
                        // ----start---- 用户名密码加密存储
                        if ($scope.isSave) {

                            window.encrypt([$scope.user.UserId, "qazwUIUY45gftyu7689014dv"], function (msg) {
                                params.UserName = msg;
                            }, function (err) {

                            })

                            window.encrypt([$scope.user.UserPwd, "qazwUIUY45gftyu7689014dv"], function (msg) {
                                params.PassWord = msg;
                                window.saveData([params], function (msg) {}, function (err) {})
                            }, function (err) {})
                        } else {
                            window.encrypt([$scope.user.UserId, "qazwUIUY45gftyu7689014dv"], function (msg) {
                                params.UserName = msg;
                                window.saveData([params], function (msg) {}, function (err) {})
                            }, function (err) {

                            })
                        }
                        /***********判断手势密码的使用状态********************/
                        window.getGestureStatus([$scope.user.UserId], function (status) {
                            //已设置 进入校验
                            if (status == 'set') {
                                window.verifyGesture([$scope.user.UserId], function (success) {
                                    //验证失败
                                    if (success == 'fail') {
                                        $scope.isSave = false;
                                        window.cleanGesture([$scope.user.UserId], function (msg) {
                                            //清除已保存的用户名密码
                                            window.clearData([], function (msg) {
                                                $scope.user.UserId = '';
                                                $scope.user.UserPwd = '';
                                                appIonicLoading.hide();
                                                $state.go('logon')
                                            }, function (error) {})
                                        }, function (err) {})

                                    } else if (success == 'forget') { //忘记密码 返回登陆界面 清除手势密码以及保存的自动登陆信息 必须重新输入用户名密码后手动登录
                                        var params = {
                                            UserName: $scope.user.UserId,
                                            PassWord: ""
                                        }
                                        $scope.user.UserPwd = "";
                                        //清除手势密码
                                        window.cleanGesture([$scope.user.UserId], function (success) {
                                            window.saveData([params], function (msg) {
                                                $scope.user.UserPwd = '';
                                                appIonicLoading.hide();
                                                $state.go('logon')
                                            }, function (err) {

                                            })
                                        }, function (err) {

                                        })
                                    } else {
                                        //使用原生的方式跳转,可以避免白屏
                                        $ionicNativeTransitions.stateGo('RFSysSel', {}, {}, {});
                                        appIonicLoading.hide();
                                    }
                                }, function (fail) {
                                    //校验失败
                                })
                            } else if (status == 'unset') { //未设置 进入主界面
                                //使用原生的方式跳转,可以避免白屏
                                $ionicNativeTransitions.stateGo('RFSysSel', {}, {}, {});
                                appIonicLoading.hide();
                            }
                            $scope.upDateVersion();
                        }, function (fail) {})
                    } else {
                        if (data.UserNotExist === 'Y') {
                            $ionicLoading.show({
                                template: "该用户不存在",
                                duration: 1000
                            });
                        }

                        if (data.UserLock === 'Y') {
                            $ionicLoading.show({
                                template: "该用户已被锁定",
                                duration: 1000
                            });
                        }

                        if (data.WrongPWD === 'Y') {
                            attemptLogon++;
                            if (attemptLogon > 5) {
                                $ionicLoading.show({
                                    template: "您的账户将被锁定",
                                    duration: 1000
                                });

                                //$timeout(function(){
                                //  runServiceWithSession($http, $ionicLoading, $ionicPopup, $state,
                                //    "lockUser", {}, function(data, status) {
                                //      console.log(data);
                                //      console.log(JSON.stringify(data));
                                //    });
                                //},1000);
                                attemptLogon = 0;
                            } else {
                                $ionicLoading.show({
                                    template: "账号或密码错误,您已尝试" + attemptLogon + "次，超过5次您的账户将被锁定",
                                    duration: 1000
                                });
                            }
                        }
                    }
                });
                /*****************************************生产环境end******************************************/
            }
        };

        /*********版本更新********/
        $scope.upDateVersion = function () {
            $scope.version = {
                Version: AmApp.config.Version,
                Platform: AmApp.config.DeviceType
            };

            /*****版本更新******/
            runService($http, $ionicLoading, "getversion", $scope.version, function (data, status) {
                $scope.result = data["array"][0];
                if ($scope.result.ReturnFlag == "Y") {
                    // 有新版本
                    var confirmPopup = $ionicPopup.alert({
                        title: '<strong>版本更新</strong>',
                        template: '请更新应用',
                        okText: '确定',
                        //cancelText: '取消'
                    });
                    confirmPopup.then(function (res) {
                        if (res) {
                            /**************************打包放开 start*******************************/
                            var url = $scope.result.Url; //下载路径
                            var targetPath = cordova.file.externalRootDirectory + "AndroidDownload/RFMobile.apk"; //下载存放路径
                            var trustHosts = true;
                            var options = {};
                            $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
                                .then(function (result) {
                                    $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive').then(function (mes) {}, function (err) {

                                    })
                                    $ionicLoading.hide();
                                }, function (err) {
                                    $ionicLoading.hide();
                                    $ionicLoading.show({
                                        template: '下载失败！',
                                        duration: 2000
                                    });
                                }, function (progress) {
                                    $timeout(function () {
                                        var downloadImageProgress = (progress.loaded / progress.total) * 100;
                                        $ionicLoading.show({
                                            template: "已经下载:" + Math.floor(downloadImageProgress) + "%"
                                        });
                                        if (downloadImageProgress > 99) {
                                            $ionicLoading.hide();
                                        }
                                    });
                                });
                        }
                    });
                }
            });
        }

        $scope.outLineLogon = function () {
            $scope.longinClickable = true;
            if ($scope.modal) {
                $scope.modal.show();
            }

            $timeout(function () {
                $scope.$apply(function () {
                    $("#login").css({
                        "background-color": "#59bcfd"
                    });
                    $scope.longinClickable = false;
                });
            }, 5000);

            $timeout(function () {
                $scope.$apply(function () {
                    $("#login").css({
                        "background-color": "#F4C600"
                    });
                });
            }, 1);
            if ($scope.user.UserId == undefined || $scope.user.UserId == '') {
                $ionicLoading.show({
                    template: '请输入账号',
                    duration: 2000
                });
                return false;
            }
            if ($scope.user.UserPwd == undefined || $scope.user.UserPwd == '') {
                $ionicLoading.show({
                    template: '请输入密码',
                    duration: 2000
                });
                return false;
            }
            AmApp.userID = $scope.user.UserId;
            $rootScope.userName = $scope.user.UserId;
            $scope.changeState('outCustomerManagement');
        }

        var setData = function (data) {
            AmApp.userClass = data.userClass;
            AmApp.userID = data.userID;
            AmApp.passWord = $scope.user.UserPwd;
            AmApp.userName = data.userName;
            AmApp.orgID = data.orgID;
            AmApp.orgName = data.orgName;
            var loaclStorage = window.localStorage;
            loaclStorage['userName'] = data.userName;
            localStorage['orgName'] = data.orgName;
        };
        $scope.Refresh = function () {
            $scope.isShow = "none";
        };
        basePage.init($scope, loadData);
        document.addEventListener("deviceready", loadAccount, true);

        /****************************加密添加 服务地址begin***************************************/
        $scope.setNetwork = function () {
            $scope.data = {
                wifi: AmApp.config.ServiceRealRootPath
            };
            $ionicModal.fromTemplateUrl('templates/Sign/setServiceIP.html', {
                scope: $scope,
                backdropClickToClose: false
            }).then(function (modal) {
                $scope.modal = modal;
                $scope.modal.show();
            });

        };

        $scope.confirm = function () {
            AmApp.setCookie($cookies, "ServiceRealRootPath", $scope.data.wifi);
            AmApp.setCookie($cookies, "ServiceRootPath", $scope.data.wifi + "/JSONService?method=");
            AmApp.config.ServiceRealRootPath = $scope.data.wifi;
            AmApp.config.ServiceRootPath = $scope.data.wifi + "/JSONService?method=";
            $scope.modal.remove();
        }

        $scope.goBack = function () {
            $scope.modal.remove();
        }
        /****************************加密添加end***************************************/
    });