var app = angular.module('gameVoteApp', ['ngMaterial']);
app.controller('GameFormController', function($scope, $http, $mdDialog) {
    $scope.HS = "http://192.168.1.5:9900"

    var defaultChoice = '선택하세요';
    $scope.teamIds = [defaultChoice];
    $scope.playerIds = [defaultChoice];
    $scope.questions = [];
    $scope.answers = [];
    $scope.scores = [];
    $scope.teamId = defaultChoice;
    $scope.playerId = defaultChoice;
    $scope.wishGame = defaultChoice;

    $scope.applyChange = function() {
        $mdDialog.show({
            templateUrl: 'vote-choice.html'
        })
    };

    var questionsPromise;
    questionsPromise = $http.get($scope.HS + "/game/questions");
    questionsPromise.success(function(data, status, headers, config) {
        $scope.questions = data;
        console.log ('questions', $scope.questions);
        // for (var i = 0, var len = data.length; i < len; i++) {
        //     $scope.wishGame.push('0');
        // }
    });

    // var teamsPromise;
    // teamsPromise = $http.get("/game/teams");
    // teamsPromise.success(function(data, status, headers, config) {
    //     var i, len;
    //     for (i = 1, len = data; i <= len; i++) {
    //         $scope.teamIds.push(i);
    //     }
    //     console.log ('teams', $scope.teamIds);
    // });
    //
    // var playersPromise;
    // playersPromise = $http.get("/game/players");
    // playersPromise.success(function(data, status, headers, config) {
    //     var i, len;
    //     for (i = 1, len = data; i <= len; i++) {
    //         $scope.playerIds.push(i);
    //     }
    //     console.log ('players', $scope.playerIds);
    //
    // });

    var sizePromise;
    sizePromise = $http.get($scope.HS + "/game/get-size");
    sizePromise.success(function(data, status, headers, config) {
        // console.log ('data', data);
        var i, j, len_i, len_j;
        for (i = 1, len_i = data.team_size; i <= len_i; i++) {
            $scope.teamIds.push(i);
        }
        // console.log ('teams', $scope.teamIds);
        for (j = 1, len_j = data.player_size; j <= len_j; j++) {
            $scope.playerIds.push(j);
            // console.log('j', j);
        }
        // console.log ('players', $scope.playerIds);
        // console.log ('choices', $scope.choiceIds);
    });

    $scope.vote = function() {
        console.log ('wishGame', $scope.wishGame);
        if ($scope.teamId === defaultChoice) {
            alert ('Team ID를 입력하세요');
            return;
        }
        else if ($scope.playerId === defaultChoice) {
            alert ('Player ID를 입력하세요');
            return;
        }
        else if (!$scope.selectTime) {
            alert ('시작 또는 종료를 선택하세요');
            return;
        }
        else if ($scope.wishGame === defaultChoice) {
            alert ('게임을 선택하세요');
            return;
        }

        data = {
            'teamId': parseInt($scope.teamId),
            'playerId': parseInt($scope.playerId),
            'type': $scope.selectTime,
            'wishGame': parseInt($scope.wishGame)
        }
        console.log ('data', data)


        var votesPromise;
        votesPromise = $http.put($scope.HS + "/game/votes", data);
        votesPromise.success(function(data, status, header, config) {
            console.log ('data', data);
            if (data === '"Fail"')
                alert('이미 투표했습니다');
            else {
                $mdDialog.show({
                    templateUrl: 'vote-confirm.html'
                });
            }
        });
    };
});
