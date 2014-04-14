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

app.config(["$httpProvider", function ($httpProvider) {
    $httpProvider.defaults.headers.patch = {
        'Content-Type': 'application/json;charset=utf-8'
    }
}]);

app.service("editingAddress", function () {
    this.firstName = "";
    this.lastName = "";
    this.address = "";
    this.wbID = "";
});

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

    this.updateAddress = function (addr) {
        var self = this;

        self.addresses.forEach(function (address, idx) {
            if (address.wbID === addr.wbID) {
                self.addresses[idx] = addr;
            }
        });
    };
}]);

app.controller("AddressCtrl",["$scope", "$http", "$timeout", "addresses", "revealedAddresses", "editingAddress",
function ($scope, $http, $timeout, addresses, revealedAddresses, editingAddress) {
    $scope.addresses = addresses;
    $scope.revealedAddresses = revealedAddresses;
    $scope.state = "home";
    $scope.initialized = false;

    socket.on("init-book", function (addresses) {
        $scope.$apply(function () {
            $scope.addresses.addresses = addresses;
            // Make sure that the correct initial screen is displayed
            $timeout(function () {
                $scope.initialized = true;
            }, 500);
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

    $scope.updateAddress = function (address) {
        $scope.state = "adding";
        $scope.revealedAddresses.addresses = [];

        editingAddress.firstName = address.firstName;
        editingAddress.lastName = address.lastName;
        editingAddress.address = address.address;
        editingAddress.wbID = address.wbID;
    };
}]);

app.controller("AddressAddCtrl", ["$scope", "$http", "addresses", "editingAddress", function ($scope, $http, addresses, editingAddress) {
    $scope.editingAddress = editingAddress;

    $scope.addAddress = function () {
        var data = {
            firstName: editingAddress.firstName,
            lastName: editingAddress.lastName,
            address: editingAddress.address,
        };

        if (editingAddress.wbID) {
            data.wbID = editingAddress.wbID;

            $http({
                url: "/weatherbook",
                data: data,
                method: "PATCH",
            }).success(function () {
                addresses.updateAddress(data);

                editingAddress.firstName = "";
                editingAddress.lastName = "";
                editingAddress.address = "";
                editingAddress.wbID = "";
            });
        }
        else {
            $http.post("/weatherbook", data).success(function (wbID) {
                addresses.addresses.push({
                    wbID: wbID,
                    firstName: editingAddress.firstName,
                    lastName: editingAddress.lastName,
                    address: editingAddress.address
                });

                editingAddress.firstName = "";
                editingAddress.lastName = "";
                editingAddress.address = "";
            });
        }
    };
}]);

app.controller("DirectoryCtrl", ["$scope", "$http", "addresses", "revealedAddresses", function ($scope, $http, addresses, revealedAddresses) {
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

            filtered.forEach(function (address) {
                $http.get("/weather?address=" + encodeURIComponent(address.address))
                    .success(function () {
                        console.log(arguments);
                        });
            });
        }
    };
}]);
