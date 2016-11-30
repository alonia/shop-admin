/**
 * Created by Administrator on 2016/11/10.
 */
/**
 * simpleSelect是一个通用的下拉组件
 *
 * config  全局配置参数     必填
 * selectPreHandler  事件回调 返回选择信息 必填
 *
 * config    全局配置参数
 *    multiple            是否开启多项选择
 *    searchPrefer        是否开启列表搜索
 *    searchParams        绑定的搜索字段
 *    searchPreHandler    搜索绑定事件供服务端搜索使用
 *    placeholder         提示信息
 *    selectDirective                                   必填
 *       cssProperty       当前列表项的class
 *       name              显示的字段
 *       value             提交给后台的字段
 *
 */

(function () {
  'use strict';
  angular
    .module('shopApp')
    .directive('simpleSelect', simpleSelect);

  /** @ngInject */
  function simpleSelect($document, $filter) {
    return {
      restrict: "A",
      scope: {
        store: "=",
        select: "=",
        selectHandler: "&",
        searchHandler: "&"
      },
      templateUrl: "app/components/simpleSelect/simpleSelect.html",
      link: function(scope, iElement, iAttrs){
        /**
         * 设置配置参数
         * @type config
         *  multiple: boolean,    是否多选
         *  once: boolean,        是否只点击一此
         *  value: string,        指定返回的值的字段
         *  name: string          指定显示列表的字段
         *
         */
        scope.config = {
          search: angular.isDefined(iAttrs.search),
          multiple: angular.isDefined(iAttrs.multiple),
          once: angular.isDefined(iAttrs.once),
          value: getOptions()[0],
          name: getOptions()[1],
          iamge: getOptions()[2]
        };
        /**
         * 获取字段参数  格式 options="value,name,image"
         * @returns {*}
         */
        function getOptions(){
          if(!/^[a-z0-9]+\,([a-z0-9]+$)|([a-z0-9]+\,[a-z0-9]+$)/.test(iAttrs.simpleSelect)){
            return ["id", "name", "image"];
          }
          return iAttrs.simpleSelect.split(",");
        }

        var value = scope.config.value;
        var name = scope.config.name;
        var image = scope.config.image;
        /**
         * 值相关操作
         * @type {{once: boolean, image: string, text: string, toggle: toggle}}
         */
        scope.choose = {
          once: false,
          image: "",
          text: "-- 请点击选择 --",
          toggle: function ($event) {
            $event.stopPropagation();
            if(this.once){   // 如果是只能点击一次关闭了，就不能再点击了
              return ;
            }
            if(!this.focus){   // 打开下拉选项
              if(scope.config.multiple){
                scope.choose.text = "-- 连续点击可以选择多项 --";
              }
            }else{    // 关闭下拉选项

            }
            this.focus = !this.focus;
          },
          hide: function () {
            this.focus = false;
            scope.search.params = "";
            if(scope.config.multiple){
              this.text = "-- 请点击选择 --";
            }
          }
        };
        /**
         * 筛选操作
         * @type {{}}
         */
        var search = {};
        search[name] = undefined;
        scope.search = {
          prefer: scope.config.search,
          params: undefined,
          handler: function (data) {
            search[name] = data || undefined;
            scope.items = $filter('filter')(scope.store, search);
            scope.searchHandler({data: data});
          }
        };
        /**
         * 监听数据变化
         * @type {(()=>void)|*|(())}
         */
        var store = scope.$watch('store', function (value) {
          scope.items = value || [];
          scope.choose.once = scope.items.length === 1 && angular.isDefined(iAttrs.once) && scope.select;
          if(scope.items.length){
            if(scope.config.search){
              scope.search.prefer = value.length > 6;
            }
            if(!scope.select){
              scope.choose.text = "-- 请点击选择 --";
            }else{
              if(scope.config.multiple){
                scope.choose.text = "-- 请点击选择 --";
              }else{
                scope.choose.text = getValue(scope.items, scope.select).text;
                scope.choose.image = getValue(scope.items, scope.select).image;
              }
            }
          }
        });

        function getValue(items, select){
          if(!select){
            return "-- 请点击选择 --";
          }
          var item = _.remove(angular.copy(items), function(item){
            return item[scope.config.value] == select;
          });
          return {
            text: item.length && item[0][name] ? item[0][name] : "-- 请点击选择 --",
            image: item.length && item[0][image] ? item[0][image] : ""
          };
        }
        scope.setClass = function (item) {
          if(!item){
            return ;
          }
          if(scope.config.multiple){
            return  _.findIndex(scope.select, function (key) {
                return key == item[value];
              }) > -1;
          }else{
            return item[value] == scope.select;
          }
        };
        scope.options = function ($event, item) {
          $event.stopPropagation();
          if(scope.config.multiple){   // 多选
            var index = _.findIndex(scope.select, function (key) {
              return key == item[value];
            });
            if(index < 0){
              scope.select.push(item[value]);
            }else{
              scope.select.splice(index, 1);
            }
          }else{   //单选
            scope.select = item[value];
            scope.choose.text = item[name];
            scope.choose.image = item[image];
            scope.choose.once = scope.config.once;
            scope.choose.hide();
          }
          scope.selectHandler({
            data: scope.select
          });
        };
        $document.on('click', function () {
          scope.$apply(function(){
            scope.choose.hide();
          });
        });
        /**
         * 销毁操作
         */
        scope.$on('$destroy', function() {
          store();
        });
      }
    }
  }
})();
