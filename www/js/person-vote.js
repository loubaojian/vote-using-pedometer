var app = angular.module('personVoteApp', ['ngMaterial']);

app.controller('DialogController', function($scope, $mdDialog, $timeout) {
    $timeout(function() {
        $mdDialog.hide();
    });
});

app.controller('FormController', function($scope, $http, $mdDialog, $timeout) {
    $scope.HS = "http://192.168.1.5:9900"
    console.log('ok');
    // var defaultChoice = '선택하세요';
    $scope.teamIds = [];
    $scope.playerIds = [];
    $scope.choiceIds = [];
    $scope.memberTypes = [];
    $scope.questions = [];
    $scope.choices = [];
    $scope.scores = [];
    $scope.texts = [];
    $scope.teamId;
    $scope.playerId;
    $scope.playerIdForType;
    questionList = [[], [], []];

    $scope.typeMember = function(typeIndex, playerId) {
      console.log ('typeIndex ' + typeIndex + '   playerIdForType ' + playerId);
      if (playerId === undefined) {
        alert ('플레이어를 먼저 선택해주세요.');
        return;
      }
      $scope.memberTypes[playerId-1] = typeIndex;
      console.log ('memberTypes', $scope.memberTypes);
    };

    $scope.applyChange = function() {
        $mdDialog.show({
            templateUrl: 'vote-choice.html'
        })
    };

    // var teamsPromise;
    // teamsPromise = $http.get("/person/teams");
    // teamsPromise.success(function(data, status, headers, config) {
    //     var i, len;
    //     for (i = 1, len = data; i <= len; i++) {
    //         $scope.teamIds.push(i);
    //     }
    //     console.log ('teams', $scope.teamIds);
    // });
    //
    // var playersPromise;
    // playersPromise = $http.get("/person/players");
    // playersPromise.success(function(data, status, headers, config) {
    //     var i, len;
    //     for (i = 1, len = data; i <= len; i++) {
    //         $scope.playerIds.push(i);
    //         console.log('i', i);
    //         $scope.choiceIds.push({name: i.toString(), value: i});
    //     }
    //     console.log ('players', $scope.playerIds);
    //     console.log ('choices', $scope.choiceIds);
    // });

    var sizePromise;
    sizePromise = $http.get($scope.HS + "/person/get-size");
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
            $scope.choiceIds.push({name: j.toString(), value: j});
            $scope.memberTypes.push(-1);
        }
        // console.log ('players', $scope.playerIds);
        console.log ('choiceIds', $scope.choiceIds);
    });

    var questionsPromise;
    questionsPromise = $http.get($scope.HS + "/person/questions");
    questionsPromise.success(function(data, status, headers, config) {
        var i, len;
        // console.log ('data', data)
        $scope.questions = data;
        console.log ('questionList ', questionList);
        for (i = 0, len = data.length; i < len; i++) {
            if (data[i].type === "choice") {
                // console.log('choice');
                $scope.choices.push('0');
                questionList[0].push(data[i].value);
            }
            else if (data[i].type === "score") {
                $scope.scores.push('');
                questionList[1].push(data[i].value);
            }
            else if (data[i].type === "text") {
                $scope.texts.push('');
                questionList[2].push(data[i].value);
            }
        }
        console.log ('questions', $scope.questions);
        console.log ('choices', $scope.choices);
    });


    $scope.vote = function() {
        if ($scope.teamId === undefined) {
            alert ('Team ID를 입력하세요');
            return;
        }
        else if ($scope.playerId === undefined) {
            alert ('Player ID를 입력하세요');
            return;
        }

        var i, len;

        for (i in $scope.choices) {
            var choice = $scope.choices[i];
            if (choice === '0') {
                alert('"' + questionList[0][i] + '"을/를 선택하세요');
                return;
            }
        }

        console.log ('scope.scores', $scope.scores);
        for (i in $scope.scores) {
            var score = $scope.scores[i];
            var question = questionList[1][i];
            if (score === '') {
                alert('"' + question + '"을/를 입력하세요');
                return;
            }
            var scopeInt = parseInt(score);
            if (score < 0 || score > 100) {
                alert('"' + question + '"의 유효한 숫자를 입력하세요');
                return;
            }
        }

        for (i in $scope.texts) {
            var text = $scope.texts[i];
            if (text === '') {
                alert('"' + questionList[2][i] + '"을/를 입력하세요');
                return;
            }
        }

        console.log ('mTypes', $scope.memberTypes);
        for (i in $scope.memberTypes) {
          console.log ('i', i);
          if ($scope.memberTypes[i] === -1) {
            alert ( ++i + '번 팀원의 타입을 선택하세요');
            return;
          }
        }

        for (i = 0, len = $scope.scores.length; i < len; i++) {
            $scope.scores[i] = parseInt($scope.scores[i]);
        }

        data = {
          'teamId' : parseInt($scope.teamId),
          'playerId' : parseInt($scope.playerId),
          'choices' : $scope.choices,
          'scores' : $scope.scores,
          'texts' : $scope.texts,
          'memberTypes' : $scope.memberTypes
        };
        console.log ('post전 data', data);

        var votesPromise;
        votesPromise = $http.post($scope.HS + "/person/votes", data);
        votesPromise.success(function(data, status, header, config) {
            console.log ('post후 data', data);
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


app.controller('ResultController', function($scope, $http) {
    $scope.HS = "http://192.168.1.5"
    console.log ('ok');
    $scope.teamIds = [];
    $scope.playerIds = [];
    $scope.questions = [];
    var choicesNum = 0;
    var scoresNum = 0;
    var playersNum = 0;
    $scope.scoresAvg = [];
    $scope.choicesSum = [];
    $scope.maxChoice = [];
    $scope.thumbNail = [];
    $scope.typeByMe = [0, 0, 0, 0];
    $scope.typeByOthers = [];
    $scope.playersName = [];

    // $scope.typeByMe.push({'name': '골목대장', 'count': 0}, {'name': '윤활유', 'count': 0}, {'name': '고양이', 'count': 0}, {'name': '장미', 'count': 0});
    // $scope.typeByOthers.push({'name': '골목대장', 'count': []}, {'name': '윤활유', 'count': 0}, {'name': '고양이', 'count': 0}, {'name': '장미', 'count': 0});

    var sizePromise;
    sizePromise = $http.get($scope.HS + "/person/get-size");
    sizePromise.success(function(data, status, headers, config) {
        // console.log ('data', data);
        var i, j, len_i, len_j;
        for (i = 1, len_i = data.team_size; i <= len_i; i++) {
            $scope.teamIds.push(i);
        }
        playersNum = data.player_size;
        for (j = 1, len_j = data.player_size; j <= len_j; j++) {
            $scope.playerIds.push(j);
        }
    });

    var questionsPromise;
    questionsPromise = $http.get($scope.HS + "/person/questions");
    questionsPromise.success(function(data, status, headers, config) {
        var i, j, k, len;
        console.log ('data', data);
        $scope.questions = data;
        for (i = 0, len = data.length; i < len; i++) {
            if (data[i].type === "choice")
                choicesNum++;
            else if (data[i].type === "score")
                scoresNum++;
        }
        for (i = 0; i < choicesNum; i++) {
            $scope.choicesSum.push([]);
            $scope.maxChoice.push([]);
            for (j = 0; j < playersNum; j++) {
                $scope.choicesSum[i].push(0);
                $scope.maxChoice[i].push(0);
            }
            $scope.maxChoice[i].push(0);
        }
        for (k = 0; k < scoresNum; k++) {
            $scope.scoresAvg.push(0);
        }
        console.log ('questions', $scope.questions);
    });

    $scope.show = function() {
        $scope.players = [];
        teamId = $scope.teamId;
        $scope.thumbNail = [];
        $scope.typeByMe = [0, 0, 0, 0];
        $scope.typeByOthers = [];
        $scope.typeByOthersOne = undefined;
        $scope.playerIdForTypeResult = undefined;
        $scope.prominentTypeByMe = 0;
        $scope.prominentTypesByOthers = [];
        $scope.playersName = [];

        for (var k = 0; k < scoresNum; k++) {
            $scope.scoresAvg[k] = 0;
        }

        var voteResultPromise;
        voteResultPromise = $http.get($scope.HS + "/person/results/" + teamId);
        voteResultPromise.success(function(data, status, headers, config) {
            console.log ('data', data);
            voteList = data.vote_list;
            playerList = data.player_list;

            for (var i = 0; i < choicesNum; i++) {
                $scope.maxChoice[i][0] = 0;
                $scope.thumbNail.push([]);
                for (var j = 0; j < playersNum; j++) {
                    $scope.choicesSum[i][j] = 0;
                    $scope.maxChoice[i][j+1] = 0;
                }
            }
            for (var i = 0; i < playersNum; i++) {
              $scope.typeByOthers.push([0, 0, 0, 0]);
              $scope.prominentTypesByOthers.push(0);
              for (var j = 0; j < playerList.length; j++) {
                if (parseInt(playerList[j].username.split('-')[1]) === i+1) {
                  $scope.playersName[i] = playerList[j].player_name;
                }
              }
            }
            console.log ('p name', $scope.playersName);
            for (var k = 0; k < scoresNum; k++) {
                $scope.scoresAvg[k] = 0;
            }
            for (i in voteList) {
                var vote = voteList[i];
                $scope.players.push({username: vote.username, keyword: vote.texts});
            }
            for (var i = 0, len1 = voteList.length; i < len1; i++) {
                for (var j = 0; j < choicesNum; j++) {
                    $scope.choicesSum[j][voteList[i].choices[j]-1]++;
                }
            }

            for (var q = 0; q < choicesNum; q++) {
                var max;
                max = $scope.maxChoice[q][0] = Math.max.apply(null, $scope.choicesSum[q]);
                console.log ('maxchoice', q, ' => ', $scope.maxChoice[q][0]);
                for (var m = 0, len = playersNum; m < len; m++) {
                    if ( $scope.choicesSum[q][m] === max ) {
                        $scope.maxChoice[q][m+1] = 1;
                        $scope.thumbNail[q].push(m+1);
                    }
                }
            }

            for (var k = 0; k < scoresNum; k++) {
                for (var l = 0, len2 = voteList.length; l < len2; l++) {
                    $scope.scoresAvg[k] += voteList[l].scores[k];
                }
                $scope.scoresAvg[k] = Math.round($scope.scoresAvg[k] / len2);
            }

            for (var i = 0; i < voteList.length; i++) {
              for (var j = 0; j < $scope.playerIds.length; j++) {
                if (parseInt(voteList[i].username.split('-')[1]) === j+1) {
                  $scope.typeByMe[voteList[i].types[j]]++;
                }
                else {
                  $scope.typeByOthers[j][voteList[i].types[j]]++;
                }
              }
            }

            for (var i = 0; i < 4; i++) {
              $scope.prominentTypeByMe = $scope.typeByMe[i] > $scope.prominentTypeByMe ? $scope.typeByMe[i] : $scope.prominentTypeByMe;
            }

            for (var i = 0; i < playersNum; i++) {
              var max = 0;
              for (var j = 0; j < 4; j++) {
                max = $scope.typeByOthers[i][j] > max ? $scope.typeByOthers[i][j] : max;
              }
              $scope.prominentTypesByOthers[i] = max;
            }
            console.log ('typeByOthers', $scope.typeByOthers);
            console.log ('prominentTypeByMe', $scope.prominentTypeByMe);
            console.log ('prominentTypesByOthers', $scope.prominentTypesByOthers);
        });
    };

    $scope.showType = function() {
      if ($scope.teamId === undefined) {
        alert ('팀을 선택해주세요.');
        return;
      }

      console.log ('playerIdForTypeResult', $scope.playerIdForTypeResult);
      $scope.typeByOthersOne = typeByOthers[$scope.playerIdForTypeResult-1];
      console.log ('typeByOthers', typeByOthers);
      console.log ('$scope.typeByOthersOne', $scope.typeByOthersOne);

    };
});
