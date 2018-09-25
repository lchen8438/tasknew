/**
 *  系统条线选择
 */
angular.module('com.amarsoft.mobile.controllers.sysSelect', [])

    .controller(
    'SysSelController',
    function ($scope, $rootScope, $state, basePage) {
        basePage.init($scope);

        $scope.ct_small = true;
        $scope.ct_big = false;
        $scope.jr_small = true;
        $scope.jr_big = false;
        // 点击跳转到传统信贷
        $scope.goToCTXD = function () {
            $scope.ct_small = false;
            $scope.ct_big = true;
            AmApp.config.sysSelType = "010";
            $state.go("workTips");
        }

        //点击跳转到金融板块
        $scope.goToJRBK = function () {
            $scope.jr_small = false;
            $scope.jr_big = true;
            AmApp.config.sysSelType = "020";
            // $state.go("workTips");
        }
        
    })