/**
 * @file 审批统计
 */
angular.module('com.amarsoft.mobile.controllers.approveStatistical', [])

    /**
     * 审批统计界面
     *
     */
    .controller(
        'ApproveStatisticalController',
        function ($scope, $state, $http, $ionicPopup, $ionicLoading, $rootScope, basePage, $ionicSideMenuDelegate) {
            $scope.footActiveIndex = 1;
            $scope.item = {};
            $scope.item.other = 1;
            $scope.item.agree = 1;
            $scope.item.disagree = 1;
            $scope.item.backup = 1;
            $scope.item.supplementary = 1;
            var userID = AmApp.userID;
            $scope.items = [];
            $scope.searchFlowTask = '';

            $scope.toggleLeft = function () {
                $ionicSideMenuDelegate.toggleLeft();
            };

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
                        data: ['其他', '批准', '否决', '退回', '提交']
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
                            name: '批准'
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

            var loadData = function () {

                runServiceWithSession($http, $ionicLoading, $ionicPopup,
                    $state, "rfexam", {
                        SearchExam: $scope.searchFlowTask,
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
            }

            /**
             * 根据流程搜索
             * 根据流程编号统计当前用户当前业务流程执行情况
             * @param {*} item 
             */
            $scope.searchFlow = function (item) {
                $scope.searchFlowTask = item.FlowNo;
                loadData();
                $ionicSideMenuDelegate.toggleLeft(false);
            }

            $scope.loadFlowList = function () {

                if (!$scope.items.length > 0) {
                    runServiceWithSession($http, $ionicLoading, $ionicPopup,
                        $state, "rfFlowList", {
                            SystemType: AmApp.config.sysSelType,
                            UserId: AmApp.userID
                        },
                        function (data, status) {
                            var JSONList = angular.fromJson(data["array"][0].FlowObject);

                            for (var k = 0; k < JSONList.length; k++) {
                                $scope.items.push({
                                    "FlowNo": JSONList[k].FlowNo.value,
                                    "FlowName": JSONList[k].FlowName.value
                                });
                            }
                        });
                }

            }

            basePage.init($scope, loadData);
        })