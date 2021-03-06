var socket = io.connect("//" + window.location.host),
    app = angular.module("weatherbook", ["ngAnimate"]);

/**
 * Logic to remove address by wbID from address services upon deletion
 */
function removeAddress(wbID) {
    var self = this;

    self.addresses.forEach(function (addr, idx) {
        if (addr.wbID === wbID) {
            self.addresses.splice(idx, 1);
        }
    });
}

/**
 * Required to send JSON data via PATCH
 */
app.config(["$httpProvider", function ($httpProvider) {
    $httpProvider.defaults.headers.patch = {
        'Content-Type': 'application/json;charset=utf-8'
    }
}]);

/**
 * Used to keep update data between editing and other states
 */
app.service("editingAddress", function () {
    this.firstName = "";
    this.lastName = "";
    this.address = "";
    this.wbID = "";
});

/**
 * List of addresses that are displayed to the user
 */
app.service("revealedAddresses", function () {
    this.addresses = [];

    this.removeAddress = removeAddress;
});

/**
 * List of all addresses with functionality to locall filter/update/remove
 */
app.service("addresses", [function () {
    this.addresses = [];

    // Use last name letter comparison
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

/**
 * Main display controller
 */
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
        if (confirm("Are you sure you want to delete this address?")) {
            $http.delete("/weatherbook/" + wbID).success(function () {
                revealedAddresses.removeAddress(wbID);
                addresses.removeAddress(wbID);

                if (!revealedAddresses.addresses.length) {
                    $scope.state = "home";
                }
            });
        }
    };

    // Change to the update state for the provided address.  Same as the adding
    // state, but we include wbID for updates and fill in the form with defaults
    $scope.updateAddress = function (address) {
        $scope.addingState();

        editingAddress.firstName = address.firstName;
        editingAddress.lastName = address.lastName;
        editingAddress.address = address.address;
        editingAddress.wbID = address.wbID;
    };

    // Change to the 'adding' state -- remove revealed addresses and update display
    $scope.addingState = function () {
        $scope.state = "adding";
        $scope.revealedAddresses.addresses = [];
        addresses.lastLetter = "";
    }
}]);

/**
 * Controller that handles adding of addresses
 */
app.controller("AddressAddCtrl", ["$scope", "$http", "$timeout", "addresses", "editingAddress", function ($scope, $http, $timeout, addresses, editingAddress) {
    $scope.editingAddress = editingAddress;

    $scope.addAddress = function () {
        var data = {
            firstName: editingAddress.firstName,
            lastName: editingAddress.lastName,
            address: editingAddress.address,
        };

        // *Validation*
        if (editingAddress.firstName && editingAddress.lastName && editingAddress.address) {
            $scope.failure = false;
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

                    $scope.success = "Address updated successfully";

                    $timeout(function () {
                        $scope.success = "";
                    }, 2000);
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

                    $scope.success = "Address added successfully";

                    $timeout(function () {
                        $scope.success = "";
                    }, 2000);
                });
            }
        }
        else {
            $scope.failure = true;

            $timeout(function () {
                $scope.failure = false;
            }, 2000);
        }
    };
}]);

/**
 * Alphabet list that displays addresses by last name
 */
app.controller("DirectoryCtrl", ["$scope", "$http", "addresses", "revealedAddresses", function ($scope, $http, addresses, revealedAddresses) {
    var x;

    $scope.letters = [];

    /**
     * 65 = A; just build a list of A-Z letters
     */
    for (x = 65; x < 65 + 26; x++) {
        $scope.letters.push(String.fromCharCode(x));
    }

    $scope.addresses = addresses;

    /**
     * Update revealed addresses of the selected letter
     */
    $scope.revealAddresses = function (letter) {
        var filtered = addresses.filterAddresses(letter);
        if (filtered.length) {
            revealedAddresses.addresses = filtered;

            filtered.forEach(function (address) {
                $http.get("/weather?address=" + encodeURIComponent(address.address))
                    .success(function (weather) {
                        if (weather.response.error) {
                            address.weatherUnknown = "Unknown";
                        }
                        else {
                            weather = weather.current_observation;
                            address.weather = weather.weather + ", " + weather.temp_f + "°";
                            address.weatherIcon = weather.icon_url;
                        }
                    });
            });
        }

        // Used to show the 'selected' state of a particular letter
        addresses.lastLetter = letter;
    };
}]);
