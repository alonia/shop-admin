/**
 * Created by Administrator on 2016/11/9.
 */
/**
 * 字符串范围验证
 * valueMin        最小值
 * valueMax        最大值
 * rangeEnabled    验证范围是否开启
 */
(function () {
  'use strict';
  angular
    .module('shopApp')
    .directive('cbStringRange', cbStringRange);

  /** @ngInject */
  function cbStringRange() {
    return {
      require: "ngModel",
      link: function (scope, iElement, iAttrs, iController) {
        var valueMin = iAttrs.valueMin * 1 || 0,
          valueMax = iAttrs.valueMax * 1 || Number.MAX_VALUE,
          rangeEnabled = iAttrs.rangeEnabled || 'true';
        iAttrs.$observe("valueMin", function (value) {
          valueMin = value * 1 || 0
        });
        iAttrs.$observe("valueMax", function (value) {
          valueMax = value * 1 || Number.MAX_VALUE;
        });

        iController.$parsers.push(function (value) {
          if (angular.isUndefined(value)) {
            return "";
          }
          var filtration;
          if (angular.isString(value)) {
            var temp = "";
            // 是否是负数
            /^-\d*/g.test(value) && (temp = "-");
            // 过滤非数字
            filtration = temp + value.replace(/[^0-9]/g, "");
            (filtration != value) && (iController.$setViewValue(filtration), iController.$render())
          }

          console.log(filtration);

          var u = true;
          if(filtration !== "-"){
            filtration = filtration && parseInt(filtration, 10);
            if(rangeEnabled === 'true'){
              u = filtration !== "" && (filtration < valueMin || filtration > valueMax);
            }else{
              if(/^0$/.test(filtration)){
                u = true;
              }else{
                u = /^([1-9]\d{0,16})$/.test(filtration);
              }
            }
            iController.$setValidity("cbStringRange", u);
            return filtration;
          }else{
            u = false;
            iController.$setValidity("cbStringRange", u);
            return undefined;
          }
        });
      }
    }
  }
})();