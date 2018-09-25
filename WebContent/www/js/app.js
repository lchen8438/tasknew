// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module(
        'com.amarsoft.mobile', ['ionic', 'com.amarsoft.mobile.services',
            'com.amarsoft.mobile.controllers.mine',
            'com.amarsoft.mobile.controllers.logon',
            'ngCordova', 'ngCookies', 'ionic-native-transitions',
            //工作提醒
            'com.amarsoft.mobile.controllers.demo',
            //审批模块-新 add by jjhan
            'com.amarsoft.mobile.controllers.RFexamine',
            'com.amarsoft.mobile.controllers.workTips',
            'com.amarsoft.mobile.controllers.approveStatistical',
            'com.amarsoft.mobile.controllers.sysSelect'
        ])

    .run(function ($ionicPlatform, $state, $ionicActionSheet, $ionicLoading, $rootScope, $location, $ionicHistory, $cordovaToast, $cookies, $http) {
        $ionicPlatform.ready(function () {
            // UserAgent.set("CQBXD");
            // alert('app.js');
            $rootScope.backButtonPressedOnceToExit = true;
            if (ionic.Platform.isAndroid()) {
                window.startLocateService([], function () {

                });

                ionic.Platform.fullScreen(true, false);

                window.getMacAddress(function (result) {
                    var loaclStorage = window.localStorage;
                    loaclStorage['Mac'] = result.Mac;
                    loaclStorage['NetType'] = result.NetType;
                    AmApp.UUID = result.Mac;
                    AmApp.NetType = result.NetType;
                });

                $ionicPlatform.registerBackButtonAction(function () {
                    if ($location.path() == '/') {
                        if ($rootScope.backButtonPressedOnceToExit) {
                            ionic.Platform.exitApp();
                        } else {
                            $rootScope.backButtonPressedOnceToExit = true;
                            $cordovaToast.showLongBottom('再按一次退出系统');
                            setTimeout(function () {
                                $rootScope.backButtonPressedOnceToExit = false;
                            }, 2000);
                        }
                    } else {
                        $ionicHistory.goBack();
                    }
                    // history.back();
                }, 101);
            }

            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }

            if (ionic.Platform.isIOS()) {
                var loaclStorage = window.localStorage;
                loaclStorage['Mac'] = device.uuid;
                loaclStorage['NetType'] = 'WIFI';
                AmApp.UUID = device.uuid;
                AmApp.NetType = 'WIFI';
                window.startLocateService([], function () {});
            }

        });


        $rootScope.setServiceIpModalStyle = {
            "top": "20%",
            "right": "3%",
            "bottom": "50%",
            "left": "3%",
            "min-height": "50px",
            "width": "94%",
            "border-radius": "10px"

        };


        $rootScope.windowWidth = window.innerWidth;//ios
        $rootScope.windowHeight = window.innerHeight;
        /*$rootScope.windowWidth = window.screen.availWidth;//android
        $rootScope.windowHeight = window.screen.availHeight;*/
    
        //宽高获取
        $rootScope.contentWidth = $rootScope.windowWidth * 0.995;
        $rootScope.contentHeight = $rootScope.windowHeight * 0.81;
        
        

        $rootScope.logout = function () {
            //解决开发环境和生产环境 代码兼容问题,以后只需要在config.js里面设置"enviroment"变量值,dev 代表开发环境,produ代表生产环境
            if (AmApp.config.enviroment == 'dev') {
                $ionicActionSheet.show({
                    destructiveText: '退出账号',
                    cancelText: '取消',
                    destructiveButtonClicked: function () {
                        runService($http, $ionicLoading, "logout", {},
                            function (data, status) {
                                if (data.Result == 'Y') {
                                    $ionicLoading.show({
                                        template: '当前账号已经退出！',
                                        duration: 1000
                                    });
                                    $state.go('logon');
                                }
                            });
                    }
                });
            } else if (AmApp.config.enviroment == 'produ') {
                $ionicActionSheet.show({
                    destructiveText: '退出账号',
                    cancelText: '取消',
                    destructiveButtonClicked: function () {
                        runService($http, $ionicLoading, "logout", {},
                            function (data, status) {
                                if (data.Result == 'Y') {
                                    //                                var params = {UserName: AmApp.loginID, PassWord:AmApp.PassWord} 外网放开（手势密码更改）
                                    //                                 window.encrypt([AmApp.PassWord, "qazwUIUY45gftyu7689014dv"], function (msg) {
                                    //                                     params.PassWord = msg;
                                    //                                   }, function (err) {
                                    //                                   })
                                    var params = {
                                        UserName: AmApp.loginID,
                                        PassWord: ''
                                    }
                                    window.encrypt([AmApp.loginID, "qazwUIUY45gftyu7689014dv"], function (msg) {
                                        params.UserName = msg;
                                        alert(JSON.stringify(params));
                                        window.saveData([params], function (msg) {
                                            $ionicLoading.show({
                                                template: '当前账号已经退出！',
                                                duration: 1000
                                            });
                                            $state.go('logon');
                                        }, function (err) {})

                                    }, function (err) {})
                                }
                            });
                    }
                });
            }
        };

        if ($cookies.get("ServiceRootPath")) {
            AmApp.config.ServiceRootPath = $cookies.get("ServiceRootPath");
            AmApp.config.ServiceRealRootPath = $cookies.get("ServiceRealRootPath");
        }



        /*   if($cookies.get("ServiceRootPath")){
           AmApp.config.ServiceRootPath=$cookies.get("ServiceRootPath");
           AmApp.config.ServiceRealRootPath=$cookies.get("ServiceRealRootPath");
           
           }*/
    })

    .run(['$ionicPlatform', '$ionicPopup', '$rootScope', '$location', '$state', '$http', '$ionicLoading',
        '$ionicHistory', '$timeout',
        function ($ionicPlatform, $ionicPopup, $rootScope, $location, $state, $http, $ionicLoading,
            $ionicHistory, $timeout) {

            $rootScope.canExit = false;
            // 主页面显示退出提示框
            $ionicPlatform.registerBackButtonAction(function (e) {
                e.preventDefault();

                function showOutConfirm() {
                    if (typeof (window.plugins.toast) == 'object') {
                        if (!$rootScope.canExit) {
                            window.plugins.toast.show("再点一次退出程序", 2000, "bottom");
                            $rootScope.canExit = true;
                            $timeout(function () {
                                $rootScope.canExit = false;
                            }, 3000);
                        } else {
                            $rootScope.canExit = false;
                            ionic.Platform.exitApp();
                        }
                    } else {
                        var confirmPopup = $ionicPopup.confirm({
                            title: '<strong>退出应用?</strong>',
                            template: '你确定要退出应用吗?',
                            okText: '退出',
                            cancelText: '取消'
                        });
                        confirmPopup.then(function (res) {
                            if (res) {
                                ionic.Platform.exitApp();
                            } else {
                                // Don't close
                            }
                        });
                    }
                }
                
                if ($location.path() == '/') {
                    ionic.Platform.exitApp();
                } else if ($location.path() == '/' || $location.path() == '/examine' ||
                    $location.path() == '/re_list' || $location.path() == '/my' ||
                    $location.path().indexOf('/RFexamine') > -1 || 
                    $location.path() == '/workTips' || 
                    $location.path().indexOf('/approveStatistical') > -1 || 
                    $location.path().indexOf('/RFSysSel') > -1 ) {
                    showOutConfirm();
                } else if ($ionicHistory.viewHistory().backView) {
                    console.log('currentView:', $ionicHistory.viewHistory().currentView);
                    // Go back in history
                    $ionicHistory.viewHistory().backView.go();
                } else {
                    ionic.Platform.exitApp();
                }
                return false;
            }, 101);
        }
    ])




    .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicNativeTransitionsProvider) {

        $ionicNativeTransitionsProvider.setDefaultOptions({
            duration: 0, // in milliseconds (ms), default 400,
            slowdownfactor: 4, // overlap views (higher number is more) or no overlap (1), default 4
            iosdelay: -1, // ms to wait for the iOS webview to update before animation kicks in, default -1
            androiddelay: -1, // same as above but for Android, default -1
            winphonedelay: -1, // same as above but for Windows Phone, default -1,
            fixedPixelsTop: 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
            fixedPixelsBottom: 0, // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android)
            triggerTransitionEvent: '$ionicView.afterEnter', // internal ionic-native-transitions option
            backInOppositeDirection: false // Takes over default back transition and state back transition to use the opposite direction transition to go back
        });
        $ionicNativeTransitionsProvider.setDefaultTransition({
            type: 'slide',
            direction: 'left'
        });

        //是否支持滑动回退，IOS平台下默认支持
        //NOTE:只针对IOS平台有效
        $ionicConfigProvider.views.swipeBackEnabled(false);

        //安卓允许缩放
        $ionicConfigProvider.scrolling.jsScrolling(true);

        $stateProvider
            // 我的
            .state('my', {
                url: "/my",
                cache: false,
                templateUrl: "templates/mine/my.html",
                controller: 'MyController'
            })
            // 工作日志
            .state('logs', {
                url: "/logs",
                cache: false,
                templateUrl: "templates/mine/logs.html",
                controller: 'logsController'
            })

            // 工作日志保存
            .state('logadd', {
                url: "/logadd",
                cache: false,
                templateUrl: "templates/mine/logadd.html",
                controller: 'logaddController'
            })

            .state('explain', {
                url: "/explain",
                templateUrl: "templates/mine/explain.html",
                controller: 'ExplainController'
            })

            // 工作日志基本信息修改
            .state('logbaseinfo', {
                url: "/logbaseinfo/:SerialNo",
                cache: false,
                templateUrl: "templates/mine/logbaseinfo.html",
                controller: 'logbaseinfoController'
            })

            // 审批审计
            .state('exam', {
                url: "/exam/:UserID",
                templateUrl: "templates/mine/exam.html",
                controller: 'ExamController'
            })
            // 总行通知
            .state('notice', {
                url: "/notice",
                templateUrl: "templates/mine/notice.html",
                controller: 'NoticeController'
            })
            // 通知详情
            .state('noticeDetail', {
                url: "/noticeDetail/:boardNo",
                templateUrl: "templates/mine/noticeDetail.html",
                controller: 'NoticeDetailController'
            })

            // 设置
            .state('setAccount', {
                url: "/setAccount",
                templateUrl: "templates/mine/setAccount.html",
                controller: 'SetAccountController'
            })
            // 修改密码
            .state('XGpassword', {
                url: "/XGpassword",
                templateUrl: "templates/mine/XGpassword.html",
                controller: 'XGpasswordController'
            })
            //手势密码
            .state('gesture', {
                url: "/gesture",
                templateUrl: "templates/mine/gesture.html",
                controller: 'gestureController'
            })
            // 安全提醒
            .state('setremind', {
                url: "/setremind",
                templateUrl: "templates/mine/setremind.html",
                controller: 'SetremindController'
            })
            // 意见反馈
            .state('Feedback', {
                url: "/Feedback",
                templateUrl: "templates/mine/Feedback.html",
                controller: 'FeedbackController'
            })
            // 关于
            .state('about', {
                url: "/about",
                templateUrl: "templates/mine/about.html",
                controller: 'AboutController'
            })

            // 登录
            .state('logon', {
                url: "/:loginID",
                cache: true,
                templateUrl: "templates/Sign/index.html",
                controller: 'LogonController'
            })
            
             // 审批审查-新 add by jjhan
            .state('RFexamine', {
                url: "/RFexamine/:SelectTab",
                cache: false,
                templateUrl: "templates/RFexamine/index.html",
                controller: 'RFApproveAccessController'
            })
            .state('RFApproveList', {
                url: "/RFApproveList/:FlowNo/:FlowName/:PhaseNo/:PhaseName/:NodeType",
                cache: false,
                templateUrl: "templates/RFexamine/RFApproveList.html",
                controller: 'RFApproveListController'
            })
            .state('RFApproveDetail', {
                url: "/RFApproveDetail/:ParamObject/:FlowNo/:PhaseNo/:PhaseName/:FlowName/:NodeType",
                cache: false,
                templateUrl: "templates/RFexamine/RFApproveDetail_Side.html",
                controller: 'RFApproveDetailController'
            })
            
            .state('RFSysSel', {
                url: "/RFSysSel",
                cache: false,
                templateUrl: "templates/sysSel/sysSel.html",
                controller: 'SysSelController'
            })
            // RF审批统计
            .state('approveStatistical', {
                url: "/approveStatistical",
                cache: false,
                templateUrl: "templates/RFReport/approveStatistical.html",
                controller: 'ApproveStatisticalController'
            })
            // RF工作台
            .state('workTips', {
                url: "/workTips/:SelectType",
                cache: false,
                templateUrl: "templates/RFWorkTips/WorkTips.html",
                controller: 'WorkTipsController'
            })
            // 工作台--RF工作提醒
            .state('workTipsList', {
                url: "/workTips/:Params",
                cache: false,
                templateUrl: "templates/RFWorkTips/WorkTipsList.html",
                controller: 'WorkTipsListController'
            })

        $urlRouterProvider.otherwise('/');
    });

AmApp.redirect = function ($state, name, params) {
    if (AmApp.UserId && name == 'logon')
        name = 'myAccount';
    $state.go(name, params);
};