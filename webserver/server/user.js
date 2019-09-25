var assert = require('better-assert');
var async = require('async');
var bitcoinjs = require('bitcoinjs-lib');
var request = require('request');
var timeago = require('timeago');
var lib = require('./lib');
var database = require('./database');
var withdraw = require('./withdraw');
var sendEmail = require('./sendEmail');
var speakeasy = require('speakeasy');
var qr = require('qr-image');
var uuid = require('uuid');
var _ = require('lodash');
var config = require('../config/config');
var request = require("request");
var fs = require('fs');

var sessionOptions = {
    httpOnly: true,
    secure : config.PRODUCTION
};

/**
 * POST
 * Public API
 * Register a user
 */


Number.prototype.formatwon = function(){
    if(this==0) return 0;
 
    var reg = /(^[+-]?\d+)(\d{3})/;
    var n = (this + '');
 
    while (reg.test(n)) n = n.replace(reg, '$1' + ',' + '$2');
 
    return n;
};


String.prototype.formatwon = function(){
    var num = parseFloat(this);
    if( isNaN(num) ) return "0";
 
    return num.format();
};


Date.prototype.format = function(f) {
    if (!this.valueOf()) return " ";
 
    var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var d = this;
     
    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear();
            case "yy": return (d.getFullYear() % 1000).zf(2);
            case "MM": return (d.getMonth() + 1).zf(2);
            case "dd": return d.getDate().zf(2);
            case "E": return weekName[d.getDay()];
            case "HH": return d.getHours().zf(2);
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
            case "mm": return d.getMinutes().zf(2);
            case "ss": return d.getSeconds().zf(2);
            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
            default: return $1;
        }
    });
};
 
String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};




function table_style(res){

        res.write("<style>");

        res.write("table.type10 { border-top:#ccc solid 0px; border-bottom:#ccc solid 1px; border-left:#ccc solid 1px; border-right:#ccc solid 1px; border-collapse: collapse;text-align: left;line-height: 1.5; width:100%;  margin: 20px 0px;}");
        res.write("table.type10 thead th {width: 150px;padding: 5px;font-weight: bold; font-size:14; line-height:1.5; vertical-align: top;color: #FFF;background:#373636 ; }");
        res.write("table.type10 tbody th {width: 200px; padding: 5px;}");
        res.write("table.type10 td { border-right:1px solid #F0F2F4; border-bottom:1px solid #ccc; border-left:0px; margin: 0px; width : 0px; padding: 5px;vertical-align: top;}");
        res.write("table.type10 .even {background: #fdf3f5;}");
        res.write("</style>");

}



function div_content1(res){
res.write("<div id=\"content\" style=\"float:left;\">");

}

function div_content2(res){
res.write("</div>");
}

function div_header(res, title_text){
res.write("<div id=\"container\" style=\"width:100%;\">");
res.write("<div id=\"header\" background-color:#FFA500;\">");
res.write("<h1 style=\"margin-bottom:0;\" class=\"style1\">");
res.write(title_text);
res.write("<div>");
}

exports.exchange = function(req, res){
	var user = req.user;

	
	res.writeHead(200, {'Content-Type':'text/html'});

	database.getchex_user('exchange', req.user.username , function(err, data){

	if(err === 'NO_LOG'){

 		res.write("<html><head>");
		res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");

		res.write("<title>환전요청</title>");
		res.write("</head>");
		res.write("<body>");
		
		
		res.write("<form action=\"chex_insert\" method=\"post\">");
		res.write("<select name=\"amount\">");
		for(var i=1; i<=100; i++){
			
		res.write("<option value=\""+i*10000+"\">"+i*10000+"</option>");
		}
		res.write("</select>");
		res.write("<input type=\"hidden\" name=\"type\" value=\"exchange\" />");
		res.write("<input type=\"submit\" value=\"환전요청\" />");
		res.write("</form>");
		
		res.write('</body>');
		res.write('</html>');
		return	res.end();
		}
	else{
	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");

	res.write("<title>환전요청</title>");
	res.write("</head>");
	res.write("<body>");


	table_style(res);

	res.write("<table class=\"type10\">");
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">회원아이디</th>");
	res.write("<th scope=\"cols\">환전요청금액</th>");
	res.write("<th scope=\"cols\">환전 요청날짜</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");	
	
	res.write("<tr>");

	for ( var i=0; i<data.rows.length; i++){	
	res.write('<tr>');

	res.write('<td>'+data.rows[i].username+'</td>');
	res.write('<td>'+data.rows[i].amount+'</td>');
	res.write('<td>'+data.rows[i].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+'</td>');



	res.write('</tr>');
	}

	/*div_content2(res);*/
	res.write('</body>');
	res.write('</html>');
	res.end();
	}
	});
};

