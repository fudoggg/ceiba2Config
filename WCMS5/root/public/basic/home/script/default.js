function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var appHome = {
    uri: '/basic/home/',
    apiuri: '/login/',
    lang: '',
    defaultPage: 'basic/dashboard/default.html',
    userValidTime: '', //用户有效期
    rsapublickey: '',
    faceTime: '',
    startDefaultValue: '',
    endDefaultValue: '',
    init: function init() {
        var that = this;
        that.lang = appCommon.getCookie('wcms5c', 'L');
        that.userValidTime = appCommon.getCookie('wcms5u', 've');
        that.page.init();
    },
    //页面整体
    page: {
        $time: $('#span_time'),
        el_loading: '#div_loading',
        el_iframe: '<iframe id="{0}" frameborder="0" allowfullscreen="true" style="width:100%;height:100%;border:none;"></iframe>',
        socket: null,
        alarmType: [],
        ids: [], //车辆id数组
        action: '', //从客户端跳转过来的参数action，标志需要跳转到哪个页面
        init: function init() {
            var that = this;
            that.resize();
            that.setCookie();
            $('.nav-toggle').on('mouseenter', function () {
                var $this = $(this);
                if ($this.siblings('.sub-menu')) {
                    var win = $(window);
                    var $subMenu = $this.siblings('.sub-menu');
                    if ($this.parent()[0].id == 'm_report') {
                        //@wzz 2018-05-03 判断sbu-menu的高度与窗口高度
                        //清空设置的属性
                        $subMenu.attr('style', '');
                        var winHeight = win.height();
                        var subMenuHeight = $subMenu.height();
                        var subOffTop = $subMenu.offset().top;
                        if (subMenuHeight + subOffTop - 0.4 * subOffTop > winHeight) {
                            $subMenu.attr('style', 'top: -' + 0.6 * subOffTop + 'px!important;height:' + (winHeight - 0.7 * subOffTop) + 'px!important;overflow:auto;');
                        } else {
                            $subMenu.attr('style', 'top: -' + 0.1 * subOffTop + 'px!important;');
                        }
                    } else {
                        window.setTimeout(function () {
                            if ($subMenu.offset().top + $subMenu.height() - win.height() - win.scrollTop() > 0) {
                                $subMenu.attr('style', 'top:' + (win.height() + win.scrollTop() - $subMenu.height() - $subMenu.offset().top - 36) + 'px !important;');
                            }
                        }, 100);
                    }
                }
            });
            //获取跳转路径中的action
            that.action = appCommon.getQueryString('action');
            //根据action加载不同的页面
            if (that.action) {
                that.initTabs(that.action);
            } else {
                that.initTabs();
            }
            this.initTime();
            appHome.topMenu.init();
            appHome.sidebar.init();
            if (appHome.lang != 'en-US') {
                appCommon.loadScriptOrCss('script', '../../../third-resource/metronic47/global/plugins/jquery-validation/js/localization/messages_' + appHome.lang + '.min.js', function () {
                    appHome.passwordInfo.init();
                });
            } else {
                appHome.passwordInfo.init();
            }
            //appHome.download.init();
            // this.initSocket();
        },
        //获取系统配置存入cookie
        setCookie: function setCookie() {
            //获取系统配置
            appCommon.ajax('../../../system-config/items', 'get', 'json', {}, function (data) {
                var _data = {};
                for (var j in data.result) {
                    var name = data.result[j].name;
                    var value = data.result[j].value;
                    _data['' + name] = value;
                }
                //将系统配置写到cookie中
                if (Cookies) {
                    if (Cookies.get(appConfig.CONFIGCOOKIENAME)) {
                        var cookieJson = JSON.parse(Cookies.get(appConfig.CONFIGCOOKIENAME));
                        if (cookieJson) {
                            cookieJson.SU = _data.SpeedUnit;
                            cookieJson.MT = _data.MapType;
                            cookieJson.AT = _data.AutoCloseVideo;
                            cookieJson.E = _data.Enable;
                            cookieJson.isJump = false;
                            cookieJson.MK = _data.MapType == 'BMap' ? '' : _data.MapKey;
                            Cookies.set(appConfig.CONFIGCOOKIENAME, JSON.stringify(cookieJson), {
                                expires: 7,
                                path: '/'
                            });
                        }
                    }
                }
            });
        },
        resize: function resize() {
            //让页面总体高度随窗口高度变化而变化
            $(window).resize(function () {
                var height = $(window).height();
                var headerHeight = parseInt($('.page-header').css('height'));
                var tabToolHeight = parseInt($('.lava-tabs-toolbar').css('height'));
                if ($($('.lava-tabs-tab').not('.lava-tabs-tab-close').find('iframe')[0].contentWindow.document.body).find('.page-content').height() <= $('.lava-tabs-tab').not('.lava-tabs-tab-close').height()) {
                    $($('.lava-tabs-tab').not('.lava-tabs-tab-close').find('iframe')[0].contentWindow.document.body).find('.page-content').css('height', height - headerHeight - tabToolHeight);
                }
                $('#div_content').css('height', height - headerHeight < $('.page-sidebar').height() ? $('.page-sidebar').height() : height - headerHeight);
                //$($(".lava-tabs-tab").not(".lava-tabs-tab-close").find("iframe")[0].contentWindow.document).children("html").css("overflow", "hidden");
            });
        },
        //初始化socket
        initSocket: function initSocket() {
            var that = this;
            /**
             * @author ququ
             * @content 从数据库获取所有报警类型
             */
            that.alarmType = window.appCommon.getAlarmTypeArray();
            /**
             * end
             */
            that.socket = io.connect(location.origin);
            that.socket.on('sub_alarm', function (data) {
                appHome.alarm.appendAlarm(data);
            });
            //socket重连
            that.socket.on('reconnect', function () {
                that.socket.emit('sub_alarm', { vidArray: that.ids, alarmType: that.alarmType });
            });
            appCommon.ajax('../../common/vehicle-tree', 'get', 'json', {}, function (data) {
                if (data.code == 200) {
                    if (data.result) {
                        var str = JSON.stringify(data.result);
                        var arr = str.match(/(\{[0-9a-zA-Z\u4E00-\u9FA5:",.\-\/_ ]*car.min.png[0-9a-zA-Z\u4E00-\u9FA5:",.\-\/_ ]*\})/g);
                        var ids = [];
                        if (arr && arr.length > 0) {
                            for (var i = 0; i < arr.length; i++) {
                                ids.push(JSON.parse(arr[i]).id);
                            }
                            if (ids.length > 0) {
                                that.ids = ids;
                                that.socket.emit('sub_alarm', { vidArray: ids, alarmType: that.alarmType });
                            }
                        }
                    }
                }
            });
        },
        //弹出信息
        alert: function alert(info, type) {
            lavaMsg.alert(info, type);
        },
        //弹出确定框
        confirm: function confirm(title, info, oklabel, callback) {
            lavaMsg.confirm(title, info, oklabel, function (r) {
                callback(r);
            });
        },
        /**
         * 初始化时间
         */
        initTime: function initTime() {
            var that = this;
            setInterval(function () {
                that.$time.text(appCommon.getDateTime(new Date(), true, 'yyyy-MM-dd')); //统一时间格式@wzz20180403
            }, 1000);
        },
        /**
         * 初始化Tabs
         * @type 初始化界面的类型 "basic" / "report",type为空时则直接跳转至home页面
         */
        initTabs: function initTabs(type) {
            var that = this;
            var bg = $('body').css('background-color');
            var color = $('.nav-link').eq(0).css('color');
            var borderColor = $('.nav-link').eq(0).css('borderTopColor');
            var activeColor = $('.page-header').eq(0).css('background-color');
            $('#div_tabs').lavaTabs({
                color: '#888',
                bgColor: '#fafbfc',
                borderColor: '#eef1f5',
                activeColor: '#eef1f5',
                onSelect: function onSelect(title, id) {
                    var idStr = $('#' + id).find('iframe').attr('id');
                    //获取iframe子页面全局变量
                    var childPage = window.frames[idStr].contentWindow;
                    //解决ajax轮询导致table样式错乱问题，选中有轮询的tab页后刷新table
                    if (title === lang.M_38) {
                        childPage.frames['iframe_linkage'].contentWindow.taskReportInfo.$table_taskList.table('resize');
                    } else if (title === lang.M_32) {
                        childPage.remoteUpgrade.page.taskManage.$tableTask.table('resize');
                    }
                    $('.nav-item.active').removeClass('active');
                    $('.span-icon-select').removeClass('span-icon-select');
                    var $titles = $('.page-sidebar-menu .nav-link>span[lang]');
                    var $title = null;
                    for (var i = 0; i < $titles.length; i++) {
                        if (lang[$titles.eq(i).attr('lang')] == title) {
                            $title = $titles.eq(i);
                            break;
                        }
                    }
                    if ($title) {
                        if ($title.parent().parent().parent().hasClass('sub-menu')) {
                            $title.parent().parent().parent().parent().addClass('active');
                            $title.parent().parent().parent().prev().children('.span-icon').addClass('span-icon-select');
                        } else {
                            $title.parent().parent().addClass('active');
                            $title.prev().addClass('span-icon-select');
                        }
                    }
                }
            });
            var id = new Date().getTime();
            var _title = '';
            var _src = '';
            if (type) {
                if (type == 'basic') {
                    _title = lang.homePage;
                    _src = '../../../' + appHome.defaultPage;
                } else if (type == 'report') {
                    _title = lang['reportDashboard'];
                    _src = '/report/dashboard/default.html';
                } else if (type == 'alarmvideo') {
                    _title = lang['M_49'];
                    var device = appCommon.getQueryString('device');
                    var alarmtime = appCommon.getQueryString('alarmtime');
                    var alarmtype = appCommon.getQueryString('alarmtype');
                    _src = '/play-back/video-track/default.html' + '?device=' + device + '&alarmtime=' + alarmtime + '&alarmtype=' + alarmtype;
                }
            } else {
                _title = lang.homePage;
                _src = '../../../' + appHome.defaultPage;
            }
            $('#div_tabs').lavaTabs('add', {
                title: _title,
                closable: false,
                content: that.el_iframe.replace('{0}', id)
            });
            $('#' + id).prop('src', _src);
            $('#' + id)[0].onload = function (e) {
                that.removeLoading();
            };
            this.loading();
        },
        addTab: function addTab(title, url) {
            var existMonitor = false,
                existSetting = false,
                existPlayback = false;
            var existHomePage = false;
            //监控和系统设置，回放界面，首页只能打开一个
            if (title == lang['M_48'] || title == lang['M_38'] || title == lang['M_49'] || title == lang['homePage']) {
                $.each($('.lava-tabs-btn'), function (index, el) {
                    if ($.trim($(el).text()) == $.trim(title)) {
                        $(el).click();
                        if (title == lang['M_48']) {
                            existMonitor = true;
                        } else if (title == lang['M_38']) {
                            existSetting = true;
                        } else if (title == lang['M_49']) {
                            existPlayback = true;
                        } else if (title == lang['homePage']) {
                            existHomePage = true;
                        }
                    }
                });
                appHome.alarm.show();
                //如果不存在监控页面则新打开一个
                if (!existMonitor && title == lang['M_48']) {
                    if (url) {
                        this.addNewTab(title, url);
                    }
                }
                //如果不存在系统设置页面则新打开一个
                if (!existSetting && title == lang['M_38']) {
                    this.addNewTab(title, url);
                }
                if (!existPlayback && title == lang['M_49']) {
                    this.addNewTab(title, url);
                }
                if (!existHomePage && title == lang['homePage']) {
                    this.addNewTab(title, url);
                }
            } else {
                if (url) {
                    //@wzz0521修改相同的Tab页面只能打开一次
                    var titileExistFlag = false;
                    var titleEl = null;
                    $('.lava-tabs-btn').each(function (index, el) {
                        if ($.trim($(el).text()) == $.trim(title)) {
                            titileExistFlag = true;
                            titleEl = el;
                        }
                    });
                    if (!titileExistFlag) {
                        this.addNewTab(title, url);
                    } else {
                        $(titleEl).click();
                    }
                } else {
                    //如果没有url则是从报警查看详情跳转至报警报表查看页面
                    //根据lang属性判断是因为左侧栏去掉了一级菜单的文字，将原有的data-lang属性改为了lang属性
                    var $btn = $('.nav-link>span[lang=M_2201]').parent();
                    $btn.click();
                }
            }
        },
        /**
         * 添加新的tab
         */
        addNewTab: function addNewTab(title, url) {
            var that = this;
            that.loading();
            var id = new Date().getTime();
            //火狐下，隐藏回放界面采用向左定位的方式，防止flash重新初始化
            if (appCommon.checkBrower().mozilla && title == lang['M_49']) {
                var hideType = 'position';
            } else {
                var hideType = 'hide';
            }
            $('#div_tabs').lavaTabs('add', {
                title: title,
                content: that.el_iframe.replace('{0}', id),
                hideType: hideType
            });
            $('#' + id).prop('src', '../../../' + url);
            $('#' + id).load(function (e) {
                that.removeLoading();
            });
        },
        /**
         * 加载等待状态
         */
        loading: function loading() {
            $(this.el_loading).removeClass('fadeout').css('backgroundColor', $('body').css('backgroundColor')).show(); //使用渐隐的方法淡出loading page
        },
        /**
         * 取消等待状态
         */
        removeLoading: function removeLoading() {
            $(appHome.page.el_loading).addClass('fadeout');
            window.setTimeout(function () {
                $(appHome.page.el_loading).hide();
            }, 1000);
        }
    },
    /**
     * 右上角菜单
     */
    topMenu: {
        $el: $('#ul_user'),
        $username: $('.username'),
        init: function init() {
            this.loadUserName();
            if (appHome.userValidTime) {
                var endTime = new Date(appHome.userValidTime.replace(/-/g, '/')).getTime();
                var count = endTime - new Date().getTime();
                var sevenDays = 7 * 24 * 60 * 60 * 1000;
                if (count <= sevenDays) {
                    //小于7天时加载过期提示
                    this.loadOverTimePrompt();
                }
            }
            this.initEvent();
        },
        //初始化事件
        initEvent: function initEvent() {
            var that = this;
            that.$el.delegate('a', 'click', function () {
                var id = $(this).prop('id');
                switch (id) {
                    case 'a_logout':
                        appHome.page.confirm(lang.prompt, lang.logoutPrompt + '?', lang.sure, function (r) {
                            if (r) {
                                appCommon.ajax(appHome.apiuri + 'out', 'GET', 'json', {}, function (data) {
                                    if (data.code == 200) {
                                        if (data.result) {
                                            if (appHome.page.action) {
                                                if (appHome.page.action == 'alarmvideo') {
                                                    var device = appCommon.getQueryString('device');
                                                    var alarmtime = appCommon.getQueryString('alarmtime');
                                                    var alarmtype = appCommon.getQueryString('alarmtype');
                                                    window.location.href = '/basic/register-login/default.html' + '?action=' + appHome.page.action + '&device=' + device + '&alarmtype=' + alarmtype + '&alarmtime=' + alarmtime;
                                                } else {
                                                    window.location.href = '/basic/register-login/default.html' + '?action=' + appHome.page.action;
                                                }
                                            } else {
                                                window.location.href = '/basic/register-login/default.html';
                                                window.setInterval(function () {
                                                    window.location.href = '/basic/register-login/default.html';
                                                }, 5000);
                                            }
                                        }
                                    } else {
                                        appHome.page.alert(appCommon.errorCode2Message(data.code), 'danger');
                                    }
                                });
                            }
                        });
                        break;
                    case 'a_userinfo':
                        appHome.userInfo.show();
                        break;
                    case 'a_password':
                        appHome.passwordInfo.show();
                        break;
                    default:
                        break;
                }
            });
        },
        //加载用户名
        loadUserName: function loadUserName() {
            var name = appCommon.getCookie(appConfig.USERCOOKIENAME, 'un');
            this.$username.text(name);
        },
        loadVersion: function loadVersion() {
            var that = this;
            var version = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'V');
            that.$version.text('V' + version);
        },
        loadOverTimePrompt: function loadOverTimePrompt() {
            $('#span_endtime').html(appHome.userValidTime + lang.expire);
        }
    },
    //左侧菜单
    sidebar: {
        $wrapper: $('.page-sidebar-wrapper'),
        $home: $('#m_home'),
        $basic: $('#m_basicinfo'),
        //$monitor: $("#m_monitor"),
        //$playback: $("#m_playback"),
        $evidence: $('#m_evidence'),
        $alarm: $('#m_alarmcenter'),
        $report: $('#m_report'),
        $help: $('#m_help'),
        //$system: $("#m_system"),
        li_temp: '<li class="nav-item">' + '<a href="javascript:;" class="nav-link" url="{url}">' + '<i class="{icon}"></i> ' + '<span class="title" id="title" lang="{lang}">{title}</span>' + '</a>' + '</li>',
        init: function init() {
            var that = this;
            that.initMenu();
            that.initEvent();
        },
        //初始化菜单
        initMenu: function initMenu() {
            var that = this;
            var currRid = appCommon.getCookie('wcms5u', 'rid');
            var auth = [];
            appCommon.ajax('../../../role/' + currRid, 'get', 'json', {}, function (data) {
                if (data.code == 200) {
                    if (data.result) {
                        for (var i = 0, len = data.result.authority.length; i < len; i++) {
                            auth.push(data.result.authority[i].module);
                        }
                        appHome.userInfo.init(data.result);
                        that.loadMenu(auth);
                    } else {
                        appHome.page.alert(lang.operateFail, 'danger');
                    }
                } else {
                    appHome.page.alert(appCommon.errorCode2Message(data.code), 'danger');
                }
            });
        },
        //加载菜单
        loadMenu: function loadMenu(auth) {
            var that = this;
            var basic = [];
            var report = [];
            //先对权限进行升序排序
            auth = auth.sort(function (a, b) {
                return a - b;
            });
            for (var i = 0; i < auth.length; i++) {
                var module = auth[i];
                if (module == '48') {
                    module = '303';
                }
                if (module == '49') {
                    module = '308';
                }
                var temp = that.li_temp.replace('{lang}', 'M_' + module);
                temp = temp.replace('{title}', lang['M_' + module]);
                switch (module) {
                    case '12':
                        basic.push(temp.replace('{url}', 'basic/group/default.html').replace('{icon}', 'fa fa-sitemap'));
                        break;
                    case '13':
                        basic.push(temp.replace('{url}', 'basic/vehicle-device/default.html').replace('{icon}', 'fa fa-car'));
                        break;
                    case '19':
                        basic.push(temp.replace('{url}', 'basic/role-user/default.html').replace('{icon}', 'fa fa-user'));
                        break;
                    case '15':
                        basic.push(temp.replace('{url}', 'person-management/default.html').replace('{icon}', 'fa fa-users'));
                        break;
                    case '62':
                        basic.unshift(temp.replace('{url}', 'basic/quick-add/default.html').replace('{icon}', 'fa fa-fighter-jet'));
                        break;
                    case '32':
                        basic.push(temp.replace('{url}', 'remote-upgrade/default.html').replace('{icon}', 'fa fa-location-arrow'));
                        break;
                    case '210':
                        basic.push(temp.replace('{url}', '/report/face-management/default.html').replace('{icon}', 'icon-user'));
                        break;
                    case '2201':
                        if (appHome.userInfo.hasAlarmAuthority) {
                            appHome.alarm.initEvent();
                        }
                        report.push(temp.replace('{url}', 'report/alarm-count/default.html').replace('{icon}', 'fa fa-bell'));
                        break;
                    case '2207':
                        report.push(temp.replace('{url}', 'report/distance-count/default.html').replace('{icon}', 'fa fa-car'));
                        break;
                    case '2210':
                        report.push(temp.replace('{url}', 'report/online-count/default.html').replace('{icon}', 'fa fa-line-chart'));
                        break;
                    case '2202':
                        report.push(temp.replace('{url}', 'report/user-log/default.html').replace('{icon}', 'fa fa-user'));
                        break;
                    case '2205':
                        report.push(temp.replace('{url}', 'report/user-online/default.html').replace('{icon}', 'fa fa-user'));
                        break;
                    case '2200':
                        report.push(temp.replace('{url}', 'report/gps-count/default.html').replace('{icon}', 'fa fa-paper-plane'));
                        break;
                    case '2209':
                        report.push(temp.replace('{url}', 'report/continuous-driving/default.html').replace('{icon}', 'fa fa-truck'));
                        break;
                    case '2218':
                        report.push(temp.replace('{url}', 'report/last-status/default.html').replace('{icon}', 'fa fa-shield'));
                        break;
                    case '2224':
                        report.push(temp.replace('{url}', 'report/device-flow/default.html').replace('{icon}', 'fa fa-signal'));
                        break;
                    case '2203':
                        report.push(temp.replace('{url}', 'report/over-speed/default.html').replace('{icon}', 'fa fa-location-arrow'));
                        break;
                    case '2226':
                        report.push(temp.replace('{url}', 'report/passenger-count/default.html').replace('{icon}', 'fa fa-users'));
                        break;
                    case '2223':
                        report.push(temp.replace('{url}', 'report/temper-info/default.html').replace('{icon}', 'fa fa-fire'));
                        break;
                    case '6106':
                        report.push(temp.replace('{url}', 'report/swipe-person/default.html').replace('{icon}', 'fa fa-credit-card'));
                        break;
                    case '2221':
                        report.push(temp.replace('{url}', 'report/ioalarm-count/default.html').replace('{icon}', 'fa fa-bell'));
                        break;
                    case '2214':
                        report.push(temp.replace('{url}', 'report/alarm-common/default.html?alarmtype=13').replace('{icon}', 'fa fa-bell'));
                        break;
                    case '2215':
                        report.push(temp.replace('{url}', 'report/alarm-common/default.html?alarmtype=2').replace('{icon}', 'fa fa-bell'));
                        break;
                    case '2220':
                        report.push(temp.replace('{url}', 'report/alarm-common/default.html?alarmtype=18').replace('{icon}', 'fa fa-bell'));
                        break;
                    case '2225':
                        report.push(temp.replace('{url}', 'report/user-flow/default.html').replace('{icon}', 'fa fa-user'));
                        break;
                    case '2229':
                        report.push(temp.replace('{url}', 'report/alarm-frequency-anomaly/default.html').replace('{icon}', 'fa fa-bell'));
                        break;
                    case '2227':
                        report.push(temp.replace('{url}', 'report/flow-config/default.html').replace('{icon}', 'fa fa-gear'));
                        break;
                    case '2230':
                        report.push(temp.replace('{url}', 'report/face-recognition/default.html').replace('{icon}', 'icon-user'));
                        break;
                    case '303':
                        if (!appHome.page.action) {
                            if (!$('#m_monitor').is(':visible')) {
                                $('#m_monitor').removeClass('hidden');
                            }
                        }
                        break;
                    case '308':
                        if (!appHome.page.action) {
                            if (!$('#m_playback').is(':visible')) {
                                $('#m_playback').removeClass('hidden');
                                /**start**/
                                /**
                                 * @author qu
                                 * 根据是否有自动下载权限来决定是否加载下载图标和开启下载监听
                                 */
                                if (appHome.userInfo.hasDownloadAuthority) {
                                    appHome.download.init();
                                }
                                /**end**/
                            }
                        }
                        break;
                    case '38':
                        if (!appHome.page.action) {
                            $('#m_system').removeClass('hidden');
                        }
                        break;
                    //证据中心
                    case '312':
                        if (!appHome.page.action) {
                            $('#m_evidence').removeClass('hidden');
                        }
                        break;
                    default:
                        break;
                }
            }
            if (appHome.page.action && appHome.page.action.length > 0) {
                if (appHome.page.action == 'basic') {
                    if (basic.length > 0) {
                        var tmp = basic.concat();
                        basic = [];
                        var roleuser = '';
                        //@wzz 2018-05-03
                        var remoteupgrade = '';
                        var personManage = '';
                        for (var i = 0; i < tmp.length; i++) {
                            if (/quick-add/.test(tmp[i])) {
                                //快速加车放在最前
                                basic.unshift(tmp[i]);
                            } else if (!/role-user|remote-upgrade|face-management/g.test(tmp[i])) {
                                basic.push(tmp[i]);
                            } else if (/role-user/.test(tmp[i])) {
                                roleuser = tmp[i];
                            } else if (/remote-upgrade/.test(tmp[i])) {
                                remoteupgrade = tmp[i];
                            } else if (/face-management/.test(tmp[i])) {
                                personManage = tmp[i];
                            }
                        }
                        //roleuser添加在最后
                        if (roleuser) {
                            basic.push(roleuser);
                        }
                        if (personManage) {
                            basic.push(personManage);
                        }
                        if (remoteupgrade) {
                            basic.push(remoteupgrade);
                        }
                        that.$basic.removeClass('hidden').children('ul').html(basic.join(''));
                    }
                } else if (appHome.page.action == 'report') {
                    if (report.length > 0) {
                        //报表看板
                        var temp = that.li_temp.replace('{lang}', 'reportDashboard');
                        temp = temp.replace('{title}', lang['reportDashboard']);
                        report.unshift(temp.replace('{url}', 'report/dashboard/default.html').replace('{icon}', 'fa fa-th-large'));
                        that.$report.removeClass('hidden').children('ul').html(report.join(''));
                        $('body').find('.span-icon-select').removeClass('span-icon-select');
                        $('#m_report').children('a').children('.span-icon').addClass('span-icon-select');
                    }
                }
            } else {
                if (report.length > 0) {
                    //报表看板
                    var temp = that.li_temp.replace('{lang}', 'reportDashboard');
                    temp = temp.replace('{title}', lang['reportDashboard']);
                    report.unshift(temp.replace('{url}', 'report/dashboard/default.html').replace('{icon}', 'fa fa-th-large'));
                    that.$report.removeClass('hidden').children('ul').html(report.join(''));
                }
                if (basic.length > 0) {
                    var tmp = basic.concat();
                    basic = [];
                    var roleuser = '';
                    //@wzz 2018-05-03
                    var remoteupgrade = '';
                    var personManage = '';
                    for (var i = 0; i < tmp.length; i++) {
                        if (/quick-add/.test(tmp[i])) {
                            //快速加车放在最前
                            basic.unshift(tmp[i]);
                        } else if (!/role-user|remote-upgrade|face-management/g.test(tmp[i])) {
                            basic.push(tmp[i]);
                        } else if (/role-user/.test(tmp[i])) {
                            roleuser = tmp[i];
                        } else if (/remote-upgrade/.test(tmp[i])) {
                            remoteupgrade = tmp[i];
                        } else if (/face-management/.test(tmp[i])) {
                            personManage = tmp[i];
                        }
                    }
                    //roleuser添加在最后
                    if (roleuser) {
                        basic.push(roleuser);
                    }
                    //司机管理
                    if (personManage) {
                        basic.push(personManage);
                    }
                    //远程升级
                    if (remoteupgrade) {
                        basic.push(remoteupgrade);
                    }
                    that.$basic.removeClass('hidden').children('ul').html(basic.join(''));
                }
            }
        },
        //初始化事件
        initEvent: function initEvent() {
            var that = this;
            that.$wrapper.delegate('a', 'click', function () {
                var url = $(this).attr('url');
                var title = lang[$(this).children('#title').attr('lang')];
                if (url) {
                    that.$wrapper.find('.span-icon-select').removeClass('span-icon-select');
                    that.$wrapper.find('.active').removeClass('active');
                    if ($(this).children('.span-icon').length > 0) {
                        $(this).children('.span-icon').addClass('span-icon-select');
                        $(this).parent().addClass('active');
                    } else {
                        $(this).parent().parent().prev().children('.span-icon').addClass('span-icon-select');
                        $(this).parent().parent().parent().addClass('active');
                    }
                    window.appHome.page.addTab(title, url);
                }
            });
            that.$wrapper.delegate('.nav-div', 'click', function () {
                that.$wrapper.find('.li-active').removeClass('li-active');
                $(this).addClass('li-active');
            });
        }
    },
    /**
     * 个人信息
     */
    userInfo: {
        $el: $('#div_userinfo'),
        $tbody: $('#div_userinfo tbody'),
        $username: $('#span_username'),
        $rolename: $('#span_rolename'),
        $group: $('#ul_group'),
        $channel: $('#ul_channel'),
        groupObj: null,
        channelObj: null,
        loadFlag: false,
        userName: null,
        hasDownloadAuthority: false,
        hasAlarmAuthority: false,
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
        init: function init(data) {
            var that = this;
            var authority = data.authority;
            //过滤掉报表导出权限
            for (var i = 0; i < authority.length; i++) {
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
            // var manageTrArray = [],
            //     reportTrArray = [];
            //用户名直接从cookie读取
            var userName = appCommon.getCookie('wcms5u', 'un');
            that.userName = userName;
            //角色用户比较特殊，特意这么定义
            var roleUser = { module: '', command: [] };
            that.$username.text(userName);
            that.$rolename.text(data.name);
            that.initGroupAndChannel(data.channelpower);
            //先过滤下权限
            var authorityHtml = {};
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
            //先把客户端和web上的回放直通的权限统一
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
            for (var i = 0; i < authority.length; i++) {
                var module = authority[i].module;
                //把20单独出来是因为M_20语言包中没有
                if (lang['M_' + module] || lang['C_M_' + module] || module == 20) {
                    //如果是跳转过来的，则隐藏web上的模块权限
                    if (appHome.page.action) {
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
                        /**
                         * @author ququ
                         * @content 判断是否具有自动下载权限和报警权限
                         */
                        if (module == 'H') {
                            that.hasDownloadAuthority = true;
                        }
                        if (module == 'D') {
                            that.hasAlarmAuthority = true;
                            appHome.alarm.init();
                            appHome.page.initSocket();
                        }
                        /** end */
                        if (authorityHtml['M_' + module] === undefined) {
                            authorityHtml['M_' + module] = { html: '', subModule: [] };
                        }
                        //组装一级模块的html
                        var html = '<td {rowspan}>{0}</td>';
                        var data = [];
                        data.push(lang['M_' + module]);
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
                                    data.push(lang[attr]);
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
                                    if (module == '38') {
                                        smLang = lang['M_' + module] + '(web)';
                                    } else {
                                        smLang = lang['M_' + module];
                                    }
                                } else if (lang['C_M_' + module]) {
                                    smLang = lang['C_M_' + module];
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
                                    if (module == '301' || module == '207') {
                                        if (commandLang && commands.length !== 0 && commands.length % 1 === 0) {
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
            that.$tbody.html(lastHtml.reverse().join(''));
            //初始化人脸待办是否有权限
            appHome.faceToDoList.init(authority);
        },
        initGroupAndChannel: function initGroupAndChannel(channelAuth) {
            var that = this;
            if (!that.groupObj) {
                var rid = appCommon.getCookie('wcms5u', 'rid');
                var url = '../../../common/simple-tree/' + rid;
                that.groupObj = $.fn.zTree.init(that.$group, that.getSettings(url, null, function () {
                    //that.groupObj = $.fn.zTree.getZTreeObj("ul_group");
                    var groups = [];
                    var nodes = that.groupObj.getNodesByFilter(function (node) {
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
                    var chUrl = '../../../common/vehicle-tree/powerchannel';
                    that.channelObj = $.fn.zTree.init(that.$channel, that.getSettings(chUrl, { groupid: ids }, function () {
                        //that.channelObj = $.fn.zTree.getZTreeObj("ul_group");
                        for (var i = 0; i < channelAuth.length; i++) {
                            var vid = channelAuth[i].vid;
                            var channel = '|' + channelAuth[i].channel.toString().split(',').join('|') + '|';
                            var removeNodes = that.channelObj.getNodesByFilter(function (node) {
                                if (node.icon.indexOf('webcam.min.png') > -1 && node.getParentNode().id == vid && channel.indexOf('|' + node.id + '|') > -1) {
                                    return true;
                                }
                            });
                            for (var k = 0; k < removeNodes.length; k++) {
                                that.channelObj.removeNode(removeNodes[k]);
                            }
                        }
                    }));
                }));
            }
        },
        getSettings: function getSettings(url, param, callback) {
            var that = this;
            var settings = {
                async: _defineProperty({
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
                    url: url
                }, 'otherParam', param ? param : []),
                callback: {
                    onAsyncSuccess: function onAsyncSuccess(event, treeId, treeNode) {
                        if (!that.loadFlag && treeId == 'ul_group') {
                            that.groupObj.expandAll(true);
                            that.loadFlag = false;
                        }
                        if (callback) {
                            callback();
                        }
                    }
                }
            };
            return settings;
        },
        //显示
        show: function show() {
            var that = this;
            $('#div_tab a:first').tab('show');
            that.$el.modal('show');
        },
        //隐藏
        hide: function hide() {
            this.$el.modal('hide');
        }
    },
    /**
     * 修改密码表单
     */
    passwordInfo: {
        $el: $('#div_password'),
        $form: $('#form_password'),
        $submit: $('#btn_submit'),
        $oldPassword: $('#inp_oldpassword'),
        $password: $('#inp_password'),
        validObj: null,
        //初始化
        init: function init() {
            var that = this;
            $.extend($.validator.messages, {
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
            that.validObj = that.$form.validate({
                ignore: '.ignore',
                errorElement: 'p',
                errorClass: 'font-red',
                focusInvalid: false,
                rules: {
                    oldPassword: {
                        required: true
                    },
                    password: {
                        PasswordChar: true,
                        required: true,
                        minlength: 8
                    },
                    repeatPassword: {
                        PasswordChar: true,
                        required: true,
                        minlength: 8,
                        equalTo: '#inp_newpassword'
                    }
                },
                success: function success(error, element) {
                    $(element).closest('.form-group').find('p').remove();
                    $(element).removeClass('border-red');
                },
                errorPlacement: function errorPlacement(error, element) {
                    $(element).closest('.form-group').append(error);
                    $(element).addClass('border-red');
                },
                submitHandler: function submitHandler(form) {
                    that.hide();
                    var data = {};
                    var formDataArr = $(form).serializeArray();
                    for (var i = 0; i < formDataArr.length; i++) {
                        data[formDataArr[i]['name']] = encodeURIComponent(appCommon.encryptRSAStr(appHome.rsapublickey, formDataArr[i]['value']));
                    }
                    appCommon.ajax('../../../user/update/password', 'post', 'json', data, function (data) {
                        if (data.code == 200) {
                            if (data.result) {
                                appHome.page.alert(lang.operateSuccess, 'success');
                            } else {
                                appHome.page.alert(lang.operateFail, 'danger');
                            }
                        } else {
                            appHome.page.alert(appCommon.errorCode2Message(data.code), 'danger');
                        }
                    });
                }
            });
            that.initEvent();
        },
        //初始化事件
        initEvent: function initEvent() {
            var that = this;
            that.$submit.on('click', function (e) {
                that.$form.submit();
            });
        },
        //显示
        show: function show() {
            this.clearData();
            this.$el.modal('show');
        },
        //隐藏
        hide: function hide() {
            this.$el.modal('hide');
        },
        clearData: function clearData() {
            appCommon.jqueryCache('#inp_oldpassword').val('');
            appCommon.jqueryCache('#inp_newpassword').val('');
            appCommon.jqueryCache('#inp_repeatpassword').val('');
            appCommon.jqueryCache('#form_password input').closest('.form-group').find('p').remove();
            appCommon.jqueryCache('#form_password input').removeClass('border-red');
        }
    },
    /**
     * 报警面板
     */
    alarm: {
        $toggle: $('#a_alarm'),
        $ul: $('#ul_alarm'),
        $detail: $('#a_detail'),
        temp_li: "<li data-time='{0}'><span class='span-time'></span>{1}<span class='pull-right'>{2}</span></li>",
        count: 0,
        timer: null,
        init: function init() {
            this.$toggle.removeClass('hidden');
            //this.initEvent();
        },
        initEvent: function initEvent() {
            var that = this;
            that.$detail.removeClass('hidden');
            that.$detail.on('click', function (e) {
                appHome.page.addTab(lang['M_2201']);
            });
        },
        //显示
        show: function show() {
            this.$toggle.show();
        },
        //隐藏
        hide: function hide() {
            this.count = 0;
            this.$toggle.hide();
            this.$ul.find('li').remove();
            this.$toggle.children('span').text(0);
        },
        /**
         * 加载相对时间
         */
        loadTime: function loadTime() {
            var that = this;
            var $lis = that.$ul.children('li');
            var result = '';
            for (var i = 0; i < $lis.length; i++) {
                var $li = $lis.eq(i);
                var time = $li.attr('data-time');
                var timeSpan = new Date().getTime() - new Date(time.replace(/-/g, '/')).getTime();
                if (timeSpan / 86400000 >= 1) {
                    result = lang.dayAgo.replace('{0}', parseInt(timeSpan / 86400000));
                } else if (timeSpan / 3600000 >= 1) {
                    result = lang.hourAgo.replace('{0}', parseInt(timeSpan / 3600000));
                } else if (timeSpan / 60000 >= 1) {
                    result = lang.minuteAgo.replace('{0}', parseInt(timeSpan / 60000));
                } else {
                    result = lang.secondsAgo;
                }
                $li.children('.span-time').text(result);
            }
        },
        /**
         * 增加报警
         * @data Obj
         */
        appendAlarm: function appendAlarm(data) {
            var that = this;
            var li = appCommon.strReplace(that.temp_li, [data.dateTime, data.carlicense, lang['malarm_' + data.type]]);
            that.count++;
            that.$ul.prepend(li);
            that.$toggle.children('span').text(that.count);
            if (that.count > 5) {
                that.$ul.children('li').last().remove();
            }
            if (that.timer) {
                clearInterval(that.timer);
            }
            that.loadTime();
            that.timer = setInterval(function () {
                that.loadTime();
            }, 5000);
        }
    },
    //下载任务
    download: {
        $toggle: $('#a_download'),
        $ul: $('#ul_download'),
        $ul_file: $('#ul_filelist'),
        $animation: $('#div_animation'),
        $table: $('#tb_download'),
        $modal_file: $('#div_filelist'),
        count: 0, //任务总数
        ids: [], //任务id数组
        dateArray: [], //任务日期数组
        taskTotalPage: 0, // 任务总页数
        taskPage: 0, // 任务当前页面显示的第一行下标
        taskPageSize: 11, // 任务每页条数
        taskRefreshTime: 20000, // 任务定时器刷新间隔
        temp_tr: '<tr data-id="{0}" data-type="{1}">' + '<td>{7}</td>' + '<td>{2}</td>' + '<td>{6}</td>' + '<td><div class="progress progress-striped"><div class="progress-bar progress-bar-success" role="progressbar" style="width:5%;background-color:#5de0a4;"><span style="color:#444;">0%</span></div></div></td>' + '<td class="td-state">{3}</td>' + '<td><button type="button" class="btn btn-xs blue btn-filelist disabled"><i class="fa fa-spinner fa-spin font-white"></i>{4}</button></td>' + '<td><button type="button" class="btn btn-xs red btn-remove"><i class="fa fa-spinner fa-spin font-white"></i>{5}</button></td>' + '</td>',
        temp_li: '<li class="list-group-item" data-uri="{1}">{0}<a href="javascript:;" class="btn btn-xs green pull-right"><i class="fa fa-download"></i></a></li>',
        timer: null,
        init: function init() {
            var that = this;
            that.$toggle.removeClass('hidden');
            that.$ul.children('div').slimScroll({
                allowPageScroll: true, // allow page scroll when the element scroll is ended
                size: '7px',
                color: '#bbb',
                wrapperClass: 'slimScrollDiv',
                railColor: '#eaeaea',
                position: 'right',
                height: '380px',
                alwaysVisible: true,
                railVisible: $(this).attr('data-rail-visible') == '1' ? true : false,
                disableFadeOut: true
            });
            that.initEvent();
            that.getTask();
        },
        initEvent: function initEvent() {
            var that = this;
            that.$ul.delegate('.form-control', 'keydown', function (e) {
                // 监听分页输入框回车事件
                if (e.keyCode == '13') {
                    var page = that.$ul.find('.form-control').val();
                    if (page == '' || Number(page) > that.taskTotalPage || Number(page) < 1) return;
                    // 加载任务列表
                    that.dateArray = [];
                    if (Number(page) == 1) {
                        that.taskPage = 0;
                    } else {
                        that.taskPage = (Number(page) - 1) * that.taskPageSize;
                    }
                    that.getTask();
                }
            });
            // 下方分页点击事件阻止
            that.$ul.delegate('#downloadPageDiv', 'click', function (e) {
                e.stopPropagation();
            });
            that.$table.delegate('.btn-filelist', 'click', function (e) {
                var $loading = $(this).children('.fa-spin');
                //如果任务未完成或者当前请求还没有应答，则不做处理
                if ($(this).hasClass('disabled') || $loading.is(':visible')) {
                    return false;
                }
                // $loading.show();
                var id = $(this).parent().parent().attr('data-id');
                that.getFileList(id);
            });
            that.$table.delegate('.btn-remove', 'click', function (e) {
                var $loading = $(this).children('.fa-spin');
                //如果当前请求还没有应答，则不做处理
                if ($loading.is(':visible')) {
                    return false;
                }
                // $loading.show();
                var id = $(this).parent().parent().attr('data-id');
                that.deleteTask(id, e);
            });
            that.$toggle.on('click', function (e) {
                setTimeout(function () {
                    if (that.$ul.is(':visible')) {
                        if (that.timer) {
                            clearInterval(that.timer);
                        }
                        that.getState();
                        that.timer = setInterval(function () {
                            that.getState();
                        }, that.taskRefreshTime);
                    }
                }, 0);
            });
            that.$table.on('click', function (e) {
                return false;
            });
            //下载文件
            that.$ul_file.delegate('.btn', 'click', function (e) {
                var uri = 'video/' + $.trim($(this).parent().text()) + '?dir=' + $.trim($(this).parent().attr('data-uri'));
                that.downloadFile(uri);
            });
        },
        /**
         * 添加任务
         * @obj JSON Obj
         */
        addTask: function addTask(obj) {
            var that = this;
            var width = $(window).width();
            var height = $(window).height();
            that.$animation.css({ top: 350, left: width / 2 }).show();
            that.$animation.animate({ top: 20, left: width - 350 }, 'slow', function () {
                that.$animation.hide();
                appCommon.ajax('../../play-back/video-track/addTask', 'get', 'json', obj, function (data) {
                    if (data.code == 200) {
                        if (data.result > 0) {
                            that.getTask();
                            // var name = obj.carLicense + " " +obj.date + " " + obj.startTime + "-" + obj.endTime;
                            // var name = obj.carLicense;
                            // that.$ul
                            //     .find('tbody')
                            //     .append(
                            //         appCommon.strReplace(that.temp_tr, [
                            //             data.result,
                            //             obj.fileType,
                            //             name,
                            //             lang['dstate_-1'],
                            //             lang.fileList,
                            //             lang.deleteTask,
                            //             obj.date,
                            //             obj.taskName
                            //         ])
                            //     );
                            // that.ids.push(data.result);
                            // that.dateArray.push(obj.date);
                            // that.$toggle.children('span').text(that.$ul.find('tr').length);
                            // if (that.timer) {
                            //     clearInterval(that.timer);
                            // }
                            // that.timer = setInterval(function () {
                            //     that.getState();
                            // }, that.taskRefreshTime);
                        } else {
                            appHome.page.alert(lang.operateFail, 'danger');
                        }
                    } else {
                        appHome.page.alert(appCommon.errorCode2Message(data.code), 'danger');
                    }
                });
            });
        },
        /**
         * 删除任务
         * @id 任务id
         */
        deleteTask: function deleteTask(id, event) {
            var that = this;
            lavaMsg.singleConfirm(event.target, lang.sureDeleteThis + '?', lang.sure, lang.cancel, function (r) {
                if (r) {
                    var $tr = that.$ul.find('tr[data-id=' + id + ']');
                    var $loading = $tr.find('.btn-remove .fa-spin');
                    appCommon.ajax('../../play-back/video-track/deleteTask', 'get', 'json', { taskid: id }, function (data) {
                        $loading.hide();
                        $loading.next().show();
                        if (data.code == 200) {
                            if (data.result) {
                                that.dateArray = [];
                                that.count--;
                                // 如果当前删除后该页无数据则需要向上翻页
                                if (that.$toggle.children('span').text(that.$ul.find('tr').length) == 1 && that.count >= that.pageSize) {
                                    that.taskPage = that.taskPage - that.pageSize;
                                }
                                $tr.remove();
                                that.getTask();
                            } else {
                                appHome.page.alert(lang.operateFail, 'danger');
                            }
                        } else {
                            appHome.page.alert(appCommon.errorCode2Message(data.code), 'danger');
                        }
                    });
                }
            });
        },
        /**
         * 获取任务列表
         */
        getTask: function getTask() {
            var that = this;
            var ids = [];
            var dateArray = [];
            var userName = appCommon.getCookie('wcms5u', 'un');
            appCommon.ajax('../../play-back/video-track/getTask', 'get', 'json', {
                userName: window.encodeURIComponent(userName),
                page: that.taskPage,
                pageSize: that.taskPageSize
            }, function (data) {
                if (data.code == 200) {
                    if (data.result) {
                        var htmlArray = [];
                        for (var i = 0; i < data.result.length; i++) {
                            var item = data.result[i];
                            htmlArray.push(appCommon.strReplace(that.temp_tr, [item.taskId, item.fileType, item.carlicense, lang['dstate_-1'], lang.fileList, lang.deleteTask, item.day, item.taskName]));
                            ids.push(item.taskId);
                            dateArray.push(item.day);
                        }
                        that.$ul.find('tbody').html(htmlArray.join(''));
                        that.ids = ids;
                        that.dateArray = that.dateArray.concat(dateArray);
                        if (that.ids.length > 0) {
                            if (that.timer) {
                                clearInterval(that.timer);
                            }
                            that.getState();
                            that.timer = setInterval(function () {
                                that.getState();
                            }, that.taskRefreshTime);
                        }
                        // 获取任务总数
                        that.getTaskCount(userName);
                    } else {
                        appHome.page.alert(lang.operateFail, 'danger');
                    }
                } else {
                    appHome.page.alert(appCommon.errorCode2Message(data.code), 'danger');
                }
            });
        },
        /**
         * 获取任务总数
         */
        getTaskCount: function getTaskCount(userName) {
            var that = this;
            appCommon.ajax('../../play-back/video-track/getTaskCount', 'get', 'json', {
                userName: window.encodeURIComponent(userName)
            }, function (data1) {
                if (data1.code == 200) {
                    that.count = data1.result[0].count;
                    that.getPageState();
                } else {
                    appHome.page.alert(appCommon.errorCode2Message(data1.code), 'danger');
                }
            });
        },
        /**
         * 任务翻页
         */
        getTaskBypage: function getTaskBypage(type) {
            var that = this;
            switch (type) {
                // 首页
                case 1:
                    that.taskPage = 0;
                    that.getTask();
                    break;
                // 上一页
                case 2:
                    that.taskPage = that.taskPage - that.taskPageSize;
                    that.getTask();
                    break;
                // 下一页
                case 3:
                    that.taskPage = that.taskPage + that.taskPageSize;
                    that.getTask();
                    break;
                // 尾页
                case 4:
                    that.taskPage = that.taskPageSize * (that.taskTotalPage - 1);
                    that.getTask();
                    break;
            }
        },
        /**
         * 获取翻页按钮的状态
         */
        getPageState: function getPageState() {
            var that = this;
            // 判断当前按钮那些可用,默认都不可用
            var top = false,
                previous = false,
                next = false,
                bottom = false;
            // 获取当前页码

            var pageNow = Math.ceil(that.taskPage / that.taskPageSize) + 1;
            // 刷新页码框值
            that.$ul.find('.form-control').val(pageNow);
            // 设置右上数量提示
            that.$toggle.children('span').text(that.count);
            $('#download_count').text(that.count);
            // 获取总页数
            that.taskTotalPage = Math.ceil(that.count / that.taskPageSize);
            $('#download_page').text(that.taskTotalPage);
            if (that.taskTotalPage != 0) {
                // 如果不在第一页则前两个按钮可用
                if (pageNow > 1) {
                    top = true;
                    previous = true;
                }
                // 如果不在最后页则前两个按钮可用
                if (pageNow < that.taskTotalPage) {
                    next = true;
                    bottom = true;
                }
            }
            that.setPageState(top, previous, next, bottom);
        },
        /**
         * 设置翻页按钮状态
         */
        setPageState: function setPageState(top, previous, next, bottom) {
            var that = this;
            // 第一页可用
            if (top) {
                $('#download_Top').removeClass('ul_download_page_disable');
                $('#download_Top').addClass('ul_download_page_activation');
                $('#download_Top').unbind('click').bind('click', function () {
                    that.getTaskBypage(1);
                });
            } else {
                $('#download_Top').removeClass('ul_download_page_activation');
                $('#download_Top').addClass('ul_download_page_disable');
                $('#download_Top').unbind('click');
            }
            // 上一页可用
            if (previous) {
                $('#download_Previous').removeClass('ul_download_page_disable');
                $('#download_Previous').addClass('ul_download_page_activation');
                $('#download_Previous').unbind('click').bind('click', function () {
                    that.getTaskBypage(2);
                });
            } else {
                $('#download_Previous').removeClass('ul_download_page_activation');
                $('#download_Previous').addClass('ul_download_page_disable');
                $('#download_Previous').unbind('click');
            }
            // 下一页可用
            if (next) {
                $('#download_Next').removeClass('ul_download_page_disable');
                $('#download_Next').addClass('ul_download_page_activation');
                $('#download_Next').unbind('click').bind('click', function () {
                    that.getTaskBypage(3);
                });
            } else {
                $('#download_Next').removeClass('ul_download_page_activation');
                $('#download_Next').addClass('ul_download_page_disable');
                $('#download_Next').unbind('click');
            }
            // 最后一页可用
            if (bottom) {
                $('#download_Bottom').removeClass('ul_download_page_disable');
                $('#download_Bottom').addClass('ul_download_page_activation');
                $('#download_Bottom').unbind('click').bind('click', function () {
                    that.getTaskBypage(4);
                });
            } else {
                $('#download_Bottom').removeClass('ul_download_page_activation');
                $('#download_Bottom').addClass('ul_download_page_disable');
                $('#download_Bottom').unbind('click');
            }
        },
        //获取任务状态
        getState: function getState() {
            var that = this;
            var taskId = that.ids.join(',');
            var date = that.dateArray.join(',');
            /**
             * @author ququ
             * @content 刷新状态前判断是否还有没有完成的任务
             */
            if (taskId.length > 0 && date.length > 0) {
                appCommon.ajax('../../play-back/video-track/taskState', 'get', 'json', { taskid: taskId, date: date }, function (data) {
                    if (data.code == 200 && data.result) {
                        for (var i = 0; i < data.result.length; i++) {
                            var item = data.result[i];
                            var $tr = $('tr[data-id=' + item.taskId + ']');
                            if (item.state) {
                                if (item.state == 3 && item.percent == 0) {
                                    $tr.find('.td-state').text(lang.noData);
                                } else {
                                    $tr.find('.td-state').text(lang['dstate_' + item.state]);
                                }
                                if (/^(3|4|5|6)$/.test(item.state)) {
                                    var index = that.ids.indexOf(item.taskId);
                                    that.ids.splice(index, 1);
                                    that.dateArray.splice(index, 1);
                                    $tr.find('.btn-filelist').removeClass('disabled');
                                }
                            }
                            var percent = item.percent;
                            $tr.find('.progress-bar span').text(percent + '%');
                            percent = percent < 5 ? 5 : percent;
                            $tr.find('.progress-bar').css({ width: percent + '%' });
                        }
                        if (that.ids.length == 0) {
                            clearInterval(that.timer);
                        }
                    }
                });
            } else {
                if (that.timer) {
                    clearInterval(that.timer);
                }
            }
            /**
             * end
             */
            if (!that.$ul.is(':visible')) {
                clearInterval(that.timer);
            }
        },
        /**
         * 获取文件列表
         * id 任务 id
         */
        getFileList: function getFileList(id) {
            var that = this;
            var $tr = that.$ul.find('tr[data-id=' + id + ']');
            var $loading = $tr.find('.btn-filelist .fa-spin');
            var type = $tr.attr('data-type');
            type = type == '1' ? '264' : 'mp4';
            appCommon.ajax('../../play-back/video-track/taskFileList', 'get', 'json', { taskid: id }, function (data) {
                $loading.hide();
                if (data.code == 200) {
                    if (data.result) {
                        var items = data.result;
                        var htmlArray = [];
                        for (var i = 0; i < items.length; i++) {
                            if (new RegExp('.' + type + '$').test(items[i].name)) {
                                var li = appCommon.strReplace(that.temp_li, [items[i].name, items[i].dir]);
                                htmlArray.push(li);
                            }
                        }
                        that.$ul_file.html(htmlArray.join(''));
                        that.$modal_file.modal('show');
                    } else {
                        appHome.alert(lang.operateFail, 'danger');
                    }
                } else {
                    appHome.alert(appCommon.errorCode2Message(data.code), 'danger');
                }
            });
        },
        /**
         * 下载文件
         * @url 文件名
         */
        downloadFile: function downloadFile(url) {
            appCommon.downloadFile('../../download/' + url);
        }
    },
    //人脸待办事项
    faceToDoList: {
        faceToDoAuth: false,
        //初始化查询待办事项条数
        init: function init(auth) {
            var that = this;
            for (var i = 0; i < auth.length; i++) {
                if (auth[i].module == '210') {
                    $('#a_face_todo').parent().show();
                    that.faceToDoAuth = true;
                    that.getFaceTodocount();
                    window.setInterval(function () {
                        that.getFaceTodocount();
                    }, 60000);
                    that.eventBind();
                    break;
                }
            }
            if (!that.faceToDoAuth) {
                $('#a_face_todo').parent().remove();
            }
        },
        getFaceTodocount: function getFaceTodocount() {
            var ET = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'ET');
            var timeInterval = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'T');
            var date = new Date(ET);
            var nowDate = new Date();
            if (appHome.faceTime < 2) {
                var weekdate = new Date(date - timeInterval * 60 * 60 * 1000);
            } else {
                var weekdate = date;
            }
            appHome.startDefaultValue = appCommon.formatDate(weekdate, true, 'yyyy-MM-dd');
            appHome.endDefaultValue = appCommon.formatDate(nowDate, true, 'yyyy-MM-dd');
            // 将两个时间放进localstorage
            localStorage.setItem('startDefaultValue', appHome.startDefaultValue);
            localStorage.setItem('endDefaultValue', appHome.endDefaultValue);
            var data = {
                guid: new Date().getTime(),
                starttime: appHome.startDefaultValue,
                endtime: appHome.endDefaultValue,
                reg: 0
            };
            appCommon.ajax('../../home/facetodocount', 'post', 'json', data, function (result) {
                if (result.code == 200) {
                    $('#a_face_todo span').text(result.count);
                }
            });
        },
        eventBind: function eventBind() {
            var that = this;
            $('#a_face_todo').on('click', function () {
                var i = 1;
                appHome.faceTime += i;
                that.getFaceTodocount();
                appHome.page.addTab(lang.pendingTodo, 'driverface-upcoming/default.html');
                if (Cookies) {
                    if (Cookies.get(appConfig.CONFIGCOOKIENAME)) {
                        var cookieJson = JSON.parse(Cookies.get(appConfig.CONFIGCOOKIENAME));
                        if (cookieJson) {
                            cookieJson.ET = new Date().getTime();
                            Cookies.set(appConfig.CONFIGCOOKIENAME, JSON.stringify(cookieJson), {
                                expires: 7,
                                path: '/'
                            });
                        }
                    }
                }
            });
        }
    }
};
window.onload = function () {
    appCommon.lang(function () {
        appHome.rsapublickey = appCommon.getRSAPublicKey();
        appHome.init();
    });
};