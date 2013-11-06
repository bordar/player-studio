'use strict';
/* Menu */
var KMCMenu = angular.module('KMC.menu', []);
KMCMenu.factory('menuSvc', ['editableProperties', '$rootScope', '$compile', function (editableProperties, $rootScope, $compile) {
        var menudata = null;
        var promise = editableProperties
            .success(function (data) {
                menudata = data;
            });
        var menuSVC = {
            promise: promise,
            menuScope: {},
            get: function () {
                return menudata;
            },
            setMenu: function (setTo) {
                menuSVC.menuScope.$broadcast('menuChange', setTo);
            },
            buildMenuItem: function (item, targetMenu, BaseData,parentMenu) {
                var originAppendPos = angular.element(targetMenu).find('ul[ng-transclude]:first');
                if (originAppendPos.length < 1)
                    originAppendPos = targetMenu;
                switch (item.type) {
                    case  'menu':
                        var originModel = angular.element(targetMenu).attr('model') ? angular.element(targetMenu).attr('model') : BaseData;
                        var parentLabel =(parentMenu) ? parentMenu.label : 'Top';
                        var parent = writeFormElement(item, '<menu-level pagename="' + item.model + '" parent-menu="'+parentLabel+'"/>', originAppendPos, originModel);
                        var modelStr = originModel + '.' + item.model;
                        for (var j = 0; j < item.children.length; j++) {
                            var subitem = item.children[j];
                            switch (subitem.type) {
                                case 'checkbox' :
                                    writeFormElement(subitem, '<model-checbox/>', parent, modelStr);
                                    break;
                                case 'select' :
                                    writeFormElement(subitem, '<model-select/>', parent, modelStr);
                                    break;
                                case 'color' :
                                    writeFormElement(subitem, '<model-color/>', parent, modelStr);
                                    break;
                                case 'number':
                                    writeFormElement(subitem, '<model-number/>', parent, modelStr);
                                    break;
                                case 'text':
                                    writeFormElement(subitem, '<model-text/>', parent, modelStr);
                                    break;
                                case 'menu':
                                    menuSVC.buildMenuItem(subitem, parent, BaseData,item);
                                    break;
                            }
                        }
                        break;
                    case 'select' :
                        writeFormElement(item, '<model-select/>', originAppendPos);
                        break;
                    case 'checkbox' :
                        writeFormElement(item, '<model-checbox/>', originAppendPos);
                        break;
                    case 'color' :
                        writeFormElement(item, '<model-color/>', originAppendPos);
                        break;
                    case 'text' :
                        writeFormElement(item, '<model-text/>', originAppendPos);
                        break;
                    case 'number':
                        writeFormElement(item, '<model-number/>', originAppendPos);
                        break;
                }
                function writeFormElement(item, directive, appendTo, parentModel) {
                    var elm = angular.element(directive);
                    angular.forEach(item, function (value, key) {
                        if (key != 'model' && (typeof value == 'string' || typeof value == 'number')) {
                            elm.attr(key, value);
                        } else {
                            if (key == 'options' && typeof value == 'object')
                                if (Array.isArray(value))
                                    elm.attr(key, JSON.stringify(value));
                        }
                    });
                    if (typeof parentModel != "undefined") {
                        var subModelStr = parentModel + '.' + item.model;
                        elm.attr('model', subModelStr);
                    }
                    else {
                        elm.attr('model', BaseData + '.' + item.model);
                    }
                    if (item.type != 'menu')
                        elm = $('<li/>').html(elm);
                    return (elm).appendTo(appendTo);
                }
            }
        };
        return menuSVC;
    }]).directive('navmenu', ["$compile", '$parse', 'menuSvc' , function ($compile, $parse, menuSvc) {
        return  {
            template: "<nav id='mp-menu'>" +
                "<div id='mp-inner'>" +
                "<div id='mp-base' class='mp-level'>" +
                "<ul ng-transclude=''></ul>" +
                "</div>" +
                "</div>" +
                "</nav>",
            replace: true,
            restrict: 'E',
            scope: {data: '='},
            transclude: true,
            compile: function (tElement) {
                var BaseData = 'data';
                var menuObj = menuSvc.get(); // gets the  editableProperties json
                var menuList = tElement.find('ul[ng-transclude]:first');
                angular.forEach(menuObj, function (value) {
                    menuSvc.buildMenuItem(value, menuList, BaseData);
                });
                return function ($scope, $element) {
                    //open first level
                    $element.find('#mp-base >ul > li > div.mp-level').addClass('mp-level-open');
                }
            },
            controller: function ($scope, $element, $attrs) {
                $scope.currentPage = 'Root Level';
                menuSvc.menuScope = $scope;

            }

        }
    }]).
    directive('menuLevel', ['menuSvc', function (menuSvc) {
        return  {
            template: "<li>" +
                "<a class='menu-level-trigger' data-ng-click='openLevel()'>{{label}}</a>" +
                "<div class='mp-level'>" +
                "<a class='mp-back' ng-click='goBack()' ng-show='isOnTop'>Back to {{parentMenu}}</a>" +
                "<h2>{{label}}</h2>" +
                "<span class='levelDesc'>{{description}}</span>" +
                "<ul ng-transclude=''></ul>" +
                "</div>" +
                "</li>",
            replace: true,
            restrict: 'E',
            link: function ($scope, $element, $attrs) {
                $scope.currentPage = $attrs['label'];
                $scope.goBack = function () {
                    $scope.isOnTop = false;
                }
                $scope.label = $attrs.label;
                $scope.openLevel = function (arg) {
                    if (typeof arg == 'undefined')
                        $scope.isOnTop = true;

                    else {
                        if (arg == $scope.pagename) {
                            $scope.isOnTop = true;
                        }
                        else {
                            $scope.isOnTop = false;
                        }
                    }
                }
                $scope.isOnTop = false;
                $scope.$on('menuChange', function (event, arg) {
                    $scope.openLevel(arg);
                });
                $scope.$watch('isOnTop', function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        if (newVal) { // open
                            $element.parents('.mp-level:first').addClass('mp-level-in-stack');
                            $element.children('.mp-level').addClass('mp-level-open');
                        }
                        else { //close
                            $element.find('.mp-level').removeClass('mp-level-open');
                            $element.parents('.mp-level').removeClass('mp-level-in-stack');
                        }
                    }
                });
            },
            scope: {
                'label': '@',
                'pagename': '@',
                'parentMenu' :'@',
                'description': '@'
            },
            transclude: 'true'
        };
    }]).directive('menuHead', ['menuSvc', '$compile', function (menuSvc, $compile) {
        return {
            restrict: 'E',
            template: "<div id='mp-mainlevel'><ul></ul></div>",
            replace: true,
            link: function (scope, iElement, iAttrs) {
                var ul = iElement.find('ul');
                var elements = menuSvc.get();
                angular.forEach(elements, function (value, key) {
                    var elm = angular.element('<li></li>');
                    elm.html('<a class="icon icon-' + value.icon + '" tooltip-placement="right" tooltip="' + value.label + '"></a>');
                    elm.on('click', function () {
                        menuSvc.setMenu(value.model);
                    });
                    $compile(elm)(scope).appendTo(ul);

                })
            }
        }
    }]);