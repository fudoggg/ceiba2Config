var appRegisterLogin = {
    uri: '/basic/register-login/',
    apiUri: '/login/',
    publicKey: '',
    errorTimes: 0,
    imgDir: {
        zh_CN: '/images/flags/cn.png',
        en_US: '/images/flags/us.png'
    },
    authCodeImg: ['/images/auth-code/authcode_0.png', '/images/auth-code/authcode_1.png', '/images/auth-code/authcode_2.png', '/images/auth-code/authcode_3.png', '/images/auth-code/authcode_4.png'],
    validResult: false,
    checkBrower: function checkBrower(callback) {
        var brower = appCommon.checkBrower();
        if (brower.msie && brower.version < 10) {
            $('.mt-cookie-consent-bar').show();
            $('#button_login').addClass('disabled');
            $('.login-form input').keypress(function (e) {
                return 13 == e.which ? void 0 : void 0;
            });
        } else {
            if (callback) {
                callback();
            }
        }
    },
    checkCanvasSupport: function checkCanvasSupport() {
        return !!document.createElement('canvas').getContext('2d');
    },
    loadConfig: function loadConfig(callback) {
        // if (!appCommon.getCookie(appConfig.CONFIGCOOKIENAME,'L')||!appCommon.getCookie(appConfig.CONFIGCOOKIENAME,'V')) {
        appCommon.ajax('../../../login/info', 'get', 'json', {}, function (data) {
            if (data.code == 200) {
                if (data.result) {
                    var result = data.result;
                    var configCookie = {};
                    configCookie.L = result.lang;
                    configCookie.V = result.version;
                    configCookie.HP = result.hlsPort; //hls 端口
                    configCookie.FP = result.flvPort; //flv 端口
                    configCookie.TP = result.transmitPort; //transmit 端口
                    configCookie.RP = result.reactPort; //reactnode 服务端口
                    configCookie.D = result.distributed; //是否分布式
                    Cookies.set(appConfig.CONFIGCOOKIENAME, JSON.stringify(configCookie), { expires: 7, path: '/' });
                    if (callback) {
                        callback();
                    }
                }
            }
        });
        // }else{
        /*if(callback){
            callback();
        }*/
        // }
    },
    init: function init() {
        appRegisterLogin.page.init();
        appRegisterLogin.checkBrower(function () {
            appRegisterLogin.loginForm.init();
            appRegisterLogin.authCode.init();
        });
    },
    //页面整体
    page: {
        el: 'body',
        init: function init() {
            function format(state) {
                if (!state.id) {
                    return state.text;
                }
                var value = state.element.value.replace('-', '_');
                var $state = $('<span><img src="' + appRegisterLogin.imgDir[value] + '" class="img-flag" /> ' + state.text + '</span>');
                return $state;
            }
            var lang = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'L');
            if (lang) {
                $('#country_list').val(lang).trigger('change');
            }
            if (jQuery().select2 && $('#country_list').size() > 0) {
                $('#country_list').select2({
                    templateResult: format,
                    templateSelection: format,
                    width: 'auto',
                    escapeMarkup: function escapeMarkup(m) {
                        return m;
                    },
                    //隐藏语言选择的搜索框
                    minimumResultsForSearch: Infinity
                });
                var cookieJson = {};
                $('#country_list').change(function (e) {
                    var lang = $(this).val();
                    cookieJson = JSON.parse(Cookies.get(appConfig.CONFIGCOOKIENAME));
                    cookieJson.L = lang;
                    Cookies.set(appConfig.CONFIGCOOKIENAME, JSON.stringify(cookieJson), { expires: 7, path: '/' });
                    location.href = location.href;
                });
            }
            appCommon.jqueryCache('body').on('select', function () {
                return false;
            });
            //登录button绑定
            $('#button_login').on('click', function () {
                appRegisterLogin.loginForm.submit();
            });
        }
    },
    loginForm: {
        init: function init() {
            $('.login-form input').keypress(function (e) {
                return 13 == e.which ? appRegisterLogin.loginForm.submit() : void 0;
            });
        },
        submit: function submit() {
            var that = this;
            if (appRegisterLogin.errorTimes >= 0) {
                //需要验证码
                if ($('#div_slideauthcode').is(':visible')) {
                    if (!appRegisterLogin.authCode.imgAuthSuccess) {
                        //验证失败
                        appRegisterLogin.authCode.showAuthWrongMsg();
                        return;
                    }
                }
            }
            that.validLoginValue();
            if (!appRegisterLogin.validResult) {
                return;
            }
            var param = that.getSubmitData();
            appCommon.ajax(appRegisterLogin.apiUri + 'auth', 'POST', 'json', param, function (data) {
                if (data.code == 200) {
                    if (data.result) {
                        appRegisterLogin.errorTimes = 0;
                        //获取系统配置
                        appCommon.ajax('../../../system-config/config-items', 'get', 'json', {}, function (data) {
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
                                        if (_data.TimeInterval) {
                                            cookieJson.T = _data.TimeInterval;
                                        } else {
                                            cookieJson.T = 1;
                                        }
                                        cookieJson.ET = new Date().getTime();
                                        Cookies.set(appConfig.CONFIGCOOKIENAME, JSON.stringify(cookieJson), {
                                            expires: 7,
                                            path: '/'
                                        });
                                    }
                                }
                            }
                            //如果带action,登陆成功之后做对应跳转
                            var action = appCommon.getQueryString('action');
                            if (action == 'alarmvideo') {
                                var device = appCommon.getQueryString('device');
                                var alarmtime = appCommon.getQueryString('alarmtime');
                                var alarmtype = appCommon.getQueryString('alarmtype');
                                location.href = '/basic/home/default.html' + '?action=' + action + '&device=' + device + '&alarmtime=' + alarmtime + '&alarmtype=' + alarmtype;
                            } else {
                                location.href = '/basic/home/default.html';
                            }
                        });
                    } else {
                        // appRegisterLogin.errorTimes += 1;
                        if (appRegisterLogin.errorTimes >= 0) {
                            if (appRegisterLogin.checkCanvasSupport()) {
                                //显示滑动验证码
                                appRegisterLogin.authCode.resetImgAuth();
                                appRegisterLogin.authCode.loadRandomImage();
                                if (appRegisterLogin.errorTimes == 0) {
                                    appRegisterLogin.authCode.type = 'imgAuth';
                                    appRegisterLogin.authCode.show();
                                }
                            } else {
                                //显示验证码验证
                                appRegisterLogin.authCode.type = 'codeAuth';
                                appRegisterLogin.authCode.loadCodeAuth();
                                appRegisterLogin.authCode.show();
                            }
                        }
                        $('.alert-danger span').text(window.lang.passwordOrAccountWrong);
                        $('.alert-danger').show();
                    }
                } else if ($('#div_authcode').is(':visible') && data.code == 205) {
                    appRegisterLogin.authCode.showAuthWrongMsg();
                } else {
                    $('.alert-danger span').text(window.lang['error' + data.code]);
                    $('.alert-danger').show();
                }
            });
        },
        /**
         * 验证输入登录信息
         */
        validLoginValue: function validLoginValue() {
            var password = $('#inp_password').val();
            var account = $('#inp_account').val();
            if (!password) {
                appRegisterLogin.validResult = false;
                $('.alert-danger span').text(window.lang.inputEmptyTip);
                $('.alert-danger').show();
            } else if (!account) {
                appRegisterLogin.validResult = false;
                $('.alert-danger span').text(window.lang.inputEmptyTip);
                $('.alert-danger').show();
            } else {
                appRegisterLogin.validResult = true;
                $('.alert-danger span').text('');
                $('.alert-danger').hide();
            }
        },
        //获取登录的参数
        getSubmitData: function getSubmitData() {
            //对登录密码进行rsa加密
            var password = $('#inp_password').val();
            var ciphertext = appCommon.encryptRSAStr(appRegisterLogin.publicKey, password);
            var data = {
                //用户名密码base64编码后提交登陆请求
                Zne: $('#inp_account').val(),
                Nrv: encodeURIComponent(ciphertext),
                client: 1, //代表ceiba2
                lang: $('#country_list').val(),
                version: '1.0.0.0'
            };
            if ($('#div_slideauthcode').is(':visible')) {
                if (appRegisterLogin.authCode.imgAuthSuccess) {
                    data.ae2 = new Date().getTime() + '*' + appRegisterLogin.authCode.xPosition + '*' + appRegisterLogin.authCode.yPosition;
                }
            } else if ($('#div_authcode').is(':visible')) {
                data.authcode = $('#inp_authcode').val();
            }
            return { z: encodeURIComponent(appCommon.encryptByDES(JSON.stringify(data))) };
        }
    },
    authCode: {
        barNowLeft: 0,
        barOldPosition: 0,
        authcodePosition: 0, //记住验证码块缺的地方
        isMouseDown: false,
        isMouseMove: true,
        isLoadImgAuth: false,
        imgAuthSuccess: false,
        xPosition: 0,
        yPosition: 0,
        type: '',
        imgSrc: '',
        init: function init() {
            var that = this;
            that.bindEvent();
            that.showAuthCode();
        },
        //初始显示验证码
        showAuthCode: function showAuthCode() {
            if (appRegisterLogin.checkCanvasSupport()) {
                //显示滑动验证码
                appRegisterLogin.authCode.resetImgAuth();
                appRegisterLogin.authCode.loadRandomImage();
                if (appRegisterLogin.errorTimes == 0) {
                    appRegisterLogin.authCode.type = 'imgAuth';
                    appRegisterLogin.authCode.show();
                }
            } else {
                //显示验证码验证
                appRegisterLogin.authCode.type = 'codeAuth';
                appRegisterLogin.authCode.loadCodeAuth();
                appRegisterLogin.authCode.show();
            }
        },
        show: function show() {
            var that = this;
            if (that.type == 'imgAuth') {
                $('#div_slideauthcode').show();
            } else if (that.type == 'codeAuth') {
                $('#div_authcode').show();
            }
        },
        //显示验证码错误信息
        showAuthWrongMsg: function showAuthWrongMsg() {
            $('.alert-danger span').text(window.lang.authCodeWrong);
            $('.alert-danger').show();
        },
        //隐藏验证码错误信息
        hideAuthWrongMsg: function hideAuthWrongMsg() {
            if ($('.alert-danger').is(':visible')) {
                if ($('.alert-danger span').text() === window.lang.authCodeWrong) {
                    $('.alert-danger').hide();
                }
            }
        },
        resetImgAuth: function resetImgAuth(isWrongBefore) {
            var that = this;
            $('#span_authcodetip').text(lang['spinnerPrompt']);
            $('#btn_authstate').html('<i class="glyphicon glyphicon-lock"></i>');
            $('#btn_authstate').removeClass('red').removeClass('green').addClass('blue');
            $('#div_authcodecontrol').animate({ left: '10px' });
            that.imgAuthSuccess = false;
            $('body').css('cursor', 'default');
            if (isWrongBefore) {
                //如果是一个验证码本次没有验证过时，将前面的块位置还原
                $('#cv_prev').animate({ left: that.oppNum(that.authcodePosition) - 1 + 10 });
                that.isLoadImgAuth = true;
            } else {
                $('#div_authcodeimg').html('');
                that.isLoadImgAuth = false;
            }
        },
        bindEvent: function bindEvent() {
            var that = this;
            appCommon.jqueryCache('#div_authcodecontrol').on('mousedown mouseover', function (e) {
                if (!that.imgAuthSuccess) {
                    if (e.type == 'mousedown') {
                        if (that.isMouseDown) {
                            return false;
                        }
                        that.isMouseDown = true;
                        $('#span_authcodetip').text('');
                        if (!that.isLoadImgAuth) {
                            appCommon.ajax('/login/authcode2', 'get', 'json', {}, function (data) {
                                if (data.code == 200) {
                                    if (data.result) {
                                        var result = data.result;
                                        var xHex = result.split('*')[1];
                                        var yHex = result.split('*')[2];
                                        var x = parseInt(xHex, 16); //从16进制转到10进制
                                        var y = parseInt(yHex, 16);
                                        that.loadImgAuth(x, y);
                                        that.xPosition = x.toString(2); //转为2进制
                                        that.yPosition = y.toString(2);
                                    }
                                }
                            });
                        }
                    } else {
                        $(this).css('cursor', 'pointer');
                    }
                } else {
                    $(this).css('cursor', 'not-allowed');
                }
            });
            $('#div_authcodebar').on('mouseenter mouseleave', function (e) {
                if (!that.imgAuthSuccess) {
                    if (e.type == 'mouseenter') {
                        $('#div_authcodeimg').show();
                    } else if (e.type == 'mouseleave') {}
                }
            });
            appCommon.jqueryCache('body').on('mouseup mousemove', function (e) {
                if (e.type == 'mouseup') {
                    if (that.isMouseDown && that.isMouseMove) {
                        that.isMouseDown = false;
                        that.isMouseMove = false;
                        $(this).css('cursor', 'default');
                        var left = parseInt($('#cv_prev').css('left'));
                        if (left <= 5 && left >= -5) {
                            //完全重合应为-1
                            $('#div_authcodeimg').html('');
                            $('#btn_authstate').html('<i class="glyphicon glyphicon-ok"></i>');
                            $('#btn_authstate').removeClass('blue').removeClass('red').addClass('green');
                            $('#cv_prev').css('left', '-10px');
                            that.imgAuthSuccess = true;
                            setTimeout(function () {
                                $('#div_authcodeimg').fadeOut(900);
                            }, 300);
                        } else {
                            $('#btn_authstate').html('<i class="glyphicon glyphicon-remove"></i>');
                            $('#btn_authstate').removeClass('blue').removeClass('green').addClass('red');
                            setTimeout(function () {
                                that.resetImgAuth(true);
                            }, 200);
                        }
                    }
                } else if (e.type == 'mousemove') {
                    if (that.isMouseDown) {
                        that.isMouseMove = true;
                        that.barOldPosition = document.getElementById('div_authcodecontrol').getBoundingClientRect().left + document.documentElement.scrollLeft;
                        var x = e.pageX;
                        var changeXBar = x - that.barOldPosition;
                        var oldBarLeft = $('#div_authcodecontrol').position().left;
                        var barLeft = oldBarLeft + changeXBar;
                        var oldCodeLeft = $('#cv_prev').position().left;
                        var codeLeft = oldCodeLeft + changeXBar;
                        var barWidth = $('#div_authcodebar').width();
                        if (barLeft >= barWidth - 40) {
                            barLeft = barWidth - 40;
                        } else if (barLeft <= 10) {
                            barLeft = 10;
                        }
                        if (codeLeft >= barWidth - that.authcodePosition - 40 - 10) {
                            codeLeft = barWidth - that.authcodePosition - 40 - 10;
                        } else if (codeLeft < that.oppNum(that.authcodePosition) - 1 + 10) {
                            codeLeft = that.oppNum(that.authcodePosition) - 1 + 10;
                        }
                        $('#div_authcodecontrol').css('left', barLeft);
                        $('#cv_prev').css('left', codeLeft);
                    }
                }
            });
            appCommon.jqueryCache('#img_authcode').on('click', function () {
                appRegisterLogin.authCode.loadCodeAuth();
            });
        },
        loadRandomImage: function loadRandomImage() {
            var that = this;
            //随机生成图片编号
            var imgNo = that.createRandomArray(5, 0, 5)[0];
            that.imgSrc = appRegisterLogin.authCodeImg[imgNo];
            $('#div_authcodeimg').css('background-image', 'url(' + that.imgSrc + ')');
        },
        loadImgAuth: function loadImgAuth(xPosition, yPosition) {
            var that = this;
            var imgWidth = $('#div_authcodeimg').width();
            var imgHeight = $('#div_authcodeimg').height();
            //清除掉上一次的canvas
            var canvas = '<canvas id="cv_prev" style="position:absolute;top:0;z-index:2004;"></canvas>' + '<canvas id="cv_after" style="position:absolute;top:0;left:-1px;z-index:2003;"></canvas>';
            $('#div_authcodeimg').html(canvas);
            //var xPosition=that.createRandomArray(imgWidth-160,80,imgWidth-80)[0];
            //var yPosition=that.createRandomArray(imgHeight-160,80,imgHeight-80)[0];
            var directArray = that.createRandomArray(2, 0, 6); //圆的方向数组 <3表示里面 >=3表示外面
            var c1 = document.getElementById('cv_prev');
            var ctx_prev = c1.getContext('2d');
            var c2 = document.getElementById('cv_after');
            c1.width = imgWidth;
            c1.height = imgHeight;
            c2.width = imgWidth;
            c2.height = imgHeight;
            var ctx_after = c2.getContext('2d');
            ctx_prev.strokeStyle = '#5B5B5B';
            ctx_after.strokeStyle = '#000';
            ctx_prev.lineWidth = 3;
            ctx_after.lineWidth = 0;
            ctx_prev.shadowBlur = 10;
            //ctx_prev.shadowColor='black';火狐不支持
            ctx_prev.beginPath();
            ctx_after.beginPath();
            if (directArray[0] < 3) {
                var bezierStartX = that.createRandomArray(10, xPosition + 15, xPosition + 25)[0]; //+5,+35避免缺口太靠边
                ctx_prev.moveTo(bezierStartX, yPosition);
                ctx_prev.bezierCurveTo(bezierStartX, yPosition + 10, bezierStartX + 10, yPosition + 10, bezierStartX + 10, yPosition);
                ctx_prev.lineTo(xPosition + 40, yPosition);
                ctx_after.moveTo(bezierStartX, yPosition);
                ctx_after.bezierCurveTo(bezierStartX, yPosition + 10, bezierStartX + 10, yPosition + 10, bezierStartX + 10, yPosition);
                ctx_after.lineTo(xPosition + 40, yPosition);
            } else {
                var bezierStartX = that.createRandomArray(10, xPosition + 15, xPosition + 25)[0]; //+5,+35避免缺口太靠边
                ctx_prev.moveTo(bezierStartX, yPosition);
                ctx_prev.bezierCurveTo(bezierStartX, yPosition - 10, bezierStartX + 10, yPosition - 10, bezierStartX + 10, yPosition);
                ctx_prev.lineTo(xPosition + 40, yPosition);
                ctx_after.moveTo(bezierStartX, yPosition);
                ctx_after.bezierCurveTo(bezierStartX, yPosition - 10, bezierStartX + 10, yPosition - 10, bezierStartX + 10, yPosition);
                ctx_after.lineTo(xPosition + 40, yPosition);
            }
            if (directArray[1] < 3) {
                var bezierStartY = that.createRandomArray(10, yPosition + 15, yPosition + 25)[0];
                var bezierStartX = xPosition + 40;
                ctx_prev.lineTo(bezierStartX, bezierStartY);
                ctx_prev.bezierCurveTo(bezierStartX - 10, bezierStartY, bezierStartX - 10, bezierStartY + 10, bezierStartX, bezierStartY + 10);
                ctx_prev.lineTo(xPosition + 40, yPosition + 40);
                ctx_prev.lineTo(xPosition, yPosition + 40);
                ctx_prev.lineTo(xPosition, yPosition);
                ctx_after.lineTo(bezierStartX, bezierStartY);
                ctx_after.bezierCurveTo(bezierStartX - 10, bezierStartY, bezierStartX - 10, bezierStartY + 10, bezierStartX, bezierStartY + 10);
                ctx_after.lineTo(xPosition + 40, yPosition + 40);
                ctx_after.lineTo(xPosition, yPosition + 40);
                ctx_after.lineTo(xPosition, yPosition);
            } else {
                var bezierStartY = that.createRandomArray(10, yPosition + 15, yPosition + 25)[0];
                var bezierStartX = xPosition + 40;
                ctx_prev.lineTo(bezierStartX, bezierStartY);
                ctx_prev.bezierCurveTo(bezierStartX + 10, bezierStartY, bezierStartX + 10, bezierStartY + 10, bezierStartX, bezierStartY + 10);
                ctx_prev.lineTo(xPosition + 40, yPosition + 40);
                ctx_prev.lineTo(xPosition, yPosition + 40);
                ctx_prev.lineTo(xPosition, yPosition);
                ctx_after.lineTo(bezierStartX, bezierStartY);
                ctx_after.bezierCurveTo(bezierStartX + 10, bezierStartY, bezierStartX + 10, bezierStartY + 10, bezierStartX, bezierStartY + 10);
                ctx_after.lineTo(xPosition + 40, yPosition + 40);
                ctx_after.lineTo(xPosition, yPosition + 40);
                ctx_after.lineTo(xPosition, yPosition);
            }
            ctx_after.closePath();
            ctx_after.stroke();
            ctx_after.clip(); //图片加载成功后绘制
            ctx_prev.closePath();
            ctx_prev.stroke();
            ctx_prev.clip();
            var img = new Image();
            img.src = that.imgSrc;
            img.onload = function () {
                ctx_prev.drawImage(img, 0, 0);
                var grd = ctx_after.createRadialGradient(xPosition + 20, yPosition + 20, 10, xPosition + 20, yPosition + 20, 20);
                grd.addColorStop(0, 'rgba(0,0,0,0.4)');
                grd.addColorStop(1, 'rgba(0,0,0,0.6)');
                ctx_after.fillStyle = grd;
                ctx_after.fillRect(0, 0, c2.width, c2.height);
                $('#cv_prev').css('left', that.oppNum(xPosition) - 1 + 10); //背景图片定位与滑动条left为-1 滑动条有边框，为把后面所有输入框遮住
                that.authcodePosition = xPosition;
            };
            that.isLoadImgAuth = true;
        },
        //取相反数
        oppNum: function oppNum(data) {
            return 0 - data;
        },
        /***
         * 创建随机数组
         * @param num 随机数个数
         * @param maxnum 最大数
         * @param minnum 最小数
         */
        createRandomArray: function createRandomArray(num, minnum, maxnum) {
            if (!num || !maxnum) {
                console.log('no data');
                return;
            }
            var i = minnum,
                array = [];
            if (maxnum - minnum < num) {
                console.log('no enouph data!');
                return;
            }
            for (; i < maxnum; i++) {
                array[i] = i;
            }
            //打乱顺序
            array.sort(function (p1, p2) {
                return 0.5 - Math.random();
            });
            array.length = num;
            return array;
        },
        loadCodeAuth: function loadCodeAuth() {
            $('#img_authcode').prop('src', '../../../login/authcode');
        }
    }
};
window.onload = function () {
    appRegisterLogin.checkBrower();
    appRegisterLogin.loadConfig(function () {
        appCommon.lang(function () {
            appRegisterLogin.publicKey = appCommon.getRSAPublicKey();
            appRegisterLogin.init();
        });
    });
};