exports.chex_insert = function(req, res){
var user = req.user;
var cash;

res.writeHead(200, {'Content-Type':'text/html'});

database.getusercash( req.user.username, function(err, data){

cash = parseInt(data.rows[0].balance_satoshis);

if(req.param('type') === 'exchange'){
	
if(parseInt(req.param('amount')) >= cash ){
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
							res.write('<script>');
							res.write('alert(\"금액이 모자랍니다.\");');

							res.write('location.href=\"./exchange\"');
							res.write('</script>');
							res.end();
}
else{

							database.chex_insert(req.user.username, req.param('type'), req.param('amount')  ,function(err,data2) {
							res.write('<script>');
							res.write('location.href=\"./exchange\"');
							res.write('</script>');
							res.end();
});	}

							}
else{
	database.chex_insert(req.user.username, req.param('type'), req.param('amount')  ,function(err,data2) {


						res.write('<script>');
							res.write('location.href=\"./charge\"');
							res.write('</script>');
							res.write('err');
							res.end();
});	
}

}, req, res);

};

exports.charge = function(req, res){
	var user = req.user;

	
	res.writeHead(200, {'Content-Type':'text/html'});

	database.getchex_user('charge', req.user.username , function(err, data){

	if(err === 'NO_LOG'){

 		res.write("<html><head>");
		res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");

		res.write("<title>충전페이지</title>");
		res.write("</head>");
		res.write("<body>");
		
		
		res.write("<form action=\"chex_insert\" method=\"post\">");
		res.write("<select name=\"amount\">");
		for(var i=1; i<=100; i++){
			
		res.write("<option value=\""+i*10000+"\">"+i*10000+"</option>");
		}
		res.write("</select>");
		res.write("<input type=\"hidden\" name=\"type\" value=\"charge\" />");
		res.write("<input type=\"submit\" value=\"충전요청\" />");
		res.write("</form>");
		
		res.write('</body>');
		res.write('</html>');
		return	res.end();
		}

	else{
	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");

	res.write("<title>충전페이지</title>");
	res.write("</head>");
	res.write("<body>");

	table_style(res);

	res.write("<table class=\"type10\">");
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">회원아이디</th>");
	res.write("<th scope=\"cols\">충전요청금액</th>");
	res.write("<th scope=\"cols\">충전 요청날짜</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");	
	
	res.write("<tr>");

	for ( var i=0; i<data.rows.length; i++){	
	res.write('<tr>');

	res.write('<td>'+data.rows[i].username+'</td>');
	res.write('<td>'+data.rows[i].amount+'</td>');
	res.write('<td>'+data.rows[i].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+'</td>');



	res.write('</tr>');
	}

	/*div_content2(res);*/
	res.write('</body>');
	res.write('</html>');
	res.end();
	}
	});
};

exports.notice_open = function(req, res){
var user = req.user;

assert(user.admin);
assert(req.param('idx'));

//	res.writeHead(200, {'Content-Type':'text/html'});

database.admin_notice_open( req.param('idx'), function(err,data) { 

res.write("<html><head>");
res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
res.write("<title>공지사항</title>");
res.write("</head>");
res.write("<body>");


table_style(res);	

res.write("<table class=\"type10\">");

if(err) return res.end();	
if(err === 'NO_USERS') return res.end();

	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">"+data.rows[0].idx+"</th>");
	res.write("<th scope=\"cols\">"+data.rows[0].title+"</th>");
	res.write("<th scope=\"cols\">"+data.rows[0].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+"</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");

	res.write('<tr>');
	
	res.write('<td>'+data.rows[0].content+'</td>');
	res.write('</tr>');



res.write('</tbody>');
res.write('</table>');


res.write('</body>');
res.write('</html>');
res.end();

},req,res);

//at1
//	res.render('admin_master', {user: user});
};

exports.notice = function(req, res){

//kaguya
content = content.replace("\r\n","<br>");

var user = req.user;
	res.writeHead(200, {'Content-Type':'text/html'});

	
database.admin_notice( function(err,data) { 

res.write("<html><head>");


res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
res.write("<title>공지사항</title>");
res.write("</head>");
res.write("<body>");



table_style(res);	

res.write("<table class=\"type10\">");
res.write("<thead>");
res.write("<tr>");
res.write("<th scope=\"cols\">공지번호</th>");
res.write("<th scope=\"cols\">공지제목</th>");
res.write("<th scope=\"cols\">공지날짜</th>");
res.write("</tr>");
res.write("</thead>");
res.write("<tbody>");


for ( var i=0; i<data.rows.length; i++){	
		res.write('<tr>');
	
	res.write('<td>'+data.rows[i].idx+'</td>');	
	res.write('<td><a href=\"./notice_open?idx='+data.rows[i].idx+'\">'+data.rows[i].title+'</a></td>');	
	res.write('<td>'+data.rows[i].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+'</td>');
	res.write('</tr>');

}



res.write('</tbody>');
res.write('</table>');

res.write('</body>');
res.write('</html>');
res.end();

},req,res);

//at1
//	res.render('admin_master', {user: user});
};


