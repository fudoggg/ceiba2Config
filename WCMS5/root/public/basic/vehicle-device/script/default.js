var vehicledevice = {
    rsapublickey: '', //rsa公钥
    lang: '',
    init: function init() {
        var that = this;
        that.page.init();
    },
    page: {
        init: function init() {
            var that = this;
            //左侧树的开关
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
            appCommon.jqueryCache('#i_refresh').on('click', function () {
                that.tree.reload();
            });
            vehicledevice.lang = appCommon.getCookie('wcms5c', 'L');
            that.tree.init();
            that.table.init();
            that.modal.init();
            that.importUploader.init();
            if (vehicledevice.lang != 'en-US') {
                appCommon.loadScriptOrCss('script', '../../../third-resource/metronic47/global/plugins/jquery-validation/js/localization/messages_' + vehicledevice.lang + '.min.js', function () {
                    appCommon.loadScriptOrCss('script', '../../../third-resource/metronic47/global/plugins/bootstrap-datepicker/locales/bootstrap-datepicker.' + vehicledevice.lang + '.min.js', function () {
                        appCommon.jqueryCache('#div_platecolor').removeClass('hidden');
                        vehicledevice.page.form.init();
                    });
                });
            } else {
                vehicledevice.page.form.init();
            }
        },
        table: {
            init: function init() {
                var that = this;
                var footLanguage = {};
                footLanguage[vehicledevice.lang] = {
                    total: lang.total,
                    from: lang.displaying,
                    to: lang.to
                };
                $('#tb_grid').table({
                    url: '../../../vehicle/items',
                    checkbox: true,
                    frozenNumber: 4,
                    fit: true,
                    pageSizeField: 'pageSize',
                    pageNumberField: 'pageIndex',
                    columnToggle: '#dropdown2',
                    orderType: 'desc',
                    defaultOrderColumn: 'groupName',
                    pageSize: 20,
                    footLanguage: footLanguage,
                    columns: [{ field: 'checkbox' }, { field: 'operate', width: 100, formatter: that.formatOperate }, { field: 'name', width: 150 }, { field: 'carlicense', width: 150, order: true, formatter: that.formatCarLicense }, { field: 'deviceno', width: 150, order: true }, { field: 'type', width: 150, formatter: that.formatterType }, { field: 'sim', width: 120 }, { field: 'imei', width: 80 }, { field: 'imsi', width: 80 }, { field: 'moduletype', width: 120, formatter: that.formatModuleType }, { field: 'channel', width: 80, formatter: that.formatNum }, { field: 'channelenable', width: 120, formatter: that.formatChnnlEnable }, { field: 'deviceusername', width: 120 }, { field: 'devicepassword', width: 120 }, { field: 'transmitip', width: 125 }, { field: 'transmitport', width: 120 },
                    //新增字段
                    { field: 'vehicletype', width: 120, formatter: that.formatVehicleType }, { field: 'factorygrade', width: 150 }, { field: 'seatnumber', width: 150, formatter: that.formatSeatNumber }, { field: 'enginenumber', width: 125 }, { field: 'chassisnumber', width: 110 }, { field: 'fueltype', width: 120, formatter: that.formatFulType }, { field: 'roadnumber', width: 125 }, { field: 'roadlevel', width: 120, formatter: that.formatRoadLevel }, { field: 'validitydate', width: 100 }, { field: 'fuelconsumption', width: 190 }, { field: 'province', width: 110 }, { field: 'city', width: 100 }, { field: 'factorynumber', width: 125 }, { field: 'factorytime', width: 120 }, { field: 'installuser', width: 100 }, { field: 'installtime', width: 120 }, { field: 'peripheral', width: 125 }],
                    loadFilter: function loadFilter(data) {
                        if (data && data.code == 200 && data.result) {
                            return { total: data.result.count, rows: data.result.items };
                        } else {
                            return { total: 0, rows: [] };
                        }
                    },
                    onLoadSuccess: function onLoadSuccess() {
                        //修改勾选部分列,更新车辆信息表格展示的问题
                        $('#dropdown ul li a span.span-checkbox').each(function () {
                            if (!$(this).hasClass('span-checkbox-checked')) {
                                $(this).click();
                            }
                        });
                    },
                    lang: vehicledevice.lang
                });
                appCommon.jqueryCache('#inp_search').on('focus blur', function (e) {
                    if (e.type == 'focus') {
                        appCommon.jqueryCache('#inp_search').animate({ width: 350 }, 300);
                    } else {
                        appCommon.jqueryCache('#inp_search').animate({ width: 250 });
                    }
                });
                appCommon.jqueryCache('#inp_search').bind('keydown', function (e) {
                    if (e.keyCode == 13) {
                        that.searchVehicle();
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
                //下载模板点击事件
                appCommon.jqueryCache('#downloadBtn').on('click', function () {
                    var langType = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'L');
                    var dir = window.encodeURIComponent(window.btoa('locale/' + langType + '/vehicle-template.xlsx'));
                    var fileName = window.encodeURIComponent(lang.M_13 + '-' + lang.template + '.xlsx');
                    appCommon.downloadFile('/download/origin/file?dir=' + dir + '&fileName=' + fileName);
                });
                //表格初始化时对列展示下拉列表高度做初始化
                that.initDropDown2Height();
                window.onresize = function () {
                    that.initDropDown2Height();
                };
            },
            formatterType: function formatterType(value, row, index) {
                if (value == 4) {
                    return 'N9M';
                } else if (value == 1) {
                    return 'MDVR';
                } else {
                    return lang['others'];
                }
            },
            formatOperate: function formatOperate(value, row, index) {
                var id = 'i_' + new Date().getTime() + index;
                return "<i class='fa fa-edit' onclick='vehicledevice.page.table.editVehicle(" + row.id + ")'></i>&nbsp;&nbsp;<i class='fa fa-trash-o' id='" + id + "' onclick='vehicledevice.page.table.deleteVehicle(" + row.id + ',"#' + id + '","' + row.carlicense + '")\'></i>';
            },
            formatCarLicense: function formatCarLicense(value, row, index) {
                var color = '';
                switch (row.platecolor) {
                    case '1':
                        color = 'blue';
                        break;
                    case '2':
                        color = 'yellow';
                        break;
                    case '3':
                        color = 'black';
                        break;
                    case '4':
                        color = 'white';
                        break;
                    case '5':
                        color = 'green';
                        break;
                    case '9':
                        color = 'other';
                        break;
                    default:
                        color = 'other';
                        break;
                }
                return appCommon.formatCarlicense(color, value);
            },
            formatChnnlEnable: function formatChnnlEnable(value, row, index) {
                var total = row.channel;
                var channelname = [];
                if (row.channelname) {
                    channelname = row.channelname.split(',');
                } else {
                    for (var i = 0; i < total; i++) {
                        channelname.push(i + 1);
                    }
                }
                if (channelname.length > 0) {
                    for (var i = 0; i < channelname.length; i++) {
                        if (channelname[i] == '') {
                            channelname[i] = i + 1;
                        }
                    }
                }
                var enable = '';
                if (value !== undefined) {
                    enable = parseInt(value).toString(2);
                    if (enable == '-1') {
                        for (var i = 0; i < total; i++) {
                            if (i == 0) {
                                enable = '1';
                            } else {
                                enable = '1' + enable;
                            }
                        }
                    }
                    if (enable.length > 0 && enable.length < total) {
                        var length = enable.length;
                        for (var i = 0; i < total - length; i++) {
                            enable = '0' + enable;
                        }
                    }
                    var enableArr = enable.split('');
                    var htmlArr = [];
                    for (var i = 0; i < enableArr.length; i++) {
                        if (enableArr[i] === '0') {
                            htmlArr[enableArr.length - i - 1] = "<a class='font-red' title='" + channelname[enableArr.length - i - 1] + "'><i class='fa fa-close'></i></a>";
                        } else {
                            htmlArr[enableArr.length - i - 1] = "<a class='font-green' title='" + channelname[enableArr.length - i - 1] + "'><i class='fa fa-check'></i></a>";
                        }
                    }
                    return htmlArr ? htmlArr.join('') : '';
                }
            },
            formatModuleType: function formatModuleType(value, row, index) {
                var moduleType = '';
                switch (row.moduletype) {
                    case '0':
                        moduleType = 'GPRS';
                        break;
                    case '1':
                        moduleType = 'CDMA';
                        break;
                    case '2':
                        moduleType = 'EVDO';
                        break;
                    case '3':
                        moduleType = 'WCDMA';
                        break;
                    case '4':
                        moduleType = 'EDGE';
                        break;
                    case '5':
                        moduleType = 'TDSCDMA';
                        break;
                    case '6':
                        moduleType = 'LTE-TDD';
                        break;
                    case '7':
                        moduleType = 'LTE-FDD';
                        break;
                }
                return moduleType;
            },
            formatFulType: function formatFulType(value, row, index) {
                var fuleType = '';
                switch (row.fueltype) {
                    case '1':
                        fuleType = window.lang.gasoline;
                        break;
                    case '2':
                        fuleType = window.lang.dieseloil;
                        break;
                    case '3':
                        fuleType = window.lang.naturalgas;
                        break;
                    case '4':
                        fuleType = window.lang.liquidgas;
                        break;
                    case '5':
                        fuleType = window.lang.electricpower;
                        break;
                    case '6':
                        fuleType = window.lang.others;
                        break;
                }
                return fuleType;
            },
            formatRoadLevel: function formatRoadLevel(value, row, index) {
                var roadLevel = '';
                switch (row.roadlevel) {
                    case '0':
                        roadLevel = window.lang.nonrating;
                        break;
                    case '1':
                        roadLevel = window.lang.classA;
                        break;
                    case '2':
                        roadLevel = window.lang.classB;
                        break;
                    case '3':
                        roadLevel = window.lang.classC;
                        break;
                    case '9':
                        roadLevel = window.lang.failtoreachthestandard;
                        break;
                }
                return roadLevel;
            },
            formatVehicleType: function formatVehicleType(value, row, index) {
                var vehicleType = '';
                switch (row.vehicletype) {
                    case '10':
                        vehicleType = window.lang.passengerCar;
                        break;
                    case '11':
                        vehicleType = window.lang.largeBus;
                        break;
                    case '12':
                        vehicleType = window.lang.mediumPassengerCar;
                        break;
                    case '13':
                        vehicleType = window.lang.smallPassengerCar;
                        break;
                    case '14':
                        vehicleType = window.lang.Sedan;
                        break;
                    case '15':
                        vehicleType = window.lang.largeBerthBus;
                        break;
                    case '16':
                        vehicleType = window.lang.mediumBerthBus;
                        break;
                    case '20':
                        vehicleType = window.lang.generalGreightCar;
                        break;
                    case '21':
                        vehicleType = window.lang.largeGeneralGreightCar;
                        break;
                    case '22':
                        vehicleType = window.lang.mediumGeneralGreightCar;
                        break;
                    case '23':
                        vehicleType = window.lang.smallGeneralGreightCar;
                        break;
                    case '30':
                        vehicleType = window.lang.specialTransportVehicle;
                        break;
                    case '31':
                        vehicleType = window.lang.containerCar;
                        break;
                    case '32':
                        vehicleType = window.lang.largeTransporter;
                        break;
                    case '33':
                        vehicleType = window.lang.heatPreservationAndRefrigeratorCar;
                        break;
                    case '34':
                        vehicleType = window.lang.SpecialVehicleForFreightCarTransportation;
                        break;
                    case '35':
                        vehicleType = window.lang.tankCar;
                        break;
                    case '36':
                        vehicleType = window.lang.tractor;
                        break;
                    case '37':
                        vehicleType = window.lang.trailer;
                        break;
                    case '38':
                        vehicleType = window.lang.flatCar;
                        break;
                    case '39':
                        vehicleType = window.lang.otherSpecialCars;
                        break;
                    case '40':
                        vehicleType = window.lang.dangerousGoodsTransporter;
                        break;
                    case '50':
                        vehicleType = window.lang.agriculturalVehicle;
                        break;
                    case '90':
                        vehicleType = window.lang.otherVehicles;
                        break;
                }
                return vehicleType;
            },
            formatSeatNumber: function formatSeatNumber(value, row, index) {
                var vehicletype = row.vehicletype;
                var result = '';
                if (value != null) {
                    if (vehicletype == '10' || vehicletype == '11' || vehicletype == '12' || vehicletype == '13' || vehicletype == '14' || vehicletype == '15' || vehicletype == '16') {
                        result = value + window.lang.people;
                    } else {
                        result = value + window.lang.ton;
                    }
                }
                return result;
            },
            reload: function reload() {
                var _value = $('#inp_search').val();
                $('#tb_grid').table('load', {
                    groupid: vehicledevice.page.tree.checkedGid,
                    key: 'carlicense',
                    value: _value
                });
            },
            realReload: function realReload() {
                $('#tb_grid').table('reload');
            },
            addVehicle: function addVehicle() {
                vehicledevice.page.form.operateFlag = 'add';
                vehicledevice.page.modal.title = window.lang.add;
                vehicledevice.page.form.clearData();
                vehicledevice.page.tree.loadGrouptree(); //每次打开都重新加载一次
                appCommon.jqueryCache('#btn_submitvehicle').removeAttr('disabled');
                vehicledevice.page.modal.show();
            },
            editVehicle: function editVehicle(id) {
                vehicledevice.page.form.operateFlag = 'edit';
                vehicledevice.page.modal.title = window.lang.edit;
                vehicledevice.page.form.clearData();
                vehicledevice.page.tree.loadGrouptree(); //每次打开都重新加载一次
                var vid = id;
                appCommon.ajax('../../../vehicle/' + id, 'get', 'json', { id: vid }, function (data) {
                    //appCommon.ajax('../../mock/vehicle.json','get','json',{id:vid},function(data){
                    if (data.code == 200) {
                        if (data.result.length > 0) {
                            vehicledevice.page.form.fillData(data.result[0]);
                        } else {
                            lavaMsg.alert(lang['getInfoFail'], danger);
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                });
                appCommon.jqueryCache('#btn_submitvehicle').removeAttr('disabled');
                vehicledevice.page.modal.show();
            },
            searchVehicle: function searchVehicle() {
                var _value = $('#inp_search').val();
                $('#tb_grid').table('load', {
                    groupid: vehicledevice.page.tree.checkedGid,
                    key: 'carlicense',
                    value: _value
                });
            },
            deleteVehicle: function deleteVehicle(id, element, name) {
                if (id) {
                    if (element) {
                        lavaMsg.singleConfirm(element, lang.sureDeleteThis + '?', lang.sure, lang.cancel, function (r) {
                            if (r) {
                                vehicledevice.page.table.deleteConfirm({ ids: id, logContent: name });
                            }
                        });
                    } else {
                        lavaMsg.confirm(lang.prompt, lang.sureDeleteThese + '?', lang.sure, function (r) {
                            if (r) {
                                var data = { ids: id, logContent: name };
                                vehicledevice.page.table.deleteConfirm(data);
                            }
                        });
                    }
                } else {
                    var rows = $('#tb_grid').table('getChecked');
                    var idArray = [];
                    var nameArray = [];
                    for (var i = 0; i < rows.length; i++) {
                        idArray.push(rows[i].id);
                        nameArray.push(rows[i].carlicense);
                    }
                    if (idArray.length == 0) {
                        lavaMsg.alert(lang.chooseOneLeast, 'info');
                    } else {
                        vehicledevice.page.table.deleteVehicle(idArray.join(','), '', nameArray.join(','));
                    }
                }
            },
            deleteConfirm: function deleteConfirm(data) {
                appCommon.ajax('../../../vehicle/delete/batch', 'post', 'json', data, function (data) {
                    if (data.code == 200) {
                        if (data.result) {
                            lavaMsg.alert(lang['operateSuccess'], 'success');
                            // vehicledevice.page.table.reload();
                            //判断是否为删除的最后一页所有数据
                            var tablePara = $('#tb_grid').table('options').formData;
                            var pageIndex = tablePara.pageIndex;
                            var pageSize = tablePara.pageSize;
                            tablePara.onlyCount = 1;
                            appCommon.ajax('../../../vehicle/items', 'post', 'json', tablePara, function (data) {
                                if (data.code == 200) {
                                    var totalpage = Math.ceil(data.result.count / pageSize);
                                    if (pageIndex > totalpage) {
                                        tablePara.pageIndex = totalpage;
                                        $('#tb_grid').table('options').pageNumber = totalpage;
                                    }
                                    tablePara.onlyCount = undefined;
                                    vehicledevice.page.table.realReload();
                                } else {
                                    lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                                }
                            });
                        } else {
                            lavaMsg.alert(window.lang.operateFail, 'danger');
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                });
            },
            //打开导出模态框
            importData: function importData() {
                var that = this;
                $('#div_import').modal('show');
            },
            //导入接口
            import: function _import(requirement, callback) {
                appCommon.ajax('/vehicle/import', 'post', 'json', requirement, function (data) {
                    callback(data);
                });
            },
            //表格初始化时对列展示下拉列表高度做初始化
            initDropDown2Height: function initDropDown2Height() {
                var height = document.body.clientHeight;
                var realHeight = (height - 110) * 0.5;
                $('div#dropdown .dropdown-menu').css('height', realHeight + 'px');
                $('div#dropdown .dropdown-menu').css('overflow', 'auto');
            },
            //导出车辆信息
            exportData: function exportData() {
                var ajaxData = {};
                var columnName = [];
                var vehicleTypeLang = {
                    vehicle10: lang.passengerCar,
                    vehicle11: lang.largeBus,
                    vehicle12: lang.mediumPassengerCar,
                    vehicle13: lang.smallPassengerCar,
                    vehicle14: lang.Sedan,
                    vehicle15: lang.largeBerthBus,
                    vehicle16: lang.mediumBerthBus,
                    vehicle20: lang.generalGreightCar,
                    vehicle21: lang.largeGeneralGreightCar,
                    vehicle22: lang.mediumGeneralGreightCar,
                    vehicle23: lang.smallGeneralGreightCar,
                    vehicle30: lang.specialTransportVehicle,
                    vehicle31: lang.containerCar,
                    vehicle32: lang.largeTransporter,
                    vehicle33: lang.heatPreservationAndRefrigeratorCar,
                    vehicle34: lang.SpecialVehicleForFreightCarTransportation,
                    vehicle35: lang.tankCar,
                    vehicle36: lang.tractor,
                    vehicle37: lang.trailer,
                    vehicle38: lang.flatCar,
                    vehicle39: lang.otherSpecialCars,
                    vehicle40: lang.dangerousGoodsTransporter,
                    vehicle50: lang.agriculturalVehicle,
                    vehicle90: lang.otherVehicles
                };
                var moduleTypeLang = {
                    module0: 'GPRS',
                    module1: 'CDMA',
                    module2: 'EVDO',
                    module3: 'WCDMA',
                    module4: 'EDGE',
                    module5: 'TDSCDMA',
                    module6: 'LTE-TDD',
                    module7: 'LTE-FDD'
                };
                var fuleTypeLang = {
                    fule1: lang.gasoline,
                    fule2: lang.dieseloil,
                    fule3: lang.naturalgas,
                    fule4: lang.liquidgas,
                    fule5: lang.electricpower,
                    fule6: lang.others
                };
                var roadLevelLang = {
                    road0: lang.nonrating,
                    road1: lang.classA,
                    road2: lang.classB,
                    road3: lang.classC,
                    road9: lang.failtoreachthestandard
                };
                var unitLang = {
                    people: lang.people,
                    ton: lang.ton
                };
                var fileName = lang['M_13'];
                var typeLang = {
                    others: lang['others'],
                    4: 'N9M',
                    1: 'MDVR'
                };
                $('#tb_grid th').each(function (key, value) {
                    columnName[key] = $.trim($(this).text());
                });
                columnName.splice(0, 2);
                var tableFormData = $('#tb_grid').table('options').formData;
                ajaxData = {
                    fileName: fileName,
                    columnName: columnName.join(','),
                    typeLang: JSON.stringify(typeLang),
                    vehicleTypeLang: JSON.stringify(vehicleTypeLang),
                    moduleTypeLang: JSON.stringify(moduleTypeLang),
                    fuleTypeLang: JSON.stringify(fuleTypeLang),
                    roadLevelLang: JSON.stringify(roadLevelLang),
                    unitLang: JSON.stringify(unitLang),
                    key: tableFormData.key,
                    value: tableFormData.value,
                    orderType: tableFormData.orderType ? tableFormData.orderType : '',
                    orderField: tableFormData.orderField ? tableFormData.orderField : '',
                    groupId: vehicledevice.page.tree.checkedGid
                };
                appCommon.ajax('/vehicle/export', 'post', 'json', ajaxData, function (res) {
                    if (res.code == 200 && res.result) {
                        appCommon.downloadFile('/download/absolute/dwnfile?dir=' + res.result);
                    } else if (res.code == 200 && !res.result) {
                        lavaMsg.alert(lang['noData'], 'info', 1000);
                    } else {
                        var errorType = appCommon.errorCode2Message(res.code);
                        lavaMsg.alert(errorType, 'danger', 1000);
                    }
                });
            }
        },
        tree: {
            checkedGid: 0,
            checkedGname: '',
            loadFlag1: false,
            loadFlag2: false,
            pGroupObj: null,
            settings: {
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
                    otherParam: [],
                    type: 'get',
                    url: '../../../common/simple-tree'
                },
                callback: {
                    onClick: function onClick(event, treeId, treeNode, clickFlag) {
                        if (treeId == 'ul_parentgroup') {
                            if (vehicledevice.page.form.operateFlag == 'add' || vehicledevice.page.form.operateFlag == 'edit') {
                                $('#inp_groupid').val(treeNode.id);
                                $('#inp_group').val(treeNode.name).focus().blur();
                                $('#div_parentgroup').modal('hide');
                            } else if (vehicledevice.page.form.operateFlag == 'changeGroup') {
                                that.groupId = treeNode.id;
                                if (!$('#div_parentgroup .modal-footer').is(':visible')) $('#div_parentgroup .modal-footer').slideDown();
                            }
                        } else if (treeId == 'ul_tree') {
                            vehicledevice.page.tree.checkedGid = treeNode.id;
                            vehicledevice.page.tree.checkedGname = treeNode.name;
                            vehicledevice.page.table.reload();
                        }
                    },
                    onAsyncSuccess: function onAsyncSuccess(event, treeId, treeNode) {
                        if (!vehicledevice.page.tree.loadFlag1 && treeId == 'ul_tree') {
                            $.fn.zTree.getZTreeObj('ul_tree').expandAll(true);
                            var treeObj = $.fn.zTree.getZTreeObj('ul_tree');
                            treeObj.getNodesByFilter(function (node) {
                                if (node.level == 0) {
                                    //初始加载第一个根节点下的数据
                                    vehicledevice.page.tree.checkedGid = node.id;
                                    vehicledevice.page.tree.checkedGname = node.name;
                                    var rootNode = treeObj.getNodeByParam('id', vehicledevice.page.tree.checkedGid);
                                    treeObj.selectNode(rootNode);
                                    vehicledevice.page.table.reload();
                                }
                            });
                            vehicledevice.page.tree.loadFlag1 = false;
                        } else if (!vehicledevice.page.tree.loadFlag2 && treeId == 'ul_parentgroup') {
                            $.fn.zTree.getZTreeObj('ul_parentgroup').expandAll(true);
                            vehicledevice.page.tree.loadFlag2 = false;
                        }
                    }
                }
            },
            init: function init() {
                var that = this;
                $.fn.zTree.init($('#ul_tree'), that.settings);
            },
            loadGrouptree: function loadGrouptree() {
                var that = this;
                if (that.pGroupObj) {
                    $.fn.zTree.getZTreeObj('ul_parentgroup').reAsyncChildNodes(null, 'refresh');
                } else {
                    $.fn.zTree.init($('#ul_parentgroup'), that.settings);
                    that.pGroupObj = $.fn.zTree.getZTreeObj('ul_parentgroup');
                }
            },
            reload: function reload() {
                var that = this;
                $.fn.zTree.getZTreeObj('ul_tree').reAsyncChildNodes(null, 'refresh');
            }
        },
        modal: {
            title: '',
            $el: $('#modal'),
            $el_pGroup: appCommon.jqueryCache('#div_parentgroup'),
            init: function init() {
                var that = this;
                that.bindEvent();
            },
            bindEvent: function bindEvent() {
                var that = this;
                that.$el_pGroup.on('shown.bs.modal', function (e) {
                    $('#btn_chooseparent').html('<i class="fa fa-ellipsis-h"></i>');
                });
                that.$el.on('shown.bs.modal', function () {
                    if ($('#div_enablechkbox').is(':visible')) {
                        $('#a_collapse').click();
                    }
                    if ($('#div_others').is(':visible')) {
                        $('#a_collapseother').click();
                    }
                    if ($('#div_sim').is(':visible')) {
                        $('#a_collapse_sim').click();
                    }
                    if ($('#div_vehicle_archives').is(':visible')) {
                        $('#a_collapse_vehicle_archives').click();
                    }
                    if ($('#div_vehicle_archives').is(':visible')) {
                        $('#a_collapse_device_archives').click();
                    }
                });
                that.$el.on('hide.bs.modal', function () {
                    if ($('#div_enablechkbox').is(':visible')) {
                        $('#a_collapse').click();
                    }
                    if ($('#div_others').is(':visible')) {
                        $('#a_collapseother').click();
                    }
                    if ($('#div_sim').is(':visible')) {
                        $('#a_collapse_sim').click();
                    }
                    if ($('#div_vehicle_archives').is(':visible')) {
                        $('#a_collapse_vehicle_archives').click();
                    }
                    if ($('#div_device_archives').is(':visible')) {
                        $('#a_collapse_device_archives').click();
                    }
                });
            },
            show: function show() {
                var that = this;
                $('#span_title').text(that.title);
                $('#modal').modal('show');
            },
            close: function close() {
                $('#modal').modal('hide');
            }
        },
        form: {
            operateFlag: '',
            oldCarLicense: '',
            oldDeviceNo: '',
            oldSim: '',
            $el: appCommon.jqueryCache('#form_vehicle'),
            $enableChkboxDiv: appCommon.jqueryCache('#div_enablechkbox'),
            isExistCarlicense: false,
            isExistDeviceNo: false,
            isExistSim: false,
            currChannelName: '', //保存当前正在编辑的通道名称
            init: function init() {
                var that = this;
                that.addValidate();
                that.addEventListener();
                that.initDeviceType();
                that.initPlateColor();
                that.initModuleType();
                that.initVehicleType();
                that.initFuleType();
                that.initRoadlevel();
                that.initDate();
                that.stopEvent();
                that.initVehicleTypeOnChange();
            },
            stopEvent: function stopEvent() {
                $('#inp_validitydate').datepicker().on('hide', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
                $('#inp_factorytime').datepicker().on('hide', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
                $('#inp_installtime').datepicker().on('hide', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
            },
            initDeviceType: function initDeviceType() {
                // <option>里面不能放span标签
                $('#inp_type').append('<option value="0">' + lang['others'] + '</option>');
                $('#inp_type').select2({
                    minimumResultsForSearch: Infinity
                });
            },
            //初始化sim模块类型
            initModuleType: function initModuleType() {
                $('#inp_module_type').select2({
                    minimumResultsForSearch: Infinity
                });
                $('#inp_module_type').val('').trigger('change');
            },
            //初始化车辆类型
            initVehicleType: function initVehicleType() {
                $('#inp_vehicle_type').select2({
                    minimumResultsForSearch: Infinity,
                    data: [{ id: 10, text: window.lang.passengerCar }, { id: 11, text: window.lang.largeBus }, { id: 12, text: window.lang.mediumPassengerCar }, { id: 13, text: window.lang.smallPassengerCar }, { id: 14, text: window.lang.Sedan }, { id: 15, text: window.lang.largeBerthBus }, { id: 16, text: window.lang.mediumBerthBus }, { id: 20, text: window.lang.generalGreightCar }, { id: 21, text: window.lang.largeGeneralGreightCar }, { id: 22, text: window.lang.mediumGeneralGreightCar }, { id: 23, text: window.lang.smallGeneralGreightCar }, { id: 30, text: window.lang.specialTransportVehicle }, { id: 31, text: window.lang.containerCar }, { id: 32, text: window.lang.largeTransporter }, { id: 33, text: window.lang.heatPreservationAndRefrigeratorCar }, { id: 34, text: window.lang.SpecialVehicleForFreightCarTransportation }, { id: 35, text: window.lang.tankCar }, { id: 36, text: window.lang.tractor }, { id: 37, text: window.lang.trailer }, { id: 38, text: window.lang.flatCar }, { id: 39, text: window.lang.otherSpecialCars }, { id: 40, text: window.lang.dangerousGoodsTransporter }, { id: 50, text: window.lang.agriculturalVehicle }, { id: 90, text: window.lang.otherVehicles }]
                });
                $('#inp_vehicle_type').val('').trigger('change');
            },
            initVehicleTypeOnChange: function initVehicleTypeOnChange() {
                $('#inp_vehicle_type').select2().on('change', function (e) {
                    var value = $('#inp_vehicle_type').val();
                    if (value == 10 || value == 11 || value == 12 || value == 13 || value == 14 || value == 15 || value == 16) {
                        //当选择的为客车是
                        $('#span-seatnumber').text(window.lang.seatnumberP);
                    } else {
                        $('#span-seatnumber').text(window.lang.seatnumbeF);
                    }
                });
            },
            //初始化燃油类型
            initFuleType: function initFuleType() {
                $('#inp_fule_type').select2({
                    minimumResultsForSearch: Infinity,
                    data: [{ id: 1, text: window.lang.gasoline }, { id: 2, text: window.lang.dieseloil }, { id: 3, text: window.lang.naturalgas }, { id: 4, text: window.lang.liquidgas }, { id: 5, text: window.lang.electricpower }, { id: 6, text: window.lang.others }]
                });
                $('#inp_fule_type').val('').trigger('change');
            },
            initRoadlevel: function initRoadlevel() {
                $('#inp_road_level').select2({
                    minimumResultsForSearch: Infinity,
                    data: [{ id: 0, text: window.lang.nonrating }, { id: 1, text: window.lang.classA }, { id: 2, text: window.lang.classB }, { id: 3, text: window.lang.classC }, { id: 9, text: window.lang.failtoreachthestandard }]
                });
                $('#inp_road_level').val('').trigger('change');
            },
            //初始化有效期
            initDate: function initDate() {
                $('#inp_validitydate').datepicker({
                    format: 'yyyy-mm-dd',
                    orientation: 'top',
                    autoclose: true,
                    startDate: '+0d', //设置只能从今天开始选择,
                    language: vehicledevice.lang
                });
                $('#inp_factorytime').datepicker({
                    format: 'yyyy-mm-dd',
                    orientation: 'top',
                    autoclose: false,
                    endDate: new Date(),
                    language: vehicledevice.lang
                });
                $('#inp_installtime').datepicker({
                    format: 'yyyy-mm-dd',
                    orientation: 'top',
                    autoclose: false,
                    language: vehicledevice.lang
                });
            },
            initPlateColor: function initPlateColor() {
                var $platecolor = appCommon.jqueryCache('#inp_carcolor');
                for (var i = 1; i < 6; i++) {
                    $platecolor.append("<option value='" + i + "'>" + lang['platecolor_' + i] + '</option>');
                }
                $platecolor.select2({
                    minimumResultsForSearch: Infinity
                });
            },
            addEventListener: function addEventListener() {
                var that = this;
                appCommon.jqueryCache('#inp_type').on('select2:select', function (e) {
                    if (e.target.value == '4') {
                        appCommon.jqueryCache('#inp_linktype').val('124');
                    } else if (e.target.value == '1') {
                        appCommon.jqueryCache('#inp_linktype').val('121');
                    } else {
                        appCommon.jqueryCache('#inp_linktype').val('121');
                    }
                });
                appCommon.jqueryCache('#btn_chooseparent').on('click', function () {
                    appCommon.jqueryCache('#btn_chooseparent').html('<i class="fa fa-spin fa-spinner"></i>');
                    appCommon.jqueryCache('#div_parentgroup').modal('show');
                });
                appCommon.jqueryCache('#btn_submitvehicle').on('click', function () {
                    appCommon.jqueryCache('#inp_carlicense').addClass('ignore');
                    appCommon.jqueryCache('#inp_deviceno').addClass('ignore');
                    appCommon.jqueryCache('#inp_simnumber').addClass('ignore');
                    var _newCarlicense = appCommon.jqueryCache('#inp_carlicense').val();
                    var _newDeviceno = appCommon.jqueryCache('#inp_deviceno').val();
                    var _newSim = appCommon.jqueryCache('#inp_simnumber').val();
                    if (that.operateFlag == 'edit') {
                        if (_newCarlicense == that.oldCarLicense && _newDeviceno == that.oldDeviceNo && _newSim == that.oldSim) {
                            that.$el.submit();
                            return;
                        } else {
                            if (_newCarlicense != that.oldCarLicense) {
                                $('#inp_carlicense').removeClass('ignore');
                            }
                            if (_newDeviceno != that.oldDeviceNo) {
                                $('#inp_deviceno').removeClass('ignore');
                            }
                            if (_newSim != that.oldSim) {
                                $('#inp_simnumber').removeClass('ignore');
                            }
                        }
                    } else {
                        $('#inp_carlicense').removeClass('ignore');
                        $('#inp_deviceno').removeClass('ignore');
                        $('#inp_simnumber').removeClass('ignore');
                    }
                    that.$el.submit();
                });
                //将previousValue数据移除，解决remote缓存问题
                appCommon.jqueryCache('#inp_carlicense').change(function () {
                    appCommon.jqueryCache('#inp_carlicense').removeData('previousValue');
                });
                appCommon.jqueryCache('#inp_deviceno').change(function () {
                    appCommon.jqueryCache('#inp_deviceno').removeData('previousValue');
                });
                //通道使能
                appCommon.jqueryCache('#inp_channelnum').change(function () {
                    var channel = appCommon.jqueryCache('#inp_channelnum').val();
                    var channelname = [];
                    var $channelname = $('.channelname');
                    for (var i = 0; i < $channelname.length; i++) {
                        channelname.push($channelname.eq(i).val());
                    }
                    that.currChannelName = channelname.join(',');
                    var channelEnable = [];
                    for (var i = 0; i < channel; i++) {
                        channelEnable.push(1);
                    }
                    that.initChnnelEnable(channel, parseInt(channelEnable.join(''), 2), that.currChannelName);
                });
                that.$el.delegate("input[value='-1']", 'click', function (e) {
                    if ($(this).prop('checked')) {
                        $('input.channel').prop('checked', true);
                    } else {
                        $('input.channel').prop('checked', false);
                    }
                    $('input.channel').change();
                });
                that.$el.delegate('input.channel', 'change', function (e) {
                    var val = $(this).val();
                    if ($(this).prop('checked')) {
                        if ($('#channelname_' + val)) {
                            $('#channelname_' + val).removeAttr('disabled');
                        }
                        var checkArray = $('input.channel:checked');
                        var channelNum = $('#inp_channelnum').val();
                        if (checkArray.length == channelNum) {
                            $("input[value='-1']").prop('checked', true); //当取消一个通道时通道全选去掉
                        }
                    } else {
                        if ($('#channelname_' + val)) {
                            $('#channelname_' + val).val('');
                            $('#channelname_' + val).attr('disabled', true);
                            $("input[value='-1']").prop('checked', false); //当取消一个通道时通道全选去掉
                        }
                    }
                });
                that.$el.delegate('.channelname', 'keydown', function (e) {
                    if (e.key == ',') {
                        return false;
                    }
                });
                that.$el.delegate('.channelname', 'change', function (e) {
                    var $this = $(this);
                    var currVal = $this.val();
                    if (currVal) {
                        $this.parent().removeClass('has-error');
                        $this.siblings('p').remove();
                        var $channelname = $('.channelname');
                        var otherVal = [];
                        for (var i = 0; i < $channelname.length; i++) {
                            if ($channelname.eq(i).prop('id') !== $this.prop('id')) {
                                otherVal.push($channelname.eq(i).val());
                            }
                        }
                        //通道名已存在
                        if (('|' + otherVal.join('|') + '|').indexOf('|' + currVal + '|') > -1) {
                            if (!$this.parent().hasClass('has-error')) {
                                $this.parent().addClass('has-error');
                            }
                            if ($this.siblings('#inp_channelname-error').length < 1) {
                                $this.after('<p id="inp_channelname-error" class="help-block">' + lang['channelNameExist'] + '</p>');
                            }
                        } else {
                            $this.parent().removeClass('has-error');
                            $this.siblings('p').remove();
                        }
                    } else {
                        $this.parent().removeClass('has-error');
                        $this.siblings('p').remove();
                    }
                });
                //不能输入空格
                $('#inp_deviceno').on('keydown', function (e) {
                    if (e.keyCode === 32) {
                        return false;
                    }
                });
            },
            handleResult: function handleResult(data, typeFlag) {
                if (data.code == 200) {
                    if (data.result) {
                        lavaMsg.alert(window.lang.operateSuccess, 'success');
                        if (typeFlag && typeFlag == 'edit') {
                            vehicledevice.page.table.realReload();
                        } else {
                            vehicledevice.page.table.reload();
                        }
                        vehicledevice.page.modal.close();
                    } else {
                        lavaMsg.alert(window.lang.operateFail, 'danger');
                        appCommon.jqueryCache('#btn_submitvehicle').removeAttr('disabled');
                    }
                } else {
                    lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    appCommon.jqueryCache('#btn_submitvehicle').removeAttr('disabled');
                }
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
                $.validator.addMethod('telephone', function (value) {
                    if (value.trim() !== '') {
                        var reg = /[\D|^-]/;
                        if (reg.test(value.trim())) {
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return true;
                    }
                }, window.lang.illegalPhone);
                $.validator.addMethod('ip', function (value) {
                    if (window.appCommon.regExpress().ip.test(value.trim()) || window.appCommon.regExpress().field.test(value.trim())) {
                        return true;
                    } else {
                        return false;
                    }
                }, window.lang.inputIllegleIp);
                that.validObj = that.$el.validate({
                    ignore: '.ignore',
                    errorElement: 'p',
                    errorClass: 'help-block',
                    focusInvalid: false,
                    rules: {
                        name: {
                            SafeChar: true,
                            required: true
                        },
                        carlicense: {
                            SafeChar: true,
                            required: true,
                            maxlength: 50,
                            remote: {
                                url: '../../../vehicle/exist/carlicense?guide=' + new Date().getTime(),
                                data: {
                                    carlicense: function carlicense() {
                                        return $.trim($('#inp_carlicense').val());
                                    }
                                }
                            }
                        },
                        platecolor: {
                            required: true
                        },
                        deviceno: {
                            required: true,
                            DeviceNo: true,
                            maxlength: 50,
                            remote: {
                                url: '../../../vehicle/exist/deviceno?guide=' + new Date().getTime(),
                                data: {
                                    deviceno: function deviceno() {
                                        return $.trim($('#inp_deviceno').val());
                                    }
                                }
                            }
                        },
                        type: {
                            required: true
                        },
                        channel: {
                            required: true,
                            digits: true,
                            max: 32
                        },
                        groupName: {
                            required: true,
                            maxlength: 50
                        },
                        sim: {
                            required: false,
                            telephone: true,
                            remote: {
                                url: '../../../vehicle/exist/sim?guide=' + new Date().getTime(),
                                data: {
                                    sim: function sim() {
                                        return $.trim($('#inp_simnumber').val());
                                    }
                                }
                            }
                        },
                        transmitip: {
                            required: true,
                            ip: true
                        },
                        transmitport: {
                            required: true,
                            digits: true,
                            max: 65535
                        },
                        imei: {
                            required: false,
                            maxlength: 20
                        },
                        imsi: {
                            required: false,
                            maxlength: 20
                        },
                        factorygrade: {
                            required: false,
                            maxlength: 20
                        },
                        seatnumber: {
                            required: false,
                            digits: true,
                            max: 999,
                            min: 0
                        },
                        enginenumber: {
                            required: false,
                            maxlength: 20
                        },
                        chassisnumber: {
                            required: false,
                            maxlength: 20
                        },
                        roadnumber: {
                            required: false,
                            maxlength: 20
                        },
                        fuelconsumption: {
                            required: false,
                            digits: true,
                            min: 0,
                            max: 99999
                        },
                        province: {
                            required: false,
                            maxlength: 20
                        },
                        city: {
                            required: false,
                            maxlength: 20
                        },
                        factorynumber: {
                            required: false,
                            maxlength: 20
                        },
                        installuser: {
                            required: false,
                            maxlength: 20
                        },
                        peripheral: {
                            required: false,
                            maxlength: 20
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
                        appCommon.jqueryCache('#btn_submitvehicle').attr('disabled', true);
                        if (that.operateFlag == 'add') {
                            var _data = that.getData();
                            var channelname = _data.channelname.split(',');
                            var obj = {};
                            var isRepeatChnnl = false;
                            var isIllegalChannelName = false;
                            for (var i = 0; i < channelname.length; i++) {
                                if (channelname[i] != '' && !obj[channelname[i]]) {
                                    obj[channelname[i]] = 1;
                                } else if (channelname[i] != '' && obj[channelname[i]]) {
                                    isRepeatChnnl = true;
                                }
                                if (/,/.test(channelname[i])) {
                                    isIllegalChannelName = true;
                                }
                            }
                            if (isRepeatChnnl) {
                                lavaMsg.alert(lang['noRepeatChannelName'], 'danger');
                                appCommon.jqueryCache('#btn_submitvehicle').attr('disabled', false);
                                return;
                            }
                            that.validateCarlicense(_data.carlicense, function () {
                                if (!that.isExistCarlicense) {
                                    appCommon.jqueryCache('#inp_carlicense').closest('.form-group').removeClass('has-error');
                                    appCommon.jqueryCache('#inp_carlicense-error').html('');
                                    that.validateDeviceNo(_data.deviceno, function () {
                                        if (!that.isExistDeviceNo) {
                                            appCommon.jqueryCache('#inp_deviceno').closest('.form-group').removeClass('has-error');
                                            appCommon.jqueryCache('#inp_deviceno-error').html('');
                                            //_data=_data+"&logContent="+appCommon.jqueryCache("#inp_carlicense").val()+"&olddeviceno="+that.oldDeviceNo;
                                            _data.logContent = appCommon.jqueryCache('#inp_carlicense').val();
                                            _data.olddeviceno = that.oldDeviceNo;
                                            that.validataSim(_data.sim, function () {
                                                if (!that.isExistSim) {
                                                    appCommon.jqueryCache('#inp_simnumber').closest('.form-group').removeClass('has-error');
                                                    appCommon.jqueryCache('#inp_simnumber-error').html('');
                                                    appCommon.ajax('../../../vehicle/create', 'post', 'json', _data, function (data) {
                                                        that.handleResult(data);
                                                    });
                                                } else {
                                                    appCommon.jqueryCache('#inp_simnumber').closest('.form-group').addClass('has-error').append('<p id="inp_simnumbe-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                                }
                                            });
                                        } else {
                                            appCommon.jqueryCache('#inp_deviceno').closest('.form-group').addClass('has-error').append('<p id="inp_deviceno-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                        }
                                    });
                                } else {
                                    appCommon.jqueryCache('#inp_carlicense').closest('.form-group').addClass('has-error').append('<p id="inp_carlicense-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                }
                            });
                        } else if (that.operateFlag == 'edit') {
                            var _data = that.getData();
                            _data.logContent = that.oldCarLicense;
                            _data.olddeviceno = that.oldDeviceNo;
                            _data.oldSim = that.oldSim;
                            var channelname = _data.channelname.split(',');
                            var obj = {};
                            var isRepeatChnnl = false;
                            for (var i = 0; i < channelname.length; i++) {
                                if (channelname[i] != '' && !obj[channelname[i]]) {
                                    obj[channelname[i]] = 1;
                                } else if (channelname[i] != '' && obj[channelname[i]]) {
                                    isRepeatChnnl = true;
                                }
                            }
                            if (isRepeatChnnl) {
                                lavaMsg.alert(lang['noRepeatChannelName'], 'danger');
                            } else {
                                if (_data.carlicense != that.oldCarLicense) {
                                    that.validateCarlicense(_data.carlicense, function () {
                                        if (!that.isExistCarlicense) {
                                            appCommon.jqueryCache('#inp_carlicense').closest('.form-group').removeClass('has-error');
                                            appCommon.jqueryCache('#inp_carlicense-error').html('');
                                            if (_data.deviceno != that.oldDeviceNo) {
                                                that.validateDeviceNo(_data.deviceno, function () {
                                                    if (!that.isExistDeviceNo) {
                                                        appCommon.jqueryCache('#inp_deviceno').closest('.form-group').removeClass('has-error');
                                                        appCommon.jqueryCache('#inp_deviceno-error').html('');
                                                        if (_data.sim != that.oldSim) {
                                                            that.validataSim(_data.sim, function () {
                                                                if (!that.isExistSim) {
                                                                    appCommon.jqueryCache('#inp_simnumber').closest('.form-group').removeClass('has-error');
                                                                    appCommon.jqueryCache('#inp_simnumber-error').html('');
                                                                    appCommon.ajax('../../../vehicle/update', 'post', 'json', _data, function (data) {
                                                                        that.handleResult(data, 'edit');
                                                                    });
                                                                } else {
                                                                    appCommon.jqueryCache('#inp_simnumber').closest('.form-group').addClass('has-error').append('<p id="inp_simnumber-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                                                }
                                                            });
                                                        } else {
                                                            appCommon.jqueryCache('#inp_simnumber').closest('.form-group').removeClass('has-error');
                                                            appCommon.jqueryCache('#inp_simnumber-error').html('');
                                                            appCommon.ajax('../../../vehicle/update', 'post', 'json', _data, function (data) {
                                                                that.handleResult(data, 'edit');
                                                            });
                                                        }
                                                    } else {
                                                        appCommon.jqueryCache('#inp_deviceno').closest('.form-group').addClass('has-error').append('<p id="inp_deviceno-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                                    }
                                                });
                                            } else {
                                                appCommon.jqueryCache('#inp_deviceno').closest('.form-group').removeClass('has-error');
                                                appCommon.jqueryCache('#inp_deviceno-error').html('');
                                                if (_data.sim != that.oldSim) {
                                                    that.validataSim(_data.sim, function () {
                                                        if (!that.isExistSim) {
                                                            appCommon.jqueryCache('#inp_simnumber').closest('.form-group').removeClass('has-error');
                                                            appCommon.jqueryCache('#inp_simnumber-error').html('');
                                                            appCommon.ajax('../../../vehicle/update', 'post', 'json', _data, function (data) {
                                                                that.handleResult(data, 'edit');
                                                            });
                                                        } else {
                                                            appCommon.jqueryCache('#inp_simnumber').closest('.form-group').addClass('has-error').append('<p id="inp_simnumber-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                                        }
                                                    });
                                                } else {
                                                    appCommon.jqueryCache('#inp_simnumber').closest('.form-group').removeClass('has-error');
                                                    appCommon.jqueryCache('#inp_simnumber-error').html('');
                                                    appCommon.ajax('../../../vehicle/update', 'post', 'json', _data, function (data) {
                                                        that.handleResult(data, 'edit');
                                                    });
                                                }
                                            }
                                        } else {
                                            appCommon.jqueryCache('#inp_carlicense').closest('.form-group').addClass('has-error').append('<p id="inp_carlicense-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                        }
                                    });
                                } else {
                                    appCommon.jqueryCache('#inp_carlicense').closest('.form-group').removeClass('has-error');
                                    appCommon.jqueryCache('#inp_carlicense-error').html('');
                                    if (_data.deviceno != that.oldDeviceNo) {
                                        that.validateDeviceNo(_data.deviceno, function () {
                                            if (!that.isExistDeviceNo) {
                                                appCommon.jqueryCache('#inp_deviceno').closest('.form-group').removeClass('has-error');
                                                appCommon.jqueryCache('#inp_deviceno-error').html('');
                                                if (_data.sim != that.oldSim) {
                                                    that.validataSim(_data.sim, function () {
                                                        if (!that.isExistSim) {
                                                            appCommon.jqueryCache('#inp_simnumber').closest('.form-group').removeClass('has-error');
                                                            appCommon.jqueryCache('#inp_simnumber-error').html('');
                                                            appCommon.ajax('../../../vehicle/update', 'post', 'json', _data, function (data) {
                                                                that.handleResult(data, 'edit');
                                                            });
                                                        } else {
                                                            appCommon.jqueryCache('#inp_simnumber').closest('.form-group').addClass('has-error').append('<p id="inp_simnumber-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                                        }
                                                    });
                                                } else {
                                                    appCommon.jqueryCache('#inp_simnumber').closest('.form-group').removeClass('has-error');
                                                    appCommon.jqueryCache('#inp_simnumber-error').html('');
                                                    appCommon.ajax('../../../vehicle/update', 'post', 'json', _data, function (data) {
                                                        that.handleResult(data, 'edit');
                                                    });
                                                }
                                            } else {
                                                appCommon.jqueryCache('#inp_deviceno').closest('.form-group').addClass('has-error').append('<p id="inp_deviceno-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                            }
                                        });
                                    } else {
                                        appCommon.jqueryCache('#inp_deviceno').closest('.form-group').removeClass('has-error');
                                        appCommon.jqueryCache('#inp_deviceno-error').html('');
                                        if (_data.sim != that.oldSim) {
                                            that.validataSim(_data.sim, function () {
                                                if (!that.isExistSim) {
                                                    appCommon.jqueryCache('#inp_simnumber').closest('.form-group').removeClass('has-error');
                                                    appCommon.jqueryCache('#inp_simnumber-error').html('');
                                                    appCommon.ajax('../../../vehicle/update', 'post', 'json', _data, function (data) {
                                                        that.handleResult(data, 'edit');
                                                    });
                                                } else {
                                                    appCommon.jqueryCache('#inp_simnumber').closest('.form-group').addClass('has-error').append('<p id="inp_simnumber-error" class="help-block">' + lang['existErrorPlacement'] + '</p>');
                                                }
                                            });
                                        } else {
                                            appCommon.jqueryCache('#inp_simnumber').closest('.form-group').removeClass('has-error');
                                            appCommon.jqueryCache('#inp_simnumber-error').html('');
                                            appCommon.ajax('../../../vehicle/update', 'post', 'json', _data, function (data) {
                                                that.handleResult(data, 'edit');
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                $.validator.addMethod('DeviceNo', function (value) {
                    var reg = appCommon.regExpress().legalDeviceNo;
                    if (reg.test(value.trim())) {
                        return true;
                    } else {
                        return false;
                    }
                }, window.lang.illegalChar);
            },
            validateCarlicense: function validateCarlicense(value, callback) {
                var that = this;
                appCommon.ajax('../../../vehicle/exist/carlicense?guide=' + new Date().getTime(), 'get', 'json', { carlicense: $.trim(value) }, function (data) {
                    that.isExistCarlicense = !data;
                    if (callback) {
                        callback();
                    }
                });
            },
            validateDeviceNo: function validateDeviceNo(value, callback) {
                var that = this;
                appCommon.ajax('../../../vehicle/exist/deviceno?guide=' + new Date().getTime(), 'get', 'json', { deviceno: $.trim(value) }, function (data) {
                    that.isExistDeviceNo = !data;
                    if (callback) {
                        callback();
                    }
                });
            },
            validataSim: function validataSim(value, callback) {
                var that = this;
                appCommon.ajax('../../../vehicle/exist/sim?guide=' + new Date().getTime(), 'get', 'json', { sim: $.trim(value) }, function (data) {
                    that.isExistSim = !data;
                    if (callback) {
                        callback();
                    }
                });
            },
            fillData: function fillData(data) {
                var that = this;
                appCommon.jqueryCache('#inp_carlicense').addClass('ignore');
                appCommon.jqueryCache('#inp_deviceno').addClass('ignore');
                appCommon.jqueryCache('#inp_simnumber').addClass('ignore');
                that.oldCarLicense = data.carlicense;
                that.oldDeviceNo = data.deviceno;
                that.oldSim = data.sim;
                $('#inp_carlicense').val(data.carlicense);
                $('#inp_carid').val(data.id);
                $('#inp_deviceno').val(data.deviceno);
                $('#inp_carcolor').val(data.platecolor).trigger('change');
                $('#inp_simnumber').val(data.sim);
                $('#inp_channelnum').val(data.channel);
                $('#inp_group').val(data.name);
                $('#inp_groupid').val(data.groupid);
                $('#inp_type').val(data.type).trigger('change');
                $('#inp_linktype').val(data.linktype);
                $('#inp_deviceusename').val(data.deviceusername);
                $('#inp_devicepassword').val(data.devicepassword);
                $('#inp_transmitip').val(data.transmitip);
                $('#inp_transmitport').val(data.transmitport);
                //添加新字段
                $('#inp_imei').val(data.imei);
                $('#inp_imsi').val(data.imsi);
                $('#inp_module_type').val(data.moduletype).trigger('change');
                $('#inp_vehicle_type').val(data.vehicletype).trigger('change');
                $('#inp_factory_grade').val(data.factorygrade);
                $('#inp_seat_number').val(data.seatnumber);
                $('#inp_engine_number').val(data.enginenumber);
                $('#inp_chassis_number').val(data.chassisnumber);
                $('#inp_fule_type').val(data.fueltype).trigger('change');
                $('#inp_road_number').val(data.roadnumber);
                $('#inp_road_level').val(data.roadlevel).trigger('change');
                $('#inp_road_number').val(data.roadnumber);
                $('#inp_validitydate').val(data.validitydate);
                $('#inp_fuelconsumption').val(data.fuelconsumption);
                $('#inp_province').val(data.province);
                $('#inp_city').val(data.city);
                $('#inp_factorynumber').val(data.factorynumber);
                $('#inp_factorytime').val(data.factorytime);
                $('#inp_installuser').val(data.installuser);
                $('#inp_installtime').val(data.installtime);
                $('#inp_peripheral').val(data.peripheral);
                that.initChnnelEnable(data.channel, data.channelenable === undefined ? null : data.channelenable, data.channelname);
            },
            clearData: function clearData() {
                var that = this;
                that.$el.validate().resetForm();
                $('#inp_carlicense').removeClass('ignore');
                $('#inp_deviceno').removeClass('ignore');
                that.$el.find('input,textarea').val('');
                $('#inp_carcolor').val(1).trigger('change');
                $('#inp_type').val(4).trigger('change');
                $('#inp_linktype').val(124);
                $('#inp_channelnum').val(4);
                $('#inp_group').val(vehicledevice.page.tree.checkedGname);
                $('#inp_groupid').val(vehicledevice.page.tree.checkedGid);
                that.initChnnelEnable(4, '15');
                //从数据库中读取默认的转发服务器和转发IP填上
                window.appCommon.ajax('../../../system-config/config-items', 'get', 'json', {}, function (data) {
                    if (data.code == 200) {
                        if (data.result) {
                            var result = data.result;
                            for (var i = 0; i < result.length; i++) {
                                if (result[i].name == 'TransmitIP') {
                                    $('#inp_transmitip').val(result[i].value);
                                }
                                if (result[i].name == 'TransmitPort') {
                                    $('#inp_transmitport').val(result[i].value);
                                }
                            }
                        }
                    }
                });
                $('#inp_module_type').val('').trigger('change');
                $('#inp_vehicle_type').val('').trigger('change');
                $('#inp_road_level').val('').trigger('change');
            },
            /**
             * @channel 通道总数
             * @channelEnable 使能通道的10进制数
             */
            initChnnelEnable: function initChnnelEnable(channel, channelEnable, channelname) {
                var that = this;
                //初始化通道使能
                var htmlArr = [];
                var enable = parseInt(channelEnable).toString(2);
                if (enable == '-1') {
                    for (var i = 0; i < channel; i++) {
                        if (i == 0) {
                            enable = '1';
                        } else {
                            enable = '1' + enable;
                        }
                    }
                }
                //往前补0
                if (enable.length < channel) {
                    var length = enable.length;
                    for (var i = 0; i < channel - length; i++) {
                        enable = '0' + enable;
                    }
                }
                var channelnameArr = [];
                if (channelname) {
                    channelnameArr = channelname.split(',');
                }
                var titleHtml = '<div style="width:375px;height:34px;margin-bottom:5pxvertical-align: middle;line-height: 34px;"><span>' + window.lang.chnnelEnable + '</span><span style="margin-left:20px;">' + window.lang.chnnelAlias + '</span></div>';
                htmlArr.push(titleHtml);
                var htmlAll = '<div style="width:350px;height:34px;margin-bottom:5pxvertical-align: middle;line-height: 34px;"><label class="mt-checkbox mt-checkbox-outline" style="float:left;margin-top:8px;"><input type="checkbox" value = "-1" class="channel" checked><span></span></label><span style="margin-left:45px;">' + lang['all'] + '</span></div>';
                htmlArr.push(htmlAll);
                for (var i = 0; i < channel; i++) {
                    //var html = '<label class="mt-checkbox mt-checkbox-outline"><input type="checkbox" value = "{0}" class="channel" {2}><span></span></label><span class="sp_channel">{1}</span>';
                    var html = '<div style="width:375px;height:34px;margin-bottom:19px;"><label class="mt-checkbox mt-checkbox-outline" style="float:left;margin-top:8px;"><input type="checkbox" value = "{0}" class="channel" {1}><span></span></label>' + '<div style="float:right;marin-left:45px;"><input type="text" id= "channelname_{2}" class="form-control channelname" {3} {4} style="width:300px;" name="channelname"></div></div>';
                    var data = [];
                    //channel id
                    data.push(i);
                    //isChecked
                    if (channelEnable != null) {
                        //是否勾选
                        if (enable.slice(channel - 1 - i, channel - i) == 1) {
                            data.push('checked');
                            //channel name id
                            data.push(i);
                            //是否disabled channel name input
                            data.push('');
                        } else {
                            data.push('');
                            //channel name id
                            data.push(i);
                            //是否disabled channel name input
                            data.push('disabled');
                        }
                    } else {
                        data.push('');
                        //channel name id
                        data.push(i);
                        //是否disabled channel name input
                        data.push('disabled');
                    }
                    if (channelnameArr && channelnameArr[i]) {
                        data.push('value="' + channelnameArr[i] + '"');
                    } else {
                        data.push('placeholder="' + lang['inputChnnelName'] + '"');
                    }
                    html = appCommon.strReplace(html, data);
                    htmlArr.push(html);
                }
                var promptHtml = '<div style="width:400px;height:auto;margin-bottom:5pxvertical-align: middle;line-height: 34px;">' + window.lang.channelPrompt + '</div>';
                htmlArr.push(promptHtml);
                that.$enableChkboxDiv.html(htmlArr.join(''));
                var checked = true;
                $('.channel').each(function (index, value) {
                    if ($(this).val() != '-1') {
                        if (!$(this).prop('checked')) {
                            checked = false;
                        }
                    }
                });
                if (checked) {
                    $("input[value = '-1']").prop('checked', true);
                } else {
                    $("input[value = '-1']").prop('checked', false);
                }
            },
            getData: function getData() {
                var that = this;
                var array = $('#form_vehicle').serializeArray();
                var result = {};
                for (var i = 0; i < array.length; i++) {
                    if (array[i].name === 'carlicense') {
                        result[array[i].name] = $.trim(array[i].value);
                    } else {
                        result[array[i].name] = array[i].value;
                    }
                }
                //获取通道使能
                var $channelEnable = $('.channel');
                var total = $channelEnable.length - 1;
                var channelArr = [];
                $channelEnable.each(function (index, obj) {
                    var value = $(obj).val();
                    if ($(obj).val() != -1) {
                        if ($(obj).prop('checked')) {
                            channelArr[total - 1 - value] = 1;
                        } else {
                            channelArr[total - 1 - value] = 0;
                        }
                    }
                });
                result.channelenable = parseInt(channelArr.join(''), 2);
                //获取通道名称
                var $channelname = $('.channelname');
                var nameArr = [];
                var isAllNull = true;
                for (var i = 0; i < $channelname.length; i++) {
                    if ($channelname.eq(i).val() != '') {
                        isAllNull = false;
                    }
                    nameArr.push($channelname.eq(i).val());
                }
                if (isAllNull) {
                    result.channelname = '';
                } else {
                    result.channelname = nameArr.join(',');
                }
                //设备密码加密
                if (result.devicepassword !== '******') {
                    result.devicepassword = encodeURIComponent(appCommon.encryptRSAStr(vehicledevice.rsapublickey, result.devicepassword));
                }
                return result;
            }
        },
        importUploader: {
            uploaderObj: null,
            init: function init() {
                var that = this;
                that.uploaderObj = WebUploader.create({
                    // 选完文件后，是否自动上传。
                    auto: true,
                    // swf文件路径
                    swf: '../../third-resource/webuploader/Uploader.swf',
                    // 文件接收服务端。
                    server: '/upload',
                    // 选择文件的按钮。可选。
                    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                    pick: {
                        id: '#importBtn',
                        //label: window.lang.import,
                        multiple: false
                    },
                    formData: {
                        dir: '/xlsx/'
                    },
                    // 只允许选择表格文件。
                    accept: {
                        title: 'Excel',
                        extensions: 'xlsx',
                        mimeTypes: '.xlsx'
                    },
                    method: 'POST',
                    fileNumLimit: 1
                });
                that.uploaderObj.on('uploadStart', function () {
                    $('#infoProgressModal').modal('show');
                    $('#div_info_importing').removeClass('hide');
                    $('#div_download_log').addClass('hide');
                });
                that.uploaderObj.on('uploadSuccess', function (file, response) {
                    if (response.code == 200) {
                        //设备类型语言包
                        var vehicleTypeLang = {
                            passengerCar: window.lang.passengerCar,
                            largeBus: window.lang.largeBus,
                            mediumPassengerCar: window.lang.mediumPassengerCar,
                            smallPassengerCar: window.lang.smallPassengerCar,
                            Sedan: window.lang.Sedan,
                            largeBerthBus: window.lang.largeBerthBus,
                            mediumBerthBus: window.lang.mediumBerthBus,
                            generalGreightCar: window.lang.generalGreightCar,
                            largeGeneralGreightCar: window.lang.largeGeneralGreightCar,
                            mediumGeneralGreightCar: window.lang.mediumGeneralGreightCar,
                            smallGeneralGreightCar: window.lang.smallGeneralGreightCar,
                            specialTransportVehicle: window.lang.specialTransportVehicle,
                            containerCar: window.lang.containerCar,
                            largeTransporter: window.lang.largeTransporter,
                            heatPreservationAndRefrigeratorCar: window.lang.heatPreservationAndRefrigeratorCar,
                            SpecialVehicleForFreightCarTransportation: window.lang.SpecialVehicleForFreightCarTransportation,
                            tankCar: window.lang.tankCar,
                            tractor: window.lang.tractor,
                            trailer: window.lang.trailer,
                            flatCar: window.lang.flatCar,
                            otherSpecialCars: window.lang.otherSpecialCars,
                            dangerousGoodsTransporter: window.lang.dangerousGoodsTransporter,
                            agriculturalVehicle: window.lang.agriculturalVehicle,
                            otherVehicles: window.lang.otherVehicles
                        };
                        //燃油类型语言包
                        var fuelTypeLang = {
                            gasoline: window.lang.gasoline,
                            dieseloil: window.lang.dieseloil,
                            naturalgas: window.lang.naturalgas,
                            liquidgas: window.lang.liquidgas,
                            electricpower: window.lang.electricpower,
                            other: window.lang.others
                        };
                        //技术等级语言包
                        var roadLevelLang = {
                            nonrating: window.lang.nonrating,
                            classA: window.lang.classA,
                            classB: window.lang.classB,
                            classC: window.lang.classC,
                            failtoreachthestandard: window.lang.failtoreachthestandard
                        };
                        var plateColorLang = {
                            platecolor_1: window.lang.platecolor_1,
                            platecolor_2: window.lang.platecolor_2,
                            platecolor_3: window.lang.platecolor_3,
                            platecolor_4: window.lang.platecolor_4,
                            platecolor_5: window.lang.platecolor_5
                        };
                        var requirement = {
                            dir: response.result[0].dir,
                            savename: response.result[0].savename,
                            vehicleTypeLang: JSON.stringify(vehicleTypeLang),
                            fuelTypeLang: JSON.stringify(fuelTypeLang),
                            roadLevelLang: JSON.stringify(roadLevelLang),
                            plateColorLang: JSON.stringify(plateColorLang),
                            lang: vehicledevice.lang
                        };
                        //ajax导入
                        vehicledevice.page.table.import(requirement, function (data) {
                            $('#div_import').modal('hide');
                            if (data.code == 200) {
                                var message = appCommon.strReplace(lang.importSuccessPrompt, [data.result.success, data.result.failed]);
                                lavaMsg.alert(message, 'success', 3000);
                                if (data.result.rowNumber) {
                                    var downloadLogMessage = appCommon.strReplace(lang.importErrLogPrompt, [data.result.failed]);
                                    var rowNumber = data.result.rowNumber.sort(function (a, b) {
                                        return a - b;
                                    });
                                    $('#span_download_log').html(downloadLogMessage);
                                    $('#span_failedRowNumber').html(lang.failedRowNumber + ':');
                                    $('#p_failedRowNumber').html(rowNumber.join(' ,'));
                                    $('#div_info_importing').addClass('hide');
                                    $('#div_download_log').removeClass('hide');
                                    $('#infoProgressModal').modal('show');
                                } else {
                                    $('#infoProgressModal').modal('hide');
                                }
                            } else {
                                $('#div_info_importing').addClass('hide');
                                $('#div_download_log').removeClass('hide');
                                $('#infoProgressModal').modal('hide');
                                var message = appCommon.errorCode2Message(data.code);
                                lavaMsg.alert(message, 'danger', 1000);
                            }
                            vehicledevice.page.table.reload();
                        });
                    } else {
                        lavaMsg.alert(lang.uploadError, 'danger', 1000);
                    }
                    that.uploaderObj.reset();
                });
            }
        }
    }
};
window.onload = function () {
    appCommon.lang(function () {
        vehicledevice.rsapublickey = appCommon.getRSAPublicKey();
        vehicledevice.init();
    });
};