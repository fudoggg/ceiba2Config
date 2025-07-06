var appBasicDashboard = {
    uri: '../../Basic/Dashboard/',
    currRid: 0,
    currModulePower: [],
    init: function init() {
        var that = this;
        that.currRid = appCommon.getCookie('wcms5u', 'rid');
        //获取当前用户的权限
        appCommon.ajax('../../../role/' + that.currRid, 'get', 'json', {}, function (data) {
            if (data.code == 200) {
                if (data.result) {
                    for (var i = 0, len = data.result.authority.length; i < len; i++) {
                        that.currModulePower.push(data.result.authority[i].module);
                    }
                    that.page.init();
                    that.charts.init();
                    that.count.init();
                }
            }
        });
    },
    //页面整体
    page: {
        init: function init() {
            var height = $(window).height();
            this.initEvent();
        },
        //弹出框
        alert: function alert(info, type) {
            lavaMsg.alert(info, type);
        },
        initEvent: function initEvent() {
            window.onresize = appBasicDashboard.charts.resize;
        }
    },
    //统计图
    count: {
        $group: $('#span_group'),
        $vehicle: $('#span_vehicle'),
        $role: $('#span_role'),
        $user: $('#span_user'),
        init: function init() {
            var that = this;
            for (var i = 0, len = window.appBasicDashboard.currModulePower.length; i < len; i++) {
                if (window.appBasicDashboard.currModulePower[i] == '19') {
                    //角色用户
                    $('#div_user,#div_role').removeClass('hidden');
                    //先把之前的事件绑定去掉，然后再进行绑定，防止重复绑定
                    $('#span_user,#span_role').unbind('mouseout mouseenter click').on('mouseout mouseenter click', function (e) {
                        if (e.type == 'click') {
                            window.parent.appHome.page.addTab(lang['M_19'], 'basic/role-user/default.html');
                        } else if (e.type == 'mouseout') {
                            $(this).css('color', '#FFF');
                        } else if (e.type == 'mouseenter') {
                            $(this).css('color', '#F4D03F');
                        }
                    });
                } else if (window.appBasicDashboard.currModulePower[i] == '12') {
                    //组织架构
                    $('#div_group').removeClass('hidden');
                    $('#span_group').on('mouseout mouseenter click', function (e) {
                        if (e.type == 'click') {
                            window.parent.appHome.page.addTab(lang['M_12'], 'basic/group/default.html');
                        } else if (e.type == 'mouseout') {
                            $(this).css('color', '#FFF');
                        } else if (e.type == 'mouseenter') {
                            $(this).css('color', '#F4D03F');
                        }
                    });
                } else if (window.appBasicDashboard.currModulePower[i] == '13') {
                    //车辆设备
                    $('#div_vehicle').removeClass('hidden');
                    $('#span_vehicle').on('mouseout mouseenter click', function (e) {
                        if (e.type == 'click') {
                            window.parent.appHome.page.addTab(lang['M_13'], 'basic/vehicle-device/default.html');
                        } else if (e.type == 'mouseout') {
                            $(this).css('color', '#FFF');
                        } else if (e.type == 'mouseenter') {
                            $(this).css('color', '#F4D03F');
                        }
                    });
                }
            }
            that.load();
        },
        load: function load() {
            var that = this;
            appCommon.ajax('../../dashboard/count', 'get', 'json', {}, function (data) {
                if (data.code == 200) {
                    if (data.result) {
                        var item = data.result;
                        that.$group.attr('data-value', item.group);
                        that.$vehicle.attr('data-value', item.vehicle);
                        that.$role.attr('data-value', item.role);
                        that.$user.attr('data-value', item.user);
                        that.$group.counterUp();
                        that.$vehicle.counterUp();
                        that.$role.counterUp();
                        that.$user.counterUp();
                    } else {
                        appBasicDashboard.page.alert(lang.operateFail, 'danger');
                    }
                } else {
                    appBasicDashboard.page.alert(appCommon.errorCode2Message(data.code), 'danger');
                }
            });
        }
    },
    charts: {
        alarmChart: null,
        onlineChart: null,
        el_alarm: 'div_alarmchart',
        el_online: 'div_onlinechart',
        $alarmType: $('#inp_alarmtype'),
        startTime: null,
        endTime: null,
        INIT_ALARM_TYPE: -1,
        init: function init() {
            var that = this;
            that.initAction();
            var date = new Date(new Date().getTime() - 86400000 * 6); //往前数第七天
            var xData = [];
            that.startTime = appCommon.getDateTime(date, false, 'yyyy-MM-dd');
            for (var i = 0; i < 6; i++) {
                xData.push(appCommon.round(date.getMonth() + 1) + '-' + appCommon.round(date.getDate()));
                date.setTime(date.getTime() + 86400000);
            }
            that.endTime = appCommon.getDateTime(date, false, 'yyyy-MM-dd');
            that.alarmChart = echarts.init(document.getElementById(that.el_alarm));
            that.onlineChart = echarts.init(document.getElementById(that.el_online));
            that.alarmChart.setOption(that.getOption(xData, [0, 0, 0, 0, 0, 0, 0]));
            that.onlineChart.setOption(that.getOption(xData, [0, 0, 0, 0, 0, 0, 0], true));
            // that.alarmChart.showLoading('default', {
            //     text: ''
            // });
            // that.onlineChart.showLoading('default', {
            //     text: ''
            // });
            // that.load(that.INIT_ALARM_TYPE, true);
        },
        //加载图表
        load: function load(alarmtype, isGps, isAlarm) {
            var that = this;
            appCommon.ajax('../../dashboard/chart', 'post', 'json', {
                alarmType: alarmtype,
                startTime: that.startTime,
                endTime: that.endTime,
                isGPS: isGps,
                isAlarm: isAlarm
            }, function (data) {
                if (isGps) {
                    that.onlineChart.hideLoading();
                } else {
                    that.alarmChart.hideLoading();
                }
                if (data.code == 200) {
                    if (data.result) {
                        if (isGps) {
                            var gps = data.result.gps;
                            var gpsDate = [];
                            var gpsData = [];
                            for (var i in gps) {
                                gpsDate.push(gps[i].date);
                                gpsData.push(gps[i].count);
                            }
                            that.onlineChart.setOption(that.getOption(gpsDate, gpsData, true));
                        } else {
                            var alarm = data.result.alarm;
                            var alarmDate = [];
                            var alarmData = [];
                            for (var i in alarm) {
                                alarmDate.push(alarm[i].date);
                                alarmData.push(alarm[i].count);
                            }
                            that.alarmChart.setOption(that.getOption(alarmDate, alarmData, false));
                        }
                    } else {
                        lavaMsg.alert(lang.operateFail, 'danger');
                    }
                } else {
                    lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                }
            });
        },
        //获取图表配置项
        getOption: function getOption(xData, data, isGps) {
            var option = {
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: xData
                },
                yAxis: {
                    //name:lang.piece,
                    type: 'value',
                    minInterval: 1
                },
                series: [{
                    name: lang.pieceCount,
                    type: 'line',
                    data: data,
                    markPoint: {
                        data: [{ type: 'max', name: lang.maxValue }, { type: 'min', name: lang.minValue }],
                        symbolSize: function symbolSize(value, params) {
                            var overSize = value.toString().length - 4;
                            var size;
                            if (overSize >= 1) {
                                size = overSize * 10 + 50;
                            } else {
                                size = 50;
                            }
                            if (size <= 80) {
                                return [size, size];
                            } else {
                                return [size, 80];
                            }
                        }
                    },
                    markLine: {
                        data: [{ type: 'average', name: lang.averageValue }]
                    }
                }],
                color: [isGps ? '#3598DC' : '#E7505A']
            };
            return option;
        },
        resize: function resize() {
            appBasicDashboard.charts.alarmChart.resize();
            appBasicDashboard.charts.onlineChart.resize();
        },
        initAction: function initAction() {
            var that = this;
            var optionArray = [];
            optionArray.push("<option value='select'>--" + lang.choose + '--</option>');
            optionArray.push("<option value='-1'>" + lang.allAlarm + '</option>'); // 全部报警类型
            var alarmTypeArray = appCommon.getAlarmTypeArray();
            for (var i = 0; i < alarmTypeArray.length; i++) {
                if (lang['malarm_' + alarmTypeArray[i]]) {
                    optionArray.push("<option value='" + alarmTypeArray[i] + "'>" + lang['malarm_' + alarmTypeArray[i]] + '</option>');
                }
            }
            that.$alarmType.html(optionArray.join(''));
            //that.$alarmType.val(15).trigger('change');
            that.$alarmType.select2({
                minimumResultsForSearch: Infinity
            });
            that.$alarmType.on('select2:select', function (e) {
                if (e.target.value === 'select') {
                    return;
                }
                that.$alarmType.siblings('span').children().children().blur();
                that.alarmChart.showLoading('default', {
                    text: ''
                });
                that.load(e.target.value, false, true);
            });
            // gps加载事件响应
            $('#btn_load_gps').on('click', function () {
                that.onlineChart.showLoading('default', {
                    text: ''
                });
                that.load(null, true, false);
            });
        }
    }
};
window.onload = function () {
    appCommon.lang(function () {
        appBasicDashboard.init();
    });
};