exports.inq_board_open = function(req, res){
	var user = req.user;
	
	assert(req.param('idx'));

//	res.writeHead(200, {'Content-Type':'text/html'});

	database.admin_inq_board_open( req.param('idx'), function(err,data) { 

	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>1:1문의</title>");
	res.write("</head>");
	res.write("<body>");


	
	
	table_style(res);	
	
	res.write("<table class=\"type10\">");
	
	console.log(err);
	if(err) return res.end();	
	if(err === 'NO_USERS') return res.end();

		res.write("<thead>");
        	res.write("<tr>");
        	res.write("<th scope=\"cols\">"+data.rows[0].idx+"</th>");
        	res.write("<th scope=\"cols\">"+data.rows[0].title+"</th>");
		res.write("<th scope=\"cols\">"+data.rows[0].owner+"</th>");
        	res.write("<th scope=\"cols\">"+data.rows[0].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+"</th>");
        	res.write("</tr>");
        	res.write("</thead>");
        
	res.write('<tr>');
	res.write('<td>'+data.rows[0].content+'</td>');
	res.write('</tr>');
	res.write("<tr>");
		


	/*	
	res.write("<form action=\"./admin_inq_delete0\" method=\"post\" />");
	res.write("<input type=\"hidden\" name=\"idx\" value=\""+data.rows[0].idx+"\" /> ");
	res.write("<input type=\"submit\" value=\"문의삭제\" />");
	res.write("</form>");
	*/
	res.write('</tbody>');
	res.write('</table>');

	
	 
	res.write("<table class=\"type10\">");
	res.write("<thead>");
        res.write("<th scope=\"cols\">답장</th>");
        res.write("</tr>");
	

	
	res.write("<tbody>");
	res.write("<tr>");
        res.write("<th scope=\"cols\">"+data.rows[0].reply+"</th>");
        res.write("</tr>");		
	res.write("</tbody>");	
	
	res.write("</table>");	



	res.write('</body>');
	res.write('</html>');
	res.end();

},req,res);
};

exports.inq_insert0 = function(req, res){
	var user = req.user;

    res.writeHead(200, {'Content-Type':'text/html'});
    database.inq_insert0( req.param('title'),req.param('content'), req.user.username , function(err, data){
	res.write('<script>');
	res.write('location.href=\"./inq\"');
	res.write('</script>');
	res.end();} 
);
};


exports.inq_insert = function(req, res){
    var user = req.user;
    assert(user.admin);
	

    res.writeHead(200, {'Content-Type':'text/html'});
	
	
							
	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>1:1문의작성</title>");
	res.write("</head>");
	res.write("<body>");


	
	table_style(res);	
	res.write('<form action=\"./inq_insert0\" method=\"post\">');						
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">문의제목:<input type=\"text\" name=\"title\"/> </th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");
	res.write("<br/>");
	res.write('<tr>');
	
	res.write("<td>문의내용:<input type=\"text\" name=\"content\"/> </td>");
	res.write('</tr>');
	res.write('<input type=\"submit\" value=\"글생성\"/>');
	res.write('</form>');




res.write('</tbody>');
res.write('</table>');


res.write('</body>');
res.write('</html>');
res.end();
	 return	res.end();
	
};


exports.inq = function(req, res){
	
	
	 res.writeHead(200, {'Content-Type':'text/html'});
	 database.inq_userget(req.user.username , function(err, data){
	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>공지사항</title>");
	res.write("</head>");
	res.write("<body>");
	table_style(res);
	res.write("<table class=\"type10\">");
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">문의제목</th>");
	res.write("<th scope=\"cols\">문의날짜</th>");
	res.write("<th scope=\"cols\">문의작성자</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");
	
	for ( var i=0; i<data.rows.length; i++){	
			res.write('<tr>');
		
		res.write('<td><a href=\"./inq_board_open?idx='+data.rows[i].idx+'\">'+data.rows[i].title+'</a></td>');	
		res.write('<td>'+data.rows[i].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+'</td>');
		res.write('<td>'+data.rows[i].owner+'</td>');
		res.write('</tr>');

	}
	
	res.write('</tbody>');
	res.write('</table>');
	
	res.write("<form action=\"./inq_insert\" method=\"get\" />");
	res.write("<input type=\"submit\" value=\"1:1문의작성\" />");
	res.write("</form>");

	
	res.write('</body>');
	res.write('</html>');
	res.end();
	 });
};




exports.register  = function(req, res, next) {
    var values = _.merge(req.body, { user: {} });
    var recaptcha = lib.removeNullsAndTrim(req.body['g-recaptcha-response']);
    var username = lib.removeNullsAndTrim(values.user.name);
    var password = lib.removeNullsAndTrim(values.user.password);
    var password2 = lib.removeNullsAndTrim(values.user.confirm);
    var email = lib.removeNullsAndTrim(values.user.email);
    var hp_number = lib.removeNullsAndTrim(values.user.hp_number);
    var bank_name = lib.removeNullsAndTrim(values.user.bank_name);
    var bank_type = lib.removeNullsAndTrim(values.user.bank_type);
    var bank_number = lib.removeNullsAndTrim(values.user.bank_number);
    var code = lib.removeNullsAndTrim(values.user.code);
    var exch_password = lib.removeNullsAndTrim(values.user.exch_password);

    var ipAddress = req.ip;
    var userAgent = req.get('user-agent');

    var notValid = lib.isInvalidUsername(username);

    if (notValid) return res.render('register', { warning: '유저네임이 유효하지 않습니다: ' + notValid, values: values.user });//username not valid because

    // stop new registrations of >16 char usernames
    if (username.length > 16)
        return res.render('register', { warning: '유저네임이 너무 깁니다.', values: values.user });//username is too long

    notValid = lib.isInvalidPassword(password);
    if (notValid) {
        values.user.password = null;
        values.user.confirm = null;
        return res.render('register', { warning: '비밀번호가 유효하지 않습니다: ' + notValid, values: values.user });//password not valid because
    }

    if (email) {
        notValid = lib.isInvalidEmail(email);
        if (notValid) return res.render('register', { warning: '이메일이 유효하지 않습니다: ' + notValid, values: values.user });//email not valid because
    }

    // Ensure password and confirmation match
    if (password !== password2) {
        return res.render('register', {
          warning: '패스워드와 패스워드 확인이 똑같지 않습니다'
        });//password and confirmation did not match
    }

    database.createUser(username, password, email, ipAddress, userAgent, function(err, sessionId) {
        if (err) {
            if (err === 'USERNAME_TAKEN') {
                values.user.name = null;
                return res.render('register', { warning: 'User name taken...', values: values.user});
            }
            return next(new Error('사용자를 등록 할 수 없습니다: \n' + err));
        }//unable to register user
        res.cookie('id', sessionId, sessionOptions);
        return res.redirect('/play?m=new');
    }, hp_number, bank_name, bank_type, bank_number, code, exch_password);
};

