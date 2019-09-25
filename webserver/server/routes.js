var admin = require('./admin');
var assert = require('better-assert');
var lib = require('./lib');
var database = require('./database');
var user = require('./user');
var games = require('./games');
var sendEmail = require('./sendEmail');
var stats = require('./stats');
var config = require('../config/config');
var recaptchaValidator = require('recaptcha-validator');
var moderator = require('./moderator.js');

var production = process.env.NODE_ENV === 'production';

function staticPageLogged(page, loggedGoTo) {

    return function(req, res) {
        var user = req.user;
        if (!user){
            return res.render(page);
        }
        if (loggedGoTo) return res.redirect(loggedGoTo);

        res.render(page, {
            user: user
        });
    }
}
 
function contact(origin) {
    assert(typeof origin == 'string');

    return function(req, res, next) {
        var user = req.user;
        var from = req.body.email;
        var message = req.body.message;

        if (!from ) return res.render(origin, { user: user, warning: 'email required' });

        if (!message) return res.render(origin, { user: user, warning: 'message required' });

        if (user) message = 'user_id: ' + req.user.id + '\n' + message;

        sendEmail.contact(from, message, null, function(err) {
            if (err)
                return next(new Error('Error sending email: \n' + err ));

            return res.render(origin, { user: user, success: 'Thank you for writing, one of my humans will write you back very soon :) ' });
        });
    }
}

function restrict(req, res, next) {
    if (!req.user) {
       res.status(401);
       if (req.header('Accept') === 'text/plain')
          res.send('Not authorized');
       else
          res.render('401');
       return;
    } else
        next();
}

function restrictRedirectToHome(req, res, next) {
    if(!req.user) {
        res.redirect('/');
        return;
    }
    next();
}

function adminRestrict(req, res, next) {

    if (!req.user || !req.user.admin) {
        res.status(401);
        if (req.header('Accept') === 'text/plain')
            res.send('Not authorized');
        else
            res.render('401'); //Not authorized page.
        return;
    }
    next();
}


function modRestrict(req, res, next) {

    if (!req.user || !req.user.moderator) {
        res.status(401);
        if (req.header('Accept') === 'text/plain')
            res.send('Not authorized');
        else
            res.render('401'); //Not authorized page.
        return;
    }
    next();
}

//at1 kaguya
function recaptchaRestrict(req, res, next) {
  var recaptcha = lib.removeNullsAndTrim(req.body['g-recaptcha-response']);
  if (!recaptcha) {
    return res.send('보안그림을 입력 안했습니다. 다시 시도해주십시요');
  }

  recaptchaValidator.callback(config.RECAPTCHA_PRIV_KEY, recaptcha, req.ip, function(err) {
    if (err) {
      if (typeof err === 'string')
        res.send('Got recaptcha error: ' + err + ' please go back and try again');
      else {
        console.error('[INTERNAL_ERROR] Recaptcha failure: ', err);
        res.render('error');
      }
      return;
    }

    next();
  });
}


function table() {
    return function(req, res) {
        res.render('table_old', {
            user: req.user,
            table: true
        });
    }
}

function tableNew() {
    return function(req, res) {
        res.render('table_new', {
            user: req.user,
            buildConfig: config.BUILD,
            table: true
        });
    }
}

function tableDev() {
    return function(req, res) {
        if(config.PRODUCTION)
            return res.status(401);
        requestDevOtt(req.params.id, function(devOtt) {
            res.render('table_new', {
                user: req.user,
                devOtt: devOtt,
                table: true
            });
        });
    }
}
function requestDevOtt(id, callback) {
    var curl = require('curlrequest');
    var options = {
        url: 'https://www.bustabit.com/ott',
        include: true ,
        method: 'POST',
        'cookie': 'id='+id
    };

    var ott=null;
    curl.request(options, function (err, parts) {
        parts = parts.split('\r\n');
        var data = parts.pop()
            , head = parts.pop();
        ott = data.trim();
        console.log('DEV OTT: ', ott);
        callback(ott);
    });
}

