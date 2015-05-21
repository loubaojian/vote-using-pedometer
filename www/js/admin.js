var app = angular.module('adminApp', ['ngMaterial']);
app.controller('DialogController', function($scope, $mdDialog, $timeout) {
    $timeout(function() {
        $mdDialog.hide();
    });
});

app.controller('AdminController', function($scope, $http, $mdDialog, $timeout) {
    console.log ('ok');

    $scope.HS = "http://192.168.1.5:9900"

    $scope.setPersonSize = function() {
        if ($scope.personTeamSize === undefined) {
            alert ('팀 수를 입력하세요');
            return;
        }
        if ($scope.personPlayerSize === undefined) {
            alert ('플레이어 수를 입력하세요');
            return;
        }

        var populatePromise;
        populatePromise = $http.get($scope.HS + "/person/populate/" + $scope.personTeamSize + "/" + $scope.personPlayerSize);
        populatePromise.success(function(data, status, headers, config) {
            if (data >= 0) {
                alert (data + '명 생성 완료');
            }
            else {
                alert ('데이터베이스가 이미 존재합니다');
            }
        });

    };

    $scope.getQuestionList = function() {
        console.log ('불러오기');
        var questionsPromise;
        questionsPromise = $http.get($scope.HS + "/person/questions");
        questionsPromise.success(function(data, status, headers, config) {
            console.log ('data', data)
            $scope.questionList = data;
        });
    };

    $scope.deleteQuestion = function(question_id) {
        console.log ('question_id', question_id);
        var deleteQuestionPromise;
        deleteQuestionPromise = $http.get($scope.HS + "/person/delete-question/" + question_id);
        deleteQuestionPromise.success(function(data, status, headers, config) {
            console.log ('data', data);
            alert ('삭제 성공');
        });

    };

    $scope.addQuestion = function() {
        if ($scope.questionType === undefined) {
            alert ('질문 타입을 선택하세요');
            return;
        }
        if ($scope.questionValue === undefined) {
            alert ('질문 내용을 입력하세요');
            return;
        }

        data = {
            'type' : $scope.questionType,
            'value' : $scope.questionValue
        };

        var addQuestionPromise;
        addQuestionPromise = $http.post($scope.HS + "/person/add-question", data);
        addQuestionPromise.success(function(data, status, headers, config) {
            console.log ('data', data);
            alert ('추가 성공');
        });

    };

    $scope.setGameSize = function() {
        if ($scope.gameTeamSize === undefined) {
            alert ('팀 수를 입력하세요');
            return;
        }
        if ($scope.gamePlayerSize === undefined) {
            alert ('플레이어 수를 입력하세요');
            return;
        }

        var populatePromise;
        populatePromise = $http.get($scope.HS + "/game/populate/" + $scope.gameTeamSize + "/" + $scope.gamePlayerSize);
        populatePromise.success(function(data, status, headers, config) {
            if (data >= 0) {
                alert (data + '명 생성 완료');
            }
            else {
                alert ('데이터베이스가 이미 존재합니다');
            }
        });

    };



});
