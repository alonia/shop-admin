/**
 * Created by Administrator on 2016/11/24.
 */
(function() {
  'use strict';
  /**
   * observer 观察者
   * @method register    注册
   * @method fire        发布
   * @method remove      取消
   */
  angular
    .module('shopApp')
    .factory('utils', utils);

  /** @ngInject */
  function $$utils() {
    return {
      /**
       * 获取车辆品牌列表
       * 后端传递是一个带#拼接字符串数组
       * 需要处理
       * @param data      传递的字符串
       * @returns {Array} 返回数组
       */
      getMotorbrandids: function(data){
        if(angular.isUndefined(data)){
          return [];
        }
        if(!angular.isString(data) && angular.isArray(data)){
          return data;
        }
        if(data.indexOf('#') == -1 && angular.isArray(window.eval(data))){
          return window.eval(data);
        }
        var results = [];
        var list = decodeURI(data).split('#');
        angular.forEach(list, function (item) {
          var items = window.eval(item);
          angular.forEach(items, function (key) {
            results.push(key);
          });
        });
        return results;
      },
      /**
       * 在数组里面根据value参数获取数组中对应的数据
       * @param arr                数据
       * @param id                 查询id
       * @param value              比较的字段 默认id
       * @returns  undefined或{}   返回找不到或者结果对象
       */
      getData: function (arr, id, value) {
        if(!angular.isArray(arr)){
          throw Error('需要传递一个数组');
        }
        if(angular.isUndefined(id)){
          throw Error('需要传递一个查询项的值');
        }
        value = value || 'id';
        return _.find(arr, function (item) {
          return item[value] == id;
        });
      }
    }
  }

  /** @ngInject */
  function utils(configuration, webDefaultConfig) {
    return {
      /**
       * 根据start和end获取列表的model
       * @param list        列表
       * @param start       起始
       * @param end         结束
       * @returns {number}  如果找不到返回-1,找到返回正确的索引
       */
      getCustomModel: function(list, start, end) {
        if (_.isUndefined(start) && _.isUndefined(end)) {
          return -1;
        }
        var items;
        end = end || start;
        items = _.filter(list, function (item) {
          return item.start == start && item.end == end;
        });
        return items.length === 1 ? items[0].id : -2;
      },

      /**
       * 根据地址和类型获取图片地址，或者设置默认图片
       * @param src        图片地址
       * @param type       默认图片类型  logo 汽车车标， user 会员头像， product 商品图片 server 服务图片
       * @returns {string}  返回一个正确的地址
       */
      getImageSrc: function (src, type) {
        if(!!src){
          return configuration.getStatic() + src;
        }
        if(arguments.length == 1){
          throw Error('没有传递type或者src');
        }
        var types = webDefaultConfig.WEB_DEFAULT_IMAGE;
        if(_.isUndefined(types[type])){
          throw Error('默认图片类型错误，请查阅api.js查看webDefaultConfig.WEB_DEFAULT_IMAGE');
        }
        return types[type];
      },

      /**
       * 获取车辆品牌列表
       * 后端传递是一个带#拼接字符串数组
       * 需要处理
       * @param data      传递的字符串
       * @returns {Array} 返回数组
       */
      getMotorbrandids: function(data){
        if(angular.isUndefined(data)){
          return [];
        }
        if(!angular.isString(data) && angular.isArray(data)){
          return data;
        }
        if(data.indexOf('#') == -1 && angular.isArray(window.eval(data))){
          return window.eval(data);
        }
        var results = [];
        var list = decodeURI(data).split('#');
        angular.forEach(list, function (item) {
          var items = window.eval(item);
          angular.forEach(items, function (key) {
            results.push(key);
          });
        });
        return results;
      },
      /**
       * 在数组里面根据value参数获取数组中对应的数据
       * @param arr                数据
       * @param id                 查询id
       * @param value              比较的字段 默认id
       * @returns  undefined或{}   返回找不到或者结果对象
       */
      getData: function (arr, id, value) {
        if(!angular.isArray(arr)){
          throw Error('需要传递一个数组');
        }
        if(angular.isUndefined(id)){
          throw Error('需要传递一个查询项的值');
        }
        value = value || 'id';
        return _.find(arr, function (item) {
          return item[value] == id;
        });
      }
    }
  }
})();
