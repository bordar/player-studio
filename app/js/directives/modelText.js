'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('modelText', function (menuSvc) {
    return {
        replace: true,
        restrict: 'EA',
        controller: function ($scope, $element, $attrs) {
            $scope.type = 'text';
            $scope.form = menuSvc.menuScope.playerEdit;
            var makeWatch = function (value, retProp) {
                $scope.$watch(function () {
                        if ($scope.form[$attrs['model']]) {
                            var inputCntrl = $scope.form[$attrs['model']];
                            if (typeof inputCntrl.$error[value] != 'undefined');
                            return inputCntrl.$error[value];
                        }
                        return false;
                    },
                    function (newVal) {
                        $scope[retProp] = newVal;
                    }
                );
            };
            if ($scope.require) {
                makeWatch('required', 'reqState');
            }
            if ($attrs['validation'] == 'url' || $attrs['validation'] == 'email') {
                makeWatch($attrs['validation'], 'valState');
                $scope.type = $attrs['validation'];
                if ($attrs['validation'] == 'url') {
                    $scope.placehold = 'http://';
                }
            }
            if ($attrs["initvalue"] && (typeof $scope.model == 'undefined' || $scope.model === '' )) {
                $scope.model = $attrs["initvalue"];
            }
            else if ($attrs['validation']) {
                var pattern = $attrs['validation'];
                var isValid, regex;
                try {
                    regex = new RegExp(pattern, 'i');
                    isValid = true;
                }
                catch (e) {
                    isValid = false;
                }
                if (isValid) {
                    $scope.validation = regex;
                    makeWatch('pattern', 'valState');
                }
            }
            $scope.isDisabled = false;
            $scope.validation = {
                test: function () { // mock the RegExp object
                    return true;
                }, match: function () { // mock the RegExp object
                    return true;
                }
            };
        },
        scope: {
            'label': '@',
            'model': '=',
            'icon': '@',
            'placehold': '@',
            'strModel': '@model',
            'helpnote': '@',
            'require': '@'
        },
        compile: function (tElement, tAttr) {
            if (tAttr['endline'] == 'true') {
                tElement.append('<hr/>');
            }
            return function ($scope, $element, $attrs) {
                var inputElm = $($element).find('input');
                $scope.$on('disableControls', function () {
                    $scope.isDisabled = true;
                    //inputElm.attr('disabled','disabled');
                });
                $scope.$on('enableControls', function () {
                    $scope.isDisabled = false;
//                    inputElm.removeAttr('disabled','disabled');
                });
                if ($attrs.initvalue) {
                    inputElm.on('click', function (e) {
                        if (inputElm.val() == $attrs.initvalue) {
                            e.preventDefault();
                            inputElm.select();
                        }
                    });
                }
            };
        },
        templateUrl: 'template/formcontrols/modelText.html'
    };
});

DirectivesModule.directive('ngPlaceholder', function ($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attr, ctrl) {
            if (attr['ngPlaceholder']) {
                var value;
                var placehold = function () {
                    element.val(attr['ngPlaceholder']);
                    if (attr['require']) {
                        ctrl.$setValidity('required', false);
                    }
                    element.addClass('placeholder');
                };
                var unplacehold = function () {
                    element.val('');
                    element.removeClass('placeholder');
                };
                scope.$watch(function () {
                    return element.val();
                }, function (val) {
                    value = val || '';
                });
                element.bind('focus', function () {
                    if (value === '' || value == attr['ngPlaceholder']) unplacehold();
                });
                element.bind('blur', function () {
                    if (element.val() === '') placehold();
                });
                ctrl.$formatters.unshift(function (val) {
                    if (!val) {
                        placehold();
                        value = '';
                        return attr['ngPlaceholder'];
                    }
                    return val;
                });
            }
        }
    };
});