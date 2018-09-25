angular
		.module('com.amarsoft.mobile.controllers.demo', [])

		.controller(
				'test',
				function($scope, dynamicFilter) {
					$scope.selects = {
						array : [ {
							value : "1",
							key : "1",
							array : [ {
								value : "2",
								key : "2"
							}, {
								value : "3",
								key : "3"
							}, {
								value : "4",
								key : "4"
							}, {
								value : "5",
								key : "5",
								array : [ {
									key : "6",
									value : "6"
								}, {
									key : "7",
									value : "7"
								}, {
									key : "8",
									value : "8"
								}, {
									key : "9",
									value : "9"
								} ]
							} ]
						}, {
							key : "10",
							value : "10"
						}, {
							key : "11",
							value : "11",
							array : [ {
								key : "12",
								value : "12"
							}, {
								key : "13",
								value : "13"
							}, {
								key : "14",
								value : "14"
							}, {
								key : "15",
								value : "15"
							} ]
						} ]
					};
					$scope.select2 = {
						array : [ {
							value : "16",
							key : "16",
							array : [ {
								value : "17",
								key : "17"
							}, {
								value : "18",
								key : "18"
							}, {
								value : "19",
								key : "19",
								array : [ {
									key : "20",
									value : "20"
								}, {
									key : "21",
									value : "21"
								}, {
									key : "22",
									value : "22"
								}, {
									key : "23",
									value : "23"
								} ]
							} ]
						}, {
							key : "24",
							value : "24"
						}, {
							key : "25",
							value : "25",
							array : [ {
								key : "26",
								value : "26"
							}, {
								key : "27",
								value : "27"
							}, {
								key : "28",
								value : "28"
							}, {
								key : "29",
								value : "29"
							} ]
						} ]
					};
					var parentId = document.getElementById("parent");
					$scope.filter = {};
					dynamicFilter.init($scope, parentId, "filter",
							$scope.selects.array, true);
					var parentId2 = document.getElementById("parent2");
					dynamicFilter.init($scope, "parent2", "filter2",
							$scope.select2.array, false);

					$scope.confirm1 = function() {
						alert($scope.filter.confirm());
					};

					$scope.confirm2 = function() {
						alert($scope.filter2.confirm());
					};

				})

		.controller(
				'mapTest',
				function($scope) {
					var options = {
						enableHighAccuracy : true,
						maximunAge : 1000,
						timeout : 5000
					};
					var map = new BMap.Map("allmap");
					if (window.navigator.geolocation) {
						navigator.geolocation.getCurrentPosition(function(
								position) {
							console.log(position.coords.longitude + " "
									+ position.coords.latitude);
							var point = new BMap.Point(
									position.coords.longitude,
									position.coords.latitude);
							var geoc = new BMap.Geocoder();
							geoc.getLocation(point, function(rs) {
								var addComp = rs.addressComponents;
								alert(addComp.province + ", " + addComp.city
										+ ", " + addComp.district + ", "
										+ addComp.street + ", "
										+ addComp.streetNumber);
							});
						}, function(err) {

						}, options);
					} else {
						alert("你的浏览器不支持定位!");
					}
				})

		.controller('cameraTest', function($scope) {

			var init = function() {
				$scope.options = {
					quality : 50,
					destinationType : Camera.DestinationType.DATA_URL,
					sourceType : Camera.PictureSourceType.CAMERA,
					allowEdit : true,
					encodingType : Camera.EncodingType.JPEG,
					targetWidth : 100,
					targetHeight : 100,
					popoverOptions : CameraPopoverOptions,
					saveToPhotoAlbum : false,
					correctOrientation : true
				};
			};

			$scope.confirm = function() {
				navigator.camera.getPicture(function(imageData) {
					console.log(imageData);
					$scope.img = "data:image/jpeg;base64," + imageData;
					$scope.$apply();
				}, function(err) {
				}, $scope.options);
			};

			document.addEventListener("deviceready", init, false);
		})
		//
		.controller(
				'downloadDemo',
				function($scope, $cordovaFileTransfer, $cordovaFileOpener2) {
					var init = function() {
						if (AmApp.config.DeviceType == 'android') {
							AmApp.config.filePath = cordova.file.externalRootDirectory;
						} else if (AmApp.config.DeviceType == 'ios') {
							AmApp.config.filePath = cordova.file.documentsDirectory;
						}
						var targetPath = AmApp.config.filePath + FileName;
						$cordovaFileTransfer
								.download(url, targetPath, {}, true)
								.then(
										function(result) {
											$cordovaFileOpener2.open(
													targetPath,
													getMimeType(targetPath));
										},
										function(err) {
											console.log(err);
											// Error
										},
										function(progress) {
											$timeout(function() {
												$scope.downloadProgress = (progress.loaded / progress.total) * 100;
												console.log(progress);
											});
										});
					};

					document.addEventListener("deviceready", init, false);
				})

				//tabDemo
				.controller('tabDemo', function($scope) {
						var init = function() {}
							
					});
