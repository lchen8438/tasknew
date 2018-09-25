angular
    .module('com.amarsoft.mobile.services', [])

    .factory('basePage', function ($state, $ionicLoading, $ionicHistory) {
        return {
            init: function ($scope, loadData) {
                // $scope.changeState = function(name, params) {
                // $state.go(name, params);
                // };
                $scope.changeState = function (name, params) {
                    $ionicHistory.nextViewOptions({
                        disableAnimate: true
                    });
                    $state.go(name, params);
                };
                if (loadData) {
                    loadData.call(this, $ionicLoading);
                }
                $scope.goBack = function () {
                    history.back();
                };
                $scope.goBackNoAnim = function () {
                    $ionicHistory.nextViewOptions({
                        disableAnimate: true
                    });
                    history.back();
                };
                $scope.refresh = function () {
                    loadData($ionicLoading);
                };
            }
        };
    })

    .factory('paging', function ($state, $ionicLoading, $timeout, $ionicHistory) {
        return {
            init: function ($scope, pageSize, firstPageNo, loadData) {
                // $scope.changeState = function(name, params) {
                // $state.go(name, params);
                // };
                $scope.changeState = function (name, params) {
                    $ionicHistory.nextViewOptions({
                        disableAnimate: true
                    });
                    $state.go(name, params);
                };
                $scope.hasMore = true;
                $scope.loadingMore = false;
                $scope.items = [];
                $scope.pageNo = firstPageNo - 1;// 首页页码从1开始，0表示未开始
                $scope.refresh = function () {
                    $scope.items = [];
                    $scope.pageNo = firstPageNo;
                    loadData.call(this);
                };

                $scope.loadMore = function () {
                    $scope.loadingMore = true;
                    $timeout(function () {
                        $scope.pageNo++;
                        // 加载更多
                        loadData.call(this, $ionicLoading);
                    }, 1000);
                };
                $scope.goBack = function () {
                    history.back();
                };
                $scope.goBackNoAnim = function () {
                    $ionicHistory.nextViewOptions({
                        disableAnimate: true
                    });
                    history.back();
                };
            }
        };
    })

    .factory(
    'sms',
    function ($state, $ionicLoading, $http, $timeout) {
        return {
            send: function ($scope, method, params, checkFun) {
                var initTimeout = 120;
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
                    runServiceWithSession($http, $ionicLoading,
                        $state, "/json.jsp?method=" + method,
                        params, function (data, status) {
                            if (checkFun.call(this, data)) {
                                // 开始计数
                                $timeout(updateSendMsg, 1000);
                            } else {
                                $ionicLoading.show({
                                    template: "短信发送失败",
                                    duration: 2000
                                });
                            }
                        });
                };
            }
        };
    })

    .factory('fileReader', ["$q", "$log", function ($q, $log) {
        var onLoad = function (reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.resolve(reader.result);
                });
            };
        };
        var onError = function (reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.reject(reader.result);
                });
            };
        };
        var getReader = function (deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            return reader;
        };
        var readAsDataURL = function (file, scope) {
            var deferred = $q.defer();
            var reader = getReader(deferred, scope);
            reader.readAsDataURL(file);
            return deferred.promise;
        };
        return {
            readAsDataUrl: readAsDataURL
        };
    }])

    .directive('fileModel',['$parse',function ($parse) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs, ngModel) {
                    var model = $parse(attrs.fileModel);
                    var modelSetter = model.assign;
                    element.bind('change',function (event) {
                            scope.$apply(function () {
                                    modelSetter(scope,element[0].files[0]);
                                });
                            // 附件预览
                            scope.file = (event.srcElement || event.target).files[0];
                            scope.getFile();
                        });
                }
            };
        }])

    // 筛选树图列表
   .factory('dynamicFilter',
				function($compile) {
					return {
						/**
						 * 初始化筛选列表 $scope:数据绑定 htmlContainer:列表容器
						 * scopeContainer:数据容器 filterArray:筛选数据
						 */
						init : function($scope, htmlContainer, scopeContainer,
								filterArray, multiSelect) {
							if (htmlContainer == undefined|| htmlContainer == '') {
								console.log('缺少容器');
								return;
							}
							if (typeof (htmlContainer) == 'string') {
								htmlContainer = document.getElementById(htmlContainer);
							}
							if ($scope[scopeContainer] == undefined) {
								$scope[scopeContainer] = {};
							}
							$scope[scopeContainer].singleSelect = "";
							$scope[scopeContainer].showFilterItem = {};
							$scope[scopeContainer].selectFilterItem = {};
							var showFilter = function(item, height) {
								var key = scopeContainer + item.key;
								var value = item.value;
								
								if ($scope[scopeContainer].showFilterItem[key] == undefined) {
									$scope[scopeContainer].showFilterItem[key] = false;
								}
								var checkboxHtml = "";
								var itemClickHtml = "";
								var classHtml = "";
								if (multiSelect) {
									if ($scope[scopeContainer].selectFilterItem[key] == undefined) {
										$scope[scopeContainer].selectFilterItem[key] = false;
									}
									checkboxHtml = "<input type=\"checkbox\" id=\""
											+ key
											+ "\" class=\"input_check\" ng-checked=\""
											+ scopeContainer
											+ ".selectFilterItem."
											+ key
											+ "\" ng-click=\""
											+ scopeContainer
											+ ".choose($event, '"
											+ key
											+ "')\" />";
								}
								if (item.array != undefined) {
									itemClickHtml = scopeContainer+ ".showFilterItem." + key + " = !"
											+ scopeContainer+ ".showFilterItem." + key;
								} else {
									itemClickHtml = scopeContainer+ ".itemClick(\'" + key + "\',\'"+value+"\')";
									if (!multiSelect) {
										classHtml = " class=\"{{"+ scopeContainer+ ".singleSelect==\'"
												+ key+ "\'? \'singleFilterSelect\': \'\'}}\" ";
									}
								}
								item.select = false;
								var lineClass;
								if (height == 1) {
									lineClass = 'lineOne';
								} else {
									lineClass = 'lineOther';
								}
								var innerHtml = "<div class=\"" + lineClass
										+ "\"><span>" + checkboxHtml + "<a "
										+ classHtml + "ng-click=\""
										+ itemClickHtml + "\">&nbsp;" + value
										+ "</a></span></div>";
								if (item.array != undefined
										&& item.array.length != 0) {
									innerHtml = innerHtml
											+ "<div class=\"lineContent\" ng-show=\""
											+ scopeContainer
											+ ".showFilterItem." + key + "\">";
									for (var k = 0; k < item.array.length; k++) {
										innerHtml = innerHtml+ showFilter(item.array[k],height + 1);
									}
									innerHtml = innerHtml + "</div>";
								}
								return innerHtml;
							};
							/**
							 * 搜索key对应节点
							 * 
							 * @Params item 被搜索节点
							 * @Params key 关键字
							 * @Return key对应节点，没有则为空字符串
							 */
							var searchKey = function(item, key) {
								if (item.key != undefined&& (scopeContainer + item.key) == key) {
									return item;
								} else if (item.array != undefined&& item.array.length != 0) {
									for (var k = 0; k < item.array.length; k++) {
										var temp = searchKey(item.array[k], key);
										if (temp != '')
											return temp;
									}
									return '';
								} else {
									return '';
								}
							};

							/**
							 * 设置子节点选中/未选中
							 * 
							 * @Params item 父节点
							 * @Params select 选中状态
							 */
							var childItemSetSelect = function(item, select) {
								if (item.key != undefined)
									$scope[scopeContainer].selectFilterItem[scopeContainer+ item.key] = select;
								if (item.array != undefined&& item.array.length != 0) {
									for (var k = 0; k < item.array.length; k++) {
										childItemSetSelect(item.array[k],select);
									}
								}
							};
							/**
							 * 更新节点状态
							 * 
							 * @Params 需更新节点
							 */
							var updateNodeStatus = function(item) {
								var key = scopeContainer + item.key;
								var nodeId = document.getElementById(scopeContainer+ item.key);
								if (item.array == undefined|| item.array.length == 0) {
									return $scope[scopeContainer].selectFilterItem[key] ? 1: -1;
								} else {
									var num = 0;
									for (var k = 0; k < item.array.length; k++) {
										var status = updateNodeStatus(item.array[k]);
										if (status == 0) {
											$scope[scopeContainer].selectFilterItem[key] = false;
											nodeId.indeterminate = true;
											return 0;
										} else if (status == 1) {
											num++;
										}
									}
									if (num == 0) {
										$scope[scopeContainer].selectFilterItem[key] = false;
										nodeId.indeterminate = false;
										return -1;
									} else if (num < item.array.length) {
										$scope[scopeContainer].selectFilterItem[key] = false;
										nodeId.indeterminate = true;
										return 0;
									} else {
										$scope[scopeContainer].selectFilterItem[key] = true;
										nodeId.indeterminate = false;
										return 1;
									}
								}
							};
							var innerHtml = "";
							for (var k = 0; k < filterArray.length; k++) {
								innerHtml = innerHtml+ showFilter(filterArray[k], 1);
							}
							// console.log(innerHtml);
							var i = $compile(innerHtml)($scope);
							angular.element(htmlContainer).html('').append(i);
							/**
							 * 多选框选中事件
							 */
							$scope[scopeContainer].choose = function($event, id) {
								$scope[scopeContainer].selectFilterItem[id] = $event.target.checked;
								if (multiSelect) {
									var temp = '';
									for (var k = 0; k < filterArray.length; k++) {
										var temp = searchKey(filterArray[k], id);
										if (temp != '') {
											break;
										}
									}
									childItemSetSelect(temp,$event.target.checked);
									for (var k = 0; k < filterArray.length; k++) {
										updateNodeStatus(filterArray[k]);
									}
								} else {
									for ( var key in $scope[scopeContainer].selectFilterItem) {
										if (key != id) {
											$scope[scopeContainer].selectFilterItem[key] = false;
										}
									}
								}
							};
							/**
							 * item点击事件
							 */
							$scope[scopeContainer].itemClick = function(id,value) {
								if (multiSelect) {
									$scope[scopeContainer].selectFilterItem[id] = !$scope[scopeContainer].selectFilterItem[id];
									var temp = '';
									for (var k = 0; k < filterArray.length; k++) {
										var temp = searchKey(filterArray[k], id);
										if (temp != '') {
											break;
										}
									}
									childItemSetSelect(temp,$scope[scopeContainer].selectFilterItem[id]);
									for (var k = 0; k < filterArray.length; k++) {
										updateNodeStatus(filterArray[k]);
									}
								} else {
									$scope[scopeContainer].singleSelect = id;
									$scope[scopeContainer].singleSelectName = value;
								}
							};
							var selectTemp = [];
							var getSelect = function(item) {
								var key = scopeContainer + item.key;
								if ($scope[scopeContainer].selectFilterItem[key]&& item.array == undefined) {
									var selectTempItem = {
										key : item.key,
										value : item.value
									};
									selectTemp.push(selectTempItem);
									return;
								} else if (item.array == undefined|| item.array.length == 0) {
									return;
								} else {
									for (var k = 0; k < item.array.length; k++) {
										getSelect(item.array[k]);
									}
								}
							};
							$scope[scopeContainer].confirm = function() {
								if (multiSelect) {
									selectTemp = [];
									for (var k = 0; k < filterArray.length; k++) {
										getSelect(filterArray[k]);
									}
									var keyTemp = '';
									var valueTemp = '';
									for (var j = 0; j < selectTemp.length; j++) {
										keyTemp += selectTemp[j].key + ',';
										valueTemp += selectTemp[j].value + ',';
									}
									var sTemp = {
										key : keyTemp.substring(0,keyTemp.length - 1),
										value : valueTemp.substring(0,valueTemp.length - 1)
									};
									return sTemp;
								} else {
									var sTemp =  {
											key:$scope[scopeContainer].singleSelect.substring(
													scopeContainer.length,
													$scope[scopeContainer].singleSelect.length),
												    value:$scope[scopeContainer].singleSelectName
									}
									return sTemp ;
								}
							};
						}
					};
				});