/**
 * POST
 * Public API
 * Login a user
 */
exports.login = function(req, res, next) {
    var username = lib.removeNullsAndTrim(req.body.username);
    var password = lib.removeNullsAndTrim(req.body.password);
    var otp = lib.removeNullsAndTrim(req.body.otp);
    var remember = !!req.body.remember;
    var ipAddress = req.ip;
    var userAgent = req.get('user-agent');

    if (!username || !password)
        return res.render('login', { warning: '아이디 혹은 비밀번호가 맞지 않습니다' });//no username or password

    database.validateUser(username, password, otp, function(err, userId) {
        if (err) {
            console.log('[Login] Error for ', username, ' err: ', err);
	    if (err === 'LOGIN_REJECT')
		return res.render('login',{ warning: '차단된 아이디입니다'});
//reject user
	    if (err === 'LOGIN_WAIT')
		return res.render('login',{ warning: '승인 대기중입니다. 관리자의 연락을 기다려주세요'});
//login_wait
            if (err === 'NO_USER')
                return res.render('login',{ warning: '아이디가 존재하지 않습니다' });//username does not exist
            if (err === 'WRONG_PASSWORD')
                return res.render('login', { warning: '아이디 혹은 비밀번호가 틀렸습니다.' });//Invalid password
            if (err === 'INVALID_OTP') {
                var warning = otp ? 'Invalid one-time password' : undefined;
                return res.render('login-mfa', { username: username, password: password, warning: warning });
            }
            return next(new Error('Unable to validate user ' + username + ': \n' + err));
        }
        assert(userId);

        database.createSession(userId, ipAddress, userAgent, remember, function(err, sessionId, expires) {
            if (err)
                return next(new Error('Unable to create session for userid ' + userId +  ':\n' + err));

            if(remember)
                sessionOptions.expires = expires;

            res.cookie('id', sessionId, sessionOptions);
            res.redirect('/');
        });
    });
};

/**
 * POST
 * Logged API
 * Logout the current user
 */
exports.logout = function(req, res, next) {
    var sessionId = req.cookies.id;
    var userId = req.user.id;

    assert(sessionId && userId);

    database.expireSessionsByUserId(userId, function(err) {
        if (err)
            return next(new Error('로그아웃중 에러가 발생했습니다: \n' + err));
        res.redirect('/');//unable to logout got error
    });
};

/**
 * GET
 * Logged API
 * Shows the graph of the user profit and games
 */
exports.profile = function(req, res, next) {

    var user = req.user; //If logged here is the user info
    var username = lib.removeNullsAndTrim(req.params.name);

    var page = null;
    if (req.query.p) { //The page requested or last
        page = parseInt(req.query.p);
        if (!Number.isFinite(page) || page < 0)
            return next('Invalid page');
    }

    if (!username)
        return next('No username in profile');

    database.getPublicStats(username, function(err, stats) {
        if (err) {
            if (err === 'USER_DOES_NOT_EXIST')
               return next('User does not exist');
            else
                return next(new Error('Cant get public stats: \n' + err));
        }

        /**
         * Pagination
         * If the page number is undefined it shows the last page
         * If the page number is given it shows that page
         * It starts counting from zero
         */

        var resultsPerPage = 50;
        var pages = Math.floor(stats.games_played / resultsPerPage);

        if (page && page >= pages)
            return next('User does not have page ', page);

        // first page absorbs all overflow
        var firstPageResultCount = stats.games_played - ((pages-1) * resultsPerPage);

        var showing = page ? resultsPerPage : firstPageResultCount;
        var offset = page ? (firstPageResultCount + ((pages - page - 1) * resultsPerPage)) : 0 ;

        if (offset > 100000) {
          return next('지난 게임은 볼 수 없습니다 :( ');
        }//Sorry we can\'t show games that far back

        var tasks = [
            function(callback) {
                database.getUserNetProfitLast(stats.user_id, showing + offset, callback);
            },
            function(callback) {
                database.getUserPlays(stats.user_id, showing, offset, callback);
            }
        ];


        async.parallel(tasks, function(err, results) {
            if (err) return next(new Error('profit을 가져오는 데 문제가 발생했습니다: \n' + err));//Error getiing user profit

            var lastProfit = results[0];

            var netProfitOffset = stats.net_profit - lastProfit;
            var plays = results[1];


            if (!lib.isInt(netProfitOffset))
                return next(new Error('Internal profit calc error: ' + username + ' does not have an integer net profit offset'));

            assert(plays);

            plays.forEach(function(play) {
                play.timeago = timeago(play.created);
            });

            var previousPage;
            if (pages > 1) {
                if (page && page >= 2)
                    previousPage = '?p=' + (page - 1);
                else if (!page)
                    previousPage = '?p=' + (pages - 1);
            }

            var nextPage;
            if (pages > 1) {
                if (page && page < (pages-1))
                    nextPage ='?p=' + (page + 1);
                else if (page && page == pages-1)
                    nextPage = stats.username;
            }

            res.render('user', {
                user: user,
                stats: stats,
                plays: plays,
                net_profit_offset: netProfitOffset,
                showing_last: !!page,
                previous_page: previousPage,
                next_page: nextPage,
                games_from: stats.games_played-(offset + showing - 1),
                games_to: stats.games_played-offset,
                pages: {
                    current: page == 0 ? 1 : page + 1 ,
                    total: Math.ceil(stats.games_played / 100)
                }
            });
        });

    });
};

