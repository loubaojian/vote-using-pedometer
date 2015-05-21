var chartApp = angular.module("chartApp", ['angularCharts', 'ngMaterial']);

chartApp.controller("MainCtrl", function($scope, $http) {
    $scope.HS = "http://192.168.1.5:9900"
    $scope.session = 'begin';
    $scope.config = {
        labels: false,
        title: 'Vote',
        legend: {
            display: true,
            position: 'left'
        }
    };
    $scope.chartType = 'bar';
    var teamSize;
    var chartData = [];
    // var i = 0;

    var sizePromise;
    sizePromise = $http.get($scope.HS + "/game/get-size");
    sizePromise.success(function(data, status, headers, config) {
        console.log ('data', data);
        teamSize = data.team_size;
        console.log ('teamSize', teamSize);
        for (var i = 1; i <= teamSize; i++) {
            chartData.push({x: i.toString(), y:[0, 0]});
        }
    });

    $scope.data = {
        series: ['Begin', 'End'],
        data: chartData
    };
    $scope.show = function() {

        var promise = $http.get($scope.HS + "/game/votes");
        promise.success(function(data, status, headers, config) {

            console.log('결과', data);
            $scope.wishGame = [];
            for (var i = 0; i < teamSize; i++) {
                $scope.wishGame.push([0, 0]);
            }

            for (var index in data) {
                vote = data[index];
                if (vote.answers) {
                    console.log(vote);
                    var answers = vote.answers;
                    for (var answerIndex in answers) {
                        var answer = answers[answerIndex];
                        var session = answer.type === 'begin' ? 0 : 1;
                        if ($scope.session === 'both') {
                            $scope.wishGame[answer.wish_game - 1][session]++;
                        } else {
                            if ($scope.session === answer.type) {
                                $scope.wishGame[answer.wish_game - 1][session]++;
                            }
                        }
                    }
                }
            }
            console.log('w', $scope.wishGame);
            for (i in chartData) {
                var chartItem = chartData[i];
                var wishItem = $scope.wishGame[i];
                chartItem.y = wishItem;
            }
            console.log('c', chartData);
            $scope.data.data = chartData;
            console.log('s', $scope.data);
                    // chartData = [
                    // {
                    //     x: '1',
                    //     y: [$scope.wishGame[0][0], $scope.wishGame[0][1]]
                    // }, {
                    //     x: '2',
                    //     y: [$scope.wishGame[1][0], $scope.wishGame[1][1]]
                    // }, {
                    //     x: '3',
                    //     y: [$scope.wishGame[2][0], $scope.wishGame[2][1]]
                    // }, {
                    //     x: '4',
                    //     y: [$scope.wishGame[3][0], $scope.wishGame[3][1]]
                    // }, {
                    //     x: '5',
                    //     y: [$scope.wishGame[4][0], $scope.wishGame[4][1]]
                    // }, {
                    //     x: '6',
                    //     y: [$scope.wishGame[5][0], $scope.wishGame[5][1]]
                    // }, {
                    //     x: '7',
                    //     y: [$scope.wishGame[6][0], $scope.wishGame[6][1]]
                    // }, {
                    //     x: '8',
                    //     y: [$scope.wishGame[7][0], $scope.wishGame[7][1]]
                    // }
                    // ];
                // $scope.data = {
                //     series: ['Begin', 'End'],
                //     data: chartData
                // };
        });
    };
});
