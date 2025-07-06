var quickadd = {
    rsapublickey: '', //rsa公钥
    currRid: 0,
    isJump: false, //是否为客户端跳转过来的
    lang: '',
    roleAuthority: {
        M_A: [12, 13, 19, 20, 206, 300, 62, 15, 32],
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
        that.currRid = appCommon.getCookie(appConfig.USERCOOKIENAME, 'rid');
        that.isJump = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'isJump');
        that.lang = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'L');
        that.page.init();
    },
    page: {
        init: function init() {
            var that = this;
            that.wizard.init();
            if (quickadd.lang == 'en-US') {
                appCommon.loadScriptOrCss('script', '../../../third-resource/metronic47/global/plugins/bootstrap-datepicker/locales/bootstrap-datepicker.' + quickadd.lang + '.min.js', function () {
                    that.form.init();
                });
            } else {
                appCommon.loadScriptOrCss('script', '../../../third-resource/metronic47/global/plugins/jquery-validation/js/localization/messages_' + quickadd.lang + '.min.js', function () {
                    appCommon.loadScriptOrCss('script', '../../../third-resource/metronic47/global/plugins/bootstrap-datepicker/locales/bootstrap-datepicker.' + quickadd.lang + '.min.js', function () {
                        that.form.init();
                    });
                });
            }
            that.tree.init();
            that.tab.init();
        },
        resize: function resize() {
            var that = this;
            var stepLinkHeight = parseInt($('.mt-element-step').css('height'));
            var footHeight = parseInt($('.footer').css('height'));
            var bodyPadding = 20;
            if (that.wizard.nowIndex == 0) {
                var nameDivHeight = parseInt($('#tab1').children('div:eq(0)').css('height'));
                var bottomMargin = 10;
                var bottomPadding = 2 * 15; //两个div
                //自适应groupTreeDiv的高度
                if ($(window).width() < 975) {
                    var pGroupDivHeight = $(window).height() - stepLinkHeight - nameDivHeight - footHeight - bottomPadding - bodyPadding - bottomMargin;
                } else {
                    var labelHeight = 26;
                    var pGroupDivHeight = $(window).height() - stepLinkHeight - nameDivHeight - footHeight - bottomPadding - bodyPadding - bottomMargin - labelHeight;
                }
                $('#div_parentgroup').css('height', pGroupDivHeight);
                $('#div_parentgroup').css('min-height', 200); //设置最小值，避免小屏幕下看不完全树
                $('#div_parentgroup').parent().css('height', $('#div_parentgroup').css('height'));
                that.slimScroll.resizeScroll('div_parentgroup', $('#div_parentgroup').css('height'));
                $('#tab1').children('div:eq(1)').css('height', $('#div_parentgroup').css('height'));
                if (parseInt($('#div_parentgroup').css('height') == 200)) {
                    $('#tab1').children('div:eq(1)').css('margin-bottom', 94);
                }
            } else if (that.wizard.nowIndex == 1) {
                $('#tab2').children('div:eq(9)').css('margin-bottom', 72);
            } else if (that.wizard.nowIndex == 2) {
                var nameDivHeight = parseInt($('#tab3').children('div:eq(0)').css('height'));
                var bottomMargin = 3 * 15; //三个div
                var topMargin = 10;
                var authBottomMargin = 10; //权限div的marin-bottom
                var pRoleDivHeight = 200;
                var authDivHeight = 0;
                if ($(window).width() < 975) {
                    var labelHeight = 26;
                    authDivHeight = $(window).height() - stepLinkHeight - nameDivHeight - footHeight - bodyPadding - bottomMargin - labelHeight - topMargin - authBottomMargin - pRoleDivHeight - nameDivHeight;
                } else {
                    authDivHeight = $(window).height() - stepLinkHeight - nameDivHeight - footHeight - bodyPadding - bottomMargin - topMargin - authBottomMargin - pRoleDivHeight - nameDivHeight;
                }
                //判断角色权限当前的tab
                if (that.tab.nowIndex == 0) {
                    appCommon.jqueryCache('#div_module').css('height', authDivHeight);
                    appCommon.jqueryCache('#div_module').css('min-height', 200);
                    $('#div_module').parent().css('height', appCommon.jqueryCache('#div_module').css('height'));
                    that.slimScroll.resizeScroll('div_module', appCommon.jqueryCache('#div_module').css('height'));
                    if (parseInt($('#div_module').css('height')) == 200) {
                        $('#tab3').children('div:eq(2)').css('margin-bottom', 94);
                    }
                } else if (that.tab.nowIndex == 1) {
                    appCommon.jqueryCache('#div_group').css('height', authDivHeight);
                    appCommon.jqueryCache('#div_group').css('min-height', 200);
                    $('#div_group').parent().css('height', appCommon.jqueryCache('#div_group').css('height'));
                    that.slimScroll.resizeScroll('div_group', appCommon.jqueryCache('#div_group').css('height'));
                    if (parseInt($('#div_group').css('height')) == 200) {
                        $('#tab3').children('div:eq(2)').css('margin-bottom', 94);
                    }
                }
            }
        },
        wizard: {
            el_wizard: '#div_wizard',
            el_submit: '.button-submit',
            el_next: '.button-next',
            el_prev: '.button-previous',
            onlyAddRoleUser: false, //只添加角色用户
            nowIndex: 1,
            isFirstOpenVehicle: true, //标识是否第一次打开车辆设备添加tab
            init: function init() {
                var that = this;
                that.initWizard();
                that.disable(1);
                that.disable(3);
            },
            initWizard: function initWizard() {
                var that = this;
                $('#div_wizard').bootstrapWizard({
                    nextSelector: that.el_next,
                    previousSelector: that.el_prev,
                    onTabClick: function onTabClick(tab, navigation, index, clickedIndex) {
                        if (clickedIndex != 2 && clickedIndex != 0) {
                            return false;
                        } else {
                            //角色可点击
                            if (clickedIndex == 0) {
                                that.disable(1);
                                that.disable(3);
                                that.onlyAddRoleUser = false;
                            } else {
                                that.onlyAddRoleUser = true;
                            }
                            that.handleTitle(clickedIndex);
                            that.handleButton(clickedIndex);
                        }
                    },
                    onNext: function onNext(tab, navigation, index) {
                        var $valid;
                        $valid = $('#form_all').valid();
                        if (!$valid) {
                            return false;
                        }
                        if (index == 1) {
                            var len = quickadd.page.tree.pGroupObj.getSelectedNodes().length;
                            if (len <= 0) {
                                lavaMsg.alert(lang['chooseParentGroupPrompt'], 'info');
                                return false;
                            }
                            that.enable(index);
                        } else if (index == 3) {
                            var moduleLen = quickadd.page.form.getModule().length;
                            var groupLen = quickadd.page.form.getGroup().length;
                            if (moduleLen <= 0) {
                                lavaMsg.alert(lang['chooseModulePermissionPrompt'], 'info');
                                return false;
                            } else if (groupLen <= 0) {
                                lavaMsg.alert(lang['chooseGroupPermissionPrompt'], 'info');
                                return false;
                            }
                            that.enable(index);
                        }
                        that.handleButton(index);
                        that.handleTitle(index);
                        quickadd.page.form.fillData(index);
                    },
                    onPrevious: function onPrevious(tab, navigation, index) {
                        that.handleTitle(index);
                        that.handleButton(index);
                        that.nowIndex = index;
                    },
                    onTabShow: function onTabShow(tab, navigation, index) {
                        that.nowIndex = index;
                        quickadd.page.resize();
                        if (index == 2) {
                            quickadd.page.slimScroll.initPRole();
                            //角色下权限portlet初始化
                            appCommon.jqueryCache('#a_module').parent().addClass('active');
                            appCommon.jqueryCache('#tab_group').removeClass('active');
                            appCommon.jqueryCache('#tab_module').addClass('active');
                        } else if (index == 1) {
                            if (that.isFirstOpenVehicle) {
                                quickadd.page.form.initChnnelEnable(4, '15');
                                that.isFirstOpenVehicle = false;
                            }
                        }
                    }
                });
            },
            handleTitle: function handleTitle(index) {
                var that = this;
                var $li = $(that.el_wizard).find('ul').children('li');
                $li.removeClass('active');
                $li.removeClass('done');
                $li.eq(index).prevAll().addClass('done');
                $li.eq(index + 1).addClass('active');
            },
            handleButton: function handleButton(index) {
                var that = this;
                if (index == 0) {
                    $(that.el_next).show();
                    $(that.el_prev).hide();
                    $(that.el_submit).hide();
                } else if (index == 2) {
                    $(that.el_next).show();
                    if (that.onlyAddRoleUser) {
                        $(that.el_prev).hide();
                    } else {
                        $(that.el_prev).show();
                    }
                    $(that.el_submit).hide();
                } else {
                    $(that.el_next).hide();
                    $(that.el_prev).show();
                    $(that.el_submit).show();
                    if (index == 1) {
                        if (appCommon.jqueryCache('#inp_isaddrole').prop('checked')) {
                            $(that.el_next).show();
                            $(that.el_submit).hide();
                        } else {
                            $(that.el_next).hide();
                            $(that.el_submit).show();
                        }
                    }
                }
            },
            disable: function disable(index) {
                var that = this;
                $(that.el_wizard).bootstrapWizard('disable', index);
            },
            enable: function enable(index) {
                var that = this;
                $(that.el_wizard).bootstrapWizard('enable', index);
            }
        },
        form: {
            $el: $('#form_all'),
            hasAddGroup: false,
            hasAddRole: false,
            isValid: true,
            groupIsValid: true,
            vehicleIsValid: true,
            roleIsValid: true,
            userIsValid: true,
            validObj: null,
            $enableChkboxDiv: appCommon.jqueryCache('#div_enablechkbox'),
            hasRealPlay: false,
            hasPlayback: false,
            init: function init() {
                var that = this;
                //长度限制显示
                $('#inp_desc').maxlength({
                    alwaysShow: true
                });
                //绑定事件
                $('#btn_group_chossePGroup').on('click', function (e) {
                    quickadd.page.modal.type = 'parentGroup';
                    quickadd.page.modal.show();
                });
                //初始化车牌颜色
                var $platecolor = appCommon.jqueryCache('#inp_carcolor');
                var plateColor = [];
                for (var i = 1; i < 6; i++) {
                    plateColor.push("<option value='" + i + "'>" + lang['platecolor_' + i] + '</option>');
                }
                $platecolor.html(plateColor.join(''));
                $platecolor.select2({
                    minimumResultsForSearch: Infinity
                });
                //初始化设备类型
                appCommon.jqueryCache('#inp_type').append('<option value="0">' + lang['unknown'] + '</option>');
                appCommon.jqueryCache('#inp_type').select2({
                    minimumResultsForSearch: Infinity
                });
                appCommon.jqueryCache('#inp_type').on('select2:select', function (e) {
                    if (e.target.value == '4') {
                        appCommon.jqueryCache('#inp_linktype').val('124');
                    } else if (e.target.value == '1') {
                        appCommon.jqueryCache('#inp_linktype').val('121');
                    } else {
                        appCommon.jqueryCache('#inp_linktype').val('121');
                    }
                });
                //勾选添加角色
                appCommon.jqueryCache('#inp_isaddrole').on('click', function (e) {
                    if ($(this).prop('checked')) {
                        quickadd.page.wizard.enable(2);
                        $(quickadd.page.wizard.el_next).show();
                        $(quickadd.page.wizard.el_submit).hide();
                    } else {
                        quickadd.page.wizard.disable(2);
                        $(quickadd.page.wizard.el_next).hide();
                        $(quickadd.page.wizard.el_submit).show();
                    }
                });
                $('#div_moduletitle').html('<label class="mt-checkbox mt-checkbox-outline" id="div_moduleall" style="margin-bottom:0;font-weight:700;">' + '<input type="checkbox" id="checkbox_moduleall"><span></span>' + lang['all'] + '</label>');
                //提交按钮
                $(quickadd.page.wizard.el_submit).on('click', function () {
                    that.$el.submit();
                });
                //添加验证
                that.addValidate();
                that.checkboxOperate();
                //给上面通道的checkbox添加change事件
                $('input.channel').on('change', function (e) {
                    if ($(this).prop('checked')) {
                        quickadd.page.tree.setChannelCheck($(this).val(), true);
                    } else {
                        quickadd.page.tree.setChannelCheck($(this).val(), false);
                    }
                });
                //通道使能
                appCommon.jqueryCache('#inp_channelnum').change(function () {
                    var channel = appCommon.jqueryCache('#inp_channelnum').val();
                    var channelEnable = [];
                    for (var i = 0; i < channel; i++) {
                        channelEnable.push(1);
                    }
                    that.initChnnelEnable(channel, parseInt(channelEnable.join(''), 2));
                });
                appCommon.jqueryCache('#inp_validend').datepicker({
                    format: 'yyyy-mm-dd',
                    orientation: 'bottom',
                    autoclose: true,
                    startDate: '+0d', //设置只能从今天开始选择,
                    language: quickadd.lang
                });
                //用户名和角色名不能输入空格
                $('#inp_deviceno,#inp_rolename,#inp_account').on('keydown', function (e) {
                    if (e.keyCode === 32) {
                        return false;
                    }
                });
            },
            addValidate: function addValidate() {
                var that = this;
                $.extend($.validator.messages, {
                    remote: lang.existErrorPlacement,
                    equalTo: window.lang.pswRepeatErrorPlacement
                });
                $.validator.addMethod('PasswordChar', function (value) {
                    var reg = appCommon.regExpress().passwordChar;
                    if (reg.test(value.trim())) {
                        return true;
                    } else {
                        return false;
                    }
                }, window.lang.passwordFormat);
                that.validObj = $('#form_all').validate({
                    errorElement: 'label',
                    errorClass: 'font-red control-label',
                    focusInvalid: true,
                    rules: {
                        name: {
                            SafeChar: true,
                            required: true,
                            maxlength: 50,
                            remote: {
                                url: '../../../group/exist/name?guide=' + new Date().getTime(),
                                data: {
                                    name: function name() {
                                        return $.trim($('#inp_groupname').val());
                                    }
                                }
                            }
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
                        carColor: {
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
                        channelNum: {
                            required: true,
                            digits: true,
                            max: 32
                        },
                        rolename: {
                            SafeChar: true,
                            required: true,
                            maxlength: 50,
                            remote: {
                                url: '../../../role/exist/name?guide=' + new Date().getTime(), //避免缓存问题
                                type: 'get',
                                dataType: 'json',
                                data: {
                                    name: function name() {
                                        return $('#inp_rolename').val();
                                    }
                                }
                            }
                        },
                        carGroupName: {
                            SafeChar: true,
                            required: true,
                            maxlength: 50
                        },
                        account: {
                            SafeChar: true,
                            maxlength: 20,
                            required: true,
                            remote: {
                                url: '../../../user/exist/account?guide=' + new Date().getTime(), //避免缓存问题
                                type: 'get',
                                dataType: 'json',
                                data: {
                                    account: function account() {
                                        return $('#inp_account').val();
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
                        rePassword: {
                            required: true,
                            equalTo: '#inp_password'
                        },
                        phone: {
                            //maxlength:11
                        },
                        email: {
                            email: true
                        },
                        userGroupName: {
                            required: true
                        },
                        validend: {
                            required: true
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
                        if (quickadd.page.wizard.nowIndex == 1) {
                            //提交车组车辆或者只提交车辆
                            //验证车牌号和设备号是否重复
                            //先验证再提交
                            quickadd.page.form.validateVehicle(function () {
                                if (!quickadd.page.form.vehicleIsValid) {
                                    return;
                                } else {
                                    var _data = that.getGroupVehicleData();
                                    if (_data.name == '') {
                                        //车组名为空则只提交车辆
                                        _data.groupName = appCommon.jqueryCache('#inp_cargroupname').val();
                                        if (that.hasAddGroup) {
                                            //已经添加车组
                                            that.addVehicle(_data);
                                        }
                                    } else {
                                        //提交车组车辆时，再次验证车组名
                                        quickadd.page.form.validateGroup(function () {
                                            if (quickadd.page.form.groupIsValid) {
                                                that.addGroupAndVehicle(_data);
                                            } else {
                                                lavaMsg.alert(lang['groupExistError'], 'danger');
                                            }
                                        });
                                    }
                                }
                            });
                        } else if (quickadd.page.wizard.nowIndex == 3) {
                            //在添加用户tab界面
                            //验证用户名是否重复
                            //先验证再提交
                            quickadd.page.form.validateUser(function () {
                                if (!quickadd.page.form.userIsValid) {
                                    return;
                                } else {
                                    if (quickadd.page.wizard.onlyAddRoleUser) {
                                        //只添加角色用户
                                        var roleuserData = that.getRoleUserData();
                                        if (roleuserData.name == '') {
                                            if (that.hasAddRole) {
                                                //没有角色名，则只添加用户
                                                roleuserData.roleName = appCommon.jqueryCache('#inp_usergroupname').val();
                                                that.addUser(roleuserData);
                                            }
                                        } else {
                                            quickadd.page.form.validateRole(function () {
                                                if (quickadd.page.form.roleIsValid) {
                                                    that.addRoleAndUser(roleuserData);
                                                } else {
                                                    lavaMsg.alert(lang['roleExistError'], 'danger');
                                                }
                                            });
                                        }
                                    } else {
                                        var groupData = that.getGroupVehicleData();
                                        var roleuserData = that.getRoleUserData();
                                        if (groupData.name == '') {
                                            //车组名为空
                                            if (groupData.carlicense != '' && groupData.deviceno != '' && groupData.channel != '') {
                                                //车辆信息不为空
                                                if (that.hasAddGroup) {
                                                    //已经添加车组
                                                    groupData.groupName = appCommon.jqueryCache('#inp_cargroupname').val();
                                                    quickadd.page.form.validateVehicle(function () {
                                                        if (quickadd.page.form.vehicleIsValid) {
                                                            that.addVehicle(groupData);
                                                        } else {
                                                            lavaMsg.alert(lang['vehicleOrDeviceExistError'], 'danger');
                                                        }
                                                    });
                                                }
                                            }
                                        } else {
                                            //车组名不为空则添加车组和车辆
                                            quickadd.page.form.validateVehicle(function () {
                                                if (quickadd.page.form.vehicleIsValid) {
                                                    quickadd.page.form.validateGroup(function () {
                                                        if (quickadd.page.form.groupIsValid) {
                                                            that.addGroupAndVehicle(groupData);
                                                        } else {
                                                            lavaMsg.alert(lang['groupExistError'], 'danger');
                                                        }
                                                    });
                                                } else {
                                                    lavaMsg.alert(lang['vehicleOrDeviceExistError'], 'danger');
                                                }
                                            });
                                        }
                                        if (roleuserData.name == '') {
                                            //角色名为空
                                            if (roleuserData.account != '' && roleuserData.password != '') {
                                                //用户信息不为空
                                                if (that.hasAddRole) {
                                                    //已经添加角色
                                                    roleuserData.roleName = appCommon.jqueryCache('#inp_usergroupname').val();
                                                    quickadd.page.form.validateUser(function () {
                                                        if (quickadd.page.form.userIsValid) {
                                                            that.addUser(roleuserData);
                                                        } else {
                                                            lavaMsg.alert(lang['userExistError'], 'danger');
                                                        }
                                                    });
                                                }
                                            }
                                        } else {
                                            //角色名不为空则添加角色和用户
                                            quickadd.page.form.validateUser(function () {
                                                if (quickadd.page.form.userIsValid) {
                                                    quickadd.page.form.validateRole(function () {
                                                        if (quickadd.page.form.roleIsValid) {
                                                            that.addRoleAndUser(roleuserData);
                                                        } else {
                                                            lavaMsg.alert(lang['roleExistError'], 'danger');
                                                        }
                                                    });
                                                } else {
                                                    lavaMsg.alert(lang['userExistError'], 'danger');
                                                }
                                            });
                                        }
                                    }
                                }
                            });
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
                $.validator.addMethod('SafeChar', function (value) {
                    var reg = appCommon.regExpress().dangerChar;
                    if (reg.test(value.trim())) {
                        return false;
                    } else {
                        return true;
                    }
                }, window.lang.illegalChar);
                //将previousValue数据移除，解决remote缓存问题
                appCommon.jqueryCache('#inp_account').change(function () {
                    appCommon.jqueryCache('#inp_account').removeData('previousValue');
                });
                appCommon.jqueryCache('#inp_rolename').change(function () {
                    appCommon.jqueryCache('#inp_rolename').removeData('previousValue');
                });
                appCommon.jqueryCache('#inp_groupname').change(function () {
                    appCommon.jqueryCache('#inp_groupname').removeData('previousValue');
                });
                appCommon.jqueryCache('#inp_carlicense').change(function () {
                    appCommon.jqueryCache('#inp_carlicense').removeData('previousValue');
                });
            },
            //验证车牌号和设备号是否重复
            validateVehicle: function validateVehicle(callback) {
                var that = this;
                var flag = true;
                appCommon.ajax('../../../vehicle/exist/carlicense', 'get', 'json', { carlicense: $.trim(appCommon.jqueryCache('#inp_carlicense').val()) }, function (plateResult) {
                    if (!plateResult) {
                        appCommon.jqueryCache('#inp_carlicense').closest('.form-group').addClass('has-error').append('<label id="inp_carlicense-error" class="font-red control-label">' + lang['existErrorPlacement'] + '</label>');
                    }
                    flag = flag && plateResult;
                    appCommon.ajax('../../../vehicle/exist/deviceno', 'get', 'json', { deviceno: appCommon.jqueryCache('#inp_deviceno').val() }, function (deviceNoResult) {
                        if (!deviceNoResult) {
                            appCommon.jqueryCache('#inp_deviceno').closest('.form-group').addClass('has-error').append('<label id="inp_deviceno-error" class="font-red control-label">' + lang['existErrorPlacement'] + '</label>');
                        }
                        flag = flag && deviceNoResult;
                        that.vehicleIsValid = flag;
                        if (callback) {
                            callback();
                        }
                    });
                });
            },
            //验证车组名是否重复
            validateGroup: function validateGroup(callback) {
                var that = this;
                var flag = true;
                appCommon.ajax('../../../group/exist/name', 'get', 'json', { name: $.trim(appCommon.jqueryCache('#inp_groupname').val()) }, function (data) {
                    if (!data) {
                        appCommon.jqueryCache('#inp_groupname').closest('.form-group').addClass('has-error').append('<label id="inp_groupname-error" class="font-red control-label">' + lang['existErrorPlacement'] + '</label>');
                    }
                    flag = flag && data;
                    that.groupIsValid = flag;
                    if (callback) {
                        callback();
                    }
                });
            },
            //验证角色名是否重复
            validateRole: function validateRole(callback) {
                var that = this;
                var flag = true;
                appCommon.ajax('../../../role/exist/name', 'get', 'json', { name: $.trim(appCommon.jqueryCache('#inp_rolename').val()) }, function (data) {
                    if (!data) {
                        appCommon.jqueryCache('#inp_rolename').closest('.form-group').addClass('has-error').append('<label id="inp_rolename-error" class="font-red control-label">' + lang['existErrorPlacement'] + '</label>');
                    }
                    flag = flag && data;
                    that.roleIsValid = flag;
                    if (callback) {
                        callback();
                    }
                });
            },
            //验证用户名是否重复
            validateUser: function validateUser(callback) {
                var that = this;
                var flag = true;
                appCommon.ajax('../../../user/exist/name', 'get', 'json', { name: $.trim(appCommon.jqueryCache('#inp_account').val()) }, function (data) {
                    if (!data) {
                        appCommon.jqueryCache('#inp_account').closest('.form-group').addClass('has-error').append('<label id="inp_account-error" class="font-red control-label">' + lang['existErrorPlacement'] + '</label>');
                    }
                    that.userIsValid = flag && data;
                    if (callback) {
                        callback();
                    }
                });
            },
            addVehicle: function addVehicle(vehicle, callback) {
                //只添加车辆
                var that = this;
                appCommon.ajax('../../../quick-add/vehicle', 'post', 'json', vehicle, function (data) {
                    if (data.code == 200) {
                        if (data.result) {
                            lavaMsg.alert(lang['addVehicleSuccess'], 'success');
                            that.clearGroupVehicleData();
                            quickadd.page.wizard.isFirstOpenVehicle = true;
                        } else {
                            lavaMsg.alert(lang['addVehicleFail'], 'danger');
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                    if (callback) {
                        callback();
                    }
                });
            },
            addGroupAndVehicle: function addGroupAndVehicle(groupvehicle, callback) {
                //添加车组车辆
                var that = this;
                appCommon.ajax('../../../quick-add/group-vehicle', 'post', 'json', groupvehicle, function (data) {
                    if (data.code == 200) {
                        if (data.result) {
                            lavaMsg.alert(lang['addGroupVehicleSuccess'], 'success');
                            that.hasAddGroup = true;
                            appCommon.jqueryCache('#inp_carlicense').focus();
                            quickadd.page.tree.reloadParentGroup();
                            quickadd.page.tree.reloadGroupAuthority();
                            that.clearGroupVehicleData();
                        } else {
                            lavaMsg.alert(lang['addGroupVehicleFail'], 'danger');
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                    if (callback) {
                        callback();
                    }
                });
            },
            addUser: function addUser(user, callback) {
                //只添加用户
                var that = this;
                appCommon.ajax('../../../quick-add/user', 'post', 'json', user, function (data) {
                    if (data.code == 200) {
                        if (data.result) {
                            lavaMsg.alert(lang['addUserSuccess'], 'success');
                            that.clearRoleUserData();
                        } else {
                            lavaMsg.alert(lang['addUserFail'], 'danger');
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                    if (callback) {
                        callback();
                    }
                });
            },
            addRoleAndUser: function addRoleAndUser(roleuser, callback) {
                //添加用户和角色
                var that = this;
                appCommon.ajax('../../../quick-add/role-user', 'post', 'json', roleuser, function (data) {
                    if (data.code == 200) {
                        if (data.result) {
                            lavaMsg.alert(lang['addRoleUserSuccess'], 'success');
                            that.hasAddRole = true;
                            that.clearRoleUserData();
                            quickadd.page.tree.reloadParentRole();
                        } else {
                            lavaMsg.alert(lang['addRoleUserFail'], 'danger');
                        }
                    } else {
                        lavaMsg.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                    if (callback) {
                        callback();
                    }
                });
            },
            checkboxOperate: function checkboxOperate() {
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
                            for (var attr in quickadd.roleAuthority) {
                                var subModuleStr = '|' + quickadd.roleAuthority[attr].join('|');
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
                                for (var attr in quickadd.roleAuthority) {
                                    var subModuleStr = '|' + quickadd.roleAuthority[attr].join('|');
                                    if (subModuleStr.indexOf('|' + module) > -1) {
                                        $("input[value='" + attr.split('_')[1] + "']").prop('checked', true);
                                    }
                                }
                            }
                        }
                    } else if (e.target.className == 'firstModule') {
                        var firstModule = $(this).val();
                        for (var attr in quickadd.roleAuthority) {
                            if (attr == 'M_' + firstModule) {
                                var subModule = quickadd.roleAuthority[attr];
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
            initOperateAuthority: function initOperateAuthority(id) {
                var that = this;
                that.hasRealPlay = false;
                that.hasPlayback = false;
                var url = '../../../role/' + id;
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
                                if (authority[i].module && authority[i].module == '308') {
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
                            var $tbody = appCommon.jqueryCache('#tbody_authority');
                            //先过滤下权限
                            var authorityHtml = {};
                            for (var i = 0; i < authority.length; i++) {
                                var module = authority[i].module;
                                //把20单独出来是因为M_20语言包中没有
                                if (lang['M_' + module] || lang['C_M_' + module] || module == 20) {
                                    //如果是从客户端跳转过来的，则隐藏web上的模块权限
                                    if (quickadd.isJump) {
                                        if (module == '38' || module == '48' || module == '49') {
                                            continue;
                                        }
                                    }
                                    //把角色用户的模块id换成语言包中的19
                                    if (module == 20) {
                                        authority[i].module = 19;
                                        module = authority[i].module;
                                    }
                                    //回放直通保持和CB2的权限ID一致
                                    if (module == 48) {
                                        authority[i].module = 303;
                                        module = authority[i].module;
                                    }
                                    if (module == 49) {
                                        authority[i].module = 308;
                                        module = authority[i].module;
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
                                        var mLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='firstModule' type='checkbox' value='" + module + "'>" + '<span></span></label>';
                                        data.push(mLabel + lang['M_' + module]);
                                        html = appCommon.strReplace(html, data);
                                        authorityHtml['M_' + module]['html'] = html;
                                    } else {
                                        for (var attr in quickadd.roleAuthority) {
                                            var subModuleStr = '|' + quickadd.roleAuthority[attr].join('|');
                                            if (subModuleStr.indexOf('|' + module) > -1) {
                                                //先判断有没有对应的模块数组，如果没有先初始化
                                                if (!authorityHtml[attr]) {
                                                    authorityHtml[attr] = { html: '', subModule: [] };
                                                    //组装一级模块的html
                                                    var html = '<td {rowspan}>{0}</td>';
                                                    var data = [];
                                                    var mLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='firstModule' type='checkbox' value='" + attr.split('_')[1] + "'>" + '<span></span></label>';
                                                    data.push(mLabel + lang[attr]);
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
                                                    if (/^(19|20)$/.test(module)) {
                                                        mVal = '19,20';
                                                    }
                                                    var smLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='subModule' type='checkbox' value='" + mVal + "'>" + '<span></span></label>';
                                                    if (module == '38') {
                                                        smLang = smLabel + lang['M_' + module] + '(web)';
                                                    } else {
                                                        smLang = smLabel + lang['M_' + module];
                                                    }
                                                } else if (lang['C_M_' + module]) {
                                                    if (/^(19|20)$/.test(module)) {
                                                        mVal = '19,20';
                                                    }
                                                    var smLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='subModule' type='checkbox' value='" + mVal + "'>" + '<span></span></label>';
                                                    smLang = smLabel + lang['C_M_' + module];
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
                                                    if (commandLang) {
                                                        var cLabel = "<label class='mt-checkbox mt-checkbox-outline'>" + "<input class='command' type='checkbox' value='" + authority[i].command[j] + "'>" + '<span></span></label>';
                                                        commandLang = cLabel + commandLang;
                                                    }
                                                    //右键设置和报警策略比较挤
                                                    if (module == '301' || module == '207') {
                                                        if (commandLang && commands.length !== 0 && commands.length % 2 === 0) {
                                                            commandLang = '</br>' + commandLang;
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
                            $tbody.html(lastHtml.reverse().join(''));
                        }
                    }
                });
            },
            getGroup: function getGroup() {
                var that = this;
                var nodes = quickadd.page.tree.groupObj.getCheckedNodes(true);
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
                    var node = quickadd.page.tree.groupObj.getNodeByParam('id', ids[i]);
                    if (node.getParentNode() && that.arrayIndexOf(ids, node.getParentNode().id) > -1) {
                        //如果父节点被勾选则将当前结点去掉
                        that.arrayRemove(idArray, ids[i]);
                        that.arrayRemove(nameArray, names[i]);
                    }
                }
                return idArray.join(',');
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
            getAllGroup: function getAllGroup() {
                var groups = [];
                var nodes = quickadd.page.tree.groupObj.getNodesByFilter(function (node) {
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
            getGroupVehicleData: function getGroupVehicleData() {
                var data = {};
                var _name = $.trim(appCommon.jqueryCache('#inp_groupname').val());
                var nodes = quickadd.page.tree.pGroupObj.getSelectedNodes(true);
                var _pid = nodes[0].id;
                var _carlicense = $.trim(appCommon.jqueryCache('#inp_carlicense').val());
                var _platecolor = appCommon.jqueryCache('#inp_carcolor').val();
                var _deviceno = $.trim(appCommon.jqueryCache('#inp_deviceno').val());
                var _channel = appCommon.jqueryCache('#inp_channelnum').val();
                var _type = appCommon.jqueryCache('#inp_type').val();
                var _linktype = appCommon.jqueryCache('#inp_linktype').val();
                var _deviceusename = appCommon.jqueryCache('#inp_deviceusename').val();
                var _devicePassword = appCommon.jqueryCache('#inp_devicepassword').val();
                //获取通道使能
                var $channelEnable = $('.channel');
                var total = $channelEnable.length - 1;
                var channelArr = [],
                    channelname = [];
                $channelEnable.each(function (index, obj) {
                    var value = $(obj).val();
                    if ($(obj).val() != -1) {
                        if ($(obj).prop('checked')) {
                            channelArr[total - value] = 1;
                        } else {
                            channelArr[total - value] = 0;
                        }
                    }
                });
                //默认通道名为空
                data.channelname = '';
                data.channelenable = parseInt(channelArr.join(''), 2);
                data.name = _name;
                data.pid = _pid;
                data.remark = '';
                data.carlicense = _carlicense;
                data.platecolor = _platecolor;
                data.deviceno = _deviceno;
                data.channel = _channel;
                data.type = _type;
                data.linktype = _linktype;
                data.sim = '';
                data.logContent = _name + ',' + _carlicense;
                data.deviceusename = _deviceusename;
                data.devicePassword = _devicePassword;
                return data;
            },
            clearGroupVehicleData: function clearGroupVehicleData() {
                appCommon.jqueryCache('#inp_groupname').val('');
                appCommon.jqueryCache('#inp_carlicense').val('');
                appCommon.jqueryCache('#inp_carcolor').val(1).trigger('change');
                appCommon.jqueryCache('#inp_deviceno').val('');
                appCommon.jqueryCache('#inp_channelnum').val(4);
                appCommon.jqueryCache('#inp_type').val(4).trigger('change');
                appCommon.jqueryCache('#inp_linktype').val('124');
                appCommon.jqueryCache('#inp_isaddrole').prop('checked', false); //默认不勾选添加角色用户
            },
            getRoleUserData: function getRoleUserData() {
                var that = this;
                var data = {};
                data.pid = quickadd.page.tree.pRoleObj.getSelectedNodes()[0].id;
                data.name = $.trim(appCommon.jqueryCache('#inp_rolename').val());
                data.command = that.getCommand();
                data.module = that.getModule();
                data.group = that.getGroup();
                //默认具有所有通道权限
                data.channelpower = JSON.stringify([]);
                data.account = $.trim(appCommon.jqueryCache('#inp_account').val());
                data.password = encodeURIComponent(appCommon.encryptRSAStr(quickadd.rsapublickey, appCommon.jqueryCache('#inp_password').val()));
                data.logContent = appCommon.jqueryCache('#inp_rolename').val() + ',' + $('#inp_account').val();
                data.validend = appCommon.jqueryCache('#inp_validend').val();
                data.phone = '';
                data.email = '';
                return data;
            },
            clearRoleUserData: function clearRoleUserData() {
                appCommon.jqueryCache('#inp_rolename').val('');
                appCommon.jqueryCache('#inp_account').val('');
                appCommon.jqueryCache('#inp_password').val('');
                appCommon.jqueryCache('#inp_repassword').val('');
                //去掉勾选操作
                var $commands = $('.command');
                var commands = [];
                $commands.each(function (index, obj) {
                    $(obj).prop('checked', false);
                });
                var $modules = $('.module');
                var modules = [];
                $modules.each(function (index, obj) {
                    $(obj).prop('checked', false);
                });
                appCommon.jqueryCache('#checkbox_moduleall').prop('checked', false);
                quickadd.page.tree.groupObj.checkAllNodes(false);
            },
            getCommand: function getCommand() {
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
            getModule: function getModule() {
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
            //获取勾选的通道 {vid:,channel:}
            getChannel: function getChannel() {
                var nodes = quickadd.page.tree.channelObj.getCheckedNodes(true);
                var channelpowers = [];
                var channelpowers = [];
                if (nodes.length > 0) {
                    for (var i = 0; i < nodes.length; i++) {
                        var channelpower = { vid: 0, channel: '' };
                        //过滤车id
                        if (nodes[i].icon.indexOf('car.min.png') > -1) {
                            channelpower.vid = nodes[i].id;
                            if (nodes[i].children) {
                                for (var j = 0; j < nodes[i].children.length; j++) {
                                    if (!nodes[i].children[j].checked) {
                                        channelpower.channel = channelpower.channel ? channelpower.channel + ',' + nodes[i].children[j].id : nodes[i].children[j].id;
                                    }
                                }
                            }
                            channelpowers.push(channelpower);
                        } else {
                            var pNode = nodes[i].getParentNode();
                            if (pNode.icon.indexOf('car.min.png') > -1) {
                                channelpower.vid = pNode.id;
                                channelpower.channel = channelpower.channel ? channelpower.channel + ',' + nodes[i].id : nodes[i].id;
                                channelpowers.push(channelpower);
                            }
                        }
                    }
                }
                return JSON.stringify(channelpowers);
            },
            fillData: function fillData(index) {
                if (index == 1) {
                    var groupname = appCommon.jqueryCache('#inp_groupname').val();
                    appCommon.jqueryCache('#inp_cargroupname').val(groupname);
                } else if (index == 3) {
                    var rolename = appCommon.jqueryCache('#inp_rolename').val();
                    appCommon.jqueryCache('#inp_usergroupname').val(rolename);
                }
            },
            /**
             * @channel 通道总数
             * @channelEnable 使能通道的10进制数
             */
            initChnnelEnable: function initChnnelEnable(channel, channelEnable) {
                var that = this;
                //初始化通道使能
                var htmlArr = [];
                var enable = parseInt(channelEnable).toString(2);
                for (var i = -1; i < channel; i++) {
                    var html = '<label class="mt-checkbox mt-checkbox-outline"><input type="checkbox" value = "{0}" class="channel" {2}><span></span></label><span class="{3}">{1}</span>';
                    var data = [];
                    if (i === -1) {
                        data.push(-1);
                        data.push(lang['all']);
                        if (channelEnable != null) {
                            if (enable.indexOf('0') < 0) {
                                data.push('checked');
                            }
                        }
                        data.push('sp_all');
                    } else {
                        data.push(i);
                        data.push(i + 1);
                        if (channelEnable != null) {
                            enable.slice(channel - 1 - i, channel - i) == 1 ? data.push('checked') : data.push('');
                        } else {
                            data.push('');
                        }
                        data.push('sp_channel');
                    }
                    html = appCommon.strReplace(html, data);
                    if (i != 1 && i % 8 == 1) {
                        html = '</br>' + html + '&emsp;';
                    }
                    htmlArr.push(html);
                }
                that.$enableChkboxDiv.html(htmlArr.join(''));
                that.$el.delegate("input[value='-1']", 'click', function (e) {
                    if ($(this).prop('checked')) {
                        $('input.channel').prop('checked', true);
                    } else {
                        $('input.channel').prop('checked', false);
                    }
                });
            }
        },
        tree: {
            $el_parentgroup: $('#ul_parentgroup'),
            $el_parentrole: $('#ul_parentrole'),
            $el_group: $('#ul_group'),
            $channelEl: appCommon.jqueryCache('#ul_channel'),
            pGroupObj: null,
            groupObj: null,
            pRoleObj: null,
            channelObj: null,
            clickedRid: 0,
            init: function init() {
                var that = this;
                that.initParentGroup();
                that.initParentRole();
            },
            initParentGroup: function initParentGroup() {
                var that = this;
                $.fn.zTree.init(that.$el_parentgroup, that.getSetting('../../../common/simple-tree', false));
                that.pGroupObj = $.fn.zTree.getZTreeObj('ul_parentgroup');
            },
            reloadParentGroup: function reloadParentGroup() {
                var that = this;
                if (that.pGroupObj) {
                    that.pGroupObj.reAsyncChildNodes(null, 'refresh');
                }
            },
            initParentRole: function initParentRole() {
                var that = this;
                $.fn.zTree.init(that.$el_parentrole, that.getSetting('../../../common/role-tree', false));
                that.pRoleObj = $.fn.zTree.getZTreeObj('ul_parentrole');
            },
            reloadParentRole: function reloadParentRole() {
                var that = this;
                if (that.pRoleObj) {
                    that.pRoleObj.reAsyncChildNodes(null, 'refresh');
                }
            },
            initGroupAuthority: function initGroupAuthority() {
                var that = this;
                $.fn.zTree.init(that.$el_group, that.getSetting('../../../common/simple-tree/' + that.clickedRid, true, function () {
                    //先默认把所有车组勾选上
                    quickadd.page.tree.groupObj.checkAllNodes(true);
                    //获取所有的车组id
                    var ids = quickadd.page.form.getAllGroup();
                    quickadd.page.tree.initChannel(ids, true, function () {
                        //默认勾选所有通道
                        quickadd.page.tree.channelObj.checkAllNodes(true);
                    });
                }));
                that.groupObj = $.fn.zTree.getZTreeObj('ul_group');
            },
            initChannel: function initChannel(ids, isCheck, callback) {
                var that = this;
                $.fn.zTree.init(that.$channelEl, that.getSetting('../../../common/vehicle-tree/powerchannel', isCheck, callback, { groupid: ids }));
                that.channelObj = $.fn.zTree.getZTreeObj('ul_channel');
            },
            reloadGroupAuthority: function reloadGroupAuthority() {
                var that = this;
                if (that.groupObj) {
                    that.groupObj.reAsyncChildNodes(null, 'refresh');
                }
            },
            getSetting: function getSetting(url, isMultipleSelect, callback, otherParam) {
                var that = this;
                var setting = {
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
                    check: {
                        enable: isMultipleSelect,
                        chkboxType: { Y: 's', N: 'ps' }
                    },
                    callback: {
                        onAsyncSuccess: function onAsyncSuccess(event, treeId, treeNode) {
                            if (treeId == 'ul_parentgroup') {
                                that.pGroupObj.getNodesByFilter(function (node) {
                                    if (node.level == 0) {
                                        that.pGroupObj.selectNode(node);
                                    }
                                });
                            } else if (treeId == 'ul_parentrole') {
                                that.pRoleObj.getNodesByFilter(function (node) {
                                    if (node.level == 0) {
                                        that.clickedRid = node.id;
                                    }
                                });
                                var rootNode = that.pRoleObj.getNodeByParam('id', that.clickedRid);
                                that.pRoleObj.selectNode(rootNode);
                                quickadd.page.form.initOperateAuthority(that.clickedRid);
                                that.initGroupAuthority();
                            }
                            if (callback) {
                                callback();
                            }
                        },
                        onClick: function onClick(event, treeId, treeNode) {
                            if (treeId == 'ul_parentrole') {
                                that.clickedRid = treeNode.id;
                                quickadd.page.form.initOperateAuthority(that.clickedRid);
                                that.initGroupAuthority();
                            }
                        }
                    }
                };
                return setting;
            },
            resize: function resize(id, height) {
                $('#' + id).height(height);
            },
            //根据上面的通道勾选树的通道
            setChannelCheck: function setChannelCheck(value, checkFlag) {
                value = value.split('_')[1];
                var that = this;
                that.channelObj.getNodesByFilter(function (node) {
                    if (node.icon.indexOf('webcam.min.png') > -1 && node.name == value) {
                        that.channelObj.checkNode(node, checkFlag, true);
                    }
                });
            }
        },
        slimScroll: {
            resizeScroll: function resizeScroll(id, height) {
                $('#' + id).slimScroll({
                    height: height,
                    alwaysVisible: true,
                    color: '#32C5D2',
                    railVisible: true,
                    railOpacity: 0.3,
                    opacity: 0.7,
                    wheelStep: 20
                });
            },
            initPRole: function initPRole() {
                $('#div_parentrole').slimScroll({
                    height: 200,
                    alwaysVisible: true,
                    color: '#32C5D2',
                    railVisible: true,
                    railOpacity: 0.3,
                    opacity: 0.7,
                    wheelStep: 20
                });
            }
        },
        //角色下的权限tab
        tab: {
            nowIndex: 0,
            init: function init() {
                var that = this;
                that.bindEvent();
            },
            bindEvent: function bindEvent() {
                var that = this;
                $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                    if ($(this).prop('id') == 'a_module') {
                        that.nowIndex = 0;
                        quickadd.page.resize();
                    } else if ($(this).prop('id') == 'a_group') {
                        that.nowIndex = 1;
                        quickadd.page.resize();
                    } else if ($(this).prop('id') == 'a_channel') {
                        that.nowIndex = 2;
                        quickadd.page.resize();
                        var ids = quickadd.page.form.getGroup();
                        quickadd.page.tree.initChannel(ids, true, function () {
                            //默认勾选所有通道
                            quickadd.page.tree.channelObj.checkAllNodes(true);
                            //勾选上面的所有通道
                            for (var i = 1; i < 17; i++) {
                                $("input[value='totalChnnl_" + i + "']").prop('checked', true);
                            }
                        });
                    }
                });
            }
        }
    }
};
window.onload = function () {
    appCommon.lang(function () {
        quickadd.rsapublickey = appCommon.getRSAPublicKey();
        quickadd.init();
    });
};
window.onresize = function () {
    quickadd.page.resize();
};