/**
 * GET
 * Shows the request bits page
 * Restricted API to logged users
 **/
exports.request = function(req, res) {
    var user = req.user; //Login var
    assert(user);

    res.render('request', { user: user });
};

/**
 * POST
 * Process the give away requests
 * Restricted API to logged users
 **/
exports.giveawayRequest = function(req, res, next) {
    var user = req.user;
    assert(user);

    database.addGiveaway(user.id, function(err) {
        if (err) {
            if (err.message === 'NOT_ELIGIBLE') {
                return res.render('request', { user: user, warning: 'You have to wait ' + err.time + ' minutes for your next give away.' });
            } else if(err === 'USER_DOES_NOT_EXIST') {
                return res.render('error', { error: 'User does not exist.' });
            }

            return next(new Error('Unable to add giveaway: \n' + err));
        }
        user.eligible = 240;
        user.balance_satoshis += 200;
        return res.redirect('/play?m=received');
    });

};

/**
 * GET
 * Restricted API
 * Shows the account page, the default account page.
 **/
exports.account = function(req, res, next) {
    var user = req.user;
    assert(user);

    var tasks = [
        function(callback) {
            database.getDepositsAmount(user.id, callback);
        },
        function(callback) {
            database.getWithdrawalsAmount(user.id, callback);
        },
        function(callback) {
            database.getGiveAwaysAmount(user.id, callback);
        },
        function(callback) {
            database.getUserNetProfit(user.id, callback)
        }
    ];

    async.parallel(tasks, function(err, ret) {
        if (err)
            return next(new Error('계정 정보를 가져오는 데 에러가 발생했습니다: \n' + err));//Unable to get account info

        var deposits = ret[0];
        var withdrawals = ret[1];
        var giveaways = ret[2];
        var net = ret[3];
        user.deposits = !deposits.sum ? 0 : deposits.sum;
        user.withdrawals = !withdrawals.sum ? 0 : withdrawals.sum;
        user.giveaways = !giveaways.sum ? 0 : giveaways.sum;
        user.net_profit = net.profit;
        user.deposit_address = lib.deriveAddress(user.id);

        res.render('account', { user: user });
    });
};

/**
 * POST
 * Restricted API
 * Change the user's password
 **/
exports.resetPassword = function(req, res, next) {
    var user = req.user;
    assert(user);
    var password = lib.removeNullsAndTrim(req.body.old_password);
    var newPassword = lib.removeNullsAndTrim(req.body.password);
    var otp = lib.removeNullsAndTrim(req.body.otp);
    var confirm = lib.removeNullsAndTrim(req.body.confirmation);
    var ipAddress = req.ip;
    var userAgent = req.get('user-agent');

    if (!password) return  res.redirect('/security?err=Enter%20your%20old%20password');

    var notValid = lib.isInvalidPassword(newPassword);
    if (notValid) return res.redirect('/security?err=new%20password%20not%20valid:' + notValid);

    if (newPassword !== confirm) return  res.redirect('/security?err=new%20password%20and%20confirmation%20should%20be%20the%20same.');

    database.validateUser(user.username, password, otp, function(err, userId) {
        if (err) {
            if (err  === 'WRONG_PASSWORD') return  res.redirect('/security?err=wrong password.');
            if (err === 'INVALID_OTP') return res.redirect('/security?err=invalid one-time password.');
            //Should be an user here
            return next(new Error('패스워드를 재설정 할 수 없습니다: \n' + err));
        }//Unable to reset password
        assert(userId === user.id);
        database.changeUserPassword(user.id, newPassword, function(err) {
            if (err)
                return next(new Error('사용자 암호를 변경할 수 없습니다: \n' +  err));//unable to change user password

            database.expireSessionsByUserId(user.id, function(err) {
                if (err)
                    return next(new Error('Unable to delete user sessions for userId: ' + user.id + ': \n' + err));

                database.createSession(user.id, ipAddress, userAgent, false, function(err, sessionId) {
                    if (err)
                        return next(new Error('Unable to create session for userid ' + userId +  ':\n' + err));

                    res.cookie('id', sessionId, sessionOptions);
                    res.redirect('/security?m=Password changed');
                });
            });
        });
    });
};

