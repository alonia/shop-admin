/**
 * Created by Administrator on 2016/10/15.
 */
(function () {
  'use strict';

  angular
    .module('shopApp')
    .controller('ProductGoodsListController', ProductGoodsListController)
    .controller('ProductGoodsChangeController', ProductGoodsChangeController);

  /** @ngInject */
  function ProductGoodsListController($window, $state, $log, $timeout, utils, productGoods, productGoodsConfig, cbAlert) {
    var vm = this;
    var currentState = $state.current;
    var currentStateName = currentState.name;
    var currentParams = angular.extend({}, $state.params, {pageSize: 5});
    console.log($state.params);

    var total = 0;

    /**
     * 表格配置
     */
    vm.gridModel = {
      columns: angular.copy(productGoodsConfig.DEFAULT_GRID.columns),
      itemList: [],
      config: angular.copy(productGoodsConfig.DEFAULT_GRID.config),
      loadingState: true,      // 加载数据
      pageChanged: function (data) {    // 监听分页
        var page = angular.extend({}, currentParams, {page: data});
        $state.go(currentStateName, page);
      }
    };
    /*productGoods.category().then(function (data) {
     console.log(data.data.data);
     });*/
    /**
     * 组件数据交互
     *
     */
    vm.gridModel.config.propsParams = {
      removeItem: function (data) {
        if (data.status == 0) {
          /**
           * 删除单页
           */
          var item = null;
          if (data.removal.length == 1) {
            item = {
              productid: data.removal[0].productid,
              pskuid: data.removal[0].pskuid
            }
          }
          productGoods.remove(item).then(function (results) {
            if (results.data.status == '0') {
              cbAlert.tips("删除成功");
            } else {
              cbAlert.error("错误提示", results.data.rtnInfo);
            }
            getList();
          }, function (results) {
            $log.debug('removeItemError', results);
          });
        }
        // if(data.list.length <= 5 && total > 10){
        //     vm.gridModel.loadingState = true;
        //     $timeout(function (){
        //         getList();
        //     }, 3000);
        // }
        //vm.gridModel.itemList = data.list;

      },
      statusItem: function (data) {
        if (data.status == 0) {
          var item = null;
          if (data.removal.length == 1) {
            item = {
              pskuid: data.removal[0].pskuid
            }
          }
          productGoods[data.type](item).then(function (results) {
            if (results.data.status == '0') {
              cbAlert.tips("商品状态修改成功");
            } else {
              cbAlert.error("错误提示", results.data.rtnInfo);
            }
            getList();
          }, function (results) {
            $log.debug('statusItemError', results);
          });

        }
      },
      pricesItem: function (data) {
        if (data.status == 0) {
          productGoods.price({
            pskuid: data.data.pskuid,
            saleprice: data.data.saleprice
          }).then(function (results) {
            if (results.data.status == '0') {
              cbAlert.tips("调价成功");
            } else {
              cbAlert.error("错误提示", results.data.rtnInfo);
            }
            getList();
          }, function (results) {
            $log.debug('pricesItemError', results);
          });
        }
      }
    };

    var config = angular.copy(productGoodsConfig.DEFAULT_SEARCH.config);
    config.searchParams = $state.params;
    /**
     * 搜索操作
     *
     */
    vm.gridSearch = {
      'config': config,
      'handler': function (data) {
        $log.debug(data)
      }
    };

    /**
     * 表格配置
     */
    vm.gridModel2 = {
      editorhandler: function (data, item, type) {
        console.log(data, item);
        item[type] = data;
        productGoods.updateProductSku(angular.copy(item)).then(function (results) {
          console.log(results);
          if (results.data.status == '0') {
            cbAlert.tips('修改成功');
            getList();
          }else{
            cbAlert.error(results.data.rtnInfo);
          }
        });
      }
    };


    vm.statusItem = function (item) {
      console.log(JSON.stringify(item));
      cbAlert.ajax('是否确认禁用该商品SKU？', function (isConfirm) {
        if (isConfirm) {
          item.status = item.status === "0" ? "1" : "0";
          productGoods.updateProductSku(item).then(function (results) {
            if (results.data.status == '0') {
              cbAlert.tips('修改成功');
              getList();
            }else{
              cbAlert.error(results.data.rtnInfo);
            }
          });
        } else {
          cbAlert.close();
        }
      }, "", 'warning');
    };

    function getProductSkus(id) {
      productGoods.getProductSkus({id: id}).then(function (results) {
        vm.items = results.data.data;
      });
    }


    // 获取权限列表
    function getList() {
      /**
       * 路由分页跳转重定向有几次跳转，先把空的选项过滤
       */
      if (!currentParams.page) {
        return;
      }
      productGoods.list(currentParams).then(function (data) {
        if (data.data.status == 0) {
          if (!data.data.data.length && currentParams.page != 1) {
            $state.go(currentStateName, {page: 1});
          }
          total = data.data.totalCount;
          vm.gridModel.itemList = [];
          angular.forEach(data.data.data, function (item) {
            /**
             * 这段代码处理skuvalues值的问题，请勿修改 start
             */
            item.skuvalues = $window.eval(item.skuvalues);
            item.motobrandids = utils.getMotorbrandids(item.motobrandids);
            /**
             * 这段代码处理skuvalues值的问题，请勿修改 end
             */
            vm.gridModel.itemList.push(item);
          });
          vm.gridModel.paginationinfo = {
            page: currentParams.page * 1,
            pageSize: currentParams.pageSize,
            total: total
          };
          vm.gridModel.loadingState = false;
          getProductSkus(vm.gridModel.itemList[0].guid);
        }
      }, function (data) {
        $log.debug('getListError', data);
      });
    }

    getList();

  }

  /** @ngInject */
  function ProductGoodsChangeController($state, $window, $log, categoryGoods, productGoods, preferencenav, cbAlert) {
    var vm = this;
    var currentParams = $state.params;
    vm.attributeset = [];
    vm.isLoadData = false;
    vm.isAttributesetLoad = false;
    //  是否是编辑
    vm.isChange = !_.isEmpty(currentParams);
    $log.debug('isChange', vm.isChange);
    vm.dataBase = {};
    console.log(vm.isChange);
    categoryGoods.goods().then(function (data) {
      vm.selectModel.store = data.data.data;
    });
    if (vm.isChange) {
      productGoods.edit(currentParams).then(function (data) {
        var edit = data.data.data;
        console.log(edit);
        getAttrsku(data.data.data.pcateid2, function (data) {
          vm.dataBase = setDataBase(edit);
          vm.dataBase.productcategory = getCate(edit.parentid, edit.cateid);
          vm.dataBase.brandname = getBrandname(data.brand, edit.brandid);
          vm.dataBase.motobrandids = edit.motobrandids;
          vm.dataBase.skuvalues = $window.eval(edit.skuvalues);
        });
        vm.isAttributesetLoad = true;
        vm.isLoadData = true;
      });
    } else {
      vm.isLoadData = true;
      vm.dataBase.status = 1;
      vm.dataBase.$unit = '请先选择商品类目';
      vm.dataBase.mainphoto = [];
      vm.dataBase.items = [];
    }

    function getCate(parentid, cateid) {
      var str = "", item2;
      var item1 = _.remove(vm.selectModel.store, function (item) {
        return item.id == parentid;
      });
      if (item1.length) {
        str = item1[0].catename;
        if (item1[0].items.length) {
          item2 = _.remove(item1[0].items, function (item) {
            return item.id == cateid;
          });
          if (item2.length) {
            str += " " + item2[0].catename;
          }
        }

      }
      return str;
    }

    /**
     * 属性添加
     * @type {{}}
     */
    vm.skuvalues = {
      store: [],
      handler: function (data) {
        console.log('属性添加', data);
        if (data.status == 0) {
          vm.dataBase.items.push({
            skuvalues: data.data,
            attrvalues: vm.dataBase.$$attrvalues,
            status: "1",
            $$skuname: getSkuname(data.data)
          });
        }
      }
    };

    function getSkuname(name){
      var result = "";
      var num = 10;
      if(!name){
        return name;
      }
      if(angular.isString(name)){
        name = JSON.parse(name);
      }
      var result = "";
      if(angular.isArray(name)){
        angular.forEach(name, function (item) {
          result += item.skuname + "/"
        });
      }
      result = result.substring(0, result.length - 1);
      if(result.length > num){
        result = result.substring(0, num);
        if(result.lastIndexOf("/") === num - 1){
          result = result.substring(0, result.length - 1);
        }
        result += " 等";
      }
      console.log(result, result.length);

    }


    getSkuname([{"guid":0,"id":12,"items":[{"guid":0,"id":57,"skuid":12,"skuvalue":"15寸","sort":1}],"skuname":"轮胎尺寸","skutype":"text","sort":0},{"guid":0,"id":14,"items":[{"guid":0,"id":68,"skuid":14,"skuvalue":"155","sort":1}],"skuname":"胎面宽度","skutype":"text","sort":0},{"guid":0,"id":13,"items":[{"guid":0,"id":63,"skuid":13,"skuvalue":"防爆轮胎","sort":1}],"skuname":"轮胎类型","skutype":"text","sort":0}])

    function getBrandname(data, id) {
      var item = _.remove(data, function (item) {
        return item.id == id;
      });
      return item.length ? item[0].shortname : "";
    }

    /**
     * 在数组里面根据value参数获取数组中对应的数据
     * @param arr      数据
     * @param id       查询id
     * @param value    比较的字段 默认id
     */
    var getData = function (arr, id, value) {
      value = value || 'id';
      return _.find(arr, function (item) {
        return item[value] == id;
      });
    };

    vm.brandModel = {
      select: undefined,
      store: [],
      handler: function (data) {
        vm.dataBase.brandid = data;
        console.log('brandModel', data);
      }
    };

    vm.selectModel2 = {
      select: undefined,
      store: [],
      handler: function (data) {
        console.log('selectModel', data);
        if (!!getData(vm.selectModel2.store, data)) {
          vm.dataBase.$unit = getData(vm.selectModel2.store, data).unit;
        }
        console.log(getData(vm.selectModel2.store, data));
        vm.dataBase.cateid = data;
        getAttrsku(data);
      }
    };

    function getAttrsku(id, callback) {
      productGoods.attrsku({id: id}).then(function (data) {
        console.log(data);
        vm.brandModel.store = data.data.data.brand;
        vm.skuData = angular.copy(data.data.data.sku);
        vm.skuvalues.store = angular.copy(data.data.data.sku);
        vm.dataBase.$$attrvalues = data.data.data.attributeset[0].id;
        if (!callback) {
          vm.dataBase.brandid = undefined;
          vm.brandModel.select = undefined;
          vm.isAttributesetLoad = true;
        }
        callback && callback(data.data.data);
      });
    }

    vm.selectModel = {
      select: undefined,
      store: [],
      handler: function (data) {
        console.log('selectModel', data);
        setTwoCategorie(data, undefined, '请先选择商品类目');
        vm.isAttributesetLoad = false;
        console.log(vm.selectModel2.store);
      }
    };

    vm.sizeModel = {
      store: [],
      data: [],
      every: undefined,
      handler: function (data) {
        console.log('sizeModel', data);
        vm.sizeModel.every = data.every;
        vm.sizeModel.data = data.data;
      }
    };

    function setTwoCategorie(id, cateid, unit) {
      if (!!getData(vm.selectModel.store, id)) {
        vm.selectModel2.store = getData(vm.selectModel.store, id).items;
      } else {
        vm.selectModel2.store = [];
      }
      vm.dataBase.cateid = cateid;
      vm.dataBase.$unit = unit;
    }

    /**
     * 格式化 vm.dataBase数据供提交使用
     * @param data
     * @returns {{}}
     */
    function getDataBase(data) {
      var result = angular.extend({}, data);
      angular.forEach(result.items, function (item) {
        item.skuvalues = JSON.stringify(item.skuvalues);
        item.stock || (item.stock = -9999);
      });
      /**
       * 防止后台数据出bug end
       */
      if (vm.isChange) {
        delete result.parentid;
        delete result.brandname;
        delete result.productcategory;
      }
      delete result.$unit;
      delete result.$size;
      console.log(JSON.stringify(result));

      return result;
    }

    /**
     * 获取编辑数据，生成vm.dataBase数据格式
     * @param data
     * @returns {{}}
     */
    function setDataBase(data) {
      var result = angular.extend({}, data);
      result.mainphoto = angular.isArray(result.mainphoto) ? result.mainphoto.join(",") : result.mainphoto;
      result.$unit = result.unit;
      vm.selectModel2.select = result.cateid;
      vm.brandModel.select = result.brandid;
      setTwoCategorie(result.parentid, result.cateid, result.unit);
      delete result.unit;
      return result;
    }

    vm.uploadHandler = function (data, index) {
      if (data.status == 0) {
        if (angular.isDefined(index)) {
          vm.dataBase.mainphoto[index] = data.data[0].url;
        } else {
          angular.forEach(data.data, function (item) {
            vm.dataBase.mainphoto.push(item.url);
          });
        }
        console.log(vm.dataBase.mainphoto, index);
      }
    };
    vm.removePhotos = function (index) {
      vm.dataBase.mainphoto.splice(index, 1);
    };

    /**
     * 表单提交
     */
    vm.submit = function () {
      /*if (!vm.sizeModel.data.length) {
       cbAlert.alert('您要至少选择一项规格');
       return;
       }
       if (!vm.sizeModel.every) {
       cbAlert.alert('规格对应的值没有选择');
       return;
       }
       if (!vm.dataBase.mainphoto.length) {
       cbAlert.alert('您需要上传一张商品图片');
       return;
       }
       if (!vm.dataBase.motobrandids.length) {
       cbAlert.alert('您还没有选择适用车型');
       return;
       }*/
      productGoods.save(getDataBase(vm.dataBase)).then(function (data) {
        console.log('save', data);
        if (data.data.status == 0) {
          goto();
        }
      });
    };
    function goto() {
      preferencenav.removePreference($state.current);
      $state.go('product.goods.list', {'page': 1});
    }
  }
})();

