var socket = io.connect("//" + window.location.host),
    app = angular.module("weatherbook", []);

app.service("addresses", [function () {
    this.addresses = [];

    this.filterAddresses = function (letter) {
        var filtered = [];
        this.addresses.forEach(function (address) {
            if (address.lastName[0].toLowerCase() == letter.toLowerCase()) {
                filtered.push(address);
            }
        });
        return filtered;
    };
}]);

app.controller("AddressCtrl",["$rootScope", "$scope", "addresses", function ($rootScope, $scope, addresses) {
    $scope.addresses = addresses;
    $scope.state = "home";

    socket.on("init-book", function (addresses) {
        $scope.$apply(function () {
            $scope.addresses.addresses = addresses;
        });
    });
}]);

app.controller("AddressAddCtrl", ["$scope", "$http", "addresses", function ($scope, $http, addresses) {
    $scope.addAddress = function () {
        $http.post("/weatherbook", {
            firstName: $scope.firstName,
            lastName: $scope.lastName,
            address: $scope.address
        }).success(function (wbID) {
            addresses.addresses.push({
                wbID: wbID,
                firstName: $scope.firstName,
                lastName: $scope.lastName,
                address: $scope.address
            });
        });
    };
}]);

app.controller("DirectoryCtrl", ["$scope", "addresses", function ($scope, addresses) {
    var x;

    $scope.letters = [];

    for (x = 65; x < 65 + 26; x++) {
        $scope.letters.push(String.fromCharCode(x));
    }

    $scope.addresses = addresses;
}]);