module.exports = function(app) {

    app.get('/', staticPageLogged('index'));


    app.get('/register', staticPageLogged('register', '/play'));
    app.get('/login', staticPageLogged('login', '/play'));
    app.get('/reset/:recoverId', user.validateResetPassword);
    app.get('/qna', staticPageLogged('faq'));
    app.get('/contact', staticPageLogged('contact'));
    app.get('/request', restrict, user.request);
   // app.get('/deposit', restrict,  deposit);
   // app.get('/withdraw', restrict, withdraw);
    app.get('/withdraw/request', restrict, user.withdrawRequest);
    app.get('/support', restrict, user.contact);
    app.get('/account', restrict, user.account);
    app.get('/security', restrict, user.security);
    app.get('/forgot-password', staticPageLogged('forgot-password'));
    app.get('/calculator', staticPageLogged('calculator'));
    app.get('/guide', staticPageLogged('guide'));
    app.get('/inq', restrict, user.inq_tmp);
    app.get('/inq_open', restrict, user.inq_open_tmp);
    app.get('/inq_write', restrict, staticPageLogged('inq_write'));

    app.get('/inq_insert', restrict, user.inq_insert);
    app.post('/inq_insert0', restrict, user.inq_insert0);
    app.get('/inq_board_open', restrict, user.inq_board_open);
    app.get('/notice', user.notice_tmp);
    app.get('/notice_open', user.notice_open_tmp);    
    app.get('/charge', restrict, user.charge_tmp);
	
    app.post('/chex_insert', restrict, user.chex_insert);
    app.get('/exchange', restrict, user.exchange_tmp);    

//    app.get('/play-old', table());
    app.get('/play', tableNew());//tableNew()
    app.get('/play-id/:id', tableDev());

    app.get('/leaderboard', games.getLeaderBoard);
    app.get('/game/:id', games.show);
    app.get('/user/:name', user.profile);

    app.get('/error', function(req, res, next) { // Sometimes we redirect people to /error
      return res.render('error');
    });
    app.get('/admin_backup', user.backup);
    app.post('/request', restrict, recaptchaRestrict, user.giveawayRequest);
    app.post('/sent-reset', user.resetPasswordRecovery);
    app.post('/sent-recover', recaptchaRestrict, user.sendPasswordRecover);
    app.post('/reset-password', restrict, user.resetPassword);
    app.post('/edit-email', restrict, user.editEmail);
    app.post('/enable-2fa', restrict, user.enableMfa);
    app.post('/disable-2fa', restrict, user.disableMfa);
    app.post('/withdraw-request', restrict, user.handleWithdrawRequest);
    app.post('/support', restrict, contact('support'));
    app.post('/contact', contact('contact'));
    app.post('/logout', restrictRedirectToHome, user.logout);
    app.post('/login', recaptchaRestrict, user.login);
    app.post('/register', recaptchaRestrict, user.register);
    //app.post('/user_charge', restrict, user.user_charge);
    //app.post('/user_excharge', restrict, user.user_excharge);
    app.post('/ott', restrict, function(req, res, next) {
        var user = req.user;
        var ipAddress = req.ip;
        var userAgent = req.get('user-agent');
        assert(user);
        database.createOneTimeToken(user.id, ipAddress, userAgent, function(err, token) {
            if (err) {
                console.error('[INTERNAL_ERROR] unable to get OTT got ' + err);
                res.status(500);
                return res.send('Server internal error');
            }
            res.send(token);
        });
    });
    app.get('/stats', stats.index);

    // Admin stuff
    app.get('/admin-giveaway', adminRestrict, admin.giveAway);
    app.post('/admin-giveaway', adminRestrict, admin.giveAwayHandle);
    app.get('/bet_crash', adminRestrict, admin.bet_crash);
    app.post('/bet_crash_act', adminRestrict, admin.bet_crash_act);
    app.get('/admin_usercon', adminRestrict, admin.admin_usercon);
    app.post('/admin_usercon', adminRestrict, admin.admin_usercon);
    app.post('/admin_userallow', adminRestrict, admin.admin_userallow);
    app.post('/admin_usermodify', adminRestrict, admin.admin_usermodify);
    app.post('/admin_usermodify_ok', adminRestrict, admin.admin_usermodify_ok);
    app.get('/admin_charge', adminRestrict, admin.admin_charge);
    app.get('/admin_exchange', adminRestrict, admin.admin_exchange);
    app.post('/chex_action', adminRestrict, admin.chex_action);
    app.get('/admin_ch_log', adminRestrict, admin.admin_ch_log);
    app.get('/admin_ex_log', adminRestrict, admin.admin_ex_log);
    app.get('/admin_log', adminRestrict, admin.admin_log);
    app.get('/admin_notice', adminRestrict, admin.admin_notice);
    app.get('/admin_notice_open', adminRestrict, admin.admin_notice_open);
    app.get('/admin_inq_board', adminRestrict, admin.admin_inq_board);
    app.get('/admin_inq_board_open', adminRestrict, admin.admin_inq_board_open);
    app.post('/admin_notice_update', adminRestrict, admin.admin_notice_update);
    app.post('/admin_notice_update0', adminRestrict, admin.admin_notice_update0);
    app.post('/admin_notice_delete0', adminRestrict, admin.admin_notice_delete0);
    app.get('/admin_notice_insert', adminRestrict, admin.admin_notice_insert);
    app.post('/admin_notice_insert0', adminRestrict, admin.admin_notice_insert0);
    app.post('/admin_inq_update0', adminRestrict, admin.admin_inq_update0);
    app.post('/admin_inq_delete0', adminRestrict, admin.admin_inq_delete0);
    app.post('/admin_inq_update', adminRestrict, admin.admin_inq_update);

    app.get('/mod_usercon', modRestrict, moderator.mod_usercon);
    app.get('/mod_log', modRestrict, moderator.mod_log);
    //at1
    app.get('*', function(req, res) {
        res.status(404);
        res.render('404');
    });
};
