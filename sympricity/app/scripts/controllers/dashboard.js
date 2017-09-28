'use strict';

angular.module('sympricityApp')
  .controller('DashboardCtrl', function ($scope, $http) {

  	var formData = {};

    // $scope.getProducts = function(){

    	$http.get('/api/products').success(function(data) {
    		// debugger;
      			// for(var i in products){
      			// 	if(products[i].name)
      			// 		$scope.products.push(products[i].name);
      			// }
      			console.log('products----'+data);
      			$scope.products = data;
      			console.log($scope.products);

    	});
  // };

	
    $scope.addProduct = function(){
    	$http.post('/api/products', $scope.formData).success(function(data, status) {
      console.log(data, status);
      $scope.products.push(data);
    });
  };
});

