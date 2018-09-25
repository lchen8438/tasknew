/**
 * @file 我的模块
 * @author
 */
angular
    .module('com.amarsoft.mobile.controllers.mine', [])

    /**
     * 我的主界面
     */
    .controller(
        'MyController',
        function ($scope, $state, $http, $ionicPopup, $ionicLoading, $stateParams, basePage) {
            $scope.footActiveIndex = 3;
            console.log("111111");
            //初始化页面，密码初始化仅系统管理员可见
            /*   if(AmApp.userClass.indexOf('E')>=0){
               	$scope.initPassword = true;
               }*/

            //初始化总行通知条数
            $scope.count = {
                newsCount: 0
            };

            var loadData = function ($ionicLoading) {
                //获取localStorage中存储的用户名称和机构名称
                var loaclStorage = window.localStorage;
                $scope.mycount = {
                    userName: loaclStorage['userName'],
                    orgName: loaclStorage['orgName']
                };

                //获取总行通知条数
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    "myControl", {
                        UserId: AmApp.userID
                    },
                    function (data, status) {
                        $scope.count.newsCount = data["array"][0].NewsCount;
                    });
            };
            /**显示用户信息**/
            $scope.showPersionInfo = function () {
                // $state.go('personInfo');
            }


            //跳转到工作日志页面
            $scope.gotologs = function () {
                $state.go('logs');
            };
            //跳转到总行通知页面
            $scope.gotoNews = function () {
                $state.go('notice');
            };
            //跳转到设置页面
            $scope.gotoSet = function () {
                $state.go('setAccount');
            };
            //跳转到审批统计页面
            $scope.gotoExam = function () {
                $state.go('exam');
            };
            //跳转到离线地图页面
            $scope.gotoOfflineMap = function () {
                window.startOfflineMapManager([], function () {

                }, function (err) {
                    alert(err);
                });
            };
            //跳转到离线地图轨迹页面
            $scope.gotoLocus = function () {
                $state.go('trace');
            };
            //密码初始化
            $scope.InitPassword = function () {
                $state.go('InitPassword');
            };

            basePage.init($scope, loadData);
        })



    /**密码初始化**/
    .controller('InitPasswordForIphoneController', function ($scope, $http, $ionicLoading, $ionicPopup, $state,
        paging, basePage, $stateParams) {

        $scope.info = {
            show: false
        } //默认搜索框为隐藏
        var iPageSize = 10;
        $scope.query = {
            UserName: "",
            UserId: ""
        };

        var loadData = function ($ionicLoading) {
            runServiceWithSession($http, $ionicLoading, $ionicPopup, $state,
                "Cxsyyh", {
                    OrgId: AmApp.orgID,
                    LogonId: $scope.query.UserId,
                    UserName: $scope.query.UserName,
                    PageNo: $scope.pageNo,
                    PageSize: iPageSize
                },
                function (data, status) {
                    for (var k = 0; k < data["array"].length; k++) {
                        $scope.items.push(data["array"][k]);
                        $scope.items[k].checked = false;
                    }
                    $scope.hasMore = (($scope.pageNo - 1) *
                        iPageSize + data["array"].length < data.totalCount);
                    $scope.loadingMore = false;
                    if ($scope.items.length) {
                        $scope.noData = false;
                    } else {
                        $scope.noData = true;
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        }
        paging.init($scope, iPageSize, 1, loadData);

        $scope.showdialog = false;
        $scope.showDialog = function () { //弹出确认窗口
            $scope.ArrayLogonID = "";
            for (var i = 0; i < $scope.items.length; i++) {
                if ($scope.items[i].checked == true) {
                    $scope.ArrayLogonID = $scope.ArrayLogonID + "@" + $scope.items[i].LogonId;
                }
            }
            $scope.showdialog = true;
        }

        $scope.cancelDialog = function () { //关闭弹出窗口
            $scope.showdialog = false;
        }

        $scope.comfire = function () {
            if ($scope.ArrayLogonID == "") {
                $ionicLoading.show({
                    template: "请选择需要初始化密码用户！",
                    duration: 2000
                });
            } else {
                runServiceWithSession($http, $ionicLoading, $ionicPopup, $state,
                    "initPassword", {
                        LogonId: $scope.ArrayLogonID
                    },
                    function (data, status) {
                        $ionicLoading.show({
                            template: data.array[0].OperationMsg,
                            duration: 3000
                        });
                        $scope.ArrayLogonID = "";
                    });
            }
            $scope.showdialog = false;
        }
        /********搜索框显示/隐藏***********/
        $scope.showSearchBar = function () {
            $scope.query = {
                UserName: "",
                UserId: ""
            };
            if ($scope.info.show) {
                $scope.info.show = false;
            } else {
                $scope.info.show = true;
            }
        }
        /**********重置搜索条件***********/
        $scope.clearData = function () {
            $scope.query = {
                UserName: "",
                UserId: ""
            };
        }

        $scope.searchinfo = function () {
            if ($scope.query.UserName == "" && $scope.query.UserId == "") {
                $ionicLoading.show({
                    template: "请至少输入一个查询条件！",
                    duration: 2000
                });
                return false;
            }
            $scope.info.show = false;
            paging.init($scope, iPageSize, 1, loadData);
            $scope.refresh();
        }


    })


    /**用户信息控制器**/
    .controller('personInfoForiPhoneController', function ($scope, $http, $ionicLoading, $ionicPopup, $state, basePage, $stateParams, $timeout) {
        $ionicLoading.show({
            template: "数据加载中,请稍后！"
        });
        var loadData = function () { //加载默认身份信息
            runServiceWithSession(
                $http,
                $ionicLoading,
                $ionicPopup,
                $state,
                "Cxmrsf", {
                    UserId: AmApp.loginID
                },
                function (data, status) {
                    $scope.userID = data.array[0].UserId;
                    $scope.userName = data.array[0].UserName;
                    $scope.BelongOrg = data.array[0].BelongOrg;
                    $scope.PhoneNo = data.array[0].PhoneNo;
                    $scope.CertID = data.array[0].CertID;
                    $scope.CertBelongOrg = data.array[0].CertBelongOrg;
                    if ($stateParams.Flag == "true") {
                        $scope.CertID = $stateParams.CertID;
                        $scope.CertBelongOrg = AmApp.orgName;
                    }
                    $ionicLoading.hide();
                });
        }
        //loadData($ionicLoading);

        $scope.gotoMy = function () { //返回上一层
            $state.go('my');
        }

        $scope.MyID = function () { //我的身份
            $state.go('MyID');
        }
        basePage.init($scope, loadData);
    })

    /**我的身份控制器**/
    .controller('MyIDForiPhoneController', function ($scope, $rootScope, $http, $ionicLoading, $ionicPopup, $state, basePage, $stateParams, $timeout) {
        $scope.items = [];
        var loadListData = function ($ionicLoading) { //加载身份列表信息
            runServiceWithSession(
                $http,
                $ionicLoading,
                $ionicPopup,
                $state,
                "Cxsysf", {
                    UserId: AmApp.loginID
                },
                function (data, status) {
                    for (var k = 0; k < data["array"].length; k++) {
                        $scope.items.push(data["array"][k]);
                    }
                });
        }
        loadListData($ionicLoading);
        $scope.gotoPersonInfo = function () { //返回客户详情
            $state.go('personInfo');
        }

        $scope.saveItem = function (item) { //保存选中的身份信息
            $scope.dataArray = []; //置空数组，避免不同身份信息查询角色缓存
            $scope.subListUserId = item.UserId;
            $scope.subListBelongOrg = item.CertBelongOrg;
            $scope.subListOrgID = item.CertBelongOrgID;
            $scope.userClass = item.userClass;
        }

        $scope.gotoPersonDetail = function () { //查看角色信息
            if ($scope.subListUserId != null) {
                $state.go('personDetail', {
                    UserID: $scope.subListUserId
                });
            } else {
                alert("请先选择身份！")
            }
        }

        $scope.showdialog = false;
        $scope.showDialog = function () { //弹出确认窗口
            if ($scope.subListUserId != null) {
                $scope.showdialog = true;
            } else {
                alert("请先选择身份！")
            }

        }
        $scope.cancelDialog = function () { //关闭弹出窗口
            $scope.showdialog = false;
        }
        $scope.comfire = function () { //确认窗口
            $scope.showdialog = false;
            AmApp.userID = $scope.subListUserId;
            AmApp.orgID = $scope.subListOrgID;
            AmApp.orgName = $scope.subListBelongOrg;
            $scope.subListUserClass = $scope.userClass;
            //切换身份前，置空所有权限 
            $rootScope.userClass.cusManage = false;
            $rootScope.userClass.approver = false;
            $rootScope.userClass.manager = false;
            $rootScope.userClass.sysManager = false;
            $rootScope.userClass.leader = false;

            if ($scope.subListUserClass.indexOf('A') >= 0) {
                $rootScope.userClass.cusManage = true; //客户经理
            }
            if ($scope.subListUserClass.indexOf('B') >= 0) {
                $rootScope.userClass.approver = true; //信贷审批岗
            }
            if ($scope.subListUserClass.indexOf('C') >= 0) {
                $rootScope.userClass.manager = true; //信贷管理员
            }
            if ($scope.subListUserClass.indexOf('D') >= 0) {
                $rootScope.userClass.leader = true; //领导岗
            }
            if ($scope.subListUserClass.indexOf('E') >= 0) {
                $rootScope.userClass.sysManager = true; //系统管理员
            }

            $state.go('my', {
                Flag: true,
                CertID: $scope.subListUserId,
                CertBelongOrg: $scope.subListBelongOrg,
            });
        }

        basePage.init($scope);
    })

    /**角色信息控制器**/
    .controller('personDetailForiPhoneController', function ($scope, $http, $ionicLoading, $ionicPopup, $state, basePage, $stateParams) {
        $scope.listUserId = $stateParams.UserID;
        $scope.dataArray = [];
        var loadRoleListData = function ($ionicLoading) { //加载身份列表信息
            runServiceWithSession(
                $http,
                $ionicLoading,
                $ionicPopup,
                $state,
                "Cxsyjs", {
                    UserId: $scope.listUserId
                },
                function (data, status) {
                    for (var k = 0; k < data["array"].length; k++) {
                        $scope.dataArray.push(data["array"][k]);
                    }
                });
        }
        loadRoleListData($ionicLoading);

        $scope.gotoMyID = function () {
            $state.go('MyID');
        }

        $scope.gotoPersonDetail1 = function (user) { //点击身份列表显示角色信息
            $scope.dataArray = []; //置空数组，避免不同身份信息查询角色缓存
            $scope.subListUserId = user.UserId;
            $scope.subListBelongOrg = user.BelongOrg;
            //loadRoleListData($ionicLoading);
        }


        basePage.init($scope);
    })
    /**
     * 工作日志列表
     */
    .controller(
        'logsController',
        function ($scope, $state, $http, $ionicPopup, $ionicLoading,
            paging, $ionicScrollDelegate) {
            //绑定搜索框的值
            $scope.logsearch = {
                WorkBrief: ''
            };
            var iPageSize = 8;

            //初始化页面根据UserId加载数据
            var loadData = function ($ionicLoading) {
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    "checklogs", {
                        pageSize: iPageSize,
                        pageNo: $scope.pageNo,
                        InputUserId: AmApp.userID,
                        WorkBrief: $scope.logsearch.WorkBrief
                    },
                    function (data, status) {
                        for (var k = 0; k < data["array"].length; k++) {
                            $scope.items.push(data["array"][k]);
                        }
                        $scope.hasMore = (($scope.pageNo - 1) *
                            iPageSize + data["array"].length < data.totalCount);
                        $scope.loadingMore = false;
                        if ($scope.items.length) {
                            $scope.noData = false;
                        } else {
                            $scope.noData = true;
                        }
                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    });
            };
            paging.init($scope, iPageSize, 1, loadData);

            //点击查询按钮
            $scope.tologsSelect = function () {
                $scope.items = [];
                $scope.pageNo = 1;
                loadData();
                $ionicScrollDelegate.$getByHandle('mainScroll').scrollTop();
            };

            //点击返回按钮
            $scope.gomy = function () {
                $state.go('my');
            };

            //点击新增按钮
            $scope.gotologadd = function () {
                $state.go('logadd');

            };

            //点击日志进入详情页面
            $scope.gotologbaseinfo = function (SerialNo) {
                $state.go('logbaseinfo', {
                    SerialNo: SerialNo
                });

            };

        })


    // 工作日志基本信息修改
    .controller(
        'logbaseinfoController',
        function ($scope, $state, $http, $ionicLoading, $ionicPopup, $stateParams, $timeout,
            basePage) {
            //定义一个ng-model绑定页面数据
            $scope.log = {
                InputUserId: '',
                InputOrgId: '',
                WorkContent: '',
                WorkType: '',
                InputDate: '',
                WorkBrief: '',
                SerialNo: ''
            };

            $scope.itemNo = [];
            var SerialNo = $stateParams.SerialNo;

            var loadData = function ($ionicLoading) {
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    "checklogInfo", {
                        "SerialNo": SerialNo
                    },
                    function (data, status) {
                        $scope.log.InputDate = data.InputDate;
                        $scope.log.InputOrgId = AmApp.orgName;
                        $scope.log.InputUserId = AmApp.userName;
                        $scope.log.WorkBrief = data.WorkBrief;
                        $scope.log.WorkContent = data.WorkContent;
                        $scope.itemNo = data.WorkType;
                    });
                getWorkType();
            };

            //初始化页面时，加载工作类型的下拉菜单
            var getWorkType = function ($ionicLoading) {
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    'getWorkType', {
                        'CodeNo': 'WorkType'
                    },
                    function (data, status) {
                        $scope.WorkType = data["array"];
                        data["array"][0].ItemNO = $scope.itemNo;
                    }
                )
            };

            //点击保存按钮，修改日志
            $scope.dosave = function () {
                $scope.log.InputUserId = AmApp.userID;
                //获取页面上SELECT框的值
                var myselect = document.getElementById("worktype");
                var index = myselect.selectedIndex;
                $scope.log.WorkType = myselect.options[index].value.substring(7);
                $scope.log.SerialNo = SerialNo;
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    'addlogs',
                    $scope.log,
                    function (data, status) {
                        if (data.Flag == "Y") {
                            $ionicLoading.show({
                                template: "修改日志成功！",
                                duration: 1000
                            });
                            $timeout(function () {
                                $state.go("logs");
                            }, 1000)
                        } else {
                            $ionicLoading.show({
                                template: "修改失败稍后重试",
                                duration: 1500
                            });
                        }
                    }
                );
            };

            //点击按钮删除日志
            $scope.dodelete = function () {
                //添加ALERT框进行确认判断
                var confirmPopup = $ionicPopup.confirm({
                    title: '删除日志',
                    template: '你确定要将该日志删除？',
                    okText: '确定',
                    cancelText: '取消'
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        runServiceWithSession(
                            $http,
                            $ionicLoading,
                            $ionicPopup,
                            $state,
                            'deletelog', {
                                "SerialNo": SerialNo
                            },
                            function (result, status) {
                                if (result.Flag == "Y") {
                                    $ionicLoading.show({
                                        template: "删除日志成功！",
                                        duration: 1000
                                    });
                                    $timeout(function () {
                                        $state.go("logs");
                                    }, 1000)
                                } else {
                                    $ionicLoading.show({
                                        template: "删除失败稍后重试",
                                        duration: 1500
                                    });
                                    $timeout(function () {
                                        $state.go("logs");
                                    }, 1000)
                                    return false;
                                }
                            }
                        );

                    } else {

                    }

                });

            };

            basePage.init($scope, loadData);
        })

    /**
     * 工作日志新增页面
     */
    .controller(
        'logaddController',
        function ($scope, $state, $http, $ionicLoading, $ionicPopup, $stateParams, $timeout,
            basePage) {

            //绑定页面的数据
            $scope.log = {
                InputUserId: '',
                InputOrgId: '',
                WorkContent: '',
                WorkType: "",
                InputDate: '',
                WorkBrief: ''
            };

            //初始化页面参数
            $scope.log.InputOrgId = AmApp.orgName;
            $scope.log.InputUserId = AmApp.userName;

            var getdate = function getdate() {
                var date = new Date();
                //getMonth()返回的是0-11，则需要加1
                var mon = date.getMonth() + 1;
                //如果小于9的话，则需要加上0
                if (mon <= 9) {
                    mon = "0" + mon;
                }
                //getdate()返回的是1-31，则不需要加1
                var day = date.getDate();
                //如果小于9的话，则需要加上0
                if (day <= 9) {
                    day = "0" + day;
                }
                $scope.log.InputDate = date.getFullYear() + "/" + mon + "/" + day;
            };

            //获取下拉菜单的数据
            var loadData = function ($ionicLoading) {
                getdate();
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    'getWorkType', {
                        'CodeNo': 'WorkType'
                    },
                    function (data, status) {
                        $scope.WorkType = data["array"];
                        $scope.ItemNo = data["array"][0].ItemNO;
                    }
                )
            };

            //保存数据
            $scope.dosave = function () {
                var myselect = document.getElementById("worktype");
                var index = myselect.selectedIndex;
                $scope.log.WorkType = myselect.options[index].value.substring(7);
                $scope.log.InputUserId = AmApp.userID;
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    'addlogs',
                    $scope.log,
                    function (data, status) {
                        if (data.Flag == "Y") {
                            $ionicLoading.show({
                                template: "" +
                                    "新增日志成功！",
                                duration: 1500
                            });
                            $timeout(function () {
                                $state.go("logs");
                            }, 1000)
                        } else {
                            $ionicLoading.show({
                                template: "" +
                                    "新增失败稍后重试",
                                duration: 2000
                            });
                        }
                    }
                )
            };

            basePage.init($scope, loadData);
        })

    /**
     * 总行通知
     */
    .controller(
        'NoticeController',
        function ($scope, $state, $http, $ionicPopup, $ionicLoading,
            paging) {
            var iPageSize = 8;

            //根据USERID获取信息
            var loadData = function ($ionicLoading) {
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    "notice", {
                        UserId: AmApp.userID,
                        OrgId: AmApp.orgID,
                        pageSize: iPageSize,
                        pageNo: $scope.pageNo,
                        latesDate: $scope.latesDate
                    },
                    function (data, status) {
                        for (var k = 0; k < data["array"].length; k++) {
                            $scope.items.push(data["array"][k]);
                        }
                        $scope.hasMore = (($scope.pageNo - 1) *
                            iPageSize + data["array"].length < data.totalCount);
                        $scope.loadingMore = false;
                        if ($scope.items.length) {
                            $scope.noData = false;
                        } else {
                            $scope.noData = true;
                        }
                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    });
            };
            //跳转到通知详情页面
            $scope.gotoNoticeDetail = function (boardNo) {
                $state.go('noticeDetail', {
                    boardNo: boardNo
                });
            };

            paging.init($scope, iPageSize, 1, loadData);
        })

    /**
     * 总行通知的详情
     */
    .controller(
        'NoticeDetailController',
        function ($scope, $state, $stateParams, $http, $ionicPopup,
            $ionicLoading, basePage) {
            //定义参数
            $scope.items = [];

            //获取参数
            $scope.boardNo = $stateParams.boardNo;

            //根据通知的boardNo获取详情
            runServiceWithSession(
                $http,
                $ionicLoading,
                $ionicPopup,
                $state,
                "noticeDetail", {
                    boardNo: $scope.boardNo
                },
                function (data, status) {
                    $scope.notice = data["array"][0];
                    for (var k = 1; k < data["array"].length; k++) {
                        $scope.items.push(data["array"][k]);
                    }
                });

            //点击下载附件
            $scope.donwloadDoc = function (item) {
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    "donwloadDoc",
                    item,
                    function (data, status) {
                        $scope.docUrl = encodeURI(AmApp.config.ServiceRealRootPath + "/AttachView?" + "docNo=" + item.DocNo + "&attachmentNo=" + item.AttachmentNo + "&fileName=" + item.FileName + "&FullPath=" + item.FullPath);
                        if (typeof (Download) == 'object') {
                            var arr = [$scope.docUrl, item.FileName];

                            window.download(arr, function (msg) {}, function (err) {});
                        } else {
                            window.open($scope.docUrl);
                        }

                    });
            };
            basePage.init($scope);
        })


    /**
     * 设置页面
     */
    .controller(
        'SetAccountController',
        function ($scope, $state, $http, $ionicPopup, $ionicLoading,
            basePage, $ionicActionSheet, $cookies, $interval) {
            $scope.isGestureSet = false;
            $scope.showGesturePassword = true;

            //修改密码
            $scope.gotoXGpassword = function () {
                $state.go('XGpassword');
            };
            //意见反馈
            $scope.gotoFeedback = function () {
                $state.go('Feedback');
            };
            //关于
            $scope.gotoAbout = function () {
                $state.go('about');
            };
            //手势密码
            $scope.gotoGesture = function () {
                $state.go('gesture');
            };
            $scope.status = false;

            $scope.changeLocationStatus = function (click) {
                if (click) {
                    AmApp.setCookie($cookies, "LocationStatus", true);
                    rootHttp = $http;
                    startGetLocation($interval);
                } else {
                    AmApp.setCookie($cookies, "LocationStatus", false);
                    stopGetLocation($interval);
                }
            };
            var loadData = function () {
                var locationStatus = $cookies.get("LocationStatus");
                var jpushStatus = $cookies.get("JpushStatus");
                if (!locationStatus) {
                    $scope.status = false;
                } else if (locationStatus == 'true') {
                    $scope.status = true;
                } else if (locationStatus == 'false') {
                    $scope.status = false;
                }
                if (!jpushStatus) {
                    $scope.status.Jpush = false;
                } else if (jpushStatus == 'true') {
                    $scope.status.Jpush = true;
                } else if (jpushStatus == 'false') {
                    $scope.status.Jpush = false;
                }
            };

            //退出的登录方法
            /*$scope.logout = function () {

                $ionicActionSheet.show({
                    destructiveText: '退出账号',
                    cancelText: '取消',
                    destructiveButtonClicked: function () {
                        runService($http, $ionicLoading, "logout", {},
                            function (data, status) {
                                if (data.Result == 'Y') {
                                    var locationStatus = $cookies.get("LocationStatus");
                                    if (locationStatus == 'true') {
                                      stopGetLocation($interval);
                                    }
                                    $ionicLoading.show({
                                        template: '当前账号已经退出！',
                                        duration: 1000
                                    });
                                    $scope.changeState('logon',{
                                    	loginID:AmApp.loginID
                                    });
                                }
                            });
                    }
                });
            };*/
            basePage.init($scope, loadData);
        })


    /**
     * 修改密码
     */
    .controller(
        'XGpasswordController',
        function ($scope, $state, $ionicPopup, $http, $ionicLoading,
            basePage) {
            //页面初始化数据
            var loadData = function ($ionicLoading) {
                $scope.pwd = {
                    oldPassword: "",
                    newPassword1: "",
                    newPassword2: ""
                };
            };
            //进行密码校验
            $scope.confirm = function () {
                if ($scope.pwd.oldPassword == '' ||
                    $scope.pwd.newPassword1 == '' ||
                    $scope.pwd.newPassword2 == '') {
                    $ionicLoading.show({
                        template: "请输入密码！",
                        duration: 2000
                    });
                    return false;
                } else if ($scope.pwd.oldPassword == $scope.pwd.newPassword1) {
                    $ionicLoading.show({
                        template: "请勿使用旧密码作为新密码！",
                        duration: 2000
                    });

                    return false;
                } else if ($scope.pwd.newPassword1 != $scope.pwd.newPassword2) {
                    $ionicLoading.show({
                        template: "两次输入的密码不一致！",
                        duration: 2000
                    });

                    return false;
                }
                //点击修改密码
                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    'XGpassword', {
                        OldPwd: $scope.pwd.oldPassword,
                        NewPwd: $scope.pwd.newPassword1
                    },
                    function (data, status) {
                        $scope.result = data["array"][0];
                        if ($scope.result.ReturnFlag == "SUCCEEDED") {
                            $ionicLoading.show({
                                template: "密码修改成功！",
                                duration: 1500
                            });
                            $state.go('setAccount');
                        } else {
                            $ionicLoading.show({
                                template: $scope.result.ReturnFlag,
                                duration: 2000
                            });
                        }
                    });
            };

            basePage.init($scope, loadData);
        })

    /**
     * 手势密码
     */
    .controller(
        'gestureController',
        function ($scope, $state, $ionicPopup, $http, $ionicLoading, basePage) {
            $scope.gesture = {
                click: false,
                isShow: false
            };

            var loadData = function () {
                window.getGestureStatus([AmApp.loginID], function (msg) {
                    if (msg == 'set') {
                        $scope.gesture = {
                            click: true,
                            isShow: true
                        };
                    }
                    if (msg == 'unset') {
                        $scope.gesture = {
                            click: false,
                            isShow: false
                        };
                    }
                })
            };

            $scope.gotoChange = function () {
                window.changeGesture([AmApp.loginID], function (msg) {

                }, function (err) {

                });
            };

            $scope.clickchange = function (click) {
                if (click) {
                    window.setGesture([AmApp.loginID], function (msg) {
                        if (msg == 'fail') {
                            $scope.gesture.click = false;
                            $scope.gesture.isShow = false;
                            $state.go('gesture');

                        } else {
                            $scope.gesture.click = true;
                            $scope.gesture.isShow = true;
                            $state.go('gesture');
                        }
                    }, function (err) {

                    })

                } else {

                    //清除密码
                    window.cleanGesture([AmApp.loginID], function (msg) {
                        if (msg == 'success') {
                            $scope.gesture.click = false;
                            $scope.gesture.isShow = false;
                            $state.go('gesture');
                        }
                    }, function (err) {

                    })
                }
            };
            basePage.init($scope, loadData);
        })

    /**
     *  审批审计
     */
    .controller(
        'ExamController',
        function ($scope, basePage, $http, $stateParams, $state,
            $ionicPopup, $ionicLoading, paging) {
            $scope.item = {};
            $scope.item.other = 1;
            $scope.item.agree = 1;
            $scope.item.disagree = 1;
            $scope.item.backup = 1;
            $scope.item.supplementary = 1;
            var userID = AmApp.userID;
            var iPageSize = 8;

            var drawChart = function (dom) {
                var myChart = echarts.init(dom);
                var app = {};
                option = null;
                option = {
                    title: {
                        x: 'center'
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    legend: {
                        orient: 'vertical',
                        left: 'left',
                        data: ['其他', '同意', '否决', '退回', '提交']
                    },
                    series: [{
                        name: '访问来源',
                        type: 'pie',
                        radius: '55%',
                        center: ['50%', '60%'],
                        data: [{
                            value: $scope.item.Other,
                            name: '其他'
                        }, {
                            value: $scope.item.Agree,
                            name: '同意'
                        }, {
                            value: $scope.item.Disagree,
                            name: '否决'
                        }, {
                            value: $scope.item.Backup,
                            name: '退回'
                        }, {
                            value: $scope.item.Submit,
                            name: '提交'
                        }],
                        itemStyle: {
                            emphasis: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }]
                };
                if (option && typeof option === "object") {
                    var startTime = +new Date();
                    myChart.setOption(option, true);
                    var endTime = +new Date();
                    var updateTime = endTime - startTime;
                }
            };

            var drawChart1 = function (dom1) {
                var myChart = echarts.init(dom1);
                var app = {};
                option = null;
                option = {
                    title: {
                        x: 'center'
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    legend: {
                        orient: 'vertical',
                        left: 'left',
                        data: ['24小时内', '48小时内', '其他']
                    },
                    series: [{
                        name: '访问来源',
                        type: 'pie',
                        radius: '55%',
                        center: ['50%', '60%'],
                        data: [{
                            value: $scope.item.Time24,
                            name: '24小时内'
                        }, {
                            value: $scope.item.Time48,
                            name: '48小时内'
                        }, {
                            value: $scope.item.Timeother,
                            name: '其他'
                        }],
                        itemStyle: {
                            emphasis: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }]
                };
                if (option && typeof option === "object") {
                    var startTime = +new Date();
                    myChart.setOption(option, true);
                    var endTime = +new Date();
                    var updateTime = endTime - startTime;
                }
            };

            runServiceWithSession($http, $ionicLoading, $ionicPopup,
                $state, "exam", {
                    pageSize: iPageSize,
                    pageNo: $scope.pageNo,
                    userID: userID
                },
                function (data, status) {
                    $scope.item = data["array"][0];

                    // 画饼状图-动作统计
                    var dom = document.getElementById("container");
                    drawChart(dom);
                    // 画饼状图-时效性统计
                    var dom1 = document
                        .getElementById("container1");
                    drawChart1(dom1);

                });

            basePage.init($scope);

        })


    /**
     * 意见反馈
     */
    .controller(
        'FeedbackController',
        function ($scope, $state, $ionicPopup, $ionicLoading, $http,
            $timeout, basePage) {
            /* 意见 */
            $scope.opinion = {
                signOpinion: ""
            };

            $scope.submit = function () {
                if ($scope.opinion.signOpinion == '') {
                    $ionicLoading.show({
                        template: "请填写您的意见！",
                        duration: 2000
                    });
                    return false;
                };

                $scope.params = {
                    opinion: $scope.opinion.signOpinion,
                    Userid: AmApp.userID

                };

                runServiceWithSession($http, $ionicLoading,
                    $ionicPopup, $state, "feedback", $scope.params,
                    function (data, status) {
                        $scope.result = data["array"][0];
                        if ($scope.result.ReturnFlag == "true") {
                            $ionicLoading.show({
                                template: "意见提交成功，感谢您的宝贵意见！",
                                duration: 2000
                            });
                            $timeout(function () {
                                $scope.goBack();
                            }, 2005);

                        } else {
                            $ionicLoading.show({
                                template: "意见提交失败！",
                                duration: 2000
                            });
                        }
                    });
            };

            basePage.init($scope);
        })

    /**
     * 关于
     */
    .controller('AboutController',
        function ($scope, $state, $http, $timeout, $ionicLoading, $cordovaFileOpener2, $cordovaFileTransfer, $ionicPopup, basePage) {
            var loadData = function () {
                $ionicLoading.show({
                    template: '数据加载中，请稍后……',
                    duration: 2000
                });
                $scope.redPointShow = true;
                var version = {
                    Version: AmApp.config.Version,
                    Platform: AmApp.config.DeviceType
                };

                runService($http, $ionicLoading, "getversion", version, function (data, status) {
                    var result = data["array"][0];
                    console.log(JSON.stringify(data));
                    if (result.ReturnFlag == "Y") {
                        $scope.redPointShow = true; //控制版本更新提示是否显示
                        $scope.$digest();
                    } else {
                        $scope.redPointShow = false;
                    }
                });
            }




            $scope.renovate = function () {
                $scope.version = {
                    Version: AmApp.config.Version,
                    Platform: AmApp.config.DeviceType
                };
                runService(
                    $http,
                    $ionicLoading,
                    "getversion",
                    $scope.version,
                    function (data, status) {
                        $ionicLoading.hide();
                        $scope.result = data["array"][0];
                        if ($scope.result.ReturnFlag == "Y") {
                            // 有新版本
                            var confirmPopup = $ionicPopup
                                .confirm({
                                    title: '<strong>版本更新</strong>',
                                    template: '是否更新？',
                                    okText: '确定',
                                    cancelText: '取消'
                                });
                            confirmPopup.then(function (res) {
                                if (res) {
                                    if (ionic.Platform.isAndroid()) {
                                        /**************************打包放开 start*******************************/

                                        var url = $scope.result.Url; //下载路径
                                        var targetPath = "";
                                        var targetPath = cordova.file.externalRootDirectory + "/AndroidDownload/AFCC.apk"; //下载存放路径
                                        alert("targetPath" + targetPath);
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

                                        /**********************打包放开  end***************************/
                                    } else if (ionic.Platform.isIOS()) {
                                        /**************************打包放开 start*******************************/
                                        window.operUrl([$scope.result.Url], function () {}, function () {});
                                        /**********************打包放开  end***************************/
                                    } else {
                                        window.open($scope.result.Url);
                                    }
                                } else {}
                            });
                        } else {
                            $ionicLoading.show({
                                template: "当前版本已是最新版本！",
                                duration: 2000
                            });
                        }
                    });

            };

            $scope.explain = function () {
                $state.go('explain');
            };

            basePage.init($scope, loadData);
        })

    /**
     * 版本检测页面
     */
    .controller('RenovateController', function ($scope, $state, basePage) {
        basePage.init($scope);
    })

    /**
     * 版本说明页面
     */
    .controller('ExplainController', function ($scope, $state, basePage) {
        basePage.init($scope);
    })

    /**
     * 轨迹查询界面
     */
    .controller('TraceController', function ($scope, $state, $http, $ionicPopup, $ionicLoading,
        basePage) {
        $scope.info = {
            date: new Date(),
            startTime: '',
            endTime: ''
        };

        $scope.doSearch = function () {
            $scope.traceInfo = {
                LocateDate: $scope.info.date.format('yyyy-MM-dd'),
                StartTime: $scope.info.startTime.getHours() + ':' + $scope.info.startTime.getMinutes(),
                EndTime: $scope.info.endTime.getHours() + ':' + $scope.info.endTime.getMinutes()
            };
            runService($http, $ionicLoading, 'locationList', $scope.traceInfo,
                function (data, status) {
                    if (data.array.length == 0) {
                        $ionicLoading.show({
                            template: "该时段无位置信息！",
                            duration: 3000
                        });
                    } else {
                        window.startMap([data],
                            function (data) {
                                var obj = eval('(' + data + ')');
                                $state.go('traceUpload', {
                                    fileName: obj.FileName,
                                    filePath: obj.FilePath,
                                    LocateDate: $scope.traceInfo.LocateDate,
                                    StartTime: $scope.traceInfo.StartTime,
                                    EndTime: $scope.traceInfo.EndTime
                                })
                            },
                            function (error) {
                                alert('startmap err:' + error);
                            });
                    }
                });
        }
        basePage.init($scope);
    })
    .controller('TraceUploadController', function ($scope, $state, $http, $ionicPopup, $ionicLoading, $stateParams,
        basePage, $ionicHistory) {
        $scope.info = {
            filePath: $stateParams.filePath
        };
        $scope.traceDetail = {
            LocateDate: $stateParams.LocateDate,
            StartTime: $stateParams.StartTime,
            EndTime: $stateParams.EndTime,
            ImageName: $stateParams.fileName,
            Describe: 'Demo'
        };
        $scope.doUpload = function () {
            $ionicPopup.confirm({
                title: '上传',
                template: '是否要上传该截图?'
            }).then(function (res) {
                if (res) {
                    // runService($http, $ionicLoading, 'traceUpload', $scope.traceDetail,
                    //   function (data, status) {
                    //   })
                    var win = function (r) {
                        if ($.trim(r.response) == "SUCCESS") {
                            $ionicHistory.goBack();
                        }
                    }
                    var fail = function (error) {}
                    var options = new FileUploadOptions();
                    options.fileKey = "file";
                    options.fileName = $stateParams.fileName;
                    options.mimeType = "text/plain";

                    var currentData = new Date();
                    var ft = new FileTransfer();
                    ft.upload($stateParams.filePath, encodeURI(AmApp.config.ServiceRealRootPath + "/FileTransfer?dir=" + AmApp.userID + currentData.format("yyyy-MM-dd")), win, fail, options);
                }
            })
        }
        basePage.init($scope);
    })


;
Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}