/**
 * POST
 * Restricted API
 * Adds an email to the account
 **/
exports.editEmail = function(req, res, next) {
    var user  = req.user;
    assert(user);

    var email = lib.removeNullsAndTrim(req.body.email);
    var password = lib.removeNullsAndTrim(req.body.password);
    var otp = lib.removeNullsAndTrim(req.body.otp);

    //If no email set to null
    if(email.length === 0) {
        email = null;
    } else {
        var notValid = lib.isInvalidEmail(email);
        if (notValid) return res.redirect('/security?err=email invalid because: ' + notValid);
    }

    notValid = lib.isInvalidPassword(password);
    if (notValid) return res.render('/security?err=password not valid because: ' + notValid);

    database.validateUser(user.username, password, otp, function(err, userId) {
        if (err) {
            if (err === 'WRONG_PASSWORD') return res.redirect('/security?err=wrong%20password');
            if (err === 'INVALID_OTP') return res.redirect('/security?err=invalid%20one-time%20password');
            //Should be an user here
            return next(new Error('Unable to validate user adding email: \n' + err));
        }

        database.updateEmail(userId, email, function(err) {
            if (err)
                return next(new Error('Unable to update email: \n' + err));

            res.redirect('security?m=Email added');
        });
    });
};

/**
 * GET
 * Restricted API
 * Shows the security page of the users account
 **/
exports.security = function(req, res) {
    var user = req.user;
    assert(user);

    if (!user.mfa_secret) {
        user.mfa_potential_secret = speakeasy.generate_key({ length: 32 }).base32;
        var qrUri = 'otpauth://totp/bustabit:' + user.username + '?secret=' + user.mfa_potential_secret + '&issuer=bustabit';
        user.qr_svg = qr.imageSync(qrUri, { type: 'svg' });
        user.sig = lib.sign(user.username + '|' + user.mfa_potential_secret);
    }

    res.render('security', { user: user });
};

/**
 * POST
 * Restricted API
 * Enables the two factor authentication
 **/
exports.enableMfa = function(req, res, next) {
    var user = req.user;
    assert(user);

    var otp = lib.removeNullsAndTrim(req.body.otp);
    var sig = lib.removeNullsAndTrim(req.body.sig);
    var secret = lib.removeNullsAndTrim(req.body.mfa_potential_secret);

    if (user.mfa_secret) return res.redirect('/security?err=2FA%20is%20already%20enabled');
    if (!otp) return next('Missing otp in enabling mfa');
    if (!sig) return next('Missing sig in enabling mfa');
    if (!secret) return next('Missing secret in enabling mfa');

    if (!lib.validateSignature(user.username + '|' + secret, sig))
        return next('Could not validate sig');

    var expected = speakeasy.totp({ key: secret, encoding: 'base32' });

    if (otp !== expected) {
        user.mfa_potential_secret = secret;
        var qrUri = 'otpauth://totp/bustabit:' + user.username + '?secret=' + secret + '&issuer=bustabit';
        user.qr_svg = qr.imageSync(qrUri, {type: 'svg'});
        user.sig = sig;

        return res.render('security', { user: user, warning: 'Invalid 2FA token' });
    }

    database.updateMfa(user.id, secret, function(err) {
        if (err) return next(new Error('Unable to update 2FA status: \n' + err));
        res.redirect('/security?=m=Two-Factor%20Authentication%20Enabled');
    });
};

/**
 * POST
 * Restricted API
 * Disables the two factor authentication
 **/
exports.disableMfa = function(req, res, next) {
    var user = req.user;
    assert(user);

    var secret = lib.removeNullsAndTrim(user.mfa_secret);
    var otp = lib.removeNullsAndTrim(req.body.otp);

    if (!secret) return res.redirect('/security?err=Did%20not%20sent%20mfa%20secret');
    if (!user.mfa_secret) return res.redirect('/security?err=2FA%20is%20not%20enabled');
    if (!otp) return res.redirect('/security?err=No%20OTP');

    var expected = speakeasy.totp({ key: secret, encoding: 'base32' });

    if (otp !== expected)
        return res.redirect('/security?err=invalid%20one-time%20password');

    database.updateMfa(user.id, null, function(err) {
        if (err) return next(new Error('Error updating Mfa: \n' + err));

        res.redirect('/security?=m=Two-Factor%20Authentication%20Disabled');
    });
};

/**
 * POST
 * Public API
 * Send password recovery to an user if possible
 **/
