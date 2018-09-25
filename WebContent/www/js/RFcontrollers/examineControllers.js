/**
 * @file 业务签批模块
 * @author jjhan
 */
angular.module('com.amarsoft.mobile.controllers.RFexamine', ['ngSanitize'])

	//审查审批主界面
	.controller(
		'RFApproveAccessController',
		function ($scope, $rootScope, $state, basePage, $stateParams) {
			$scope.footActiveIndex = 0; //业务签批菜单

			$scope.selectTab = function (tabIndex) {
				if (tabIndex == '0') {
					//$rootScope.examine_tabIndex = tabIndex;
					$scope.selectTab0 = true;
					$scope.selectTab1 = false;
					$rootScope.finished = "0";
					$scope.$broadcast("To-ApproveWorkCountController", {});
				} else {
					//$rootScope.examine_tabIndex = tabIndex;
					$scope.selectTab0 = false;
					$scope.selectTab1 = true;
					$rootScope.finished = "1";
					$scope.$broadcast("To-ApproveWorkCountController", {});
				}
			};
			$scope.selectTab($stateParams.SelectTab);
			//跳转list页面
			$scope.approveList = function (obj) {
				$state.go("RFApproveList", {
					"FlowNo": obj.FlowNo,
					"FlowName": obj.FlowName,
					"PhaseNo": obj.PhaseNo,
					"PhaseName": obj.PhaseName,
					"NodeType": obj.NodeType
				});
			}

			basePage.init($scope);
		})

	//审批审查当前工作/已完成工作台
	.controller(
		'ApproveWorkCountController',
		function ($http, $ionicLoading, $ionicPopup, $scope, $state, paging, basePage, $rootScope) {
			$scope.$on('To-ApproveWorkCountController', function (e, data) {
				//console.log("当前工作/已完成:"+$rootScope.finished);
				$scope.items = [];
				basePage.init($scope, loadData);
			});
			//审批流程信息
			var loadData = function () {
				loading("数据加载中，请稍后……", 10000);
				runServiceWithSession(
					$http,
					undefined,
					$ionicPopup,
					$state,
					"examine_WorkCount", {
						//当前工作和已完成工作标志直接写死
						FinishedFlag: $rootScope.finished,
						LineFlag: AmApp.config.sysSelType,
						UserId: AmApp.userID
					},
					function (data, status) {
						appIonicLoading.hide();
						$scope.items = [];
						for (var i = 0; i < data["array"].length; i++) {
							if ("false" == data["array"][i].ShowFlag) { //判断下级是否展示
								data["array"][i].ShowFlag = false;
							} else {
								data["array"][i].ShowFlag = true;
							}
							$scope.items.push(data["array"][i]);
						}
						//console.log($scope.items);
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
			//审批流程阶段信息
			var loadPhaseData = function (obj) {
				//				console.log("工作台流程阶段信息:");
				//				console.log(obj);
				//appIonicLoading.show({template: '正在加载中',animation: 'fade-in',showBackdrop: true,duration:20000});
				runServiceWithSession(
					$http,
					undefined,
					$ionicPopup,
					$state,
					"examine_WorkCount", {
						//当前工作和已完成工作标志直接写死
						FinishedFlag: $rootScope.finished,
						FlowNo: obj.FlowNo,
						UserId: AmApp.userID
					},
					function (data, status) {
						appIonicLoading.hide();
						$scope.PhaseInfos = [];
						for (var i = 0; i < data["array"].length; i++) {
							$scope.PhaseInfos.push(data["array"][i]);
						}
						for (var i = 0; i < $scope.items.length; i++) {
							if (obj.FlowNo == $scope.items[i].FlowNo) {
								$scope.items[i].PhaseNo = $scope.PhaseInfos;
							}
						}
						$scope.$broadcast('scroll.refreshComplete');
						$scope.$broadcast('scroll.infiniteScrollComplete');
					});
			};
			$scope.togglePhaseNo = function (obj) {
				obj.ShowFlag = !obj.ShowFlag;
				loadPhaseData(obj);
			}

			basePage.init($scope, loadData);
		})


	// 审批审查列表
	.controller(
		'RFApproveListController',
		function ($scope, $rootScope, $ionicViewSwitcher, $ionicModal, $state, $stateParams, $http, $ionicPopup, $ionicLoading, basePage, paging) {
			var iPageSize = 5;
			$scope.items = [];
			$scope.FlowNo = $stateParams.FlowNo;
			$scope.FlowName = $stateParams.FlowName;
			$scope.PhaseNo = $stateParams.PhaseNo;
			$scope.PhaseName = $stateParams.PhaseName;
			$scope.NodeType = $stateParams.NodeType;
			var loadData = function ($ionicLoading) {
				loading("数据加载中，请稍后……", 10000);
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_ApproveList", {
						FinishedFlag: $rootScope.finished,
						FlowNo: $scope.FlowNo,
						PhaseNo: $scope.PhaseNo,
						PageSize: iPageSize,
						PageNo: $scope.pageNo,
						SearchParams: JSON.stringify($scope.SearchParams),
						UserId: AmApp.userID
					},
					function (data, status) {
						appIonicLoading.hide();
						$scope.SearchParams = {}; //置空搜索参数
						for (var i = 0; i < data["array"].length; i++) {
							$scope.items.push(data["array"][i]);
						}
						if (data["array"].length > 0) {
							$rootScope.item = $scope.items[0];
						}
						$scope.loadingMore = false;
						if ($scope.items.length > 0) {
							$scope.noData = false;
						} else {
							$scope.noData = true;
						}
						$scope.hasMore = (($scope.pageNo - 1) *
							iPageSize + data["array"].length < data.totalCount);
						$scope.$broadcast('scroll.refreshComplete');
						$scope.$broadcast('scroll.infiniteScrollComplete');
					});
			};

			//********************************************批量审批内容Start************************************************** */

			/**
			 * 1、全选正选、反选；
			 * 2、签署功能；
			 * 3、区分签署意见界面（授信、评级、集团认定）
			 * 4、提交界面复用原有审批内容
			 * 
			 */

			// 长按事件
			$scope.onHoldFlag = false;

			$scope.onHold = function () {
				if ($scope.onHoldFlag) {
					$scope.onHoldFlag = false;
				} else {
					$scope.onHoldFlag = true;
					//全选和反选
					$scope.selectAll = false;


				}
			}
			$scope.all = function (m) {
				for (var i = 0; i < $scope.items.length; i++) {
					if (m === true) {
						$scope.items[i].state = true;
					} else {
						$scope.items[i].state = false;
					}
				}
			};

			//	具体选择哪些作为数据提交
			$scope.select = [];
			//批量提交
			$scope.tj = function () {

				for (var i = 0; i < $scope.items.length; i++) {
					var item = $scope.items[i];
					if (item.state == true) {
						$scope.select.push(item);
					}

				}
				//console.log($scope.select);
			}



			//********************************************批量审批内容End************************************************** */

			//跳转详情tab
			$scope.gotoApplyInfo = function (item) {
				var ParamObject = JSON.stringify(item);

				if (!$scope.onHoldFlag) {
					$state.go("RFApproveDetail", {
						"ParamObject": ParamObject,
						"FlowNo": $scope.FlowNo,
						"FlowName": $scope.FlowName,
						"PhaseNo": $scope.PhaseNo,
						"PhaseName": $scope.PhaseName,
						"NodeType": $scope.NodeType
					});

				}
			}

			// 返回
			$scope.goBackApprove = function () {
				$scope.changeState('RFexamine', {
					SelectTab: $rootScope.finished
				});
				$ionicViewSwitcher.nextDirection("back"); //退回动画
			}

			/*****列表搜索框*************/
			$scope.showSearchBar = function () {
				//console.log($rootScope.item);
				console.log("列表搜索框");
				if ($rootScope.item != null) {
					$scope.noData = false;
					$scope.placeholders = [];
					$scope.models = [];
					$scope.conf = [];
					for (var i = 0; i < 3; i++) {
						if (i == 0) {
							var name = $rootScope.item.attribute30name.split(",");
							var pn = {};
							pn["placeholder"] = name[0];
							pn["showFlag"] = name[1];
							$scope.placeholders.push(pn);
							$scope.models.push($rootScope.item.attribute30);
						}
						if (i == 1) {
							var name = $rootScope.item.attribute31name.split(",");
							var pn = {};
							pn["placeholder"] = name[0];
							pn["showFlag"] = name[1];
							$scope.placeholders.push(pn);
							$scope.models.push($rootScope.item.attribute31);
						}
						if (i == 2) {
							var name = $rootScope.item.attribute32name.split(",");
							var pn = {};
							pn["placeholder"] = name[0];
							pn["showFlag"] = name[1];
							$scope.placeholders.push(pn);
							$scope.models.push($rootScope.item.attribute32);
						}
					}
				}
				//				console.log($scope.placeholders);
				//				console.log($scope.models);
				if ($scope.placeholders[0]["placeholder"].length < 1) {
					$scope.noData1 = true;
				} else {
					$scope.noData1 = false;
				}

				$ionicModal.fromTemplateUrl(
					'templates/RFexamine/SearchBar.html', {
						scope: $scope,
						backdropClickToClose: false
					}).then(function (modal) {
					$scope.modal = modal;
					$rootScope.backToAnyNodeModal = modal;
					$scope.BusinessTypesFlag = false;
					$scope.singleSelectFlag = false;
					$scope.modal.show();
				});
			}

			//重置搜索框数据
			$scope.resetSearch = function () {
				//					console.log("重置搜索框数据");
				//					console.log($scope.conf);
				$scope.conf = [];
				//console.log($scope.BTL1);
			}
			//列表搜索
			$scope.searchForList = function () {
				console.log("列表搜索");
				//拼接查询条件
				$scope.SearchParams = [];
				for (var i = 0; i < $scope.models.length; i++) {
					var param = {};
					param["Param"] = $scope.models[i];
					if (param["Param"].indexOf("sum") > -1 || param["Param"].indexOf("Sum") > -1) {
						var sum = $scope.conf[i] != undefined ? $scope.conf[i].replace(/[^\d.]/g, '').replace(/^\./g, '').replace('.', '$#$').replace(/\./g, '').replace('$#$', '.').replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3') : "";
						param["value"] = sum.length > 0 ? sum : undefined;
					} else {
						param["value"] = $scope.conf[i];
					}
					$scope.SearchParams.push(param);
				}
				//console.log($scope.SearchParams);
				$scope.hideModal();
				$scope.refresh();

			}
			//关闭
			$scope.hideModal = function () {
				$scope.conf = [];
				$scope.modal.hide();
			}

			//业务品种
			//
			$scope.showBusinessTypes = function () {
				$scope.BusinessTypesFlag = true;
				$scope.BusinessTypes1 = [];
				$scope.BusinessTypes2 = [];
				$scope.BusinessTypes3 = [];
				var BusinessTypes = JSON.parse($rootScope.item.BusinessTypes);
				for (var i = 0; i < BusinessTypes.length; i++) {
					var bt = BusinessTypes[i];
					if (2 == bt.SortNo.length) {
						$scope.BusinessTypes1.push(bt);
					}
				}
			}

			//业务品种1级 变动
			$scope.BT1Change = function (BTL1) {
				console.log(BTL1);
				$scope.BusinessTypes2 = [];
				$scope.BusinessTypes3 = [];
				var BusinessTypes = JSON.parse($rootScope.item.BusinessTypes);
				for (var i = 0; i < BusinessTypes.length; i++) {
					var bt = BusinessTypes[i];
					if (5 == bt.SortNo.length && bt.SortNo.indexOf(BTL1) == 0) {
						$scope.BusinessTypes2.push(bt);
					}
				}
			}

			//业务品种2级 变动
			$scope.BT2Change = function (BT2) {
				console.log(BT2);
				$scope.BusinessTypes3 = [];
				var BusinessTypes = JSON.parse($rootScope.item.BusinessTypes);
				for (var i = 0; i < BusinessTypes.length; i++) {
					var bt = BusinessTypes[i];
					if (8 == bt.SortNo.length && bt.SortNo.indexOf(BT2) == 0) {
						$scope.BusinessTypes3.push(bt);
					}
				}
			}

			//普通select
			$scope.showSingleSelect = function (placeholder) {
				console.log("普通select");
				console.log(placeholder);
				$scope.selects = [];
				$scope.singleSelectFlag = true;
				if ("合作项目类型" == placeholder.placeholder) {
					var ProjectTypes = JSON.parse($rootScope.item.ProjectTypes);
					for (var i = 0; i < ProjectTypes.length; i++) {
						var Param = {};
						Param["No"] = ProjectTypes[i]["ItemNo"];
						Param["Name"] = ProjectTypes[i]["ItemName"];
						$scope.selects.push(Param);
					}
				}
			}

			/*****列表搜索框*************/

			paging.init($scope, iPageSize, 1, loadData, true);
		})

	// 审查审批详情tab总览
	.controller(
		'RFApproveDetailController',
		function ($scope, $state, $timeout, $ionicViewSwitcher, $rootScope, $stateParams, $http, $ionicPopup, $ionicLoading, basePage, $ionicScrollDelegate, $ionicModal) {
			$scope.FlowNo = $stateParams.FlowNo;
			$scope.FlowName = $stateParams.FlowName;
			$scope.PhaseNo = $stateParams.PhaseNo;
			$scope.PhaseName = $stateParams.PhaseName;
			$scope.NodeType = $stateParams.NodeType;
			console.log("审查审批详情tab总览：" + $scope.NodeType);
			var Params = {};
			Params = JSON.parse($stateParams.ParamObject); //
			Params.FlowNo = $scope.FlowNo;
			Params.PhaseNo = $scope.PhaseNo;
			//console.log(Params);
			$stateParams.ParamObject = JSON.stringify(Params)
			var loadData = function ($ionicLoading) {
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_ApproveDetailTab", {
						FlowNo: $scope.FlowNo,
						Params: $stateParams.ParamObject,
						UserId: AmApp.userID
					},
					function (data, status) {
						$scope.items = [];
						for (var i = 0; i < data["array"].length; i++) {
							if ("false" == data["array"][i].ShowFlag) { //是否展示当前tab
								data["array"][i].ShowFlag = false;
							} else {
								data["array"][i].ShowFlag = true;
							}
							$scope.items.push(data["array"][i]);
						}
						//展示第一个tab
						$scope.items[0].ShowFlag = true;
						$scope.selectDetailTab($scope.items[0]);
						$scope.length = 100 / $scope.items.length; //
						if ($scope.items.length < 5) {
							$scope.scrollWidth = $rootScope.contentWidth;
						} else {
							$scope.scrollWidth = 90 * $scope.items.length; //
						}
						//console.log($scope.items);
					});
			};

			//返回审批列表
			$scope.goBackList = function () {
				$scope.changeState("RFApproveList", {
					"FlowNo": $scope.FlowNo,
					"FlowName": $scope.FlowName,
					"PhaseNo": $scope.PhaseNo,
					"PhaseName": $scope.PhaseName,
					"NodeType": $scope.NodeType
				});
				$ionicViewSwitcher.nextDirection("back"); //退回动画
			}

			//刷新额度切分列表
			$scope.$on('To-refreshCLDList', function (e, data) {
				console.log("刷新额度切分列表");
				$scope.$broadcast("To-CLDListController", {
					"Param": $stateParams.ParamObject
				});
			});

			//刷新意见信息
			$scope.$on('To-refreshOpinion', function (e, data) {
				console.log("刷新意见信息");
				$ionicScrollDelegate.$getByHandle('smallScroll02').scrollTo(-500, 0, true); //滚动到最左侧
				$scope.selectDetailTab($scope.items[0]);
			});

			/****选择tab跳转对应详情页面*****/
			$scope.selectDetailTab = function (item) {
				loading("数据加载中，请稍后……", 30000);
				//				console.log("选择tab跳转对应详情页面");
				//				console.log(item);
				//滚动到头部
				$ionicScrollDelegate.$getByHandle('smallScroll01').scrollTop();
				item.ShowFlag = true;
				$scope.SideMenu = item.Tab;
				for (var i = 0; i < $scope.items.length; i++) {
					if (item.Tab == $scope.items[i].Tab) { //是否展示当前tab
					} else {
						$scope.items[i].ShowFlag = false;
					}
				}
				//判断跳转何种详情页面 通用list/通用html/通用模板
				//通用list
				if (item.TabMothod.indexOf("List") > -1) {
					//					console.log("通用list");
					//					console.log(item.TabMothod);
					if (item.TabMothod.indexOf("OPHList") > -1) {
						$scope.BasicOPHListShow = true; //通用List加载历史
						$scope.BasicHtmlShow = false; //通用html加载
						$scope.BasicTempletShow = false; //通用模板加载
						$scope.BasicTempletBAHtmlShow = false; //通用模板加载BA、Html
						$scope.BasicOPLListShow = false; //通用List加载各级
						$scope.CLDListShow = false; //额度切分列表（特殊处理）
						$scope.opinionListShow = false; //签署意见列表（特殊处理）
						$scope.$broadcast("To-BasicOPHListController", {
							"Param": $stateParams.ParamObject,
							"TabMothod": item.TabMothod,
							"FlowNo": $scope.FlowNo
						});
					} else if (item.TabMothod.indexOf("OPLList") > -1) {
						$scope.BasicOPLListShow = true; //通用List加载各级
						$scope.BasicOPHListShow = false; //通用List加载历史
						$scope.BasicHtmlShow = false; //通用html加载
						$scope.BasicTempletShow = false; //通用模板加载
						$scope.BasicTempletBAHtmlShow = false; //通用模板加载BA、Html
						$scope.CLDListShow = false; //额度切分列表（特殊处理）
						$scope.opinionListShow = false; //签署意见列表（特殊处理）
						$scope.$broadcast("To-BasicOPLListController", {
							"Param": $stateParams.ParamObject,
							"TabMothod": item.TabMothod,
							"FlowNo": $scope.FlowNo
						});
					} else if (item.TabMothod.indexOf("CLDList") > -1) { //额度切分特殊处理
						$scope.CLDListShow = true; //额度切分列表（特殊处理）
						$scope.BasicOPLListShow = false; //通用List加载各级
						$scope.BasicOPHListShow = false; //通用List加载历史
						$scope.BasicHtmlShow = false; //通用html加载
						$scope.BasicTempletShow = false; //通用模板加载
						$scope.BasicTempletBAHtmlShow = false; //通用模板加载BA、Html
						$scope.opinionListShow = false; //签署意见列表（特殊处理）
						$scope.$broadcast("To-CLDListController", {
							"Param": $stateParams.ParamObject
						});
					} else if (item.TabMothod.indexOf("opinionList") > -1) { //签署意见特殊处理
						$scope.opinionListShow = true; //签署意见列表（特殊处理）
						$scope.BasicOPLListShow = false; //通用List加载各级
						$scope.BasicOPHListShow = false; //通用List加载历史
						$scope.BasicHtmlShow = false; //通用html加载
						$scope.BasicTempletShow = false; //通用模板加载
						$scope.BasicTempletBAHtmlShow = false; //通用模板加载BA、Html
						$scope.CLDListShow = false;
						$scope.$broadcast("To-opinionListController", {
							"Param": $stateParams.ParamObject,
							"PhaseNo": $scope.PhaseNo,
							"FlowNo": $scope.FlowNo
						});
					}
				}

				//通用html
				if (item.TabMothod.indexOf("Html") > -1) {
					//					console.log("通用html");
					//					console.log(item.TabMothod);
					$scope.BasicHtmlShow = true; //通用html加载
					$scope.BasicTempletShow = false; //通用模板加载
					$scope.BasicTempletBAHtmlShow = false; //通用模板加载BA、Html
					$scope.BasicOPHListShow = false; //通用List加载历史
					$scope.BasicOPLListShow = false; //通用List加载各级
					$scope.CLDListShow = false; //额度切分列表（特殊处理）
					$scope.opinionListShow = false; //签署意见列表（特殊处理）
					$scope.$broadcast("To-BasicHtmlController", {
						"Param": $stateParams.ParamObject,
						"TabMothod": item.TabMothod
					});
				}

				//通用模板
				if (item.TabMothod.indexOf("Info") > -1) {
					//					console.log("通用模板");
					//					console.log(item.TabMothod);
					if (item.TabMothod.indexOf("InfoEdit") > -1) {
						$scope.BasicTempletBAHtmlShow = true; //通用模板加载BA、Html
						$scope.BasicTempletShow = false; //通用模板加载
						$scope.BasicHtmlShow = false; //通用html加载
						$scope.BasicOPHListShow = false; //通用List加载历史
						$scope.BasicOPLListShow = false; //通用List加载各级
						$scope.CLDListShow = false; //额度切分列表（特殊处理）
						$scope.opinionListShow = false; //签署意见列表（特殊处理）
						$scope.$broadcast("To-BasicTempletBAHtmlController", {
							"Param": $stateParams.ParamObject,
							"TabMothod": item.TabMothod
						});
					} else if (item.TabMothod.indexOf("InfoReadOnly") > -1) {
						$scope.BasicTempletShow = true; //通用模板加载
						$scope.BasicTempletBAHtmlShow = false; //通用模板加载BA、Html
						$scope.BasicHtmlShow = false; //通用html加载
						$scope.BasicOPHListShow = false; //通用List加载历史
						$scope.BasicOPLListShow = false; //通用List加载各级
						$scope.CLDListShow = false; //额度切分列表（特殊处理）
						$scope.opinionListShow = false; //签署意见列表（特殊处理）
						$scope.$broadcast("To-BasicTempletController", {
							"Param": $stateParams.ParamObject,
							"TabMothod": item.TabMothod
						});
					}
				}
			}

			//模板收缩
			$scope.showOrNot = function (item) {
				if (item.showGroup) {
					item.showGroup = false;
				} else {
					item.showGroup = true;
				}
			};
			/***********************退回任意阶段start******************************/
			//退回任意阶段
			$scope.backToAnyNode = function () {
				//console.log("退回任意阶段");
				$ionicModal.fromTemplateUrl(
					'templates/RFexamine/backToAnyNode.html', {
						scope: $scope,
						backdropClickToClose: false
					}).then(function (modal) {
					$scope.modal = modal;
					$rootScope.backToAnyNodeModal = modal;
					$scope.modal.show();

					$scope.$broadcast("To-BackToAnyNodeController", {
						"Param": $stateParams.ParamObject,
						"FlowNo": $scope.FlowNo,
						"PhaseNo": $scope.PhaseNo
					});
				});
			}
			/***********************退回任意阶段end******************************/
			//对退回补充资料和退回任意阶段按钮的存在的阶段的判断
			//BatFlag1补充资料BatFlag2退回任意阶段
			$(function () {
				if ($scope.FlowNo == "BatCreditApproveFlow" && $scope.PhaseNo == "0020") {
					$scope.BatFlag1 = true;
					$scope.BatFlag2 = false;
				} else if ($scope.FlowNo == "BatCreditApproveFlow" && ($scope.PhaseNo == "0030" || $scope.PhaseNo == "0040")) {
					$scope.BatFlag1 = false;
					$scope.BatFlag2 = false;
				} else {
					$scope.BatFlag2 = true;
				}
			})


			//退回补充资料
			$scope.backTobc = function () {
				$ionicPopup.confirm({
					title: '退回补充资料',
					template: '您确认要退回么?',
					okText: '确定',
					cancelText: '取消'
				}).then(function (res) {
					if (res) {
						//...
						runServiceWithSession(
							$http,
							undefined,
							$ionicPopup,
							$state,
							"flowback", {
								taskNo: Params["attribute5"],
								objectNo: Params["attribute6"],
								objectType: Params["attribute7"],
								UserId: AmApp.userID
							},
							function (data, status) {
								console.log(data)
								if (data["array"][0].SaveResult == "success") {
									appIonicLoading.show({
										template: data["array"][0].SaveMsg,
										duration: 3000
									});
									$scope.changeState("RFApproveList", {
										"FlowNo": $scope.FlowNo,
										"FlowName": $scope.FlowName,
										"PhaseNo": $scope.PhaseNo,
										"PhaseName": $scope.PhaseName,
										"NodeType": $scope.NodeType
									});
									/*			$timeout(function(){
													$scope.selectDetailTab($scope.items[0]);
												},1000)*/
								} else {
									appIonicLoading.show({
										template: data["array"][0].SaveMsg,
										duration: 3000
									});
									$ionicViewSwitcher.nextDirection("back"); //退回动画
								}
							});
					}

				});



			}
			//意见保存
			$scope.SaveOpinion = function () {
				$scope.$broadcast("To-saveOpinion", {});
			}
			$scope.saveOpinionList = function () {
				$scope.$broadcast("To-saveOpinionList", {});
			}

			//关闭弹窗
			$scope.hideModal = function () {
				//console.log("关闭弹窗");
				$scope.modal.hide();
				$timeout(function () {
					$scope.selectDetailTab($scope.items[0]);
				}, 1000)
			}
			//提交下一阶段
			$scope.DoSubmit = function () {
				//console.log("提交下一阶段start");
				//提交前校验检查
				//					console.log("提交前校验检查");
				/*	appIonicLoading.show({
						template: "提交前校验检查...",
						animation: 'fade-in',
						showBackdrop: true,
						duration: 8000
					});*/
				loading("提交前校验检查，请稍后……", 10000);
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_checkSubmit", //提交前校验
					{
						FTSeriaNo: Params["attribute5"],
						ObjectNo: Params["attribute6"],
						PhaseNo: $scope.PhaseNo,
						FlowNo: $scope.FlowNo,
						UserID: AmApp.userID
					},
					function (data, status) {
						appIonicLoading.hide();
						//							console.log("提交前校验：");
						//							console.log(data);
						if ("failed" == data["array"][0].CheckResult) { //校验未通过

							appIonicLoading.show({
								template: data["array"][0].CheckMsg,
								animation: 'fade-in',
								showBackdrop: true,
								duration: 3000
							});
							if (data["array"][0].CheckMsg.indexOf("风险探测") > -1) {
								$scope.RiskResult = JSON.parse(data["array"][0].RiskResult)["array"];
								console.log($scope.RiskResult);
								$ionicModal.fromTemplateUrl(
									'templates/RFexamine/RiskResult.html', {
										scope: $scope,
										backdropClickToClose: false
									}).then(function (modal) {
									$scope.modal = modal;
									$rootScope.doSubmitModal = modal;
									$scope.modal.show();
								})
							} else {
								$timeout(function () {
									$scope.selectDetailTab($scope.items[0]);
								}, 3000)
							}
						} else if ("BackTask" == data["array"][0].CheckResult) { //退回任务BackTask
							var confirmPopup = $ionicPopup.confirm({
								title: '提交',
								template: data["array"][0].CheckMsg,
								okText: '确定',
								cancelText: '取消'
							}).then(function (res) {
								if (res) {
									$ionicModal.fromTemplateUrl(
										'templates/RFexamine/doSubmit.html', {
											scope: $scope,
											backdropClickToClose: false
										}).then(function (modal) {
										$scope.modal = modal;
										$rootScope.doSubmitModal = modal;
										$scope.modal.show();
										$scope.$broadcast("To-BackToReSubmit", {
											"Param": $stateParams.ParamObject,
											"FlowNo": $scope.FlowNo,
											"PhaseNo": $scope.PhaseNo,
											"NodeType": $scope.NodeType
										});
									})
								}
							})

						}

						//批量BatCreditApproveFlow特殊流程跳转
						else if ($scope.FlowNo == "BatCreditApproveFlow") {
							console.log(Params["attribute10"]);
							if ("MEETING" == Params["attribute10"]) {
								var confirmPopup = $ionicPopup.confirm({
									title: '提交本次会签',
									template: '您确认提交本次会签的投票意见吗?',
									okText: '确定',
									cancelText: '取消'
								}).then(function (res) {
									if (res) {
										$ionicModal.fromTemplateUrl(
											'templates/RFexamine/doSubmit.html', {
												scope: $scope,
												backdropClickToClose: false
											}).then(function (modal) {
											$scope.modal = modal;
											$rootScope.doSubmitModal = modal;
											$scope.modal.hide();
											$scope.$broadcast("To-BackToReSubmit", {
												"Param": $stateParams.ParamObject,
												"FlowNo": $scope.FlowNo,
												"PhaseNo": $scope.PhaseNo,
												"NodeType": $scope.NodeType
											});
										})
									}
								})
							} else {
								$ionicModal.fromTemplateUrl(
									'templates/RFexamine/doSubmitBatch.html', {
										scope: $scope,
										backdropClickToClose: false
									}).then(function (modal) {
									$scope.modal = modal;
									$rootScope.doSubmitModal = modal;
									$scope.modal.show();
									$scope.$broadcast("To-DoSubmit", {
										"Param": $stateParams.ParamObject,
										"FlowNo": $scope.FlowNo,
										"PhaseNo": $scope.PhaseNo,
										"NodeType": $scope.NodeType
									});
								})
							}

						} else {
							console.log(Params["attribute10"]);
							if ("MEETING" == Params["attribute10"]) {
								var confirmPopup = $ionicPopup.confirm({
									title: '提交本次会签',
									template: '您确认提交本次会签的投票意见吗?',
									okText: '确定',
									cancelText: '取消'
								}).then(function (res) {
									if (res) {
										$ionicModal.fromTemplateUrl(
											'templates/RFexamine/doSubmit.html', {
												scope: $scope,
												backdropClickToClose: false
											}).then(function (modal) {
											$scope.modal = modal;
											$rootScope.doSubmitModal = modal;
											$scope.modal.hide();
											$scope.$broadcast("To-BackToReSubmit", {
												"Param": $stateParams.ParamObject,
												"FlowNo": $scope.FlowNo,
												"PhaseNo": $scope.PhaseNo,
												"NodeType": $scope.NodeType
											});
										})
									}
								})
							} else {
								$ionicModal.fromTemplateUrl(
									'templates/RFexamine/doSubmit.html', {
										scope: $scope,
										backdropClickToClose: false
									}).then(function (modal) {
									$scope.modal = modal;
									$rootScope.doSubmitModal = modal;
									$scope.modal.show();
									$scope.$broadcast("To-DoSubmit", {
										"Param": $stateParams.ParamObject,
										"FlowNo": $scope.FlowNo,
										"PhaseNo": $scope.PhaseNo,
										"NodeType": $scope.NodeType
									});
								})
							}
						}
					});
			}
			basePage.init($scope, loadData);
		})

	// 通用模板加载 key value
	.controller(
		'BasicTempletController',
		function ($scope, $state, $stateParams, $http, $ionicPopup, $ionicLoading, basePage) {
			$scope.$on('To-BasicTempletController', function (e, data) {
				console.log("通用模板加载");
				$scope.Param = data.Param; //参数
				$scope.TempletType = data.TabMothod.split("_")[1];
				$scope.items = [];
				basePage.init($scope, loadData);
			});

			var loadData = function ($ionicLoading) {
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_BasicTemplet", {
						TempletType: $scope.TempletType,
						Param: $scope.Param,
						UserId: AmApp.userID
					},
					function (data, status) {
						appIonicLoading.hide();
						console.log("模板加载返回值");
						$scope.items = [];
						for (var i = 0; i < data["array"].length; i++) {
							//增加参数，是否展示，页面载入时均展示
							data["array"][i]['showGroup'] = true;
							$scope.items.push(data["array"][i]);
						}
						if ($scope.items.length > 0) {
							$scope.noData = false;
						} else {
							$scope.noData = true;
						}
					});
			};

		})

	//通用通用模板加载BA、Html加载
	.controller(
		'BasicTempletBAHtmlController',
		function ($scope, $rootScope, $state, $stateParams, $timeout, $http, $ionicPopup, $ionicLoading, basePage, $compile) {
			$scope.$on('To-BasicTempletBAHtmlController', function (e, data) {
				console.log("通用模板加载BA、Html");
				$scope.Param = data.Param; //参数
				$scope.Params = JSON.parse(data.Param); //参数
				$scope.TabMethod = data.TabMothod;
				$scope.TempletNo = data.TabMothod.split("_")[1]; //模板号
				$scope.TempletParam = data.TabMothod.split("_")[2]; //模板所需参数
				$scope.items = [];
				basePage.init($scope, loadData);
			});

			$scope.$on('To-saveOpinion', function (e, data) {
				SaveOpinion();
			});
			var loadData = function ($ionicLoading) {
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_BasicTempletBAHtml", {
						TempletNo: $scope.TempletNo,
						TempletParam: $scope.TempletParam,
						Param: $scope.Param,
						UserId: AmApp.userID
					},
					function (data, status) {
						appIonicLoading.hide();
						$scope.items = [];
						$scope.RequiredArray = [];
						$scope.reportInfo = {
							ReportData: ''
						};
						$scope.BA = angular.fromJson(data["array"][0].BA);

						if ($scope.BA.IRSEXPIRYDATE && $scope.TempletNo.indexOf("ApplyOpinionInfoEnt") < 0) {
							$scope.BA.IRSEXPIRYDATE = new Date($scope.BA.IRSEXPIRYDATE);
						}
						if ($scope.BA.EXPIRYDATE) {
							$scope.BA.EXPIRYDATE = new Date($scope.BA.EXPIRYDATE);
						}
						var ele = $compile(data.array['0'].html)($scope);

						$('#jh-html-container').children().remove();
						$('#jh-html-container').append(ele);
						$('input:required').each(function () {
							//console.log($(this).attr('title'));
							var temp = {
								jqobj: $(this),
								modelValue: $(this).attr('ng-model'),
								title: $(this).attr('title')

							}
							$scope.RequiredArray.push(temp);
						});


						$('select:required').each(function () {
							var temp = {
								jqobj: $(this),
								modelValue: $(this).attr('ng-model'),
								title: $(this).attr('title')

							}
							$scope.RequiredArray.push(temp);
						});

						$('textarea:required').each(function () {
							//console.log($(this).attr('title'));
							var temp = {
								jqobj: $(this),
								modelValue: $(this).attr('ng-model'),
								title: $(this).attr('title')
							}
							$scope.RequiredArray.push(temp);
							if ("MEETING" != $scope.Params["attribute10"] &&
								"COLLECT" != $scope.Params["attribute10"] &&
								"BA.PHASECHOICE" == temp.modelValue
							) { //此时结论不在必输项内
								var index = $scope.RequiredArray.indexOf(temp);
								$scope.RequiredArray.splice(index, 1);
							}
						});

						$('textarea').each(function () {
							$(this).attr("Style", "border:0.5px solid #bbb1b1;width:95%");
						});
						$('input').each(function () {
							$(this).attr("Style", "border:0.5px solid #bbb1b1;width:95%");
						});
						$('select').each(function () {
							$(this).attr("Style", "border:0.5px solid #bbb1b1;width:95%");
						});
						$('#BusinessSum').attr("onkeyup","value=value.replace(/[^\\d.]/g,\'\').replace(/^\\./g,\'\').replace(\'.\',\'$#$\').replace(/\\./g,\'\').replace(\'$#$\',\'.\').replace(/^(\\-)*(\\d+)\\.(\\d\\d).*$/,\'$1$2.$3\')");
						data = null;
						$timeout(function () { //延时操作
							appIonicLoading.hide();
						}, 2000);
					});
			};
			//评级模型联动-设置违约率
			$scope.setPD = function () {
				//console.log("评级模型联动-设置位于率："+$scope.BA.SCALS);
				var scals = JSON.parse($scope.BA.SCALS);
				$scope.BA.IRSPDSHOW = scals[$scope.BA.PHASEOPINION2];
			}


			/***********************意见保存start******************************/

			//日期转换
			var dateFtt = function (fmt, date) { //author: meizz  
				if (date && (date instanceof Date)) {
					var o = {
						"M+": date.getMonth() + 1, //月份   
						"d+": date.getDate(), //日   
						"h+": date.getHours(), //小时   
						"m+": date.getMinutes(), //分   
						"s+": date.getSeconds(), //秒   
						"q+": Math.floor((date.getMonth() + 3) / 3), //季度   
						"S": date.getMilliseconds() //毫秒   
					};
					if (/(y+)/.test(fmt))
						fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
					for (var k in o)
						if (new RegExp("(" + k + ")").test(fmt))
							fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
					return fmt;
				}
			}

			//保存意见
			var SaveOpinion = function () {
				//检查详情必输项校验
				$scope.nullFalg = 0;
				for (var k = 0; k < $scope.RequiredArray.length; k++) {
					$scope.ngmodelValue = $scope.$eval($scope.RequiredArray[k].modelValue);
					//console.log($scope.ngmodelValue);

					if ($scope.ngmodelValue == null || $scope.ngmodelValue == "" || typeof ($scope.ngmodelValue) == undefined) {
						$scope.RequiredArray[k].jqobj.attr("Style", "border:0.5px solid #FF0000;width:95%")
						$scope.nullFalg++;
					}
				}

				if ($scope.nullFalg > 0) {
					appIonicLoading.show({
						template: "请完整签署意见",
						animation: 'fade-in',
						showBackdrop: true,
						duration: 3000
					});
					return;
				}

				if ($scope.BA.IRSEXPIRYDATE && "ApplyOpinionInfoEnt" != $scope.TempletNo) {
					$scope.BA.IRSEXPIRYDATE = dateFtt("yyyy/MM/dd", $scope.BA.IRSEXPIRYDATE);
				}
				if ($scope.BA.EXPIRYDATE) {
					$scope.BA.EXPIRYDATE = dateFtt("yyyy/MM/dd", $scope.BA.EXPIRYDATE);
				}

				// 特殊字符判断
				var pattern = new RegExp("[`~''~￥……&]");
				$scope.patternFlag = true;
				for (var i in $scope.BA) {
					console.log(typeof $scope.BA[i] + "==X= " +i);
					if ($scope.BA[i] && !((typeof $scope.BA[i])=="number")) {//类型是number不进行特殊字符校验
						var result = $scope.BA[i].match(pattern);
						if (result) {
							// 含有特殊字符
							appIonicLoading.show({
								template: "所填内容【" + $scope.BA[i] + "】含有特殊字符",
								duration: 1500
							});
							$scope.patternFlag = false;
							$timeout(function () {
								$scope.$emit("To-refreshOpinion", {}); //刷新意见信息
							}, 1500);
						}
					}
				}
				
				if ($scope.patternFlag) {
					appIonicLoading.show({
						template: "意见保存中...",
						animation: 'fade-in',
						showBackdrop: true,
						duration: 3000
					});
					runServiceWithSession(
						$http,
						$ionicLoading,
						$ionicPopup,
						$state,
						"examine_SaveOpinion", {
							HtmlData: JSON.stringify($scope.BA),
							FTSeriaNo: $scope.Params["attribute5"],
							ObjectNo: $scope.Params["attribute6"],
							DoNo: $scope.TempletNo,
							UserID: AmApp.userID
						},
						function (data, status) {
							//							console.log("意见保存结果:");
							//							console.log(data);
							if (data["array"][0].SaveOpinionResult != "success") {
								$scope.$emit("To-refreshOpinion", {}); //刷新意见信息
								appIonicLoading.show({
									template: data["array"][0].SaveOpinionMsg,
									duration: 3000
								});
							} else {
								$scope.$emit("To-refreshOpinion", {}); //刷新意见信息
								appIonicLoading.show({
									template: "意见保存成功！",
									duration: 3000
								});

							}
						});
				}

			}
			/***********************意见保存end******************************/
		})


	// 通用Html加载
	.controller(
		'BasicHtmlController',
		function ($scope, $state, $stateParams, $http, $ionicPopup, $ionicLoading, basePage, $compile) {
			$scope.$on('To-BasicHtmlController', function (e, data) {
				console.log("通用Html加载");
				$scope.Param = data.Param; //参数
				$scope.HtmlMethod = data.TabMothod.split("_")[1]; //html页面请求参数，区分调查报告、风险报告
				$scope.items = [];
				basePage.init($scope, loadData);
			});
			var loadData = function ($ionicLoading) {
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_BasicTempletBAHtml", {
						TempletNo: "",
						TempletParam: $scope.HtmlMethod,
						Param: $scope.Param,
						UserId: AmApp.userID
					},
					function (data, status) {
						appIonicLoading.hide();
						if ("NOTEXIST" == data["array"][0].BA) {
							$scope.noData = true;
						} else {
							$scope.noData = false;
							var ele = $compile(data["array"][0].html)($scope);
							$('#rf-html-container').children().remove();
							$('#rf-html-container').append(ele);
						}
					});
			};
		})


	// 历史意见列表
	.controller(
		'BasicOPHListController',
		function ($scope, $state, $stateParams, $http, $ionicPopup, $ionicLoading, basePage) {
			$scope.$on('To-BasicOPHListController', function (e, data) {
				console.log("通用OPHlist加载");
				$scope.Param = data.Param; //参数
				$scope.FlowNo = data.FlowNo;
				$scope.ListMothod = data.TabMothod.split("_")[1];
				$scope.items = [];
				basePage.init($scope, loadData);
			});
			var loadData = function ($ionicLoading) {
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_ApproveList", {
						UserId: AmApp.userID,
						FlowNo: $scope.FlowNo,
						ListMothod: $scope.ListMothod,
						ListParams: $scope.Param
					},
					function (data, status) {
						appIonicLoading.hide();
						for (var i = 0; i < data["array"].length; i++) {
							$scope.items.push(data["array"][i]);
						}
						//console.log($scope.items);
						$scope.loadingMore = false;
						if ($scope.items.length > 0) {
							$scope.noData = false;
						} else {
							$scope.noData = true;
						}
					});
			};
		})

	//各级意见列表
	.controller(
		'BasicOPLListController',
		function ($scope, $state, $stateParams, $http, $ionicPopup, $ionicLoading, basePage, $ionicScrollDelegate) {
			$scope.$on('To-BasicOPLListController', function (e, data) {
				console.log("通用OPLlist加载");
				$scope.Param = data.Param; //参数
				$scope.FlowNo = data.FlowNo;
				$scope.ListMothod = data.TabMothod.split("_")[1];
				$scope.items = [];
				basePage.init($scope, loadData);
			});
			var loadData = function ($ionicLoading) {
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_ApproveList", {
						UserId: AmApp.userID,
						FlowNo: $scope.FlowNo,
						ListMothod: $scope.ListMothod,
						ListParams: $scope.Param
					},
					function (data, status) {
						appIonicLoading.hide();
						for (var i = 0; i < data["array"].length; i++) {
							//console.log(""==data["array"][i].ShowFlag);
							if ("" == data["array"][i].ShowFlag) { //判断下级是否展示
								data["array"][i].ShowFlag = false;
							} else {
								data["array"][i].ShowFlag = true;
							}
							$scope.items.push(data["array"][i]);
						}
						//console.log($scope.items);
						$scope.loadingMore = false;
						if ($scope.items.length > 0) {
							$scope.noData = false;
						} else {
							$scope.noData = true;
						}
					});
			};


			$scope.showNextLevel = function (item) {
				if (item.ShowFlag) {
					item.ShowFlag = false;
				} else {
					item.ShowFlag = true;
					/*setTimeout(function() {
						$scope.$apply(function() {
							$ionicScrollDelegate.$getByHandle(
									"smallScroll01").scrollBy(0, 310,
									true);
						});
					}, 100);*/
				}
			};
		})


	//退回任意阶段
	.controller(
		'BackToAnyNodeController',
		function ($scope, $state, $stateParams, $http, $ionicPopup, $ionicLoading, basePage) {
			$scope.$on('To-BackToAnyNodeController', function (e, data) {
				console.log("退回任意阶段");
				//$scope.Param = data.Param;//参数
				$scope.Params = JSON.parse(data.Param);
				$scope.FlowNo = data.FlowNo;
				$scope.PhaseNo = data.PhaseNo;
				$scope.BackNodes = [];
				basePage.init($scope, loadData);
			});
			var loadData = function ($ionicLoading) {
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_getBackNodes", //获取可退回阶段
					{
						ObjectNo: $scope.Params["attribute6"],
						FlowNo: $scope.FlowNo,
						PhaseNo: $scope.PhaseNo,
						UserId: AmApp.userID
					},
					function (data, status) {
						//							console.log("可退回阶段：");
						//							console.log(data);
						$scope.BackNodes = [];
						for (var i = 0; i < data["array"].length; i++) {
							$scope.BackNodes.push(data["array"][i]);
						}
						if ($scope.BackNodes.length > 0) {
							$scope.noData = false;
						} else {
							$scope.noData = true;
						}
					});
			};
			//选择阶段
			$scope.SelectNode = function (item) {
				$scope.Node = item;
			}
			//退回对应的阶段
			$scope.goBackToNode = function (i) {
				//				console.log("recommit:"+i);
				//				console.log($scope.Node);
				if (typeof ($scope.Node) == undefined || $scope.Node == null) { //校验是否选择了退回阶段
					appIonicLoading.show({
						template: "请选择退回阶段！",
						duration: 3000
					});
					return;
				}
				if (1 == i) {
					$scope.recommit = "";
				}
				if (2 == i) { //重新提交给我
					$scope.recommit = "recommit";
				}
				var confirmPopup = $ionicPopup.confirm({
					title: '退回',
					template: '退回阶段 ：(' + $scope.Node.PhaseName + ') ,确定退回？',
					okText: '确定',
					cancelText: '取消'
				}).then(function (res) {
					if (res) {
						runServiceWithSession(
							$http,
							$ionicLoading,
							$ionicPopup,
							$state,
							"examine_goBackToNode", {
								SerialNo: $scope.Node.serialNo,
								FTSeriaNo: $scope.Params["attribute5"],
								ObjectNo: $scope.Params["attribute6"],
								FlowNo: $scope.FlowNo,
								PhaseNo: $scope.PhaseNo,
								recommit: $scope.recommit,
								UserID: AmApp.userID
							},
							function (data, status) {
								if (data["array"][0].OperationMsg == "success") {
									appIonicLoading.show({
										template: "退回成功！",
										duration: 3000
									});
									$scope.hideModal(); //关闭弹窗
									$scope.goBackList(); //刷新列表

								} else if (data["array"][0].OperationMsg == "failed") {
									appIonicLoading.show({
										template: data["array"][0].ErrorMsg,
										duration: 3000
									});
								} else {
									appIonicLoading.show({
										template: "退回失败！",
										duration: 3000
									});
								}
							});
					}
				});
			}

			//关闭弹窗
			$scope.hideModal = function () {
				//console.log("关闭弹窗");
				$scope.Node = null; //置空选中的节点
				$scope.modal.hide();
			}



		})

	// 提交下一阶段
	.controller(
		'SubimtToNextPhaseController',
		function ($scope, $state, $stateParams, $http, $ionicPopup, $ionicLoading, basePage) {
			$scope.$on('To-DoSubmit', function (e, data) {
				//$scope.Param = data.Param;//参数
				console.log("提交下一阶段");
				$scope.Params = JSON.parse(data.Param);
				$scope.FlowNo = data.FlowNo;
				$scope.PhaseNo = data.PhaseNo;
				$scope.NodeType = data.NodeType;
				basePage.init($scope, loadData);
			});
			$scope.$on('To-BackToReSubmit', function (e, data) {
				//$scope.Param = data.Param;//参数
				console.log("退回任务重新提交啊");
				$scope.Params = JSON.parse(data.Param);
				$scope.FlowNo = data.FlowNo;
				$scope.PhaseNo = data.PhaseNo;
				$scope.submit();
			});

			var loadData = function ($ionicLoading) {
				appIonicLoading.show({
					template: '正在加载中',
					animation: 'fade-in',
					showBackdrop: true,
					duration: 30000
				});
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_getNextPhaseAction", //获取下一阶段动作
					{
						FTSeriaNo: $scope.Params["attribute5"],
						ObjectNo: $scope.Params["attribute6"],
						PhaseNo: $scope.PhaseNo,
						FlowNo: $scope.FlowNo,
						PhaseAction: "",
						UserID: AmApp.userID
					},
					function (data, status) {
						//							console.log("下一阶段动作：");
						//							console.log(data);
						$scope.NextActions = [];
						for (var i = 0; i < data["array"].length; i++) {
							$scope.NextActions.push(data["array"][i]);
						}
						if ($scope.NextActions.length > 0) {
							$scope.noData = false;
						} else {
							$scope.noData = true;
						}
						appIonicLoading.hide();
						$scope.showUsers = false; //不展示下阶段处理人
					});

			};


			//下一阶段处理人
			$scope.showActionUser = function (Action) {
				//								console.log("下一阶段处理人showActionUser");
				//								console.log(Action);
				$scope.showUsers = true; //展示下阶段处理人
				appIonicLoading.show({
					template: '正在加载中',
					animation: 'fade-in',
					showBackdrop: true,
					duration: 30000
				});
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_getNextPhaseAction", //获取下阶段处理人
					{
						FTSeriaNo: $scope.Params["attribute5"],
						ObjectNo: $scope.Params["attribute6"],
						PhaseNo: $scope.PhaseNo,
						FlowNo: $scope.FlowNo,
						PhaseAction: Action.NextPhaseAction,
						UserID: AmApp.userID
					},
					function (data, status) {
						//														console.log("下一下阶段处理人：");
						//														console.log(data);
						$scope.NextOperators = [];
						for (var i = 0; i < data["array"].length; i++) {
							$scope.NextOperators.push(data["array"][i]);
						}
						var nextPhaseInfo = JSON.parse($scope.NextOperators[0].ActionUser);
						$scope.ActionSet = nextPhaseInfo.ActionSet;
						$scope.ActionUsers = nextPhaseInfo.PhaseAction;
						$scope.nextPhaseInfo = $scope.NextOperators[0].NextPhaseName;
						$scope.ActionChoose = Action;

						//判断如果是BatCreditApproveFlow流程，则改变checked的值。
						if ($scope.FlowNo == "BatCreditApproveFlow" && $scope.ActionUsers != null && typeof ($scope.ActionUsers) != undefined) {
							for (var i = 0; i < $scope.ActionUsers.length; i++) {
								$scope.ActionUsers[i]["checked"] = false;
							}
						}

						if (nextPhaseInfo.Error != undefined && nextPhaseInfo.Error != null) {
							$scope.userFlag = true;
							$scope.errMsg = nextPhaseInfo.Error;
						} else {
							$scope.userFlag = false;
						}
						appIonicLoading.hide();
					});
				//console.log("$scope.userFlag："+$scope.userFlag);
			}
			$scope.ActionUserChoose = function (User) {
				$scope.ActionUser = User;
			}
			//批量Bat选择用户
			$scope.batchActionUsersChoose = function (User) {
				User["checked"] = !User["checked"];
			}

			//提交
			$scope.submit = function () { //必输校验、校验意见签署、校验是否已提交、不能提交给自己等都放在后端校验
				//				console.log("提交submit:");
				//				console.log($scope.ActionChoose==null);
				//				console.log($scope.ActionUser);


				//特殊处理，如果是BatCreditApproveFlow流程，提交时进行遍历。
				if ($scope.FlowNo == "BatCreditApproveFlow" && $scope.ActionUsers != null && typeof ($scope.ActionUsers) != undefined) {
					$scope.ActionUser = [];
					for (var i = 0; i < $scope.ActionUsers.length; i++) {
						if ($scope.ActionUsers[i]["checked"]) { //勾选的checked值变为true时，将值放入到$scope.ActionUser
							$scope.ActionUser.push($scope.ActionUsers[i]);
						}
					}
				}


				appIonicLoading.show({
					template: '正在提交中.....',
					animation: 'fade-in',
					showBackdrop: true,
					duration: 5000
				});
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_doSubmit", //提交
					{
						FTSeriaNo: $scope.Params["attribute5"], //流程任务号
						ObjectNo: $scope.Params["attribute6"], //对象编号
						PhaseNo: $scope.PhaseNo, //当前阶段号
						FlowNo: $scope.FlowNo, //流程号
						PhaseAction: $scope.ActionChoose == null ? "" : $scope.ActionChoose.NextPhaseAction, //下一阶段动作
						ActionUser: JSON.stringify($scope.ActionUser), //下一阶段处理人
						UserID: AmApp.userID
					},
					function (data, status) {
						//							console.log("提交结果：");
						//							console.log(data);
						if ("failed" == data["array"][0].OperationMsg) {
							appIonicLoading.show({
								template: data["array"][0].ErrorMsg,
								animation: 'fade-in',
								showBackdrop: true,
								duration: 3000
							});
						} else {
							appIonicLoading.show({
								template: "提交成功",
								animation: 'fade-in',
								showBackdrop: true,
								duration: 3000
							});
							$scope.goBackList(); //刷新列表
							$scope.hideModal(); //关闭弹窗
						}
					});
			}

			//关闭弹窗
			$scope.hideModal = function () {
				//console.log("关闭弹窗");
				$scope.NextActions = []; //置空下一阶段动作
				$scope.showUsers = false; //不展示下阶段处理人
				$scope.ActionUsers = []; //置空下一阶段处理人
				$scope.ActionChoose = null; //置空已选择阶段
				$scope.ActionUser = null; //置空已选择用户
				$scope.modal.hide();
			}
			/***********************提交下一阶段end******************************/

		})

	//额度切分列表
	.controller(
		'CLDListController',
		function ($scope, $state, $ionicModal, $rootScope, $stateParams, $http, $ionicPopup, $ionicLoading, basePage, $ionicScrollDelegate) {
			$scope.$on('To-CLDListController', function (e, data) {
				console.log("额度切分列表CLDList加载");
				$scope.Param = data.Param; //参数
				$scope.items = [];
				basePage.init($scope, loadData);
			});
			var loadData = function ($ionicLoading) {
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_CLDList", { //额度切分特殊处理
						UserId: AmApp.userID,
						ListMethod: "CLDList",
						Params: $scope.Param
					},
					function (data, status) {
						appIonicLoading.hide();
						//						console.log("额度切分列表：");
						//						console.log(data);
						for (var i = 0; i < data["array"].length; i++) {
							//console.log(""==data["array"][i].ShowFlag);
							var BailRate = new Number(data["array"][i].BailRate);
							console.log("BailRate:" + BailRate);
							data["array"][i].BailRate = BailRate.toFixed(2);
							data["array"][i].TERMDATE1 = new Date(data["array"][i].TERMDATE1);
							//判断下级全部打开
							data["array"][i].ShowFlag = true;
							$scope.items.push(data["array"][i]);
						}
						//console.log($scope.items);
						$scope.loadingMore = false;
						if ($scope.items.length > 0) {
							$scope.noData = false;
						} else {
							$scope.noData = true;
						}
					});
			};

			//下级展开关闭
			$scope.showNextLevel = function (item) {
				if (item.ShowFlag) {
					item.ShowFlag = false;
				} else {
					item.ShowFlag = true;
					/*setTimeout(function() {
						$scope.$apply(function() {
							$ionicScrollDelegate.$getByHandle(
									"smallScroll01").scrollBy(0, 310,
									true);
						});
					}, 100);*/
				}
			};

			//关闭弹窗
			$scope.hideModal = function () {
				//console.log("关闭弹窗");
				$scope.modal.hide();
			}

			//日期转换
			function dateFtt(fmt, date) { //author: meizz   
				var o = {
					"M+": date.getMonth() + 1, //月份   
					"d+": date.getDate(), //日   
					"h+": date.getHours(), //小时   
					"m+": date.getMinutes(), //分   
					"s+": date.getSeconds(), //秒   
					"q+": Math.floor((date.getMonth() + 3) / 3), //季度   
					"S": date.getMilliseconds() //毫秒   
				};
				if (/(y+)/.test(fmt))
					fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
				for (var k in o)
					if (new RegExp("(" + k + ")").test(fmt))
						fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
				return fmt;
			}


			//保存切分信息
			$scope.SaveCLDivide = function (item) {
				//				console.log("保存切分信息");
				//				console.log(item);
				//console.log(dateFtt("yyyy/MM/dd",item.TERMDATE1));
				item.TERMDATE1 = dateFtt("yyyy/MM/dd", item.TERMDATE1);
				var CLDivideList = JSON.stringify(item);
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_SaveCLDList", //保存相应的额度切分项
					{
						UserId: AmApp.userID,
						SaveMethod: "SaveCLDivide",
						SaveData: CLDivideList //额度切分信息
					},
					function (data, status) {
						//							console.log("保存额度切分项列表结果：");
						//							console.log(data);
						if (data["array"][0].SaveResult == "success") {
							appIonicLoading.show({
								template: "保存成功！",
								duration: 3000
							});
							$scope.$emit("To-refreshOpinion", {}); //刷新意见信息
						} else {
							appIonicLoading.show({
								template: data["array"][0].SaveMsg,
								duration: 3000
							});
						}
					});


			}

			//展开切分项信息
			$scope.ShowDivideList = function (item) {
				//				console.log("展开切分项信息");
				//				console.log(item);

				//跳转额度切分项列表页面
				$ionicModal.fromTemplateUrl(
					'templates/RFexamine/DivideList.html', {
						scope: $scope,
						backdropClickToClose: false
					}).then(function (modal) {
					$scope.modal = modal;
					$rootScope.DivideListModal = modal;
					$scope.modal.show();
					appIonicLoading.show({
						template: '正在加载中',
						animation: 'fade-in',
						showBackdrop: true,
						duration: 10000
					});
					runServiceWithSession(
						$http,
						$ionicLoading,
						$ionicPopup,
						$state,
						"examine_CLDList", //获取相应的额度切分项
						{
							UserId: AmApp.userID,
							ListMethod: "DivideList",
							ParentLineID: item.SerialNo //上层切分维度编号
						},
						function (data, status) {
							//											console.log("额度切分项列表：");
							//											console.log(data);
							$scope.DivideList = [];
							for (var i = 0; i < data["array"].length; i++) {
								$scope.DivideList.push(data["array"][i]);
							}
							if ($scope.DivideList.length > 0) {
								$scope.noData = false;
							} else {
								$scope.noData = true;
							}
							appIonicLoading.hide();
						});
				});

			}

			//保存切分项信息
			$scope.saveDivideList = function (DivideList) {
				//				console.log("保存切分项信息");
				//				console.log(DivideList);
				var DivideList = JSON.stringify(DivideList);
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"examine_SaveCLDList", //保存相应的额度切分项
					{
						UserId: AmApp.userID,
						SaveMethod: "SaveDivideList",
						SaveData: DivideList //额度切分项信息
					},
					function (data, status) {
						//							console.log("保存额度切分项列表结果：");
						//							console.log(data);
						if (data["array"][0].SaveResult == "success") {
							appIonicLoading.show({
								template: "额度切分项保存成功！",
								duration: 3000
							});
							$scope.hideModal(); //关闭弹窗
							$scope.$emit("To-refreshCLDList", {}); //刷新额度切分列表

						} else {
							appIonicLoading.show({
								template: "额度切分项保存失败！",
								duration: 3000
							});
						}
					});
			}

		})
	//签署意见特殊列表
	.controller(
		'opinionListController',
		function ($scope, $state, $ionicModal, $rootScope, $stateParams, $http, $ionicPopup, $ionicLoading, basePage, $ionicScrollDelegate) {
			$scope.$on('To-opinionListController', function (e, data) {
				console.log("签署意见特殊List加载");
				$scope.Param = JSON.parse(data.Param); //参数     
				$scope.PhaseNo = data.PhaseNo;
				$scope.FlowNo = data.FlowNo;
				$scope.PhaseOpinion1 = data.PhaseOpinion1;
				$scope.PhaseOpinion3 = data.PhaseOpinion3;

				$scope.items = [];
				basePage.init($scope, loadData);
			});
			$scope.$on('To-saveOpinionList', function (e, data) {
				saveOpinionList();
			});

			var loadData = function ($ionicLoading) {
				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"getspList", { //签署意见特殊处理
						UserId: AmApp.userID,
						ObjectNo: $scope.Param["attribute6"],
						TaskNo: $scope.Param["attribute5"],
						ObjectType: $scope.Param["attribute7"],
						FlowState: $scope.Param["attribute10"],
						FlowNo: $scope.FlowNo,
						PhaseNo: $scope.PhaseNo,
					},
					function (data, status) {
						appIonicLoading.hide();

						for (var i = 0; i < data["array"].length; i++) {
							data["array"][i].ShowFlag = true;
							$scope.items.push(data["array"][i]);
						}
						$scope.loadingMore = false;
						if ($scope.items.length > 0) {
							$scope.noData = false;
						} else {
							$scope.noData = true;
						}
					});
			}
			
			//下级展开关闭
			$scope.showNextLevel = function (item) {
				if (item.ShowFlag) {
					item.ShowFlag = false;
				} else {
					item.ShowFlag = true;
				}
			};

			//保存
			var saveOpinionList = function () {

				runServiceWithSession(
					$http,
					$ionicLoading,
					$ionicPopup,
					$state,
					"SavespList",
					{
						UserId: AmApp.userID,
						SaveData: JSON.stringify($scope.items)
					},
					function (data, status) {
						if (data["array"][0].SaveResult == "success") {
							appIonicLoading.show({
								template: "意见保存成功！",
								duration: 3000
							});
						} else {
							appIonicLoading.show({
								template: "意见保存失败！",
								duration: 3000
							});
						}
					});
			}
		});