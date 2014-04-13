var socket = io.connect("//" + window.location.host),
    app = angular.module("weatherbook", ["ngAnimate"]);

function removeAddress(wbID) {
    var self = this;

    self.addresses.forEach(function (addr, idx) {
        if (addr.wbID === wbID) {
            self.addresses.splice(idx, 1);
        }
    });
}

app.service("revealedAddresses", function () {
    this.addresses = [];

    this.removeAddress = removeAddress;
});

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

    this.removeAddress = removeAddress;
}]);

app.controller("AddressCtrl",["$scope", "$http", "addresses", "revealedAddresses", function ($scope, $http, addresses, revealedAddresses) {
    $scope.addresses = addresses;
    $scope.revealedAddresses = revealedAddresses;
    $scope.state = "home";

    socket.on("init-book", function (addresses) {
        $scope.$apply(function () {
            $scope.addresses.addresses = addresses;
        });
    });

    $scope.removeAddress = function (wbID) {
        $http.delete("/weatherbook/" + wbID).success(function () {
            revealedAddresses.removeAddress(wbID);
            addresses.removeAddress(wbID);

            if (!revealedAddresses.addresses.length) {
                $scope.state = "home";
            }
        });
    };
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

            $scope.firstName = "";
            $scope.lastName = "";
            $scope.address = "";
        });
    };
}]);

app.controller("DirectoryCtrl", ["$scope", "addresses", "revealedAddresses", function ($scope, addresses, revealedAddresses) {
    var x;

    $scope.letters = [];

    for (x = 65; x < 65 + 26; x++) {
        $scope.letters.push(String.fromCharCode(x));
    }

    $scope.addresses = addresses;

    $scope.revealAddresses = function (letter) {
        var filtered = addresses.filterAddresses(letter);
        if (filtered.length) {
            revealedAddresses.addresses = filtered;
        }
    };
}]);

