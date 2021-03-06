/**
 * Created by Administrator on 2016/10/11.
 */
(function () {
  'use strict';
  angular
    .module('shopApp')
    .directive('cbShopSidebar', cbShopSidebar)
    .directive('sidebarTooltip', sidebarTooltip)
    .directive('sidebarGroupTooltip', sidebarGroupTooltip)
    .directive('sidebarTooltipPopup', sidebarTooltipPopup);


  /** @ngInject */
  function cbShopSidebar($timeout, $rootScope, viewFrameworkHelper, configuration) {
    var defaultRouter = ["chebian:store:store:shop:view", "chebian:store:system:modpwd:view", "chebian:store:user:customer:grades:view"];
    /**
     * 获取侧栏菜单显示
     * @param data       后台返回权限列表
     * @returns {Array}  返回显示的菜单
     */
    function getNavConfig(data) {
      var results = angular.copy(data.items);
      /**
       * 过滤不显示的菜单项
       */
      _.remove(results, function (item) {
        return item.display == "0";
      });
      angular.forEach(results, function (item) {
        item.preference = [];
        item.customize = false;
        item.customizeTitle = "自定义" + item.menuname;
        item.folded = false;
        item.show = true;
        item.icon = "icon-sidebar-" + item.category;
        item.showManageButton = true;
        item.items = setItems(item.items, item.id);
      });
      function setItems(items) {
        /**
         * 过滤不显示的菜单项
         */
        _.remove(items, function (item) {
          return item.display == "0";
        });
        angular.forEach(items, function (item) {
          item.openStatus = true;
          if (item.href.indexOf("/") !== 0) {
            throw Error('API接口地址有误，请以/开头');
          } else {
            var router = item.href.substring(1).replace("/", ".");
          }
          var uisref = "";
          if (_.findIndex(defaultRouter, function(key){return key === item.permission}) > -1) {   // 修改密码
            uisref = router;
          } else {
            uisref = router + ".list({page:1})";
          }
          item.uisref = uisref;
          item.router = router;
        });
        return items;
      }

      return results;
    }

    return {
      restrict: "A",
      replace: true,
      scope: true,
      templateUrl: "app/components/sideBar/sideBar.html",
      link: function (scope, iElement, iAttrs) {
        var timer = null;
        getPermissions();
        var permissionsChanged = $rootScope.$on('permissionsChanged', function () {
          getPermissions();
        });

        // 获取权限控制
        function getPermissions() {
          timer = $timeout(function () {
            scope.loadingState = true;
            scope.navConfig = getNavConfig(configuration.getMenu());
          }, 0);
        }

        scope.loadingState = true;
        scope.isSidebarFold = viewFrameworkHelper.isSidebarFold();
        /**
         * 收起展开二级菜单
         * @param index  索引
         * @param item   状态
         */
        scope.toggleFoldStatus = function (index, status) {
          /**
           * 如果侧边栏mini状态就不要切换状态了
           */
          if(scope.isSidebarFold){
           return ;
          }
          scope.navConfig[index].folded = !status;
        };
        /**
         * 更新视图框架配置侧边栏
         */
        scope.toggleSidebarStatus = function () {
          scope.isSidebarFold = !scope.isSidebarFold;
          var status = scope.isSidebarFold ? "mini" : "full";
          setItems(status);
          scope.$emit("updateViewFrameworkConfigSidebar", status)
        };

        /**
         * 设置子菜单
         */
        function setItems(status) {
          angular.forEach(scope.navConfig, function (item) {
            item.folded = status === "mini";
          });
        }


        /**
         * 更新自定义菜单
         */
        scope.$on("updatePreference", function (event, data) {
          if (!data || !data.type || !data.preference) {
            return;
          }
          angular.forEach(scope.navConfig, function (value) {
            if (value.category.category === data.type) {
              value.preference = data.preference;
            }
          });
        });
        /**
         * 监听navConfig
         */
        var navConfig = scope.$watch("navConfig", function (newValue, oldValue, scope) {
          if (newValue) {
            scope.navConfig = newValue;
          }
        });
        /**
         * 设置type
         */
        iAttrs.$observe("type", function (value) {
          if (value) {
            scope.type = value;
            setItems(value);
            scope.isSidebarFold = value === "mini";
          }
        });

        iAttrs.$observe("productId", function (value) {
          if (value) {
            scope.productId = value;
          }
        });
        // 确保工具提示被销毁和删除。
        scope.$on('$destroy', function () {
          permissionsChanged();
          navConfig();
          $timeout.cancel(timer);
        });
      }
    }
  }

  /** @ngInject */
  function sidebarTooltip($tooltip) {
    return $tooltip("sidebarTooltip", "tooltip", "mouseenter");
  }

  /** @ngInject */
  function sidebarGroupTooltip($compile, $timeout, $document, $state) {
    var template = [
      '<div class="cb-sidebar-group-tooltip">',
      '<h3 class="title" ng-bind="group.menuname" ng-if="group.category != \'desktop\'"></h3>',
      '<a class="title" ng-bind="group.menuname" ng-if="group.category == \'desktop\'" ui-sref="{{group.category}}"></a>',
      '<ul class="sidebar-trans" ng-if="group.category != \'desktop\'">',
      '<li ng-repeat="item in group.items track by $index" class="nav-item" ng-class="{\'active\': isActive(item)}">',
      '<a ui-sref="{{item.uisref}}" class="sidebar-trans">',
      '<span class="nav-title">{{item.menuname}}</span>',
      '</a>',
      '</li>',
      '</ul>',
      '</div>'
    ].join('');
    return {
      restrict: "A",
      replace: true,
      scope: {
        group: "=",
        states: "="
      },
      link: function (scope, iElement) {
        var isSidebarFold = angular.copy(scope.states);
        var tooltipLinker = $compile(template);
        /**
         * 如果不是迷你侧栏菜单
         */
        var states = scope.$watch('states', function (value) {
          isSidebarFold = value;
        });
        scope.isActive = function(item){
          return $state.includes(item.router);
        };
        var group;
        var tooltipTimeout = null;
        iElement.on('mouseenter', function () {
          if (isSidebarFold) {
            show();
          }
        });
        iElement.on('mouseleave', function () {
          hideTooltipBind();
        });
        /**
         * 显示
         */
        function show() {
          createTooltip();
          var position = iElement.offset(),
            left = position.left,
            top = position.top,
            width = iElement.width();
          group.css({top: top, left: left + width, display: 'block'});
          hoverHandle();
        }
        /**
         * 隐藏
         */
        function hide() {
          removeTooltip();
        }
        // 创建提示
        function createTooltip() {
          // 每个指令只能同时显示一个工具提示元素。
          if (group) {
            removeTooltip();
          }
          group = tooltipLinker(scope, function (tooltip) {
            $document.find('body').append(tooltip);
          });
          scope.$digest();
        }

        function hideTooltipBind() {
          scope.$apply(function () {
            tooltipTimeout = $timeout(hide, 100);
          });
        }

        // 绑定鼠标hover到提示上处理
        function hoverHandle() {
          iElement.addClass('sidebar-title-hover');
          group && (group.on("mouseenter", mouseenterHandle), group.on("mouseleave", mouseleaveHandle));
        }

        function mouseenterHandle() {
          $timeout.cancel(tooltipTimeout);
        }

        function mouseleaveHandle() {
          tooltipTimeout = $timeout(hideTooltipBind, 100);
        }

        // 删除提示
        function removeTooltip() {
          $timeout.cancel(tooltipTimeout);
          if (group) {
            group.remove();
            group = null;
          }
          iElement.removeClass('sidebar-title-hover');
        }

        // 确保工具提示被销毁和删除。
        scope.$on('$destroy', function () {
          states();
          $timeout.cancel(tooltipTimeout);
          removeTooltip();
        });
      }
    };
  }

  /** @ngInject */
  function sidebarTooltipPopup() {
    return {
      restrict: "A",
      replace: true,
      scope: {
        content: "@",
        placement: "@",
        animation: "&",
        isOpen: "&"
      },
      templateUrl: "app/components/sideBar/sidebarTooltipPopup.html"
    }
  }
})();
