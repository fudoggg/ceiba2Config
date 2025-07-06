var _async;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var group = {
    uri: '/group',
    commonuri: '/common',
    lang: '',
    init: function init() {
        this.page.init();
    },
    page: {
        init: function init() {
            var that = this;
            //左侧树的关闭和打开
            $('#a_close').on('click', function (e) {
                $('#div_content').removeClass('col-lg-9').addClass('col-lg-12');
                $('#div_content').removeClass('col-md-8').addClass('col-md-12');
                $('#div_content').removeClass('col-sm-8').addClass('col-sm-12');
                $('#tb_grid').table('resize');
                $('#div_tree').css({ position: 'absolute', left: 0, zIndex: 100 }).animate({ left: -$('#div_tree').width() - 20 }, 500, function () {
                    $('#div_tree').hide();
                    $('#div_open').show();
                });
            });
            $('#div_open').on('click', function (e) {
                $('#div_open').hide();
                $('#div_tree').show().animate({ left: 0 }, 500, function () {
                    $('#div_tree').css({ position: 'relative' });
                    $('#div_content').removeClass('col-lg-12').addClass('col-lg-9');
                    $('#div_content').removeClass('col-md-12').addClass('col-md-8');
                    $('#div_content').removeClass('col-sm-12').addClass('col-sm-8');
                    $('#tb_grid').table('resize');
                });
            });
            group.lang = appCommon.getCookie('wcms5c', 'L');
            that.table.init();
            that.tree.init();
            that.modal.init();
            // switch(group.lang){
            //     case 'zh-CN':
            //         appCommon.loadScriptOrCss('script','../../../third-resource/metronic47/global/plugins/jquery-validation/js/localization/messages_zh.min.js',function(){
            //             group.page.form.init();
            //         });
            //         break;
            //     default:
            //         group.page.form.init();
            //         break;
            // }
            if (group.lang != 'en-US') {
                appCommon.loadScriptOrCss('script', '../../../third-resource/metronic47/global/plugins/jquery-validation/js/localization/messages_' + group.lang + '.min.js', function () {
                    group.page.form.init();
                });
            } else {
                group.page.form.init();
            }
        },
        table: {
            uploader: null,
            fileName: '',
            currGid: 0, //当前编辑的groupId
            init: function init() {
                var that = this;
                var footLanguage = {};
                footLanguage[group.lang] = {
                    total: lang.total,
                    from: lang.displaying,
                    to: lang.to
                };
                $('#tb_grid').table({
                    url: group.uri + '/items',
                    lang: group.lang,
                    checkbox: true,
                    frozenNumber: 0,
                    fit: true,
                    columnToggle: '#dropdown2',
                    orderType: 'desc',
                    defaultOrderColumn: 'groupName',
                    pagination: true,
                    pageSizeField: 'pageSize',
                    pageNumberField: 'pageIndex',
                    pageSize: 20,
                    footLanguage: footLanguage,
                    columns: [{ field: 'checkbox' }, { field: 'operate', width: 100, formatter: that.formatOperate }, { field: 'name', width: 150, order: true }, { field: 'pname', width: 150 }, { field: 'remark', width: 150 }],
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
                that.bindEvent();
            },
            bindEvent: function bindEvent() {
                var that = this;
                //添加
                $('#btn_addgroup').on('click', function () {
                    that.addGroup();
                });
                //搜索
                $('#inp_search').on('focus blur', function (e) {
                    if (e.type == 'focus') {
                        $('#inp_search').animate({ width: 350 }, 300);
                    } else {
                        $('#inp_search').animate({ width: 250 });
                    }
                });
                $('#inp_search').bind('keydown', function (e) {
                    if (e.keyCode == 13) {
                        that.searchGroup();
                    }
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
            formatOperate: function formatOperate(value, row, index) {
                //+index 避免时间差在1毫秒内
                var id = 'i_' + new Date().getTime() + index;
                return "<i class='fa fa-edit' onclick='group.page.table.editGroup(" + row.id + ")'></i>&nbsp;&nbsp;<i class='fa fa-trash-o' id='" + id + "' onclick='group.page.table.deleteGroup(" + row.id + ',"#' + id + '","' + row.name + '")\'></i>';
            },
            addGroup: function addGroup() {
                // if(!group.page.form.hasLoadGroup){//判断是否已经加载车组树
                //     group.page.tree.initGroupTree();
                //     group.page.form.hasLoadGroup=true;
                // }
                group.page.tree.initGroupTree();
                group.page.form.operateFlag = 'add';
                group.page.form.clearData();
                group.page.form.removeIgnorepGroup();
                $('#div_group').show();
                appCommon.jqueryCache('#btn_submitgroup').removeAttr('disabled');
                group.page.modal.title = window.lang.add;
                group.page.modal.show(group.page.modal.$el_groupinfo);
            },
            editGroup: function editGroup(id) {
                var that = this;
                // if(!group.page.form.hasLoadGroup){
                //     group.page.tree.initGroupTree(id);
                //     group.page.form.hasLoadGroup=true;
                // }
                group.page.tree.initGroupTree();
                group.page.form.operateFlag = 'edit';
                that.currGid = id;
                group.page.modal.title = window.lang.edit;
                var vid = id;
                group.page.form.clearData();
                appCommon.ajax(group.uri + '/' + id, 'GET', 'json', { id: vid }, function (data) {
                    if (data.code == 200) {
                        if (data.result) {
                            group.page.form.fillData(data.result[0]);
                            if (id == group.page.tree.rootGid) {
                                //根组的父组不能编辑
                                $('#div_group').hide();
                                group.page.form.ignorepGroup();
                            } else {
                                group.page.form.removeIgnorepGroup();
                                $('#div_group').show();
                            }
                            appCommon.jqueryCache('#btn_submitgroup').removeAttr('disabled');
                            group.page.modal.show(group.page.modal.$el_groupinfo);
                        } else {
                            lavaMsg.alert(lang['getInfoFail'], 'danger');
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                });
            },
            searchGroup: function searchGroup() {
                var _value = $('#inp_search').val();
                $('#tb_grid').table('load', { pid: group.page.tree.checkedGid, key: 'name', value: _value });
            },
            deleteGroup: function deleteGroup(id, element, name) {
                if (id) {
                    if (group.page.tree.rootGid == id) {
                        lavaMsg.alert(lang.cannotdeleteThis, 'danger');
                    } else {
                        if (element) {
                            lavaMsg.singleConfirm(element, lang.sureDeleteThis + '?', lang.sure, lang.cancel, function (r) {
                                if (r) {
                                    lavaMsg.confirm(lang.prompt, lang.sureDeleteThisConfirmAgain + '?', lang.sure, function (r) {
                                        if (r) {
                                            group.page.table.deleteConfirm({ ids: id, logContent: name });
                                        }
                                    });
                                }
                            });
                        } else {
                            lavaMsg.confirm(lang.prompt, lang.sureDeleteThese + '?', lang.sure, function (r) {
                                if (r) {
                                    lavaMsg.confirm(lang.prompt, lang.sureDeleteThisConfirmAgain + '?', lang.sure, function (r) {
                                        if (r) {
                                            var data = { ids: id, logContent: name };
                                            group.page.table.deleteConfirm(data);
                                        }
                                    });
                                }
                            });
                        }
                    }
                } else {
                    var rows = $('#tb_grid').table('getChecked');
                    var idArray = [];
                    var nameArray = [];
                    for (var i = 0; i < rows.length; i++) {
                        //如果包含根组，只提示不删除，但要删除其它所选组
                        if (rows[i].id != group.page.tree.rootGid) {
                            idArray.push(rows[i].id);
                            nameArray.push(rows[i].name);
                        }
                    }
                    if (idArray.length == 0) {
                        lavaMsg.alert(lang.chooseOneLeast, 'info');
                    } else {
                        group.page.table.deleteGroup(idArray.join(','), '', nameArray.join(','));
                    }
                }
            },
            deleteConfirm: function deleteConfirm(data) {
                appCommon.ajax(group.uri + '/delete/batch', 'post', 'json', data, function (data) {
                    if (data.code == 200) {
                        if (data.result) {
                            lavaMsg.alert(lang.operateSuccess, 'success');
                            group.page.tree.reload();
                        } else {
                            lavaMsg.alert(lang.operateFail, 'danger');
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                });
            },
            importData: function importData() {
                var that = this;
                $('#div_import').modal('show');
                $('#div_progressbar').css({ width: 0 });
                $('#div_filelist').hide();
                if (that.uploader) {
                    that.uploader.reset();
                    return;
                }
                window.setTimeout(function () {
                    //直接初始化上传组件在modal框下上传点击按钮不可用
                    that.uploader = WebUploader.create({
                        swf: '../../ThirdResource/webuploader/Uploader.swf',
                        server: '/upload',
                        pick: '#div_upload',
                        fileNumLimit: 1,
                        auto: true,
                        //chunked:true, //要后台支持才行
                        fileSizeLimit: 966367641600
                        //fileSizeLimit:32212254720
                    });
                    that.uploader.on('beforeFileQueued', function (file) {});
                    that.uploader.on('fileQueued', function (file) {
                        $('#div_filelist').show();
                        $('#div_filename').text(file.name);
                        that.fileName = file.name;
                        $('#div_state').text('');
                        $('#div_state').removeClass('font-green font-red');
                        $('#div_progressbar').css({ width: 0, height: 0, transition: 'none' });
                    });
                    that.uploader.on('uploadBeforeSend', function (obj, data) {
                        //data.fileName=that.fileName;
                    });
                    that.uploader.on('uploadProgress', function (file, percentage) {
                        $('#div_progressbar').css({ width: (percentage * 100).toFixed(0) + '%', height: '100%' });
                        $('#div_state').html('正在导入&nbsp;' + (percentage * 100).toFixed(0) + '%');
                    });
                    that.uploader.on('uploadSuccess', function (file, response) {
                        if (response.code == 200 && response.result) {
                            var filename = response.save_name;
                            var columnname = { name: '名称', pid: '父祖名', remark: '备注' };
                            appCommon.ajax(group.uri + '/import', 'post', 'json', { fileName: filename, columnName: columnname }, function (data) {
                                if (data.code == 200) {
                                    if (data.result) {
                                        $('#div_state').html('导入成功!').addClass('font-green');
                                    } else {
                                        $('#div_state').html('导入失败!').addClass('font-red');
                                    }
                                } else {
                                    $('#div_state').html('导入失败!').addClass('font-red');
                                }
                            });
                        } else {
                            $('#div_state').html('导入失败!').addClass('font-red');
                        }
                        that.uploader.reset();
                    });
                    that.uploader.on('uploadError', function (file) {
                        $('#div_state').html('导入失败!').addClass('danger');
                        that.uploader.reset();
                    });
                }, 500);
            },
            reload: function reload() {
                $('#tb_grid').table('load', { pid: group.page.tree.checkedGid, key: '', value: '' });
            }
        },
        tree: {
            checkedGid: 0,
            rootGid: 0,
            loadFlag1: false,
            loadFlag2: false,
            treeObj: null,
            parentObj: null,
            settings: {
                async: (_async = {
                    autoParam: ['id'],
                    enable: true,
                    contentType: 'application/x-www-form-urlencoded',
                    dataFilter: function dataFilter(treeId, parentNode, data) {
                        if (data.code == 200 && data.result) {
                            return data.result;
                        } else {
                            return [];
                        }
                    },
                    dataType: 'json'
                }, _defineProperty(_async, 'enable', true), _defineProperty(_async, 'otherParam', []), _defineProperty(_async, 'type', 'get'), _defineProperty(_async, 'url', '../../../common/simple-tree?guide=' + new Date().getTime()), _async),
                callback: {
                    onClick: function onClick(event, treeId, treeNode, clickFlag) {
                        if (treeId == 'ul_parentgroup') {
                            $('#inp_parentgroup').val(treeNode.name).focus().blur();
                            $('#inp_parentid').val(treeNode.id);
                            group.page.modal.close(group.page.modal.$el_pGroup);
                        } else if (treeId == 'ul_tree') {
                            group.page.tree.checkedGid = treeNode.id;
                            group.page.table.reload();
                        }
                    },
                    onAsyncSuccess: function onAsyncSuccess(event, treeId, treeNode) {
                        if (!group.page.tree.loadFlag1 && treeId == 'ul_tree') {
                            //$.fn.zTree.getZTreeObj("ul_tree").expandAll(false);
                            //初始加载第一个根节点下的数据
                            group.page.tree.treeObj.getNodesByFilter(function (node) {
                                if (node.level == 0) {
                                    if (group.page.tree.checkedGid == 0) {
                                        group.page.tree.rootGid = node.id;
                                    }
                                    group.page.tree.checkedGid = node.id;
                                }
                            });
                            var rootNode = group.page.tree.treeObj.getNodeByParam('id', group.page.tree.rootGid);
                            //@wzz0523 修改节点level == 0 为多个节点时的加载车组信息的bug
                            group.page.tree.checkedGid = rootNode.id;
                            //end
                            group.page.tree.treeObj.selectNode(rootNode);
                            group.page.table.reload();
                            group.page.tree.loadFlag1 = false;
                            //$("#ul_tree").parent().lavaLoading("hide");
                        } else if (!group.page.tree.loadFlag2 && treeId == 'ul_parentgroup') {
                            group.page.tree.parentObj.expandAll(true);
                            group.page.tree.loadFlag2 = false;
                            if (group.page.form.operateFlag == 'edit') {
                                //console.log(group.page.tree.parentObj.getNodes());
                                //@wzz0523 getNodesByFilter 里面removeNode 会报错
                                var selectNodeArr = group.page.tree.parentObj.getNodesByFilter(function (node) {
                                    if (node) {
                                        if (node.id == group.page.table.currGid) {
                                            return true;
                                            // group.page.tree.parentObj.removeNode(node);
                                        } else {
                                            return false;
                                        }
                                    }
                                });
                                group.page.tree.parentObj.removeNode(selectNodeArr[0]);
                            }
                        }
                    }
                }
            },
            init: function init() {
                var that = this;
                $.fn.zTree.init($('#ul_tree'), that.settings);
                that.treeObj = $.fn.zTree.getZTreeObj('ul_tree');
                //$("#ul_tree").parent().lavaLoading("show");
            },
            initGroupTree: function initGroupTree() {
                var that = this;
                $.fn.zTree.init($('#ul_parentgroup'), that.settings);
                that.parentObj = $.fn.zTree.getZTreeObj('ul_parentgroup');
            },
            reload: function reload() {
                var that = this;
                //$("#ul_tree").parent().lavaLoading("show");
                that.treeObj.reAsyncChildNodes(null, 'refresh');
                group.page.form.hasLoadGroup = false;
            }
        },
        modal: {
            title: '',
            $el_pGroup: $('#div_parentgroup'),
            $el_groupinfo: $('#modal'),
            init: function init() {
                var that = this;
                that.$el_pGroup.on('shown.bs.modal', function (e) {
                    $('#btn_chooseparent').html('<i class="fa fa-ellipsis-h"></i>');
                });
            },
            show: function show($el) {
                var that = this;
                if ($el.prop('id') == 'modal') {
                    $('#span_modaltitle').text(that.title);
                    $($el).modal('show');
                } else {
                    $($el).modal('show');
                }
            },
            close: function close($el) {
                $el.modal('hide');
            }
        },
        form: {
            operateFlag: '',
            oldName: '', //编辑之前的名称
            $el: appCommon.jqueryCache('#form_group'),
            hasLoadGroup: false, //标志是否已经加载车组树
            isExist: undefined, //车组名是否已经存在
            init: function init() {
                var that = this;
                $('#inp_desc').maxlength({
                    alwaysShow: true
                });
                that.addEventListener();
                that.addValidate();
            },
            addEventListener: function addEventListener() {
                var that = this;
                $('#btn_chooseparent').on('click', function () {
                    $('#btn_chooseparent').html('<i class="fa fa-spin fa-spinner"></i>');
                    group.page.modal.show(group.page.modal.$el_pGroup);
                });
                appCommon.jqueryCache('#btn_submitgroup').on('click', function () {
                    $('#inp_groupname').addClass('ignore');
                    var newName = appCommon.jqueryCache('#inp_groupname').val();
                    if (that.operateFlag == 'edit') {
                        if (newName == that.oldName) {
                            that.$el.submit();
                            return;
                        }
                    }
                    $('#inp_groupname').removeClass('ignore');
                    that.$el.submit();
                });
                //将previousValue数据移除，解决remote缓存问题
                appCommon.jqueryCache('#inp_groupname').change(function () {
                    appCommon.jqueryCache('#inp_groupname').removeData('previousValue');
                });
            },
            addValidate: function addValidate() {
                var that = this;
                $.extend($.validator.messages, { remote: window.lang.existErrorPlacement });
                $.validator.addMethod('SafeChar', function (value) {
                    var reg = appCommon.regExpress().dangerChar;
                    if (reg.test(value.trim())) {
                        return false;
                    } else {
                        return true;
                    }
                }, window.lang.illegalChar);
                that.validObj = that.$el.validate({
                    ignore: '.ignore',
                    errorElement: 'p',
                    errorClass: 'help-block',
                    focusInvalid: false,
                    rules: {
                        name: {
                            maxlength: 50,
                            required: true,
                            SafeChar: true,
                            remote: {
                                url: '../../../group/exist/name?guide=' + new Date().getTime(),
                                data: {
                                    name: function name() {
                                        return $.trim($('#inp_groupname').val());
                                    }
                                }
                            }
                        },
                        pname: {
                            required: true
                        },
                        remark: {
                            maxlength: 250
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
                        var _data = that.getData();
                        appCommon.jqueryCache('#btn_submitgroup').attr('disabled', true);
                        if (that.operateFlag == 'edit') {
                            if (!appCommon.jqueryCache('#inp_groupname').hasClass('ignore')) {
                                that.isExistName(_data.name, function () {
                                    if (that.isExist) {
                                        appCommon.jqueryCache('#inp_groupname').closest('.form-group').addClass('has-error');
                                        appCommon.jqueryCache('#inp_groupname').closest('.form-group').append('<p id="inp_carlicense-error" class="help-block" style="display: block;">' + lang['existErrorPlacement'] + '</p>');
                                    } else {
                                        appCommon.jqueryCache('#inp_groupname').closest('.form-group').removeClass('has-error');
                                        appCommon.jqueryCache('#inp_carlicense-error').html('');
                                        _data.logContent = that.oldName;
                                        lavaMsg.loading(true);
                                        appCommon.ajax(group.uri + '/update', 'post', 'json', _data, function (data) {
                                            that.handleResult(data);
                                        });
                                    }
                                });
                            } else {
                                appCommon.jqueryCache('#inp_groupname').closest('.form-group').removeClass('has-error');
                                appCommon.jqueryCache('#inp_carlicense-error').html('');
                                _data.logContent = that.oldName;
                                lavaMsg.loading(true);
                                appCommon.ajax(group.uri + '/update', 'post', 'json', _data, function (data) {
                                    that.handleResult(data);
                                });
                            }
                        } else if (that.operateFlag == 'add') {
                            lavaMsg.loading(true);
                            //提交前再次验重，避免网络不好之前的验重结果未返回
                            that.isExistName(_data.name, function () {
                                if (that.isExist) {
                                    appCommon.jqueryCache('#inp_groupname').closest('.form-group').addClass('has-error');
                                    appCommon.jqueryCache('#inp_groupname').closest('.form-group').append('<p id="inp_carlicense-error" class="help-block" style="display: block;">' + lang['existErrorPlacement'] + '</p>');
                                } else {
                                    appCommon.jqueryCache('#inp_groupname').closest('.form-group').removeClass('has-error');
                                    appCommon.jqueryCache('#inp_carlicense-error').html('');
                                    _data.logContent = appCommon.jqueryCache('#inp_groupname').val();
                                    appCommon.ajax(group.uri + '/create', 'post', 'json', _data, function (data) {
                                        that.handleResult(data);
                                    });
                                }
                            });
                        }
                    }
                });
                //appCommon.jqueryCache("#inp_groupname").attr("onkeyup","this.value=this.value.replace(appCommon.regExpress().dangerChar,'')");
            },
            isExistName: function isExistName(value, callback) {
                var that = this;
                appCommon.ajax('../../../group/exist/name', 'get', 'json', { name: $.trim(value) }, function (data) {
                    that.isExist = !data;
                    if (callback) {
                        callback();
                    }
                });
            },
            //添加编辑操作的结果判断
            handleResult: function handleResult(data) {
                lavaMsg.loading(false);
                if (data.code == 200) {
                    if (data.result) {
                        lavaMsg.alert(lang.operateSuccess, 'success');
                        group.page.modal.close(group.page.modal.$el_groupinfo);
                        group.page.tree.reload();
                    } else {
                        lavaMsg.alert(lang.operateFail, 'danger');
                        appCommon.jqueryCache('#btn_submitgroup').removeAttr('disabled');
                    }
                } else {
                    lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    appCommon.jqueryCache('#btn_submitgroup').removeAttr('disabled');
                }
            },
            fillData: function fillData(data) {
                var that = this;
                if (data) {
                    that.oldName = data.name;
                    $('#inp_groupname').addClass('ignore');
                    $('#inp_desc').val(data.remark);
                    $('#inp_parentid').val(data.pid);
                    $('#inp_groupid').val(data.id);
                    $('#inp_groupname').val(data.name);
                    $('#inp_parentgroup').removeAttr('readonly');
                    $('#inp_parentgroup').val(data.pname);
                    $('#inp_parentgroup').attr('readonly', true);
                }
            },
            clearData: function clearData() {
                var that = this;
                //清除验证信息
                that.$el.validate().resetForm();
                $('#inp_groupname').removeClass('ignore');
                that.$el.find('input,textarea').val('');
                //默认父角色为当前选择的角色
                var pname = group.page.tree.treeObj.getNodeByParam('id', group.page.tree.checkedGid).name;
                appCommon.jqueryCache('#inp_parentgroup').val(pname);
                appCommon.jqueryCache('#inp_parentid').val(group.page.tree.checkedGid);
            },
            getData: function getData() {
                var that = this;
                var data = {};
                data.pid = $('#inp_parentid').val();
                data.name = $.trim($('#inp_groupname').val());
                data.remark = $('#inp_desc').val();
                data.id = $('#inp_groupid').val();
                return data;
            },
            ignorepGroup: function ignorepGroup() {
                $('#inp_parentgroup').addClass('ignore');
            },
            removeIgnorepGroup: function removeIgnorepGroup() {
                $('#inp_parentgroup').removeClass('ignore');
            }
        }
    }
};
window.onload = function () {
    appCommon.lang(function () {
        group.init();
    });
};