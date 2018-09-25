angular
		.module('com.amarsoft.mobile.controllers.base', [])

	
		// *******************
		// 登录
		// *******************
		.controller('LogonController',
				function($scope, $state, $ionicPopup, $http, $ionicLoading,basePage) {
					$scope.user = {
						UserId : "",
						UserPwd : ""
					};
					$scope.logon = function() {
						if ($scope.user.UserId == undefined || $scope.user.UserId == '') {
							$ionicPopup.alert({
								title : '请输入账号',
							});
							return false;
						}
						if ($scope.user.UserPwd == undefined || $scope.user.UserPwd == '') {
							$ionicPopup.alert({
								title : '请输入密码',
							});
							return false;
						}
						runService($http, $ionicLoading, "logon", $scope.user,
								function(data, status) {
									if (data.Result == 'Y') {
										$ionicPopup.alert({
											title : '登录成功',
										});
										$state.go('examine');
									} else {
										$scope.fail = true;
										return false;
									}
								});
					};
					$scope.logonAgain = function() {
						$scope.fail = false;
						$scope.user = {
							userID : "",
							userPwd : ""
						};
					}
					basePage.init($scope);
				})
		// *******************
		// 审查审批
		// *******************
		.controller(
				'ExamineController',
				function($scope, $state, $http, $ionicLoading, $ionicPopup,
						basePage) {
					$scope.footActiveIndex = 0;
					$scope.items = [];
					runServiceWithSession(
							$http,
							$ionicLoading,
							$ionicPopup,
							$state,
							"examine",
							{
								userId : $scope.userID,
								finishedFlag : $scope.finishedFlag
							},
							function(data, status) {
								for ( var i = 0; i < data["array"].length; i++) {
									$scope.items.push(data["array"][i]);
								}
							});
					$scope.gotoList = function(flowNo) {
						if (flowNo == "normalFlow") {
							$state.go('curWork');
						} else if (flowNo == "guarantyFlow") {
							$state.go('dzyw');
						}
					}
					basePage.init($scope);
				})
		// 当前工作
		.controller(
				'CurWorkController',
				function($scope, $state, $http, $ionicLoading, paging, basePage) {
					var iPageSize = 3;
					var loadData = function(ionicLoading) {
						runService($http, $ionicLoading, "curWork", {
							pageSize : iPageSize,
							curPage : $scope.pageNo,
							phaseNo : $scope.phaseNo
						}, function(data, status) {
							for ( var k = 0; k < data["array"].length; k++)
								$scope.items.push(data["array"][k]);
							$scope.hasMore = (($scope.pageNo - 1) * iPageSize
									+ data["array"].length < data.TotalAcount);
							$scope.$broadcast('scroll.refreshComplete');
							$scope.$broadcast('scroll.infiniteScrollComplete');
						});
					}
					$scope.gotoApplyInfo = function(serialNo, objectNo) {
						$scope.changeState('applyInfo', {
							SerialNo : serialNo,
							ObjectNo : objectNo
						});
					}
					paging.init($scope, iPageSize, 1, loadData);
					basePage.init($scope);
				})
		// 申请详情
		.controller('ApplyInfoController',
				function($scope, $state, $stateParams, basePage) {
					$scope.serialNo = $stateParams.SerialNo;
					$scope.objectno = $stateParams.ObjectNo;
					
					$scope.gotoApplyDetail = function() {
						$state.go('applyDetail');
					}
					$scope.gotoCust_list = function() {
						$state.go('cust_list');
					}
					$scope.gotoGuarantee = function() {
						$state.go('guarantee');
					}

					basePage.init($scope);
				})
		// 申请信息
		.controller('ApplyController', function($scope, $http, $ionicLoading) {
			runService($http, $ionicLoading, "applyInfo", {
				serialNo : $scope.serialNo,
				objectNo : $scope.objectNo
			}, function(data, status) {
				$scope.apply = data["array"];
			});
		})
		// 客户信息
		.controller('CustomerController',
				function($scope, $http, $ionicLoading) {
					runService($http, $ionicLoading, "customerInfo", {
						serialNo : $scope.serialNo,
						objectNo : $scope.objectNo
					}, function(data, status) {
						$scope.customer = data["array"];
					});
				})
		// 担保信息
		.controller('GuarantyController',
				function($scope, $http, $ionicLoading) {
					runService($http, $ionicLoading, "guarantyInfo", {
						serialNo : $scope.serialNo,
						objectNo : $scope.objectNo
					}, function(data, status) {
						$scope.guaranty = data["array"];
					});
				})
		// 调查报告
		.controller('ReportController', function($scope, $http, $ionicLoading) {
			runService($http, $ionicLoading, "reportInfo", {
				serialNo : $scope.serialNo,
				objectNo : $scope.objectNo
			}, function(data, status) {
				$scope.report = data["array"];
			});
		})
		// 申请详细信息
		.controller('ApplyDetailController',
				function($scope, $state, $http, $ionicLoading, basePage) {

					runService($http, $ionicLoading, "applyDetail", {
						serialNo : $scope.serialNo,
					}, function(data, status) {
						$scope.items = data["array"];
					});
					$scope.gotoBasicInfo = function() {
						$state.go('applyBasicInfo');
					}
					$scope.gotoGuarantee = function() {
						$state.go('guarantee');
					}
					basePage.init($scope);
				})
		// 申请基本信息
		.controller('ApplyBasicInfoController',
				function($scope, $http, $ionicLoading, basePage) {

					runService($http, $ionicLoading, "applyBasicInfo", {
						serialNo : $scope.serialNo,
					}, function(data, status) {
						$scope.items = data["array"];
					});
					basePage.init($scope);
				})
		// 担保信息
		.controller('GuaranteeController', function($scope, basePage) {
			basePage.init($scope);
		})
		//新增担保信息
		.controller('NewGuaranteeController',function($scope,$http,$ionicLoading){
			runService($http,$ionicLoading,"newGuarantee",{
				userId:$scope.userID
				},
				function(data,status){
					$scope.items = data["array"];
				});
		})
		//拟引入担保信息
		.controller('ImportGuaranteeController',function($scope,$http,$ionicLoading){
			runService($http,$ionicLoading,"importGuarantee",{
				userId:$scope.userID
				},
				function(data,status){
					$scope.items = data["array"];
				});
		})
		// 客户信息
		.controller('CustListController',
				function($scope, $state, $http, $ionicLoading, basePage) {

					runService($http, $ionicLoading, "custList", {
						serialNo : $scope.serialNo,
					}, function(data, status) {
						$scope.items = data["array"];
					});
					$scope.gotoCust_survey = function() {
						$state.go('cust_survey');
					}
					basePage.init($scope);
				})
		// 客户详细信息
		.controller('CustSurveyController',
				function($scope, $state, $http, $ionicLoading, basePage) {

					runService($http, $ionicLoading, "custSurvey", {
						serialNo : $scope.serialNo,
					}, function(data, status) {
						$scope.items = data["array"];
					});
					basePage.init($scope);
				})
		// 抵质押物
		.controller(
				'DzywController',
				function($scope, $state, $http, $ionicLoading, paging, basePage) {
					var iPageSize = 8;
					var loadData = function($ionicLoading) {
						runService($http, $ionicLoading, "dzyw", {
							pageSize : iPageSize,
							curPage : $scope.pageNo,
							phaseNo : $scope.phaseNo
						}, function(data, status) {
							for ( var k = 0; k < data["array"].length; k++)
								$scope.items.push(data["array"][k]);
							$scope.hasMore = (($scope.pageNo - 1) * iPageSize
									+ data["array"].length < data.TotalAcount);
							$scope.$broadcast('scroll.refreshComplete');
							$scope.$broadcast('scroll.infiniteScrollComplete');
						});
					}
					paging.init($scope, iPageSize, 1, loadData);
					basePage.init($scope);
				})
		// 搜索
		.controller('SearchController',
				function($scope, $state, $ionicPopup, basePage) {
					$scope.search = {
						text : ""
					};
					$scope.doSearch = function() {
						if ($scope.search.text == '') {
							$ionicPopup.alert({
								title : '请输入搜索内容',
							});
							return false;
						}
					}

					basePage.init($scope);
				})
		// 签署意见
		.controller('SignOpinionController',
				function($scope, $state, $ionicPopup, basePage) {
					$scope.opinion = {
						signOpinion : ""
					};
					$scope.gotoCheckSelect = function() {
						if ($scope.opinion.signOpinion == '') {
							$ionicPopup.alert({
								title : '请签署意见',
							});
							return false;
						}
						$state.go('checkSelect');
					}

					basePage.init($scope);
				})
		// 提交
		.controller('CheckSelectController', function($scope, basePage) {
			$scope.flow = {
				phaseName : "提交运营托管行审核岗审核",
				userName : "支行审核员"
			};

			basePage.init($scope);
		})
		// *******************
		// 统计查询
		// *******************
		.controller(
				'QueryController',
				function($scope, $state, $ionicPopup, $timeout, basePage) {
					$scope.footActiveIndex = 1;
					$scope.options = [ {
						"name" : "上海市杨浦支行"
					}, {
						"name" : "上海市静安支行"
					}, {
						"name" : "上海市普陀支行"
					} ];

					$scope.query = {
						customerID : "",
						enterpriseName : "",
						certID : ""
					};

					$scope.doQuery = function() {
						if ($scope.query.customerID == ''
								&& $scope.query.enterpriseName == ''
								&& $scope.query.certID == '') {
							$ionicPopup.alert({
								title : '请输入查询条件',
							});
							$scope.queryFail = false;
							$scope.querySuccess = false;
							return false;
						} else if ($scope.query.customerID == '') {// 查询失败
							$timeout(function() {
								$scope.queryFail = true;
								$scope.querySuccess = false;
							}, 1000);
						} else {// 查询成功
							$timeout(function() {
								$scope.querySuccess = true;
								$scope.queryFail = false;
							}, 1000);
						}
					}
					basePage.init($scope);
					/*$scope.items = [];
					$scope.doSelect = function() {
						if ($scope.id_select.identity == ''
							|| $scope.id_select.identity == null) {
						$ionicPopup.alert({
							title : '请选择查询类型'
						});
						return false;
						}
						if ($scope.query.customerID == ''
								|| $scope.query.enterpriseName == ''
								|| $scope.query.certID == '') {
							$ionicPopup.alert({
								title : '请输入查询条件',
							});
							return false;
						} 
						runService($http,$ionicLoading,"query",{
							selectType:$scope.id_select.identity,
							customerId:$scope.query.customerID,
							customerName:$scope.query.enterpriseName,
							certId:$scope.query.certID,
							bank:$scope.bank_select.bank
							},
							function(data,status){
								if(data["array"].length > 0){// 查询成功
									$scope.settingsModal_suc.show();
									$timeout(function() {
									}, 1000);
								}else{
									$scope.settingsModal_err.show();
									$timeout(function() {
									}, 1000);
								}
						});
					}*/
				})
		//查询成功
		.controller('sucCtrl', function($scope,$http,$stateParams,$ionicLoading) {
			$scope.items = [];
			runService($http,$ionicLoading,"query",{
				/*selectType:$scope.id_select.identity,
				customerId:$scope.query.customerID,
				customerName:$scope.query.enterpriseName,
				certId:$scope.query.certID,
				bank:$scope.bank_select.bank*/
				},
				function(data,status){
					for (var i = 0; i < data["array"].length; i++) {
						$scope.items.push(data["array"][i]);				
					}
			});
			$scope.back_scu = function() {
				$scope.modal.hide();
			}
		})
		//查询失败
		.controller('failCtrl', function($scope) {
			$scope.back_err = function() {
				$scope.modal.hide();
			}
		})
		
		// *******************
		// 我的
		// *******************
		.controller('MyController', function($scope, $state, basePage) {
			$scope.footActiveIndex = 3;
			$scope.count = {
				noticeCount : "23"
			};
			$scope.gotoNews = function() {
				$state.go('news');
			}
			$scope.gotoSet = function() {
				$state.go('set');
			}
			$scope.gotoFeedback = function() {
				$state.go('Feedback');
			}
			$scope.gotoAbout = function() {
				$state.go('about');
			}
			basePage.init($scope);
		})
		// 消息
		.controller('NewsController', function($scope, $state, basePage) {
			$scope.count = {
				noticeCount : "8",
				maturityCount : "3",
				pwdModifyCount : "5",
				allopatryCount : "7"
			};
			$scope.gotoNotice = function() {
				$state.go('notice');
			}
			$scope.gotoRemind = function() {
				$state.go('remind');
			}
			$scope.gotoPasswordXG = function() {
				$state.go('passwordXG');
			}
			$scope.gotoRemoteDL = function() {
				$state.go('remoteDL');
			}
			basePage.init($scope);
		})
		// 总行通知
		.controller(
				'NoticeController',
				function($scope, $state, $http, $ionicLoading, paging, basePage) {
					var iPageSize = 1;
					var loadData = function($ionicLoading) {
						runService($http, $ionicLoading, "notice", {
							pageSize : iPageSize,
							pageNo : $scope.pageNo,
							userId : $scope.userId,
							latesDate : $scope.latesDate
						}, function(data, status) {
							for ( var k = 0; k < data["array"].length; k++)
								$scope.items.push(data["array"][k]);
							$scope.hasMore = (($scope.pageNo - 1) * iPageSize
									+ data["array"].length < data.totalCount);
							$scope.$broadcast('scroll.refreshComplete');
							$scope.$broadcast('scroll.infiniteScrollComplete');
						});
					}
					$scope.gotoNoticeDetail = function(boardNo) {
						$state.go('noticeDetail',{boardNo:boardNo});
					}
					paging.init($scope, iPageSize, 1, loadData);
					basePage.init($scope);
				})
		// 通知详情
		.controller(
				'NoticeDetailController',
				function($scope, $state,$stateParams,$http,$ionicLoading,basePage) {
					$scope.boardNo = $stateParams.boardNo;
					runService($http,$ionicLoading,"noticeDetail",{
						boardNo:$scope.boardNo
						},
						function(data,status){
							$scope.notice = data["array"];
					});

					basePage.init($scope);
				})
		// 到期业务提醒
		.controller('RemindController', function($scope, $state, basePage) {
			$scope.gotoBusiness = function() {
				$state.go('Business');
			}
			basePage.init($scope);
		})
		// 到期业务列表
		.controller(
				'BusinessController',
				function($scope, $state, $http, $ionicLoading, paging, basePage) {
					var iPageSize = 5;
					var loadData = function($ionicLoading) {
						runService($http, $ionicLoading, "business", {
							pageSize : iPageSize,
							pageNo : $scope.pageNo,
							userId : $scope.userId
						}, function(data, status) {
							for ( var k = 0; k < data["array"].length; k++)
								data["array"][k].IconCode = strEscape(data["array"][k].IconCode);
								$scope.items.push(data["array"][k]);
							$scope.hasMore = (($scope.pageNo - 1) * iPageSize
									+ data["array"].length < data.TotalAcount);
							$scope.$broadcast('scroll.refreshComplete');
							$scope.$broadcast('scroll.infiniteScrollComplete');
						});
					}
					paging.init($scope, iPageSize, 1, loadData);
					basePage.init($scope);
				})
		// 密码修改提醒
		.controller(
				'PasswordXGController',
				function($scope, $state, $http, $ionicLoading, paging, basePage) {
					var iPageSize = 8;
					var loadData = function($ionicLoading) {
						runService($http, $ionicLoading, "passwordXG", {
							pageSize : iPageSize,
							curPage : $scope.pageNo,
							userId : $scope.userId,
							msgType : $scope.msgType
						}, function(data, status) {
							for ( var k = 0; k < data["array"].length; k++)
								$scope.items.push(data["array"][k]);
							$scope.hasMore = (($scope.pageNo - 1) * iPageSize
									+ data["array"].length < data.TotalAcount);
							$scope.$broadcast('scroll.refreshComplete');
							$scope.$broadcast('scroll.infiniteScrollComplete');
						});
					}
					paging.init($scope, iPageSize, 1, loadData);
					basePage.init($scope);
				})
		// 异地登陆提醒
		.controller(
				'RemoteDLController',
				function($scope, $state, $http, $ionicLoading, paging, basePage) {
					var iPageSize = 8;
					var loadData = function($ionicLoading) {
						runService($http, $ionicLoading, "remoteDL", {
							pageSize : iPageSize,
							curPage : $scope.pageNo,
							userId : $scope.userId,
							msgType : $scope.msgType
						}, function(data, status) {
							for ( var k = 0; k < data["array"].length; k++)
								$scope.items.push(data["array"][k]);
							$scope.hasMore = (($scope.pageNo - 1) * iPageSize
									+ data["array"].length < data.TotalAcount);
							$scope.$broadcast('scroll.refreshComplete');
							$scope.$broadcast('scroll.infiniteScrollComplete');
						});
					}
					paging.init($scope, iPageSize, 1, loadData);
					basePage.init($scope);
				})
		// 设置
		.controller('SetController', function($scope, $state, basePage) {
			$scope.gotoSetAccount = function() {
				$state.go('setAccount');
			}
			basePage.init($scope);
		})
		// 账号安全
		.controller('SetAccountController', function($scope, $state, basePage) {
			$scope.gotoXGpassword = function() {
				$state.go('XGpassword');
			}
			$scope.gotoSetremind = function() {
				$state.go('setremind');
			}
			basePage.init($scope);
		})
		// 修改密码
		.controller(
				'XGpasswordController',
				function($scope, $state, $ionicPopup, basePage) {
					$scope.pwd = {
						oldPassword : "",
						newPassword1 : "",
						newPassword2 : ""
					};
					$scope.confirm = function() {
						if ($scope.pwd.oldPassword == ''
								|| $scope.pwd.newPassword1 == ''
								|| $scope.pwd.newPassword2 == '') {
							$ionicPopup.alert({
								title : '请输入密码！',
							});
							return false;
						} else if ($scope.pwd.oldPassword == $scope.pwd.newPassword1) {
							$ionicPopup.alert({
								title : '请勿使用旧密码作为新密码！',
							});
							return false;
						} else if ($scope.pwd.newPassword1 != $scope.pwd.newPassword2) {
							$ionicPopup.alert({
								title : '两次输入的密码不一致！',
							});
							return false;
						} else {
							$ionicPopup.alert({
								title : '修改密码成功！',
							});
						}
					}

					basePage.init($scope);
				})
		// 安全提醒
		.controller('SetremindController', function($scope, $state, basePage) {
			basePage.init($scope);
		})
		// 意见反馈
		.controller('FeedbackController',
				function($scope, $state, $ionicPopup, basePage) {
					$scope.opinion = {
						signOpinion : ""
					};
					$scope.submit = function() {
						if ($scope.opinion.signOpinion == '') {
							$ionicPopup.alert({
								title : '请填写意见',
							});
							return false;
						} else {
							$ionicPopup.alert({
								title : '意见提交成功！',
							});
						}
					}
					basePage.init($scope);
				})
		// 关于
		.controller('AboutController', function($scope, $state, basePage) {
			basePage.init($scope);
		});