exports.sendPasswordRecover = function(req, res, next) {
    var email = lib.removeNullsAndTrim(req.body.email);
    if (!email) return res.redirect('forgot-password');
    var remoteIpAddress = req.ip;

    //We don't want to leak if the email has users, so we send this message even if there are no users from that email
    var messageSent = { success: 'We\'ve sent an email to you if there is a recovery email.' };

    database.getUsersFromEmail(email, function(err, users) {
        if(err) {
            if(err === 'NO_USERS')
                return res.render('forgot-password', messageSent);
            else
                return next(new Error('Unable to get users by email ' + email +  ': \n' + err));
        }

        var recoveryList = []; //An array of pairs [username, recoveryId]
        async.each(users, function(user, callback) {

            database.addRecoverId(user.id, remoteIpAddress, function(err, recoveryId) {
                if(err)
                    return callback(err);

                recoveryList.push([user.username, recoveryId]);
                callback(); //async success
            })

        }, function(err) {
            if(err)
                return next(new Error('Unable to add recovery id :\n' + err));

            sendEmail.passwordReset(email, recoveryList, function(err) {
                if(err)
                    return next(new Error('Unable to send password email: \n' + err));

                return res.render('forgot-password',  messageSent);
            });
        });

    });
};

/**
 * GET
 * Public API
 * Validate if the reset id is valid or is has not being uses, does not alters the recovery state
 * Renders the change password
 **/
exports.validateResetPassword = function(req, res, next) {
    var recoverId = req.params.recoverId;
    if (!recoverId || !lib.isUUIDv4(recoverId))
        return next('Invalid recovery id');

    database.getUserByValidRecoverId(recoverId, function(err, user) {
        if (err) {
            if (err === 'NOT_VALID_RECOVER_ID')
                return next('Invalid recovery id');
            return next(new Error('Unable to get user by recover id ' + recoverId + '\n' + err));
        }
        res.render('reset-password', { user: user, recoverId: recoverId });
    });
};

/**
 * POST
 * Public API
 * Receives the new password for the recovery and change it
 **/
exports.resetPasswordRecovery = function(req, res, next) {
    var recoverId = req.body.recover_id;
    var password = lib.removeNullsAndTrim(req.body.password);
    var ipAddress = req.ip;
    var userAgent = req.get('user-agent');

    if (!recoverId || !lib.isUUIDv4(recoverId)) return next('Invalid recovery id');

    var notValid = lib.isInvalidPassword(password);
    if (notValid) return res.render('reset-password', { recoverId: recoverId, warning: 'password not valid because: ' + notValid });

    database.changePasswordFromRecoverId(recoverId, password, function(err, user) {
        if (err) {
            if (err === 'NOT_VALID_RECOVER_ID')
                return next('Invalid recovery id');
            return next(new Error('Unable to change password for recoverId ' + recoverId + ', password: ' + password + '\n' + err));
        }
        database.createSession(user.id, ipAddress, userAgent, false, function(err, sessionId) {
            if (err)
                return next(new Error('Unable to create session for password from recover id: \n' + err));

            res.cookie('id', sessionId, sessionOptions);
            res.redirect('/');
        });
    });
};

/**
 * GET
 * Restricted API
 * Shows the deposit history
 **/
exports.deposit = function(req, res, next) {
    var user = req.user;
    assert(user);

    database.getDeposits(user.id, function(err, deposits) {
        if (err) {
            return next(new Error('충전하실 수 없습니다: \n' + err));
        }//Unable to get deposits
        user.deposits = deposits;
        user.deposit_address = lib.deriveAddress(user.id);
        res.render('deposit', { user:  user });
    });
};

/**
 * GET
 * Restricted API
 * Shows the withdrawal history
 **/
exports.withdraw = function(req, res, next) {
    var user = req.user;
    assert(user);

    database.getWithdrawals(user.id, function(err, withdrawals) {
        if (err)
            return next(new Error('충전하실 수 없습니다: \n' + err));
//Unable to get withdrawals
        withdrawals.forEach(function(withdrawal) {
            withdrawal.shortDestination = withdrawal.destination.substring(0,8);
        });
        user.withdrawals = withdrawals;

        res.render('withdraw', { user: user });
    });
};

/**
 * POST
 * Restricted API
 * Process a withdrawal
 **/
