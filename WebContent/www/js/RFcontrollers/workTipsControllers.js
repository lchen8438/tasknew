/**
 * @file 主页工作台
 */
angular.module('com.amarsoft.mobile.controllers.workTips', [])

    /**
     * 控制工作提醒主页面
     *
     */
    .controller(
        'WorkTipsController',
        function ($scope, $state, $http, $ionicPopup, $stateParams, $ionicLoading, $rootScope, basePage) {
            $scope.footActiveIndex = 4;
            $scope.items = [];
            // 默认进工作台展示任务提示
            $scope.workType = '010';
            $scope.selectTab0 = true;
            $scope.selectTab1 = false;

            if ($stateParams.SelectType == '010') {
                $scope.workType = '010';
                $scope.selectTab0 = true;
                $scope.selectTab1 = false;
            } else if ($stateParams.SelectType == '020') {
                $scope.workType = '020';
                $scope.selectTab0 = false;
                $scope.selectTab1 = true;
            }

            //点击按钮，定义被选中样式，同时记录状态
            $scope.selectTask = function (tabIndex) {
                if (tabIndex == '0') {
                    $rootScope.remind_tabIndex = 0;
                    $scope.selectTab0 = true;
                    $scope.selectTab1 = false;
                    $scope.workType = '010';
                    $scope.items = [];
                    loadData();
                } else {
                    $rootScope.remind_tabIndex = 1;
                    $scope.selectTab0 = false;
                    $scope.selectTab1 = true;
                    $scope.workType = '020';
                    $scope.items = [];
                    loadData();
                }
            };

            /**
             * 工作台提示信息加载
             * 初始化页面时，获取业务名称和条数
             */
            var loadData = function () {
                loading("数据加载中，请稍后……", 30000);

                runServiceWithSession(
                    $http,
                    $ionicLoading,
                    $ionicPopup,
                    $state,
                    "work_tips", {
                        UserId: AmApp.loginID,
                        WorkType: $scope.workType,
                        SystemType: AmApp.config.sysSelType
                    },
                    function (data, status) {
                        var count = 0;
                        if (data["array"].length > 0) {
                            var obj = data["array"][0].WorkTips;
                            obj = angular.fromJson(obj);

                            for (var k = 0; k < obj.length; k++) {
                                if (obj[k].IconCode) {
                                    obj[k].IconCode = strEscape(obj[k].IconCode);
                                }
                                count = count + obj[k].TaskNumber;
                                $scope.items.push(obj[k]);
                            }


                            if (count != 0) {
                                $scope.noData = false;
                            } else {
                                $scope.noData = true;
                            }

                        } else {
                            $ionicLoading.show({
                                template: "当前暂无任务提示信息！",
                                duration: 2000
                            });
                        }

                        appIonicLoading.hide();

                    });
            };

            // 进入任务提示列表信息
            $scope.gotoTaskList = function (item, index) {
                if ($scope.selectTab0) {
                    // 进入待审批列表信息
                    item.SelectType = '010';
                } else if ($scope.selectTab1) {
                    // 进入到期业务列表信息
                    item.SelectType = '020';
                }

                $scope.changeState("workTipsList", {
                    Params: JSON.stringify(item)
                });

            };

            basePage.init($scope, loadData);
        })

    /**
     * 工作台--业务列表
     */
    .controller(
        'WorkTipsListController',
        function ($scope, $state, $http, $stateParams, $ionicPopup, $timeout, basePage,$rootScope,
            $ionicLoading, paging) {
            var json = angular.fromJson($stateParams.Params);

            $scope.title = json.ItemName;
            var sSelectType = json.SelectType;
            var sItemNo = json.ItemNo;

            if (json.SelectType == '010') {
                $scope.ListShow = true;
            } else {
                $scope.ListShow = false;
            }

            // 返回首页工作台
            $scope.goWorkTips = function () {
                $scope.changeState("workTips", {
                    SelectType: sSelectType
                });
            }

            // 总记录存储容器
            $scope.items = [];
            $scope.flowItems = [];
            // 临时存放存储容器
            $scope.tempItems = [];
            $scope.listPageNo = 0;

            var iPageSize = 99;
            var loadData = function () {

                runServiceWithSession(
                    $http,
                    undefined,
                    $ionicPopup,
                    $state,
                    "work_tipsList", {
                        pageSize: iPageSize,
                        pageNo: $scope.pageNo,
                        UserId: AmApp.userID,
                        ItemNo: sItemNo,
                        SelectType: sSelectType,
                        SystemType: AmApp.config.sysSelType
                    },
                    function (data, status) {
                        var JSONList = angular.fromJson(data["array"][0].WorkTipsArray);

                        for (var k = 0; k < JSONList.length; k++) {
                            JSONList[k].IconCode = strEscape(JSONList[k].IconCode);
                            $scope.items.push(JSONList[k]);

                            if (k < iPageSize) {
                                $scope.tempItems.push(JSONList[k]);
                            }
                        }

                        if ($scope.tempItems.length) {
                            $scope.noData = false;
                        } else {
                            $scope.noData = true;
                        }

                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    });
                // 请求配置化流程列表
                $scope.flowList();
            };

            // 请求当前已模型化配置的流程列表
            $scope.flowList = function () {
                runServiceWithSession($http, $ionicLoading, $ionicPopup,
                    $state, "rfFlowList", {
                        SystemType: AmApp.config.sysSelType,
                        UserId: AmApp.userID
                    },
                    function (data, status) {
                        var JSONList = angular.fromJson(data["array"][0].FlowObject);

                        for (var k = 0; k < JSONList.length; k++) {
                            $scope.flowItems.push({
                                "FlowNo": JSONList[k].FlowNo.value,
                                "FlowName": JSONList[k].FlowName.value
                            });
                        }
                    });
            }

            // 分页待优化
            var loadMoreData = function () {
                $scope.tempItems = [];
                var count = $scope.listPageNo * iPageSize;
                var totalCount;

                if ($scope.items.length > count) {
                    var itemCount = Math.floor(($scope.items.length - count) / iPageSize);

                    if (itemCount > 0) {
                        totalCount = iPageSize;
                    } else {
                        totalCount = $scope.items.length - count;
                    }

                    for (var k = 0; k < totalCount; k++) {
                        $scope.items[k].IconCode = strEscape($scope.items[k].IconCode);
                        $scope.tempItems.push($scope.items[k]);

                    }
                }

                $scope.hasMore = (($scope.listPageNo - 1) * iPageSize + $scope.tempItems.length < $scope.items.length);
                $scope.loadingMore = false;

                if ($scope.tempItems.length) {
                    $scope.noData = false;
                } else {
                    $scope.noData = true;
                }
                $scope.$broadcast('scroll.refreshComplete');
                $scope.$broadcast('scroll.infiniteScrollComplete');

            };

            // 工作台列表前端分页处理
            $scope.loadMoreList = function () {
                $scope.loadingMore = true;
                $timeout(function () {
                    $scope.listPageNo++;
                    // 加载更多
                    loadMoreData.call(this, $ionicLoading);
                }, 1000);
            };

            // 下拉刷新
            $scope.reFreshList = function () {
                $scope.items = [];
                $scope.tempItems = [];
                $scope.listPageNo = 0;
                loadData.call(this);
            }

            // 进入审批列表界面
            $scope.goToApproveList = function (item) {
                var changeFlag = true;
                for (var i = 0; i < $scope.flowItems.length; i++) {
                    if ($scope.flowItems[i].FlowNo == item.FlowNo) {
                        changeFlag = false;

                        if ($rootScope.finished) {
                            // 有数据不做处理
                        } else {
                            $rootScope.finished = 0;
                        }

                        $state.go("RFApproveList", {
                            "FlowNo": item.FlowNo,
                            "FlowName": item.FlowName,
                            "PhaseNo": item.PhaseNo,
                            "PhaseName": item.PhaseName
                        });
                    }
                }

                if (changeFlag) {
                    appIonicLoading.show({
                        template: '当前流程未做模型配置，请联系管理员！',
                        animation: 'fade-in',
                        showBackdrop: true,
                        duration: 1000
                    });
                }
            }

            basePage.init($scope, loadData);
        })