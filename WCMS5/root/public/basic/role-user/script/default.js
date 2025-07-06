var roleuser = {
    rsapublickey: '', //rsa公钥
    currUid: 0,
    currRid: 0,
    lang: '',
    isJump: false,
    defChannelCount: 36,
    init: function init() {
        var that = this;
        that.currUid = appCommon.getCookie(appConfig.USERCOOKIENAME, 'uid');
        that.currRid = appCommon.getCookie(appConfig.USERCOOKIENAME, 'rid');
        that.lang = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'L');
        that.isJump = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'isJump') ? true : false;
        that.page.init();
    },
    page: {
        init: function init() {
            var that = this;
            that.table.init();
            if (roleuser.lang != 'en-US') {
                appCommon.loadScriptOrCss('script', '../../../third-resource/metronic47/global/plugins/jquery-validation/js/localization/messages_' + roleuser.lang + '.min.js', function () {
                    appCommon.loadScriptOrCss('script', '../../../third-resource/metronic47/global/plugins/bootstrap-datepicker/locales/bootstrap-datepicker.' + roleuser.lang + '.min.js', function () {
                        that.form.init();
                        that.tree.init();
                    });
                });
            } else {
                that.form.init();
                that.tree.init();
            }
            that.bindEvent();
            that.tab.init();
            //@wzz 添加流量控制
            that.action.init();
            that.flow.init();
        },
        action: {
            init: function init() {
                $('#inp_maxchncount').select2({
                    minimumResultsForSearch: Infinity,
                    data: [{ id: 2, text: 2 }, { id: 3, text: 3 }, { id: 4, text: 4 }, { id: 6, text: 6 }, { id: 9, text: 9 }, { id: 10, text: 10 }, { id: 12, text: 12 }, { id: 16, text: 16 }, { id: 25, text: 25 }, { id: 36, text: 36 }]
                });
                $('#inp_maxchncount').val(roleuser.defChannelCount).trigger('change');
            }
        },
        //绑定点击事件
        bindEvent: function bindEvent() {
            var that = this;
            //tree的开关
            appCommon.jqueryCache('#a_close').on('click', function (e) {
                $('#div_content').removeClass('col-lg-9').addClass('col-lg-12');
                $('#div_content').removeClass('col-md-8').addClass('col-md-12');
                $('#div_content').removeClass('col-sm-8').addClass('col-sm-12');
                that.table.resize();
                appCommon.jqueryCache('#div_tree').css({ position: 'absolute', left: 0, zIndex: 100 }).animate({ left: -$('#div_tree').width() - 20 }, 500, function () {
                    appCommon.jqueryCache('#div_tree').hide();
                    appCommon.jqueryCache('#div_open').show();
                });
            });
            appCommon.jqueryCache('#div_open').on('click', function (e) {
                appCommon.jqueryCache('#div_open').hide();
                appCommon.jqueryCache('#div_tree').show().animate({ left: 0 }, 500, function () {
                    appCommon.jqueryCache('#div_tree').css({ position: 'relative' });
                    $('#div_content').removeClass('col-lg-12').addClass('col-lg-9');
                    $('#div_content').removeClass('col-md-12').addClass('col-md-8');
                    $('#div_content').removeClass('col-sm-12').addClass('col-sm-8');
                    that.table.resize();
                });
            });
            //tree的工具栏
            appCommon.jqueryCache('#btn_addrole').on('click', function () {
                that.addRole();
            });
            appCommon.jqueryCache('#btn_editrole').on('click', function () {
                that.editRole();
            });
            appCommon.jqueryCache('#btn_deleterole').on('click', function () {
                that.deleteRole();
            });
            appCommon.jqueryCache('#i_refresh').on('click', function () {
                that.tree.reload();
            });
        },
        addRole: function addRole() {
            //加载当前角色下的模块权限和组权限
            roleuser.page.form.initAuthority('', false);
            //加载完组权限后加载对应的通道权限
            roleuser.page.tree.initGroup(roleuser.page.tree.checkedRoleId, function () {
                //先默认把所有车组勾选上
                roleuser.page.tree.groupObj.checkAllNodes(true);
                //获取所有的车组id
                var ids = roleuser.page.form.getAllGroup();
                roleuser.page.tree.initChannel(ids, true, function () {
                    //默认勾选所有通道
                    roleuser.page.tree.channelObj.checkAllNodes(true);
                });
            });
            roleuser.page.form.type = 'role';
            roleuser.page.form.operateFlag = 'addRole';
            roleuser.page.modal.title = lang.add;
            roleuser.page.modal.type = 'role';
            roleuser.page.modal.init();
            setTimeout(function () {
                roleuser.page.form.clearData();
                appCommon.jqueryCache('#btn_submitrole').removeAttr('disabled');
                roleuser.page.modal.show();
            }, 100);
        },
        editRole: function editRole() {
            var checkedRoleId = roleuser.page.tree.checkedRoleId;
            if (!checkedRoleId) {
                lavaMsg.alert(lang.chooseOneLeast, 'info');
            } else {
                if (checkedRoleId == roleuser.currRid) {
                    lavaMsg.alert(lang.cannotEditThis, 'danger');
                } else {
                    roleuser.page.form.type = 'role';
                    roleuser.page.form.operateFlag = 'editRole';
                    roleuser.page.form.clearData();
                    appCommon.ajax('../../../role/' + roleuser.page.tree.checkedRoleId, 'get', 'json', {}, function (data) {
                        roleuser.page.form.initAuthority(data.result.pid, false, function () {
                            roleuser.page.tree.initGroup(data.result.pid, function () {
                                roleuser.page.form.fillData(data.result);
                            });
                        });
                    });
                    roleuser.page.modal.title = lang.edit;
                    roleuser.page.modal.type = 'role';
                    roleuser.page.modal.init();
                    setTimeout(function () {
                        appCommon.jqueryCache('#btn_submitrole').removeAttr('disabled');
                        roleuser.page.modal.show();
                    }, 100);
                }
            }
        },
        deleteRole: function deleteRole() {
            var _id = roleuser.page.tree.checkedRoleId;
            if (_id == roleuser.currRid) {
                //不能删除根角色
                lavaMsg.alert(lang.cannotdeleteThis, 'danger');
            } else {
                var _name = roleuser.page.tree.treeObj.getNodeByParam('id', _id).name;
                lavaMsg.confirm(lang.prompt, lang.sureDeleteThis + '"' + _name + '"?', lang.sure, function (r) {
                    if (r) {
                        lavaMsg.confirm(lang.prompt, lang.sureDeleteThisConfirmAgain + '?', lang.sure, function (r) {
                            if (r) {
                                appCommon.ajax('../../../role/delete/batch', 'post', 'json', { ids: _id, logContent: _name }, function (data) {
                                    if (data.code == 200) {
                                        if (data.result) {
                                            lavaMsg.alert(lang.operateSuccess, 'success');
                                            roleuser.page.tree.reload();
                                        } else {
                                            lavaMsg.alert(lang.operateFail, 'danger');
                                        }
                                    } else {
                                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                                    }
                                });
                            }
                        });
                    }
                });
            }
        },
        table: {
            $el: appCommon.jqueryCache('#tb_grid'),
            $searchEl: appCommon.jqueryCache('#inp_search'),
            init: function init() {
                var that = this;
                var footLanguage = {};
                footLanguage[roleuser.lang] = {
                    total: lang.total,
                    from: lang.displaying,
                    to: lang.to
                };
                that.$el.table({
                    url: '../../../user/items',
                    checkbox: true,
                    frozenNumber: 5,
                    fit: true,
                    columnToggle: '#dropdown2',
                    orderType: 'desc',
                    defaultOrderColumn: 'groupName',
                    pageSizeField: 'pageSize',
                    pageNumberField: 'pageIndex',
                    lang: roleuser.lang,
                    pageSize: 20,
                    footLanguage: footLanguage,
                    columns: [{ field: 'checkbox' }, { field: 'operate', width: 100, formatter: that.formatOperate }, { field: 'account', width: 100, order: true }, { field: 'rolename', width: 120 }, { field: 'power', width: 100, formatter: that.formatPreview }, { field: 'chncount', width: 100 }, { field: 'uniquelogin', width: 100, formatter: that.formatUniqueLogin }, { field: 'flowcontrol', width: 100, formatter: that.formatFlowControl }, { field: 'flowtype', width: 100, formatter: that.formatFlowType }, { field: 'totalflow', width: 100, formatter: that.formatFlowValue }, { field: 'alertvalue', width: 100, formatter: that.formatFlowValue }, { field: 'flowpackage', width: 100, formatter: that.formatFlowValue }, { field: 'phone', width: 150 }, { field: 'email', width: 150 }, { field: 'validend', width: 100 }],
                    loadFilter: function loadFilter(data) {
                        if (data && data.code == 200 && data.result) {
                            if (data.result) {
                                return { total: data.result.count, rows: data.result.items };
                            } else {
                                return { total: 0, rows: [] };
                            }
                        } else {
                            return { total: 0, rows: [] };
                        }
                    }
                });
                //search
                that.$searchEl.on('focus blur keydown', function (e) {
                    if (e.type == 'focus') {
                        that.$searchEl.animate({ width: 350 }, 300);
                    } else if (e.type == 'blur') {
                        that.$searchEl.animate({ width: 250 });
                    } else if (e.type == 'keydown') {
                        if (e.keyCode == 13) {
                            that.reload('account', that.$searchEl.val());
                        }
                    }
                });
                appCommon.jqueryCache('#i_search').on('click', function () {
                    that.reload('account', that.$searchEl.val());
                });
                appCommon.jqueryCache('#a_deleteUser').on('click', function () {
                    that.deleteUser();
                });
                //打印
                appCommon.jqueryCache('#a_print').on('click', function () {
                    //在打印按钮隐藏后再调用打印接口
                    var interval = window.setInterval(function () {
                        if (!appCommon.jqueryCache('.dropdown-menu').is(':visible')) {
                            clearInterval(interval);
                            $('#tb_grid').table('print');
                        }
                    }, 10);
                });
            },
            formatPreview: function formatPreview(value, row, index) {
                return "<button type='button' class='btn btn-sm btn-block green' onclick='roleuser.page.table.preview(" + row.roleid + ',"' + row.account + '")\'>' + lang['preview'] + '</button>';
            },
            formatOperate: function formatOperate(value, row, index) {
                var uid = row.id;
                var kickStr = '';
                if (uid == 1 || uid == roleuser.currUid) {
                    return '';
                } else {
                    var id = 'i_' + new Date().getTime() + index;
                    if (roleuser.currUid == 1) {
                        kickStr = "&nbsp;&nbsp;<i title='" + lang.logout + "' class='fa fa-chain-broken' id='kickoff_" + id + "' onclick='roleuser.page.table.kickOff(" + row.id + ',"#kickoff_' + id + '","' + row.account + '")\'></i>';
                    }
                    return "<i title='" + lang.edit + "' class='fa fa-edit' onclick='roleuser.page.table.editUser(" + row.id + ")'></i>&nbsp;&nbsp;" + "<i title='" + lang.delete + "' class='fa fa-trash-o' id='" + id + "' onclick='roleuser.page.table.deleteUser(" + row.id + ',"#' + id + '","' + row.account + '")\'></i>' + kickStr;
                }
            },
            //格式化是否唯一性登录
            formatUniqueLogin: function formatUniqueLogin(value, row, index) {
                if (value == 1) {
                    return lang['yes'];
                } else {
                    return lang['no'];
                }
            },
            formatFlowControl: function formatFlowControl(value, row, index) {
                if (value == 0) {
                    return lang.unLimitedFlow;
                } else {
                    return lang.limitedFlow;
                }
            },
            formatFlowType: function formatFlowType(value, row, index) {
                if (row.flowcontrol == 0) {
                    return '-';
                } else if (value == 0) {
                    return lang.accumulatePackage;
                } else if (value == 1) {
                    return lang.monthPackage;
                }
            },
            formatFlowValue: function formatFlowValue(value, row, index) {
                if (row.flowcontrol == 0) {
                    return '-';
                } else {
                    return !value && value != 0 ? '' : value + '';
                }
            },
            reload: function reload(key, value) {
                var that = this;
                var _key = 'account';
                var _value = that.$searchEl.val();
                that.$el.table('load', { roleid: roleuser.page.tree.checkedRoleId, key: _key, value: _value });
            },
            resize: function resize() {
                var that = this;
                that.$el.table('resize');
            },
            preview: function preview(roleid, account) {
                roleuser.page.modal.roleId = roleid;
                roleuser.page.modal.type = 'preview';
                roleuser.page.modal.title = account;
                roleuser.page.modal.init();
                roleuser.page.modal.show();
            },
            editUser: function editUser(id) {
                var that = this;
                roleuser.page.form.type = 'user';
                roleuser.page.form.operateFlag = 'editUser';
                roleuser.page.form.clearData();
                roleuser.page.modal.type = 'user';
                roleuser.page.modal.title = lang.edit;
                lavaMsg.loading(true);
                appCommon.ajax('../../../user/' + id, 'get', 'json', {}, function (data) {
                    lavaMsg.loading(false);
                    if (data.code == 200) {
                        if (data.result) {
                            roleuser.page.modal.init();
                            var userdata = data.result[0];
                            appCommon.jqueryCache('#inp_password').attr('placeholder', window.lang.editPswPlacement);
                            roleuser.page.form.fillData(userdata);
                            appCommon.jqueryCache('#btn_submituser').removeAttr('disabled');
                            roleuser.page.modal.show();
                        } else {
                            lavaMsg.alert(lang['getUserInfoFail'], danger);
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                });
            },
            addUser: function addUser() {
                var that = this;
                roleuser.page.form.type = 'user';
                roleuser.page.form.clearData();
                roleuser.page.form.operateFlag = 'addUser';
                roleuser.page.modal.title = lang.add;
                roleuser.page.modal.type = 'user';
                appCommon.jqueryCache('#inp_password').attr('placeholder', '');
                roleuser.page.modal.init();
                appCommon.jqueryCache('#btn_submituser').removeAttr('disabled');
                roleuser.page.modal.show();
            },
            deleteUser: function deleteUser(userId, element, account) {
                var that = this;
                if (userId) {
                    if (element) {
                        lavaMsg.singleConfirm(element, lang.sureDeleteThis + '?', lang.sure, lang.cancel, function (r) {
                            if (r) {
                                that.deleteConfirm({ ids: userId, logContent: account });
                            }
                        });
                    } else {
                        lavaMsg.confirm(lang.prompt, lang.sureDeleteThese + '?', lang.sure, function (r) {
                            if (r) {
                                that.deleteConfirm({ ids: userId, logContent: account });
                            }
                        });
                    }
                } else {
                    var rows = $('#tb_grid').table('getChecked');
                    var idArray = [];
                    var accountArray = [];
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].id != roleuser.currUid) {
                            idArray.push(rows[i].id);
                            accountArray.push(rows[i].account);
                        }
                    }
                    if (idArray.length == 0) {
                        lavaMsg.alert(lang.chooseOneLeast, 'info');
                    } else {
                        that.deleteUser(idArray.join(','), '', accountArray.join(','));
                    }
                }
            },
            //踢出ceiba在线用户
            kickOff: function kickOff(userId, element, account) {
                var that = this;
                var ajaxData = {
                    ids: userId,
                    username: account,
                    command: 'u-t-o',
                    logContent: account
                };
                if (element) {
                    lavaMsg.singleConfirm(element, lang.sureTickOffAccount, lang.sure, lang.cancel, function (r) {
                        if (r) {
                            that.kickOffConfirm(ajaxData); //无角色权限控制，logConent暂时无效
                        }
                    });
                } else {
                    lavaMsg.confirm(lang.prompt, lang.ssureTickOffAccount, lang.sure, function (r) {
                        if (r) {
                            that.kickOffConfirm(ajaxData);
                        }
                    });
                }
            },
            deleteConfirm: function deleteConfirm(formData) {
                lavaMsg.loading(true);
                appCommon.ajax('../../../user/delete/batch', 'post', 'json', formData, function (data) {
                    lavaMsg.loading(false);
                    if (data.code == 200) {
                        if (data.result) {
                            lavaMsg.loading(false);
                            roleuser.page.table.reload('');
                            lavaMsg.alert(lang.operateSuccess, 'success');
                        } else {
                            lavaMsg.alert(lang.operateFail, 'danger');
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                });
            },
            //踢出账号
            kickOffConfirm: function kickOffConfirm(reqData) {
                lavaMsg.loading(true);
                appCommon.ajax('../../../user/kickoff/batch', 'post', 'json', reqData, function (data) {
                    lavaMsg.loading(false);
                    if (data.code == 200) {
                        if (data.result) {
                            lavaMsg.loading(false);
                            roleuser.page.table.reload('');
                            lavaMsg.alert(lang.operateSuccess, 'success');
                        } else {
                            lavaMsg.alert(lang.operateFail, 'danger');
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                });
            }
        },
        tree: {
            checkedRoleId: 0,
            checkedRoleName: '',
            loadFlag1: false,
            loadFlag2: false,
            loadFlag3: false,
            rootNode: null,
            $treeEl: appCommon.jqueryCache('#ul_tree'),
            $roleEl: appCommon.jqueryCache('#ul_role'),
            $groupEl: appCommon.jqueryCache('#ul_group'),
            $channelEl: appCommon.jqueryCache('#ul_channel'),
            $previewEl: appCommon.jqueryCache('#ul_group_preview'),
            $previewChnnlEl: appCommon.jqueryCache('#ul_channel_preview'),
            treeObj: null,
            roleObj: null,
            groupObj: null,
            channelObj: null,
            previewObj: null,
            previewChnnlObj: null,
            init: function init() {
                var that = this;
                $.fn.zTree.init(that.$treeEl, that.getSettings('../../../common/role-tree'));
                that.treeObj = $.fn.zTree.getZTreeObj('ul_tree');
                //that.channelObj = $.fn.zTree.getZTreeObj("ul_channel");
            },
            initPRole: function initPRole() {
                var that = this;
                $.fn.zTree.init(that.$roleEl, that.getSettings('../../../common/role-tree'));
                that.roleObj = $.fn.zTree.getZTreeObj('ul_role');
            },
            initPreview: function initPreview(id) {
                var that = this;
                $.fn.zTree.init(that.$previewEl, that.getSettings('../../../common/simple-tree/' + id, false, function () {
                    that.previewObj = $.fn.zTree.getZTreeObj('ul_group_preview');
                    var groups = [];
                    var nodes = roleuser.page.tree.previewObj.getNodesByFilter(function (node) {
                        if (node.getParentNode()) {
                            return false;
                        } else {
                            return true;
                        }
                    });
                    for (var i = 0; i < nodes.length; i++) {
                        groups.push(nodes[i].id);
                    }
                    var ids = groups.join(',');
                    $.fn.zTree.init(that.$previewChnnlEl, that.getSettings('../../../common/vehicle-tree/powerchannel', false, function () {
                        that.previewChnnlObj = $.fn.zTree.getZTreeObj('ul_channel_preview');
                        //去除不是此角色权限的通道权限
                        var currChannelAuth = roleuser.page.form.currChannelAuth;
                        for (var i = 0; i < currChannelAuth.length; i++) {
                            var vid = currChannelAuth[i].vid;
                            var channel = '|' + currChannelAuth[i].channel.toString().split(',').join('|') + '|';
                            var removeNodes = that.previewChnnlObj.getNodesByFilter(function (node) {
                                if (node.icon.indexOf('webcam.min.png') > -1 && node.getParentNode().id == vid && channel.indexOf('|' + node.id + '|') > -1) {
                                    return true;
                                }
                            });
                            for (var k = 0; k < removeNodes.length; k++) {
                                that.previewChnnlObj.removeNode(removeNodes[k]);
                            }
                        }
                    }, { groupid: ids }));
                }));
            },
            initGroup: function initGroup(id, callback) {
                var that = this;
                $.fn.zTree.init(that.$groupEl, that.getSettings('../../../common/simple-tree/' + id, true, callback));
                that.groupObj = $.fn.zTree.getZTreeObj('ul_group');
            },
            initChannel: function initChannel(ids, isCheck, callback) {
                //先判断下是否改变勾选了组权限， 如果没有改变，则不重新加载通道树
                var oldIds = window.appCommon.jqueryCache('#inp_checkgroupids').val();
                if (oldIds == ids) {
                    return;
                } else {
                    window.appCommon.jqueryCache('#inp_checkgroupids').val(ids);
                    var that = this;
                    $.fn.zTree.init(that.$channelEl, that.getSettings('../../../common/vehicle-tree/powerchannel', isCheck, callback, {
                        groupid: ids
                    }));
                    that.channelObj = $.fn.zTree.getZTreeObj('ul_channel');
                }
            },
            //根据上面的通道勾选树的通道
            setChannelCheck: function setChannelCheck(value, checkFlag) {
                value = value.split('_')[1];
                var that = this;
                var nodes = that.channelObj.getNodesByFilter(function (node) {
                    if (node.icon.indexOf('webcam.min.png') > -1 && node.id == value) {
                        that.channelObj.checkNode(node, checkFlag, true);
                    }
                });
            },
            //根据权限勾选树的通道
            setChannelCheckByAuth: function setChannelCheckByAuth(channelpower) {
                var that = this;
                //先勾选所有的通道,再根据权限去掉勾选
                //通道权限返回的是没有该通道的权限
                that.channelObj.checkAllNodes(true);
                for (var i = 0; i < channelpower.length; i++) {
                    var vid = channelpower[i].vid;
                    var cid = '|' + channelpower[i].channel.toString().split(',').join('|') + '|';
                    var nodes = that.channelObj.getNodesByFilter(function (node) {
                        if (node.icon.indexOf('car.min.png') > -1) {
                            if (node.id == vid) {
                                if (node.children) {
                                    for (var j = 0; j < node.children.length; j++) {
                                        if (cid.indexOf('|' + node.children[j].id + '|') > -1) {
                                            that.channelObj.checkNode(node.children[j], false);
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            },
            //获取树的配置项
            getSettings: function getSettings(url, check, callback, otherParam) {
                var that = this;
                var settings = {
                    async: {
                        autoParam: ['id'],
                        contentType: 'application/x-www-form-urlencoded',
                        dataFilter: function dataFilter(treeId, parentNode, data) {
                            if (data.code == 200 && data.result) {
                                return data.result;
                            } else {
                                return [];
                            }
                        },
                        dataType: 'json',
                        enable: true,
                        otherParam: otherParam ? otherParam : [],
                        type: 'get',
                        url: url
                    },
                    data: {
                        keep: {
                            parent: true //保持父节点
                        }
                    },
                    check: {
                        enable: check,
                        chkboxType: { Y: 's', N: 'ps' }
                    },
                    callback: {
                        onClick: function onClick(event, treeId, treeNode, clickFlag) {
                            if (treeId == 'ul_role') {
                                if (roleuser.page.form.operateFlag == 'addUser' || roleuser.page.form.operateFlag == 'editUser') {
                                    appCommon.jqueryCache('#inp_prole').val(treeNode.name).focus().blur();
                                    appCommon.jqueryCache('#inp_proleid').val(treeNode.id);
                                    roleuser.page.modal.type = 'parentRole';
                                    roleuser.page.modal.close();
                                } else if (roleuser.page.form.operateFlag == 'addRole' || roleuser.page.form.operateFlag == 'editRole') {
                                    appCommon.jqueryCache('#inp_parentrolename').val(treeNode.name).focus().blur();
                                    appCommon.jqueryCache('#inp_parentroleid').val(treeNode.id);
                                    roleuser.page.modal.type = 'parentRole';
                                    //重新加载权限
                                    roleuser.page.form.initAuthority(treeNode.id, false, function () {
                                        if (roleuser.page.form.operateFlag == 'editRole') {
                                            roleuser.page.form.checkAuthority(that.checkedRoleId);
                                        }
                                    });
                                    roleuser.page.tree.initGroup(treeNode.id, function () {
                                        if (roleuser.page.form.operateFlag == 'editRole') {
                                            roleuser.page.form.checkGroup(that.checkedRoleId);
                                        }
                                    });
                                    roleuser.page.modal.close();
                                }
                            } else if (treeId == 'ul_tree') {
                                that.checkedRoleId = treeNode.id;
                                that.checkedRoleName = treeNode.name;
                                roleuser.page.table.reload('');
                            }
                        },
                        onCheck: function onCheck(event, treeId, treeNode) {
                            //如果在车组树进行勾选或者取消勾选操作，则重新刷新一下通道权限树
                            if (treeId = 'ul_group') {}
                        },
                        onAsyncSuccess: function onAsyncSuccess(event, treeId, treeNode) {
                            if (!that.loadFlag1 && treeId == 'ul_tree') {
                                that.treeObj.expandAll(true);
                                //初始加载第一个根节点下的数据
                                that.treeObj.getNodesByFilter(function (node) {
                                    if (node.level == 0) {
                                        //当前用户所属的角色
                                        roleuser.page.tree.checkedRoleId = node.id;
                                        roleuser.page.tree.checkedRoleName = node.name;
                                    }
                                });
                                //tree 每次更新后结点会变化，即使id一样
                                var rootNode = that.treeObj.getNodeByParam('id', roleuser.currRid);
                                that.treeObj.selectNode(rootNode);
                                roleuser.page.table.reload('');
                                that.loadFlag1 = false;
                            } else if (!that.loadFlag2 && treeId == 'ul_role') {
                                if (roleuser.page.form.operateFlag == 'editRole') {
                                    var selectedNode = that.roleObj.getNodesByFilter(function (node) {
                                        if (node) {
                                            if (node.id == that.checkedRoleId) {
                                                // that.roleObj.removeNode(node);//@wzz0521原方法报错,进行了修改
                                                return true;
                                            } else {
                                                return false;
                                            }
                                        }
                                    });
                                    that.roleObj.removeNode(selectedNode[0]);
                                }
                                that.roleObj.expandAll(true);
                                that.loadFlag2 = false;
                            } else if (!that.loadFlag3 && treeId == 'ul_group') {
                                that.groupObj.expandAll(true);
                                that.loadFlag3 = false;
                            }
                            if (callback) {
                                callback();
                            }
                        }
                    },
                    view: {
                        //addHoverDom:that.addHoverDom,
                        //removeHoverDom:that.removeHoverDom,
                        showTitle: false
                    }
                };
                return settings;
            },
            removeHoverDom: function removeHoverDom(treeId, treeNode) {
                if (treeId == 'ul_tree') {
                    $('#operate_space_' + treeNode.id).unbind().remove();
                    $('#operate_btn_add_' + treeNode.id).unbind().remove();
                    $('#operate_btn_edit_' + treeNode.id).unbind().remove();
                    $('#operate_btn_remove_' + treeNode.id).unbind().remove();
                }
            },
            //添加编辑删除添加图标在treenode后
            addHoverDom: function addHoverDom(treeId, treeNode) {
                if (treeId == 'ul_tree') {
                    var aObj = $('#' + treeNode.tId + '_a');
                    if ($('#operate_space_' + treeNode.id).length > 0) return;
                    var operateStr = "<span id='operate_space_" + treeNode.id + "'>&nbsp;</span>" + "<a class='font-green' href='javascript:;' title='添加' id='operate_btn_add_" + treeNode.id + "' onclick='roleuser.page.tree.addRole(" + treeNode.id + ")'><span class='glyphicon glyphicon-plus'></span></a>" + "<a class='font-green' href='javascript:;' title='编辑' id='operate_btn_edit_" + treeNode.id + "' onclick='roleuser.page.tree.editRole(" + treeNode.id + ")'><span class='glyphicon glyphicon-edit'></span></a>" + "<a class='font-green' href='javascript:;' title='删除' id='operate_btn_remove_" + treeNode.id + "' onclick='roleuser.page.tree.deleteRole(" + treeNode.id + ")'><span class='glyphicon glyphicon-trash'></span></a>";
                    aObj.append(operateStr);
                }
            },
            reload: function reload() {
                var that = this;
                that.treeObj.reAsyncChildNodes(null, 'refresh');
                that.roleObj.reAsyncChildNodes(null, 'refresh');
            }
        },
        modal: {
            title: '',
            type: '',
            roleId: 0,
            init: function init() {
                var that = this;
                appCommon.jqueryCache('#div_role').on('shown.bs.modal', function (e) {
                    appCommon.jqueryCache('#btn_chooseParentRole,#btn_chooseRole').html('<i class="fa fa-ellipsis-h"></i>');
                });
                if (that.type == 'user') {
                    appCommon.jqueryCache('#span_usertitle').text(that.title);
                } else if (that.type == 'role') {
                    appCommon.jqueryCache('#span_roletitle').text(that.title);
                } else if (that.type == 'group') {
                    appCommon.jqueryCache('#btn_chooseGroupConfirm').on('click', function () {
                        that.chooseGroupConfirm();
                    });
                } else if (that.type == 'preview') {
                    appCommon.jqueryCache('#h4_previewrole').text(that.title);
                }
            },
            show: function show() {
                var that = this;
                if (that.type == 'user') {
                    appCommon.jqueryCache('#modal_user').modal('show');
                } else if (that.type == 'role') {
                    roleuser.page.tree.initPRole();
                    appCommon.jqueryCache('#modal_role').modal('show');
                } else if (that.type == 'parentRole') {
                    roleuser.page.tree.initPRole();
                    appCommon.jqueryCache('#div_role').modal('show');
                } else if (that.type == 'preview') {
                    roleuser.page.form.initAuthority(that.roleId, true, function () {
                        roleuser.page.tree.initPreview(that.roleId);
                    });
                    $('#ul_tab-preview a:first').tab('show');
                    appCommon.jqueryCache('#div_powerpreview').modal('show');
                }
            },
            close: function close() {
                var that = this;
                if (that.type == 'user') {
                    appCommon.jqueryCache('#modal_user').modal('hide');
                } else if (that.type == 'role') {
                    appCommon.jqueryCache('#modal_role').modal('hide');
                } else if (that.type == 'parentRole') {
                    appCommon.jqueryCache('#div_role').modal('hide');
                } else if (that.type == 'preview') {
                    appCommon.jqueryCache('#div_powerpreview').modal('hide');
                }
            }
        },
        form: {
            type: '',
            el: {
                $role: appCommon.jqueryCache('#form_role'),
                $user: appCommon.jqueryCache('#form_user')
            },
            operateFlag: '',
            oldAccount: '',
            oldRoleName: '',
            currChannelAuth: '',
            loadGroupTime: 0, //标志首次打开组权限tab
            isExistRole: undefined,
            isExistUser: undefined,
            hasRealPlay: false,
            hasPlayback: false,
            roleAuthority: {
                M_A: [12, 13, 19, 20, 206, 300, 62, 15, 32, 210],
                M_B: [301, 302, 38],
                M_C: [303, 304, 305, 314],
                M_D: [306, 207],
                M_E: [308, 309, 310, 213],
                M_F: [311],
                M_G: [312, 313],
                M_H: [],
                M_I: [2200, 2201, 2202, 2205, 2207, 2209, 2210, 2218, 2224, 2203, 2226, 2223, 6106, 2221, 2214, 2215, 2220, 2225, 2229, 2227]
            }, //角色的模块权限
            init: function init() {
                var that = this;
                that.checkboxOperate();
                that.addValidate();
                that.addEventListener();
                //添加编辑角色表单中表格head的初始化
                $('#div_moduletitle').html('<label class="mt-checkbox mt-checkbox-outline" id="div_moduleall" style="margin-bottom:0;font-weight:700;">' + '<input type="checkbox" id="checkbox_moduleall"><span></span>' + lang['all'] + '</label>');
                appCommon.jqueryCache('#inp_validend').datepicker({
                    format: 'yyyy-mm-dd',
                    orientation: 'bottom',
                    autoclose: true,
                    startDate: '+0d', //设置只能从今天开始选择,
                    language: roleuser.lang
                });
            },
            addEventListener: function addEventListener() {
                var that = this;
                appCommon.jqueryCache('#btn_chooseGroup').on('click', function () {
                    that.chooseGroup();
                });
                appCommon.jqueryCache('#btn_chooseRole,#btn_chooseParentRole').on('click', function (e) {
                    if ($(this).prop('id') == 'btn_chooseRole') {
                        appCommon.jqueryCache('#btn_chooseRole').html('<i class="fa fa-spin fa-spinner"></i>');
                    } else {
                        appCommon.jqueryCache('#btn_chooseParentRole').html('<i class="fa fa-spin fa-spinner"></i>');
                    }
                    that.chooseRole();
                });
                appCommon.jqueryCache('#btn_submitrole').on('click', function () {
                    appCommon.jqueryCache('#inp_rolename').addClass('ignore');
                    //编辑角色提交时，如果角色名没有改变则不进行验证重复
                    var _newName = $.trim(appCommon.jqueryCache('#inp_rolename').val());
                    if (that.operateFlag == 'editRole') {
                        if (_newName == that.oldRoleName) {
                            var pname = appCommon.jqueryCache('#inp_parentrolename').val();
                            if (_newName != '' && pname != '' && pname == _newName) {
                                lavaMsg.alert(lang.cannotChooseSelf, 'danger');
                            } else {
                                that.el.$role.submit();
                                return;
                            }
                        }
                    }
                    appCommon.jqueryCache('#inp_rolename').removeClass('ignore');
                    var pname = appCommon.jqueryCache('#inp_parentrolename').val();
                    if (_newName != '' && pname != '' && pname == _newName) {
                        lavaMsg.alert(lang.cannotChooseSelf, 'danger');
                    } else {
                        that.el.$role.submit();
                    }
                });
                appCommon.jqueryCache('#btn_submituser').on('click', function () {
                    appCommon.jqueryCache('#inp_username').addClass('ignore');
                    appCommon.jqueryCache('#inp_password').addClass('ignore');
                    appCommon.jqueryCache('#inp_passwordrepeat').addClass('ignore');
                    var _newName = $.trim(appCommon.jqueryCache('#inp_username').val());
                    var password = appCommon.jqueryCache('#inp_password').val();
                    if (that.operateFlag == 'editUser') {
                        if (_newName == that.oldAccount && !password) {
                            that.el.$user.submit();
                            return;
                        } else {
                            if (_newName != that.oldAccount) {
                                appCommon.jqueryCache('#inp_username').removeClass('ignore');
                            }
                            if (password) {
                                appCommon.jqueryCache('#inp_password').removeClass('ignore');
                                appCommon.jqueryCache('#inp_passwordrepeat').removeClass('ignore');
                            }
                            that.el.$user.submit();
                            return;
                        }
                    }
                    appCommon.jqueryCache('#inp_username').removeClass('ignore');
                    appCommon.jqueryCache('#inp_password').removeClass('ignore');
                    appCommon.jqueryCache('#inp_passwordrepeat').removeClass('ignore');
                    that.el.$user.submit();
                });
                //将previousValue数据移除，解决remote缓存问题
                appCommon.jqueryCache('#inp_username').change(function () {
                    appCommon.jqueryCache('#inp_username').removeData('previousValue');
                });
                appCommon.jqueryCache('#inp_rolename').change(function () {
                    appCommon.jqueryCache('#inp_rolename').removeData('previousValue');
                });
                //给上面通道的checkbox添加change事件
                $('#tab_channel').delegate('input.channel', 'change', function (e) {
                    if ($(this).prop('checked')) {
                        roleuser.page.tree.setChannelCheck($(this).val(), true);
                    } else {
                        roleuser.page.tree.setChannelCheck($(this).val(), false);
                    }
                });
                //不能输入空格
                $('#inp_username, #inp_rolename').on('keydown', function (e) {
                    if (e.keyCode === 32) {
                        return false;
                    }
                });
            },
            addValidate: function addValidate() {
                var that = this;
                $.extend($.validator.messages, {
                    remote: window.lang.existErrorPlacement,
                    equalTo: window.lang.pswRepeatErrorPlacement
                });
                $.validator.addMethod('SafeChar', function (value) {
                    var reg = appCommon.regExpress().dangerChar;
                    if (reg.test(value.trim())) {
                        return false;
                    } else {
                        return true;
                    }
                }, window.lang.illegalChar);
                $.validator.addMethod('PasswordChar', function (value) {
                    var reg = appCommon.regExpress().passwordChar;
                    if (reg.test(value.trim())) {
                        return true;
                    } else {
                        return false;
                    }
                }, window.lang.passwordFormat);
                //form_user的验证
                that.validObj = that.el.$user.validate({
                    ignore: '.ignore',
                    errorElement: 'p',
                    errorClass: 'help-block', //给错误提示添加class
                    focusInvalid: false,
                    rules: {
                        account: {
                            SafeChar: true,
                            required: true,
                            maxlength: 20,
                            remote: {
                                url: '../../../user/exist/account',
                                data: {
                                    account: function account() {
                                        return $.trim($('#inp_username').val());
                                    }
                                }
                            }
                        },
                        password: {
                            PasswordChar: true,
                            required: true,
                            minlength: 8,
                            maxlength: 50
                        },
                        passwordRepeat: {
                            required: true,
                            equalTo: '#inp_password'
                        },
                        groupName: {
                            maxlength: 50,
                            required: true
                        },
                        email: {
                            maxlength: 50,
                            email: true
                        },
                        phone: {
                            maxlength: 50,
                            digits: true
                        },
                        flowVal: {
                            required: true,
                            digits: true
                        },
                        flowAlarmVal: {
                            digits: true,
                            range: [1, 100]
                        }
                    },
                    success: function success(error, element) {
                        $(element).closest('.form-group').removeClass('has-error').find('p').remove();
                    },
                    errorPlacement: function errorPlacement(error, element) {
                        var $parent = $(element).parent();
                        $(element).closest('.form-group').addClass('has-error');
                        $(element).closest('.form-group').append(error);
                    },
                    highlight: function highlight(element) {
                        $(element).closest('.form-group').addClass('has-error');
                    },
                    unhighlight: function unhighlight(element) {
                        $(element).closest('.form-group').removeClass('has-error');
                    },
                    submitHandler: function submitHandler(form) {
                        //提交未返回结果前将按钮禁用
                        appCommon.jqueryCache('#btn_submituser').attr('disabled', true);
                        var _data = that.getUserData();
                        //添加用户
                        if (that.operateFlag == 'addUser') {
                            //再次验重，避免因为网络原因之前的验证有问题
                            that.validateUserName(_data.account, function () {
                                if (that.isExistUser) {
                                    appCommon.jqueryCache('#inp_username').closest('.form-group').addClass('has-error').append('<p id="inp_username-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                } else {
                                    appCommon.jqueryCache('#inp_username').closest('.form-group').removeClass('has-error');
                                    appCommon.jqueryCache('#inp_username-error').html('');
                                    //_data=_data+"&logContent="+appCommon.jqueryCache("#inp_username").val();
                                    // _data.logContent = appCommon.jqueryCache("#inp_username").val();
                                    lavaMsg.loading(true);
                                    appCommon.ajax('../../../user/create', 'post', 'json', _data, function (data) {
                                        lavaMsg.loading(false);
                                        that.handleUserResult(data);
                                    });
                                }
                            });
                            //编辑用户
                        } else if (that.operateFlag == 'editUser') {
                            //如果没有ignore类，则说明已经修改用户名，需要验重复
                            if (!appCommon.jqueryCache('#inp_username').hasClass('ignore')) {
                                that.validateUserName(_data.account, function () {
                                    if (that.isExistUser) {
                                        appCommon.jqueryCache('#inp_username').closest('.form-group').addClass('has-error').append('<p id="inp_username-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                    } else {
                                        appCommon.jqueryCache('#inp_username').closest('.form-group').removeClass('has-error');
                                        appCommon.jqueryCache('#inp_username-error').html('');
                                        //_data=_data+"&logContent="+that.oldAccount;
                                        // _data.logContent = that.oldAccount;
                                        lavaMsg.loading(true);
                                        appCommon.ajax('../../../user/update', 'post', 'json', _data, function (data) {
                                            lavaMsg.loading(false);
                                            that.handleUserResult(data);
                                        });
                                    }
                                });
                            } else {
                                appCommon.jqueryCache('#inp_username').closest('.form-group').removeClass('has-error');
                                appCommon.jqueryCache('#inp_username-error').html('');
                                //_data=_data+"&logContent="+that.oldAccount;
                                // _data.logContent = that.oldAccount;
                                lavaMsg.loading(true);
                                appCommon.ajax('../../../user/update', 'post', 'json', _data, function (data) {
                                    lavaMsg.loading(false);
                                    that.handleUserResult(data);
                                });
                            }
                        }
                    }
                });
                //form_role的验证
                that.validObj2 = that.el.$role.validate({
                    ignore: '.ignore',
                    errorElement: 'p',
                    errorClass: 'help-block',
                    focusInvalid: false,
                    rules: {
                        name: {
                            SafeChar: true,
                            maxlength: 50,
                            required: true,
                            remote: {
                                url: '../../../role/exist/name',
                                data: {
                                    name: function name() {
                                        return $.trim($('#inp_rolename').val());
                                    }
                                }
                            }
                        },
                        pname: {
                            required: true
                        }
                    },
                    success: function success(error, element) {
                        $(element).closest('.form-group').removeClass('has-error').find('p').remove();
                    },
                    errorPlacement: function errorPlacement(error, element) {
                        $(element).closest('.form-group').addClass('has-error');
                        $(element).closest('.form-group').append(error);
                    },
                    highlight: function highlight(element) {
                        $(element).closest('.form-group').addClass('has-error');
                    },
                    unhighlight: function unhighlight(element) {
                        $(element).closest('.form-group').removeClass('has-error');
                    },
                    submitHandler: function submitHandler(form) {
                        appCommon.jqueryCache('#btn_submitrole').attr('disabled', true);
                        var _data = that.getRoleData();
                        var _modules = _data.module;
                        var group = _data.group;
                        //先判断是否选择模块权限和组权限
                        if (_modules.length <= 0) {
                            lavaMsg.alert(lang.chooseModulePrompt, 'info');
                            appCommon.jqueryCache('#btn_submitrole').removeAttr('disabled');
                        } else if (group.length <= 0) {
                            lavaMsg.alert(lang.chooseGroupPrompt, 'info');
                            appCommon.jqueryCache('#btn_submitrole').removeAttr('disabled');
                        } else if (_modules.split(',').indexOf('207') != -1 && !/207-1|207-2|207-3/g.test(_data.command)) {
                            //判断选择了报警联动策略配置,是否选择了至少一个操作权限@wzz0521
                            lavaMsg.alert(lang.chooseAlarmStrategyPower, 'info');
                            appCommon.jqueryCache('#btn_submitrole').removeAttr('disabled');
                        } else {
                            //编辑角色
                            if (that.operateFlag == 'editRole') {
                                if (!appCommon.jqueryCache('#inp_rolename').hasClass('ignore')) {
                                    that.validateRoleName(_data.name, function () {
                                        if (that.isExistRole) {
                                            appCommon.jqueryCache('#inp_rolename').closest('.form-group').addClass('has-error').append('<p id="inp_rolename-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                        } else {
                                            appCommon.jqueryCache('#inp_rolename').closest('.form-group').removeClass('has-error');
                                            appCommon.jqueryCache('#inp_rolename-error').html('');
                                            _data.logContent = that.oldRoleName;
                                            lavaMsg.loading(true);
                                            appCommon.ajax('../../../role/update', 'post', 'json', _data, function (data) {
                                                lavaMsg.loading(false);
                                                that.handleRoleResult(data);
                                            });
                                        }
                                    });
                                } else {
                                    appCommon.jqueryCache('#inp_rolename').closest('.form-group').removeClass('has-error');
                                    appCommon.jqueryCache('#inp_rolename-error').html('');
                                    _data.logContent = that.oldRoleName;
                                    lavaMsg.loading(true);
                                    appCommon.ajax('../../../role/update', 'post', 'json', _data, function (data) {
                                        lavaMsg.loading(false);
                                        that.handleRoleResult(data);
                                    });
                                }
                                //添加角色
                            } else if (that.operateFlag == 'addRole') {
                                that.validateRoleName(_data.name, function () {
                                    if (that.isExistRole) {
                                        appCommon.jqueryCache('#inp_rolename').closest('.form-group').addClass('has-error').append('<p id="inp_rolename-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                    } else {
                                        appCommon.jqueryCache('#inp_rolename').closest('.form-group').removeClass('has-error');
                                        appCommon.jqueryCache('#inp_rolename-error').html('');
                                        _data.logContent = appCommon.jqueryCache('#inp_rolename').val();
                                        lavaMsg.loading(true);
                                        appCommon.ajax('../../../role/create', 'post', 'json', _data, function (data) {
                                            lavaMsg.loading(false);
                                            that.handleRoleResult(data);
                                        });
                                    }
                                });
                            }
                        }
                    }
                });
            },
            validateRoleName: function validateRoleName(value, callback) {
                var that = this;
                appCommon.ajax('../../../role/exist/name', 'get', 'json', { name: $.trim(value) }, function (data) {
                    that.isExistRole = !data;
                    if (callback) {
                        callback();
                    }
                });
            },
            validateUserName: function validateUserName(value, callback) {
                var that = this;
                appCommon.ajax('../../../user/exist/name', 'get', 'json', { name: $.trim(value) }, function (data) {
                    that.isExistUser = !data;
                    if (callback) {
                        callback();
                    }
                });
            },
            checkboxOperate: function checkboxOperate() {
                var that = this;
                appCommon.jqueryCache('#tbl_rolepower').delegate("input[type='checkbox']", 'change', function (e) {
                    if ($(this).prop('id') == 'checkbox_moduleall') {
                        if ($(this).prop('checked')) {
                            $('.subModule').prop('checked', true);
                            $('.command').prop('checked', true);
                            $('.firstModule').prop('checked', true);
                        } else {
                            $('.subModule').prop('checked', false);
                            $('.command').prop('checked', false);
                            $('.firstModule').prop('checked', false);
                        }
                    } else if (e.target.className == 'subModule') {
                        //取消勾选模块，后面的操作也取消勾选,反之亦然
                        if (!$(this).prop('checked')) {
                            $(this).parent().parent().nextAll('td').find('input').prop('checked', false);
                        } else {
                            $(this).parent().parent().nextAll('td').find('input').prop('checked', true);
                            var module = $(this).val();
                            if (module == '19,20') {
                                $("input[value='A']").prop('checked', true);
                            }
                            for (var attr in that.roleAuthority) {
                                var subModuleStr = '|' + that.roleAuthority[attr].join('|');
                                if (subModuleStr.indexOf('|' + module) > -1) {
                                    $("input[value='" + attr.split('_')[1] + "']").prop('checked', true);
                                }
                            }
                        }
                    } else if (e.target.className == 'command') {
                        //勾选操作，对应模块也被勾选
                        if ($(this).prop('checked')) {
                            var command = $(this).attr('value');
                            var commandArray = command.split('-');
                            if (/^(19|20)$/.test(commandArray[0])) {
                                $("input[value='19,20']").prop('checked', true);
                                $("input[value='A']").prop('checked', true);
                            } else {
                                var module = commandArray[0];
                                $("input[value='" + module + "']").prop('checked', true);
                                for (var attr in that.roleAuthority) {
                                    var subModuleStr = '|' + that.roleAuthority[attr].join('|');
                                    if (subModuleStr.indexOf('|' + module) > -1) {
                                        $("input[value='" + attr.split('_')[1] + "']").prop('checked', true);
                                    }
                                }
                            }
                        }
                    } else if (e.target.className == 'firstModule') {
                        var firstModule = $(this).val();
                        for (var attr in that.roleAuthority) {
                            if (attr == 'M_' + firstModule) {
                                var subModule = that.roleAuthority[attr];
                                //角色用户单独处理
                                if (attr == 'M_A') {
                                    if ($("input[value='19,20']")) {
                                        if ($(this).prop('checked')) {
                                            $("input[value='19,20']").prop('checked', true);
                                            $("input[value='19,20']").parent().parent().nextAll('td').find('input').prop('checked', true);
                                        } else {
                                            $("input[value='19,20']").prop('checked', false);
                                            $("input[value='19,20']").parent().parent().nextAll('td').find('input').prop('checked', false);
                                        }
                                    }
                                }
                                for (var i = 0; i < subModule.length; i++) {
                                    if ($('input[value=' + subModule[i] + ']')) {
                                        if ($(this).prop('checked')) {
                                            $('input[value=' + subModule[i] + ']').prop('checked', true);
                                            $('input[value=' + subModule[i] + ']').parent().parent().nextAll('td').find('input').prop('checked', true);
                                        } else {
                                            $('input[value=' + subModule[i] + ']').prop('checked', false);
                                            $('input[value=' + subModule[i] + ']').parent().parent().nextAll('td').find('input').prop('checked', false);
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            },
            initAuthority: function initAuthority(id, isPreview, callback) {
                var that = this;
                var url = '';
                that.hasRealPlay = false;
                that.hasPlayback = false;
                if (id) {
                    url = '../../../role/' + id;
                } else {
                    url = '../../../role/' + roleuser.page.tree.checkedRoleId;
                }
                appCommon.ajax(url, 'get', 'json', {}, function (data) {
                    if (data.code == 200) {
                        if (data.result) {
                            var authority = data.result.authority;
                            //过滤掉报表导出权限
                            for (var i in authority) {
                                if (parseInt(authority[i].module) >= 2200 && parseInt(authority[i].module) <= 8000) {
                                    if (parseInt(authority[i].module) == 2201) {
                                        for (var j in authority[i].command) {
                                            if (authority[i].command[j] == '2201-g') {
                                                authority[i].command = ['2201-g'];
                                            }
                                        }
                                    } else {
                                        authority[i].command = [];
                                    }
                                } else if (parseInt(authority[i].module) == 6106) {
                                    authority[i].command = [];
                                }
                            }
                            //先对权限排序
                            authority = authority.sort(function (a, b) {
                                if (a.module == '48') {
                                    a.module = '303';
                                }
                                if (a.module == '49') {
                                    a.module = '308';
                                }
                                if (b.module == '48') {
                                    b.module = '303';
                                }
                                if (b.module == '49') {
                                    b.module = '308';
                                }
                                if (parseInt(a.module) && parseInt(b.module)) {
                                    return a.module - b.module;
                                } else {
                                    if (parseInt(a.module) && !parseInt(b.module)) {
                                        return 1;
                                    }
                                    if (!parseInt(a.module) && parseInt(b.module)) {
                                        return -1;
                                    }
                                    if (!parseInt(a.module) && !parseInt(b.module)) {
                                        return a.module.charCodeAt() - b.module.charCodeAt();
                                    }
                                }
                            });
                            for (i = 0; i < authority.length; i++) {
                                if (authority[i].module && authority[i].module == '303') {
                                    if (authority[i - 1] && authority[i - 1].module && authority[i - 1].module == '303') {
                                        if (authority[i].command.length > 0) {
                                            authority[i - 1].command = authority[i].command;
                                        } else {
                                            authority[i].command = authority[i - 1].command;
                                        }
                                    } else if (authority[i + 1] && authority[i + 1].module && authority[i + 1].module == '303') {
                                        if (authority[i].command.length > 0) {
                                            authority[i + 1].command = authority[i].command;
                                        } else {
                                            authority[i].command = authority[i + 1].command;
                                        }
                                    }
                                }
                                if (authority[i].module == '308') {
                                    if (authority[i - 1] && authority[i - 1].module && authority[i - 1].module == '308') {
                                        if (authority[i].command.length > 0) {
                                            authority[i - 1].command = authority[i].command;
                                        } else {
                                            authority[i].command = authority[i - 1].command;
                                        }
                                    } else if (authority[i + 1] && authority[i + 1].module && authority[i + 1].module == '308') {
                                        if (authority[i].command.length > 0) {
                                            authority[i + 1].command = authority[i].command;
                                        } else {
                                            authority[i].command = authority[i + 1].command;
                                        }
                                    }
                                }
                            }
                            that.currChannelAuth = data.result.channelpower;
                            //先过滤下权限
                            var authorityHtml = {};
                            for (var i = 0; i < authority.length; i++) {
                                var module = authority[i].module;
                                //把20单独出来是因为M_20语言包中没有
                                if (lang['M_' + module] || lang['C_M_' + module] || module == 20) {
                                    //如果从客户端跳转过来的则隐藏web上的模块权限
                                    if (roleuser.isJump) {
                                        if (module == '38' || module == '48' || module == '49') {
                                            continue;
                                        }
                                    }
                                    //把角色用户的模块id换成语言包中的19
                                    if (module == 20) {
                                        authority[i].module = 19;
                                        module = authority[i].module;
                                    }
                                    //与cb2上的回放直通权限保持一致
                                    if (module == '48') {
                                        module = '303';
                                    }
                                    if (module == '49') {
                                        module = '308';
                                    }
                                    if (module == 303) {
                                        if (that.hasRealPlay) {
                                            continue;
                                        }
                                        that.hasRealPlay = true;
                                    }
                                    if (module == 308) {
                                        if (that.hasPlayback) {
                                            continue;
                                        }
                                        that.hasPlayback = true;
                                    }
                                    //一级模块
                                    if (/^[A-I]$/.test(module)) {
                                        if (authorityHtml['M_' + module] === undefined) {
                                            authorityHtml['M_' + module] = { html: '', subModule: [] };
                                        }
                                        //组装一级模块的html
                                        var html = '<td {rowspan}>{0}</td>';
                                        var data = [];
                                        if (isPreview) {
                                            data.push(lang['M_' + module]);
                                        } else {
                                            var mLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='firstModule' type='checkbox' value='" + module + "'>" + '<span></span></label>';
                                            data.push(mLabel + lang['M_' + module]);
                                        }
                                        html = appCommon.strReplace(html, data);
                                        authorityHtml['M_' + module]['html'] = html;
                                    } else {
                                        for (var attr in that.roleAuthority) {
                                            var subModuleStr = '|' + that.roleAuthority[attr].join('|');
                                            if (subModuleStr.indexOf('|' + module) > -1) {
                                                //先判断有没有对应的模块数组，如果没有先初始化
                                                if (!authorityHtml[attr]) {
                                                    authorityHtml[attr] = { html: '', subModule: [] };
                                                    //组装一级模块的html
                                                    var html = '<td {rowspan}>{0}</td>';
                                                    var data = [];
                                                    if (isPreview) {
                                                        data.push(lang[attr]);
                                                    } else {
                                                        var mLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='firstModule' type='checkbox' value='" + attr.split('_')[1] + "'>" + '<span></span></label>';
                                                        data.push(mLabel + lang[attr]);
                                                    }
                                                    html = appCommon.strReplace(html, data);
                                                    authorityHtml[attr]['html'] = html;
                                                } else if (!authorityHtml[attr]['subModule']) {
                                                    authorityHtml[attr]['subModule'] = [];
                                                }
                                                var submodule = {};
                                                var existRoleUser = false;
                                                var index = 0;
                                                //如果是用户角色 先判断有无用户角色模块
                                                if (module == 19 || module == 20) {
                                                    if (authorityHtml[attr]['subModule'].length > 0) {
                                                        for (var k = 0; k < authorityHtml[attr]['subModule'].length; k++) {
                                                            if (authorityHtml[attr]['subModule'][k].module == 19) {
                                                                existRoleUser = true;
                                                                submodule = authorityHtml[attr]['subModule'][k];
                                                                index = k;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                                //如果不存在角色用户，则新建一个module对象以存储子模块信息
                                                if (!existRoleUser) {
                                                    submodule.module = module;
                                                }
                                                //组装二级模块和对应操作权限的html
                                                var html = '<tr><td>{0}</td><td>{1}</td></tr>';
                                                var data = [];
                                                var smLang = '';
                                                var mVal = module;
                                                if (lang['M_' + module]) {
                                                    if (isPreview) {
                                                        if (module == '38' || module == '48' || module == '49') {
                                                            smLang = lang['M_' + module] + '(web)';
                                                        } else {
                                                            smLang = lang['M_' + module];
                                                        }
                                                    } else {
                                                        if (/^(19|20)$/.test(module)) {
                                                            mVal = '19,20';
                                                        }
                                                        var smLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='subModule' type='checkbox' value='" + mVal + "'>" + '<span></span></label>';
                                                        if (module == '38' || module == '48' || module == '49') {
                                                            smLang = smLabel + lang['M_' + module] + '(web)';
                                                        } else {
                                                            smLang = smLabel + lang['M_' + module];
                                                        }
                                                    }
                                                } else if (lang['C_M_' + module]) {
                                                    if (isPreview) {
                                                        smLang = lang['C_M_' + module];
                                                    } else {
                                                        if (/^(19|20)$/.test(module)) {
                                                            mVal = '19,20';
                                                        }
                                                        var smLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='subModule' type='checkbox' value='" + mVal + "'>" + '<span></span></label>';
                                                        smLang = smLabel + lang['C_M_' + module];
                                                    }
                                                }
                                                data.push(smLang);
                                                var commands = [];
                                                for (var j = 0; j < authority[i].command.length; j++) {
                                                    var commandLang = '';
                                                    if (/^(19|20)$/.test(module)) {
                                                        commandLang = lang['C_' + authority[i].command[j]];
                                                    } else {
                                                        //去掉基础信息管理里面的导出和转租，修改注册转发
                                                        if (authority[i].command[j] != '12-i' && authority[i].command[j] != '13-ac' && authority[i].command[j] != '13-u') {
                                                            if (lang['C_' + authority[i].command[j].split('-')[1]]) {
                                                                commandLang = lang['C_' + authority[i].command[j].split('-')[1]];
                                                            } else if (lang['C_C_' + authority[i].command[j]]) {
                                                                commandLang = lang['C_C_' + authority[i].command[j]];
                                                            } else if (lang['C_' + authority[i].command[j]]) {
                                                                commandLang = lang['C_' + authority[i].command[j]];
                                                            }
                                                        }
                                                    }
                                                    if (commandLang && !isPreview) {
                                                        var cLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='command' type='checkbox' value='" + authority[i].command[j] + "'>" + '<span></span></label>';
                                                        commandLang = cLabel + commandLang;
                                                    }
                                                    //右键设置和报警策略比较挤
                                                    if (module == '301' || module == '207') {
                                                        //预览每排1个
                                                        if (isPreview) {
                                                            if (commandLang && commands.length !== 0 && commands.length % 1 === 0) {
                                                                commandLang = '</br>' + commandLang;
                                                            }
                                                        } else {
                                                            //非预览每排只要2个
                                                            if (commandLang && commands.length !== 0 && commands.length % 2 === 0) {
                                                                commandLang = '</br>' + commandLang;
                                                            }
                                                        }
                                                    } else {
                                                        //如果已经存在用户角色的操作权限，则判断下已经存在的是否已经有3个了
                                                        if (existRoleUser) {
                                                            if (submodule.html.match(/&nbsp;/g) && submodule.html.match(/&nbsp;/g).length >= 2 && commands.length === 0) {
                                                                commandLang = '</br>' + commandLang;
                                                            }
                                                        } else {
                                                            if (commandLang && commands.length !== 0 && commands.length % 3 === 0) {
                                                                commandLang = '</br>' + commandLang;
                                                            }
                                                        }
                                                    }

                                                    if (commandLang) {
                                                        commands.push(commandLang + '&nbsp;');
                                                    }
                                                }
                                                //快速添加后的操作改为角色用户，车辆车组的相关的添加操作
                                                if (module == 62) {
                                                    data.push(lang['C_19-e'] + '&nbsp;' + lang['C_20-e'] + '&nbsp;' + lang['C_e'] + lang['M_12'] + '&nbsp;</br>' + lang['C_e'] + lang['M_13']);
                                                } else {
                                                    data.push(commands.join(''));
                                                }
                                                html = appCommon.strReplace(html, data);
                                                if (existRoleUser) {
                                                    html = html.replace(/<tr><td>.*<\/td><td>/, '').replace('</tr>', '').replace('</td>', '');
                                                    submodule.html = submodule.html.replace(/<\/td><\/tr>$/, html + '</td></tr>');
                                                    authorityHtml[attr]['subModule'][index] = submodule;
                                                } else {
                                                    submodule.html = html;
                                                    authorityHtml[attr]['subModule'].push(submodule);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            //wzz 2018-05-04 对设备远程升级权限显示处理(在M_A基础管理模块中)
                            if (authorityHtml['M_A']) {
                                for (var i = 0; i < authorityHtml['M_A'].subModule.length; i++) {
                                    if (authorityHtml['M_A'].subModule[i].module == 32) {
                                        authorityHtml['M_A'].subModule[i].html = authorityHtml['M_A'].subModule[i].html.replace(/<\/td><td>/g, "</td><td style='display:none;>'");
                                        authorityHtml['M_A'].subModule[i].html = authorityHtml['M_A'].subModule[i].html.replace(/<\/td><\/tr>/g, '</td><td></td></tr>');
                                        break;
                                    }
                                }
                            }
                            var lastHtml = [];
                            //对authorityHtml中的子的模块排序
                            for (var attr in authorityHtml) {
                                if (authorityHtml[attr].subModule && authorityHtml[attr].subModule.length > 0) {
                                    var subModules = authorityHtml[attr].subModule;
                                    subModules.sort(function (a, b) {
                                        var module1 = a.module;
                                        var module2 = b.module;
                                        return module1 - module2;
                                    });
                                    var totalModule = subModules.length;
                                    if (totalModule > 1) {
                                        authorityHtml[attr].html = authorityHtml[attr].html.replace('{rowspan}', 'rowspan=' + totalModule);
                                    } else {
                                        authorityHtml[attr].html = authorityHtml[attr].html.replace('{rowspan}', '');
                                    }
                                    if (totalModule > 0) {
                                        for (var i = 0; i < subModules.length; i++) {
                                            if (i === 0) {
                                                subModules[i] = subModules[i].html.replace('<tr>', '<tr>' + authorityHtml[attr].html);
                                            } else {
                                                subModules[i] = subModules[i].html;
                                            }
                                        }
                                    }
                                    lastHtml.unshift(subModules.join(''));
                                } else {
                                    authorityHtml[attr].html = authorityHtml[attr].html.replace('{rowspan}', '');

                                    lastHtml.push('<tr>' + authorityHtml[attr].html + '<td></td><td></td></tr>');
                                }
                            }
                            if (isPreview) {
                                appCommon.jqueryCache('#tbody_authority_preview').html(lastHtml.reverse().join(''));
                            } else {
                                appCommon.jqueryCache('#tbody_authority').html(lastHtml.reverse().join(''));
                            }
                            if (callback) {
                                callback();
                            }
                        }
                    }
                });
            },
            //初始化通道树上面的总通道的勾选框
            initTotalChnnl: function initTotalChnnl(total, callback) {
                var that = this;
                var htmlArr = [];
                //通道id从0开始
                var chekAllHtml = "<label class='mt-checkbox mt-checkbox-outline'><input class='channel' type='checkbox' id='chk_allChnnl'><span></span></label><span style='padding-right:10px;'>" + lang.all + '</span>';
                htmlArr.push(chekAllHtml);
                for (var i = 0; i < total; i++) {
                    var html = "<label class='mt-checkbox mt-checkbox-outline'><input class='channel' type='checkbox' value='totalChnnl_" + i + "'><span></span></label><span class='sp_channel'>" + (i + 1) + '</span>';
                    if (i != 1 && i % 8 == 1) {
                        html = '<br>' + html;
                    }
                    htmlArr.push(html);
                }
                window.appCommon.jqueryCache('#div_totalchnnelcheck').html(htmlArr);
                //@wzz0518 通道添加全部勾选与取消操作
                $('#chk_allChnnl').prop('checked', true);
                //全部勾选与取消事件
                $('#chk_allChnnl').on('change', function () {
                    setTimeout(function () {
                        var chlTreeObj = $.fn.zTree.getZTreeObj('ul_channel');
                        if ($('#chk_allChnnl').prop('checked')) {
                            $('input.channel').prop('checked', true);
                            chlTreeObj.checkAllNodes(true);
                        } else {
                            $('input.channel').prop('checked', false);
                            chlTreeObj.checkAllNodes(false);
                        }
                    }, 10);
                });
                if (callback) {
                    callback();
                }
            },
            //添加编辑后结果处理
            handleUserResult: function handleUserResult(data) {
                lavaMsg.loading(false);
                if (data.code == 200) {
                    if (data.result) {
                        lavaMsg.alert(lang.operateSuccess, 'success');
                        roleuser.page.table.reload('');
                        roleuser.page.modal.type = 'user';
                        roleuser.page.modal.close();
                    } else {
                        lavaMsg.alert(lang.operateFail, 'danger');
                        appCommon.jqueryCache('#btn_submituser').removeAttr('disabled');
                    }
                } else {
                    lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    appCommon.jqueryCache('#btn_submituser').removeAttr('disabled');
                }
            },
            handleRoleResult: function handleRoleResult(data) {
                if (data.code == 200) {
                    if (data.result) {
                        lavaMsg.alert(lang.operateSuccess, 'success');
                        roleuser.page.tree.reload();
                        roleuser.page.modal.type = 'role';
                        roleuser.page.modal.close();
                    } else {
                        lavaMsg.alert(lang.operateFail, 'danger');
                        appCommon.jqueryCache('#btn_submitrole').removeAttr('disabled');
                    }
                } else {
                    lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    appCommon.jqueryCache('#btn_submitrole').removeAttr('disabled');
                }
            },
            clearData: function clearData() {
                var that = this;
                if (that.type == 'role') {
                    //清除验证信息
                    that.el.$role.validate().resetForm();
                    roleuser.page.tree.treeObj.checkAllNodes(false);
                    appCommon.jqueryCache('#inp_rolename').removeClass('ignore');
                    that.el.$role.find('input[type="text"],input[type="hidden"],textarea').val('');
                    that.el.$role.find('input[type="checkbox"]').prop('checked', false);
                    //默认填充所属角色
                    appCommon.jqueryCache('#inp_parentroleid').val(roleuser.page.tree.checkedRoleId);
                    appCommon.jqueryCache('#inp_parentrolename').val(roleuser.page.tree.checkedRoleName);
                    //将tab切换到模块tab
                    roleuser.page.tab.show(roleuser.page.tab.el.moduleTab);
                    //根据选择的角色id 加载最大通道数
                    that.getMaxChannel(function (result) {
                        that.initTotalChnnl(result, function () {
                            //默认勾选所有通道使能
                            for (var i = 0; i < result; i++) {
                                $("input[value='totalChnnl_" + i + "']").prop('checked', true);
                            }
                        });
                    });
                    // that.initTotalChnnl(32, function(){
                    //     //默认勾选所有通道使能
                    //     for (var i = 1; i < 33; i++) {
                    //         $("input[value='totalChnnl_" + i + "']").prop("checked", true);
                    //     }
                    // });
                } else if (that.type == 'user') {
                    //清除验证前先清除流量配置值的ignore
                    $('#inp_flowVal').removeClass('ignore');
                    $('#inp_flowAlarmVal').removeClass('ignore');
                    //清除验证信息
                    that.el.$user.validate().resetForm();
                    appCommon.jqueryCache('#inp_username').removeClass('ignore');
                    appCommon.jqueryCache('#inp_password').removeClass('ignore');
                    appCommon.jqueryCache('#inp_passwordrepeat').removeClass('ignore');
                    that.el.$user.find('input[type="text"],input[type="hidden"],textarea').val('');
                    that.el.$user.find('input[type="password"]').val('');
                    //默认填充所属角色
                    appCommon.jqueryCache('#inp_prole').val(roleuser.page.tree.checkedRoleName);
                    appCommon.jqueryCache('#inp_proleid').val(roleuser.page.tree.checkedRoleId);
                    //appCommon.jqueryCache("#inp_validend").val(appCommon.formatDate(new Date(),false,"yyyy-MM-dd"));
                    appCommon.jqueryCache('#inp_validend').val('');
                    //恢复用户默认最大通道数
                    appCommon.jqueryCache('#inp_maxchncount').val(roleuser.defChannelCount).trigger('change');
                    //用户唯一性登录使能关
                    appCommon.jqueryCache('#chk_onlyLoginPower').prop('checked', false);
                    //隐藏流量控制
                    roleuser.page.flow.hideFlowControlInfo();
                }
            },
            getMaxChannel: function getMaxChannel(callback) {
                appCommon.ajax('../../../vehicle/channel/max', 'GET', 'json', {}, function (result) {
                    if (result.code == 200) {
                        if (result.result) {
                            if (callback) {
                                callback(result.result);
                            }
                        }
                    }
                });
            },
            fillData: function fillData(data) {
                var that = this;
                var _data = data;
                if (that.type == 'role') {
                    that.oldRoleName = _data.name;
                    //保存当前角色的通道权限
                    that.currChannelAuth = _data.channelpower;
                    //清除验证信息
                    that.el.$role.validate().resetForm();
                    appCommon.jqueryCache('#inp_rolename').addClass('ignore');
                    appCommon.jqueryCache('#inp_password').addClass('ignore');
                    appCommon.jqueryCache('#inp_passwordrepeat').addClass('ignore');
                    appCommon.jqueryCache('#inp_rolename').val(_data.name);
                    appCommon.jqueryCache('#inp_roleid').val(_data.id);
                    appCommon.jqueryCache('#inp_parentrolename').val(_data.pname);
                    appCommon.jqueryCache('#inp_parentroleid').val(_data.pid);
                    that.checkAuthority(_data.authority);
                    that.checkGroup(_data.id);
                } else if (that.type == 'user') {
                    that.oldAccount = data.account;
                    //清除验证信息
                    that.el.$user.validate().resetForm();
                    appCommon.jqueryCache('#inp_username').addClass('ignore');
                    appCommon.jqueryCache('#inp_password').addClass('ignore');
                    appCommon.jqueryCache('#inp_passwordrepeat').addClass('ignore');
                    appCommon.jqueryCache('#inp_username').val(data.account);
                    appCommon.jqueryCache('#inp_phonenumber').val(data.phone);
                    appCommon.jqueryCache('#inp_email').val(data.email);
                    appCommon.jqueryCache('#inp_userid').val(data.id);
                    appCommon.jqueryCache('#inp_prole').val(data.rolename);
                    appCommon.jqueryCache('#inp_proleid').val(data.roleid);
                    appCommon.jqueryCache('#inp_validend').val(data.validend);
                    appCommon.jqueryCache('#inp_maxchncount').val(data.chncount).trigger('change');
                    //用户登录唯一性使能
                    if (data.uniquelogin == 0) {
                        appCommon.jqueryCache('#chk_onlyLoginPower').prop('checked', false);
                    } else if (data.uniquelogin == 1) {
                        appCommon.jqueryCache('#chk_onlyLoginPower').prop('checked', true);
                    }
                    //流量控制数据填充
                    if (data.flowcontrol == 1) {
                        //流量限制开启
                        roleuser.page.flow.showFlowControlInfo(data);
                    }
                }
            },
            checkGroup: function checkGroup(id) {
                var that = this;
                appCommon.ajax('../../../common/simple-tree/' + id, 'get', 'json', {}, function (data) {
                    //勾选当前角色的组权限
                    var result = data.result;
                    var node;
                    for (var i = 0; i < result.length; i++) {
                        node = roleuser.page.tree.groupObj.getNodeByParam('id', result[i].id);
                        roleuser.page.tree.groupObj.checkNode(node, true);
                        if (result[i].children) {
                            that.tranverseNode(result[i].children);
                        }
                    }
                });
            },
            //遍历勾选node
            tranverseNode: function tranverseNode(data) {
                var that = this;
                for (var i = 0; i < data.length; i++) {
                    var node = roleuser.page.tree.groupObj.getNodeByParam('id', data[i].id);
                    roleuser.page.tree.groupObj.checkNode(node, true);
                    if (data[i].children) {
                        that.tranverseNode(data[i].children);
                    }
                }
            },
            checkAuthority: function checkAuthority(authority) {
                //勾选当前角色的模块权限
                var that = this;
                var _authority = null;
                if (authority instanceof Array) {
                    _authority = authority;
                    that.checkModuleCommand(_authority);
                } else {
                    appCommon.ajax('../../../role/' + authority, 'get', 'json', {}, function (data) {
                        if (data.code == 200) {
                            if (data.result) {
                                _authority = data.result.authority;
                                that.checkModuleCommand(_authority);
                            }
                        }
                    });
                }
                //如果模块全部勾选 则勾选全部
                if ($('#tbody_authority').find("input[type='checkbox']").prop('checked')) {
                    $('#checkbox_moduleall').prop('checked', true);
                } else {
                    $('#checkbox_moduleall').prop('checked', false);
                }
            },
            checkModuleCommand: function checkModuleCommand(_authority) {
                for (var i = 0; i < _authority.length; i++) {
                    var module = _authority[i].module;
                    if (module == 19 || module == 20) {
                        module = '19,20';
                    }
                    if (module == 48) {
                        module = '303';
                    }
                    if (module == 49) {
                        module = '308';
                    }
                    var commands = _authority[i].command;
                    if ($("input[value='" + module + "']")) {
                        $("input[value='" + module + "']").prop('checked', true);
                    }
                    for (var j = 0; j < commands.length; j++) {
                        if ($("input[value='" + commands[j] + "']")) {
                            $("input[value='" + commands[j] + "']").prop('checked', true);
                        }
                    }
                }
            },
            getGroup: function getGroup() {
                var that = this;
                var nodes = roleuser.page.tree.groupObj.getCheckedNodes(true);
                var idArray = [];
                var nameArray = [];
                var ids = [];
                var names = [];
                for (var i = 0; i < nodes.length; i++) {
                    if (!nodes[i].getCheckStatus().half) {
                        idArray.push(nodes[i].id);
                        nameArray.push(nodes[i].name);
                    }
                }
                //数组的复制是引用传值，用concat复制数组不会影响原数组
                //http://blog.csdn.net/kongjiea/article/details/23360937
                ids = idArray.concat();
                names = nameArray.concat();
                for (var i = 0; i < ids.length; i++) {
                    var node = roleuser.page.tree.groupObj.getNodeByParam('id', ids[i]);
                    if (node.getParentNode() && that.arrayIndexOf(ids, node.getParentNode().id) > -1) {
                        //如果父节点被勾选则将当前结点去掉
                        that.arrayRemove(idArray, ids[i]);
                        that.arrayRemove(nameArray, names[i]);
                    }
                }
                //appCommon.jqueryCache("#inp_groupauthority").val(nameArray.join(","));
                appCommon.jqueryCache('#inp_groupids').val(idArray.join(','));
                return appCommon.jqueryCache('#inp_groupids').val();
            },
            //获取所有没有父节点的组节点
            getAllGroup: function getAllGroup() {
                var groups = [];
                var nodes = roleuser.page.tree.groupObj.getNodesByFilter(function (node) {
                    if (node.getParentNode()) {
                        return false;
                    } else {
                        return true;
                    }
                });
                for (var i = 0; i < nodes.length; i++) {
                    groups.push(nodes[i].id);
                }
                return groups.join(',');
            },
            arrayIndexOf: function arrayIndexOf(arr, val) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] == val) {
                        return i;
                    }
                }
                return -1;
            },
            arrayRemove: function arrayRemove(arr, val) {
                var that = this;
                var index = that.arrayIndexOf(arr, val);
                if (index > -1) {
                    arr.splice(index, 1);
                }
            },
            chooseRole: function chooseRole() {
                roleuser.page.modal.type = 'parentRole';
                roleuser.page.modal.init();
                roleuser.page.modal.show();
            },
            getModules: function getModules() {
                var $module = $('.firstModule');
                var $subModule = $('.subModule');
                var modules = [];
                $module.each(function (index, obj) {
                    if ($(obj).prop('checked')) {
                        modules.push($(obj).val());
                    }
                });
                $subModule.each(function (index, obj) {
                    if ($(obj).prop('checked')) {
                        modules.push($(obj).val());
                    }
                });
                return modules.join(',');
            },
            //获取未勾选的通道 {vid:,channel:}
            getChannel: function getChannel() {
                if (roleuser.page.tree.channelObj) {
                    var nodes = roleuser.page.tree.channelObj.getCheckedNodes(false);
                    var channelpowers = [];
                    if (nodes.length > 0) {
                        for (var i = 0; i < nodes.length; i++) {
                            var channelpower = { vid: 0, channel: '' };
                            //过滤通道
                            if (nodes[i].icon.indexOf('webcam.min.png') > -1) {
                                var pNode = nodes[i].getParentNode();
                                if (pNode.icon.indexOf('car.min.png') > -1) {
                                    var vid = pNode.id;
                                    var isExist = false;
                                    for (var j = 0; j < channelpowers.length; j++) {
                                        if (vid == channelpowers[j].vid) {
                                            isExist = true;
                                            channelpowers[j].channel = channelpowers[j].channel ? channelpowers[j].channel + ',' + nodes[i].id : nodes[i].id;
                                        }
                                    }
                                    if (!isExist) {
                                        channelpower.vid = pNode.id;
                                        channelpower.channel = '' + nodes[i].id;
                                        channelpowers.push(channelpower);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    channelpowers = [];
                }
                return JSON.stringify(channelpowers);
            },
            getCommands: function getCommands() {
                var $commands = $('.command');
                var commands = [];
                $commands.each(function (index, obj) {
                    if ($(obj).prop('checked')) {
                        //非报表
                        if ($(obj).val().indexOf(',') <= -1) {
                            commands.push($(obj).val());
                        } else {
                            commands.push($(obj).val().split(',')[1]);
                        }
                    }
                });
                return commands.join(',');
            },
            getUserData: function getUserData() {
                var that = this;
                var result = {};
                var array = appCommon.jqueryCache('#form_user').serializeArray();
                for (var i = 0; i < array.length; i++) {
                    result[array[i]['name']] = array[i]['value'];
                }
                //密码rsa加密
                result.password = encodeURIComponent(appCommon.encryptRSAStr(roleuser.rsapublickey, result.password));
                result.validend = $('#inp_validend').val();
                //最大通道数，唯一性登录，流量控制日志内容
                var userControl = result.userControl == 'on' ? lang.yes : lang.no;
                result.logContent = lang.maxChannelCount + ':' + result.chncount + ';' + lang.uniqueLogin + ':' + userControl;
                return result;
            },
            getRoleData: function getRoleData() {
                var that = this;
                var data = {};
                data.id = appCommon.jqueryCache('#inp_roleid').val();
                data.pid = appCommon.jqueryCache('#inp_parentroleid').val();
                data.name = appCommon.jqueryCache('#inp_rolename').val();
                data.command = that.getCommands();
                data.module = that.getModules();
                data.group = that.getGroup();
                data.channelpower = that.getChannel();
                return data;
            }
        },
        //角色权限的tab
        tab: {
            el: {
                tabUl: '#ul_tab',
                channelTab: "#ul_tab a[href='#tab_channel']",
                moduleTab: "#ul_tab a[href='#tab_module']"
            },
            init: function init() {
                var that = this;
                that.addEventListener();
            },
            addEventListener: function addEventListener() {
                var that = this;
                $(that.el.channelTab).on('show.bs.tab', function () {
                    //添加时直接勾选所有通道
                    if (roleuser.page.form.operateFlag == 'addRole') {
                        var ids = roleuser.page.form.getGroup();
                        roleuser.page.tree.initChannel(ids, true, function () {
                            //默认勾选所有通道
                            roleuser.page.tree.channelObj.checkAllNodes(true);
                        });
                    } else {
                        //编辑时勾选当前角色具有的通道
                        var ids = roleuser.page.form.getGroup();
                        roleuser.page.tree.initChannel(ids, true, function () {
                            roleuser.page.tree.setChannelCheckByAuth(roleuser.page.form.currChannelAuth);
                        });
                    }
                });
            },
            show: function show(target) {
                $(target).tab('show');
            }
        },
        //用户流量控制
        flow: {
            init: function init() {
                var that = this;
                //勾选事件绑定
                $('#checkbox_flowPower').on('click', function () {
                    if ($('#checkbox_flowPower').prop('checked')) {
                        $('#div_flowConf').removeClass('hidden');
                        $('#inp_flowVal').removeClass('ignore');
                        $('#inp_flowAlarmVal').removeClass('ignore');
                    } else {
                        $('#div_flowConf').addClass('hidden');
                        $('#inp_flowVal').addClass('ignore');
                        $('#inp_flowAlarmVal').addClass('ignore');
                    }
                });
                //初始化添加流量树
                that.addFlowTree.init();
                that.addValidateFlow();
            },
            //隐藏流量控制相关信息
            hideFlowControlInfo: function hideFlowControlInfo() {
                $('#checkbox_flowPower').prop('checked', false);
                $('#inp_flowAlarmVal').addClass('ignore');
                $('#inp_flowVal').addClass('ignore');
                $('#div_flowConf').addClass('hidden');
            },
            //显示流量控制相关信息
            showFlowControlInfo: function showFlowControlInfo(data) {
                $('#checkbox_flowPower').prop('checked', true);
                //开启流量配置值验证
                $('#inp_flowAlarmVal').removeClass('ignore');
                $('#inp_flowVal').removeClass('ignore');
                $('#inp_flowVal').val(data.totalflow);
                $('#inp_flowAlarmVal').val(data.alertvalue);
                //套餐类型选择
                $('input:radio[name=flowType][value=' + data.flowtype + ']').prop('checked', true);
                //填充原套餐类型,判定套餐类型是否改变
                $('#old_flowType').val(data.flowtype);
                $('#old_flowAlarmVal').val(data.alertvalue);
                $('#div_flowConf').removeClass('hidden');
            },
            //添加流量包按钮点击
            addFlow: function addFlow() {
                var that = this;
                $('#form_addFlow')[0].reset();
                $('#form_addFlow').validate().resetForm();
                //显示模态框
                $('#modal_addFlow').modal('show');
                that.addFlowTree.init();
            },
            //添加流量包树
            addFlowTree: {
                treeObj: null,
                init: function init() {
                    var that = this;
                    var url = '../../../common/user-tree?guid=' + new Date().getTime();
                    appCommon.ajax(url, 'get', 'json', {}, function (res) {
                        if (res.code == 200) {
                            $.fn.zTree.init($('#ul_flowRole'), that.getSettings(), res.result);
                            that.treeObj = $.fn.zTree.getZTreeObj('ul_flowRole');
                        }
                    });
                },
                getSettings: function getSettings() {
                    var setting = {};
                    return setting = {
                        check: {
                            enable: true
                        },
                        data: {
                            simpleData: {
                                enable: true
                            }
                        }
                    };
                }
            },
            //流量包添加验证数字
            addValidateFlow: function addValidateFlow() {
                var that = this;
                $('#form_addFlow').validate({
                    ignore: '.ignore',
                    errorElement: 'p',
                    errorClass: 'help-block',
                    focusInvalid: false,
                    debug: true,
                    rules: {
                        flowPackage: {
                            required: true,
                            digits: true,
                            min: 10
                        }
                    },
                    success: function success(error, element) {
                        $(element).closest('.form-group').removeClass('has-error').find('p').remove();
                    },
                    errorPlacement: function errorPlacement(error, element) {
                        $(element).closest('.form-group').addClass('has-error');
                        $(element).closest('.form-group').append(error);
                    },
                    highlight: function highlight(element) {
                        $(element).closest('.form-group').addClass('has-error');
                    },
                    unhighlight: function unhighlight(element) {
                        $(element).closest('.form-group').removeClass('has-error');
                    },
                    submitHandler: function submitHandler(form) {
                        //验证通过todo
                        var userIdArr = [];
                        var flowVal = $('#inp_flowPackage').val();
                        var nodes = that.addFlowTree.treeObj.getCheckedNodes(true);
                        for (var i = 0; i < nodes.length; i++) {
                            if (nodes[i].icon.indexOf('user.min.png') > 0) {
                                userIdArr.push(nodes[i].id);
                            }
                        }
                        if (nodes.length > 0) {
                            var ajaxData = {
                                flowVal: flowVal,
                                userIds: userIdArr.join(',')
                            };
                            appCommon.ajax('../../../user/addflow', 'post', 'json', ajaxData, function (res) {
                                if (res.code == 200 && res.result) {
                                    $('#modal_addFlow').modal('hide');
                                    lavaMsg.alert(lang.operateSuccess, 'info', 1000);
                                    roleuser.page.table.reload('');
                                } else {
                                    $('#modal_addFlow').modal('hide');
                                    lavaMsg.alert(appCommon.errorCode2Message(res.code), 'danger', 1000);
                                }
                            });
                        } else {
                            lavaMsg.alert(lang.chooseUser, 'warning', 1000);
                        }
                    }
                });
            },
            //确定添加流量包
            sureAddFlow: function sureAddFlow() {
                var that = this;
                //提交表单验证
                $('#form_addFlow').submit();
            }
        }
    }
};
window.onload = function () {
    appCommon.lang(function () {
        roleuser.rsapublickey = appCommon.getRSAPublicKey();
        roleuser.init();
    });
};