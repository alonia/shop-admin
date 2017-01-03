/**
 * Created by Administrator on 2016/10/15.
 */
(function() {
    'use strict';

    angular
        .module('shopApp')
        .controller('MemberRoleLsitController', MemberRoleLsitController);
    /** @ngInject */
    function MemberRoleLsitController($timeout, $state, $log, memberRole, memberRoleConfig, permissions, preferencenav) {
        var vm = this;
        var currentState = $state.current;
        var currentStateName = currentState.name;
        var currentParams = $state.params;
        var total = 0;

        /**
         * 消息提醒
         */
        vm.message = {
            loadingState: false
        };

        /**
        * 表格配置
        */
        vm.gridModel = {
            columns: angular.copy(memberRoleConfig.DEFAULT_GRID.columns),
            itemList: [],
            config: angular.copy(memberRoleConfig.DEFAULT_GRID.config),
            loadingState: true,      // 加载数据
            pageChanged: function(data){    // 监听分页
                var page = angular.extend({}, currentParams, {page:data});
                $state.go(currentStateName, page);
            }
        };

        /**
         * 组件数据交互
         *
         */
        vm.gridModel.config.propsParams = {
            removeItem: function(data){
                $log.debug('removeItem',data);
                if(data.status == -1){
                    vm.message.loadingState = false;
                }else{
                    memberRole.remove({id:data.transmit}).then(function(data) {
                        var message = "";
                        if(_.isObject(data.data.data) || _.isEmpty(data.data.data)){
                            message = "删除成功";
                        }else{
                            message = data.data.data;
                        }
                        vm.message.loadingState = true;
                        vm.message.config = {
                            type: data.data.status,
                            message: message
                        };
                        /**
                         * 如果是个对象就去设置权限，防止出错
                         */
                        if(_.isObject(data.data.data)){
                            permissions.setPermissions(data.data.data);
                            if(!permissions.findPermissions(currentState.permission)){
                                vm.message.loadingState = false;
                                preferencenav.removePreference(currentState);
                                $state.go('desktop.home');
                            }
                        }
                        getList();
                    }, function(data) {
                        $log.debug('removeItemError', data);
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
            roleItem: function (data) {
                $log.debug('roleItem', data.data);
                if(data.status == -1){
                    vm.message.loadingState = false;
                }else {
                    vm.message.loadingState = true;
                    var message = "";
                    if(data.type == "add"){
                        if(_.isEmpty(data.data.data)){
                            message = "添加成功";
                        }else{
                            message = data.data.data;
                        }
                        vm.message.config = {
                            type: data.data.status,
                            message: message
                        };
                    }
                    if(data.type == "edit"){
                        if(_.isObject(data.data.data) || _.isEmpty(data.data.data)){
                            message = "修改成功";
                        }else{
                            message = data.data.data;
                        }
                        vm.message.config = {
                            type: data.data.status,
                            message: message
                        };
                        /**
                         * 如果是个对象就去设置权限，防止出错
                         */
                        if(_.isObject(data.data.data)){
                            permissions.setPermissions(data.data.data);
                            if(!permissions.findPermissions(currentState.permission)) {
                                vm.message.loadingState = false;
                                preferencenav.removePreference(currentState);
                                $state.go('desktop.home');
                            }
                        }
                    }
                    getList();
                }
            }
        };

        /**
         * 搜索操作
         *
         */
        vm.gridSearch = {
        'config': {
          searchID: 'staffManages',
          searchParams: $state.params,
          searchDirective: [
            {
              'label': "员工姓名",
              'type': 'text',
              'searchText': "name",
              'placeholder': '员工姓名'
            },
            {
              'label': "账号",
              'type': 'text',
              'searchText': "account",
              'placeholder': '账号名称'
            },
            {
              'label': "角色名称",
              'type': 'select',
              'searchText': "role",
              'placeholder': '角色名称',
              'list': [
                {
                  'id': 0,
                  'name': '总经理'
                },
                {
                  'id': 1,
                  'name': '财务'
                },
                {
                  'id': 2,
                  'name': '运营'
                },
                {
                  'id': 3,
                  'name': '管理员'
                }
              ]
            }
          ]
        },
        'handler': function (data) {
          $log.debug(data)
        }
      };

        // 获取数据列表
        function getList(params){
            /**
             * 路由分页跳转重定向有几次跳转，先把空的选项过滤
             */
            if(!params.page){
                return ;
            }
            memberRole.get(params).then(function(data) {
                if(data.data.status == 0){
                    if(!data.data.data.length && params.page !=1){
                        $state.go(params, {page: 1});
                    }
                    total = data.data.count;
                    vm.gridModel.itemList = data.data.data;
                    vm.gridModel.paginationinfo = {
                        page:  params.page*1,
                        pageSize: 10,
                        total: total
                    };
                    vm.gridModel.loadingState = false;
                }
            }, function(data) {
              $log.debug('getListError', data);
            });
        }
        getList(currentParams);
    }

})();