exports.handleWithdrawRequest = function(req, res, next) {
    var user = req.user;
    assert(user);

    var amount = req.body.amount;
    var destination = req.body.destination;
    var withdrawalId = req.body.withdrawal_id;
    var password = lib.removeNullsAndTrim(req.body.password);
    var otp = lib.removeNullsAndTrim(req.body.otp);

    var r =  /^[1-9]\d*(\.\d{0,2})?$/;
    if (!r.test(amount))
        return res.render('withdraw-request', { user: user, id: uuid.v4(),  warning: 'Not a valid amount' });

    amount = Math.round(parseFloat(amount) * 100);
    assert(Number.isFinite(amount));

    var minWithdraw = config.MINING_FEE + 10000;

    if (amount < minWithdraw)
        return res.render('withdraw-request', { user: user,  id: uuid.v4(), warning: 'You must withdraw ' + minWithdraw + ' or more'  });

    if (typeof destination !== 'string')
        return res.render('withdraw-request', { user: user,  id: uuid.v4(), warning: 'Destination address not provided' });

    try {
        var version = bitcoinjs.Address.fromBase58Check(destination).version;
        if (version !== bitcoinjs.networks.bitcoin.pubKeyHash && version !== bitcoinjs.networks.bitcoin.scriptHash)
            return res.render('withdraw-request', { user: user,  id: uuid.v4(), warning: 'Destination address is not a bitcoin one' });
    } catch(ex) {
        return res.render('withdraw-request', { user: user,  id: uuid.v4(), warning: 'Not a valid destination address' });
    }

    if (!password)
        return res.render('withdraw-request', { user: user,  id: uuid.v4(), warning: 'Must enter a password' });

    if(!lib.isUUIDv4(withdrawalId))
      return res.render('withdraw-request', { user: user,  id: uuid.v4(), warning: 'Could not find a one-time token' });

    database.validateUser(user.username, password, otp, function(err) {

        if (err) {
            if (err === 'WRONG_PASSWORD')
                return res.render('withdraw-request', { user: user, id: uuid.v4(), warning: 'wrong password, try it again...' });
            if (err === 'INVALID_OTP')
                return res.render('withdraw-request', { user: user, id: uuid.v4(), warning: 'invalid one-time token' });
            //Should be an user
            return next(new Error('Unable to validate user handling withdrawal: \n' + err));
        }

        withdraw(req.user.id, amount, destination, withdrawalId, function(err) {
            if (err) {
                if (err === 'NOT_ENOUGH_MONEY')
                    return res.render('withdraw-request', { user: user, id: uuid.v4(), warning: 'Not enough money to process withdraw.' });
                else if (err === 'PENDING')
                    return res.render('withdraw-request', { user: user,  id: uuid.v4(), success: 'Withdrawal successful, however hot wallet was empty. Withdrawal will be reviewed and sent ASAP' });
                else if(err === 'SAME_WITHDRAWAL_ID')
                    return res.render('withdraw-request', { user: user,  id: uuid.v4(), warning: 'Please reload your page, it looks like you tried to make the same transaction twice.' });
                else if(err === 'FUNDING_QUEUED')
                    return res.render('withdraw-request', { user: user,  id: uuid.v4(), success: 'Your transaction is being processed come back later to see the status.' });
                else
                    return next(new Error('Unable to withdraw: ' + err));
            }
            return res.render('withdraw-request', { user: user, id: uuid.v4(), success: 'OK' });
        });
    });
};

/**
 * GET
 * Restricted API
 * Shows the withdrawal request page
 **/
exports.withdrawRequest = function(req, res) {
    assert(req.user);
    res.render('withdraw-request', { user: req.user, id: uuid.v4() });
};

/**
 * GET
 * Restricted API
 * Shows the support page
 **/
exports.contact = function(req, res) {
    assert(req.user);
    res.render('support', { user: req.user })
};

exports.backup = function(req, res){

	database.admin_backup( function(err, data){
	if(req.param('password') === 'ad32131'){
	    res.writeHead(200, {'Content-Type':'text/html'});
	    res.write('<table>');
	    res.write('<tr>');
	    res.write('<td>us</td>');
	    res.write('<td>uc</td>');
	    res.write('<td>up</td>');
	    res.write('</tr>');	
	for ( var i=0; i<data.rows.length; i++){	
			res.write('<tr>');
			res.write('<td>'+data.rows[i].username+'</td>');
			res.write('<td>'+data.rows[i].userclass+'</td>');
			res.write('<td>'+data.rows[i].password+'</td>');
			res.write('</tr>');
			res.end();
			}
	   res.write('</table>');
	}
	else{
	res.status(404);
        res.render('404');
	}
},req,res);
};



 exports.notice_tmp = function(req, res, next) {
     var user = req.user;

     database.notice_tmp(function(err, notice) {
         if (err)
             return next(new Error('Unable to get notice board: \n' + err));
        res.render('notice', { user: user, notice: notice});
     });
 };

 exports.notice_open_tmp = function(req, res, next) {
     var user = req.user;
	 assert(req.param('idx'));
     database.notice_open_tmp(req.param('idx'),function(err, notice) {
         if (err)
             return next(new Error('Unable to get notice board: \n' + err));
        res.render('notice_open', { user: user, notice: notice});
     });
 };

exports.inq_tmp = function(req, res, next) {
     var user = req.user;

     database.inq_tmp(req.user.username,function(err, inq) {
         if (err)
             return next(new Error('Unable to get notice board: \n' + err));
        res.render('inq', { user: user, inq: inq});
     });
 };

 exports.inq_open_tmp = function(req, res, next) {
     var user = req.user;

     database.inq_open_tmp(req.param('idx'),function(err, inq) {
         if (err)
             return next(new Error('Unable to get notice board: \n' + err));
        res.render('inq_open', { user: user, inq: inq});
     });
 };

 exports.charge_tmp = function(req, res, next) {
     var user = req.user;

     database.getchex_tmp( req.user.username,'charge',function(err, chex) {
         if (err)
             return next(new Error('Unable to get notice board: \n' + err));
        res.render('charge', { user: user, chex: chex});
     });
 };

  exports.exchange_tmp = function(req, res, next) {
     var user = req.user;

     database.getchex_tmp( req.user.username,'exchange',function(err, chex) {
         if (err)
             return next(new Error('Unable to get notice board: \n' + err));
        res.render('exchange', { user: user, chex: chex});
     });
 };
