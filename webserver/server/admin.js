var assert = require('assert');
var async = require('async');
var database = require('./database');
var config = require('../config/config');
var rel;
var fs;

var data;
var result2;
var profit1;
var username1;
var userack1

var username;
var password;
var balance_satoshis;
var userclass;
var hp_number;
var bank_name;
var bank_type;
var bank_number;
var code;
/**
 * The req.user.admin is inserted in the user validation middleware
 */

var menu_text = new Array();
menu_text[0] = "유저관리";
menu_text[1] = "충전관리";
menu_text[2] = "환전관리";
menu_text[3] = "충전기록";
menu_text[4] = "환전기록";
menu_text[5] = "총수익";
menu_text[6] = "공지사항";
menu_text[7] = "1:1문의";

var menu_url = new Array();
menu_url[0] = "./admin_usercon";
menu_url[1] = "./admin_charge";
menu_url[2] = "./admin_exchange";
menu_url[3] = "./admin_ch_log";
menu_url[4] = "./admin_ex_log";
menu_url[5] = "./admin_log";
menu_url[6] = "./admin_notice";
menu_url[7] = "./admin_inq_board";

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

        res.write("table.type10 {-webkit-box-sizing:border-box;  border-top:#ccc solid 0px; border-bottom:#ccc solid 1px; border-left:#ccc solid 1px; border-right:#ccc solid 1px; border-collapse: collapse;text-align: left;line-height: 1.5; width:100%;  margin: 20px 0px;}");
        res.write("table.type10 thead th {width: 150px;padding: 5px;font-weight: bold; font-size:14; line-height:1.5; vertical-align: top;color: #FFF; background:#373636; }");
        res.write("table.type10 tbody th {width: 200px; padding: 5px;}");
        res.write("table.type10 td { box-sizing:border-box; border-right:1px solid #F0F2F4; border-bottom:1px solid #ccc; border-left:0px; margin: 0px; width : 0px; padding: 5px;vertical-align: top;}");
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

function div_left(res){
res.write("<div id=\"menu\" style=\"border:1px solid #ccc; background-color:#373636; padding: 5px 5px; float:left;\">");

for(i=0; i<menu_text.length; i++){

res.write("<a href=\"");
res.write(menu_url[i]);
res.write("\" style=\"box-sizing: border-box; color: rgb(255, 255, 255);  text-decoration: none;  border-radius: 0px !important; text-shadow: none; /*display: block;*/ position: relative; margin: 0px; border: 0px; padding: 0px; font-size: 30px; font-weight: 300;\">");
res.write("<i class=\"icon-settings\" style=\"box-sizing: border-box; font-family: Simple-Line-Icons; speak: none; font-style: normal; font-weight: 400; font-variant-ligatures: normal; font-variant-caps: normal; text-transform: none; line-height: 14px; -webkit-font-smoothing: antialiased; display: inline-block; width: 1.25em; text-align: center; top: 1px; position: relative; font-size: 0px; margin-right: 0px; text-shadow: none; color: rgb(107, 120, 139); margin-left: 0px;\">");
res.write("</i><span>&nbsp;</span><span class=\"title\" style=\"box-sizing: border-box; border-radius: 0px !important;\">");

res.write(menu_text[i]);

res.write("</span><span class=\"arrow\" style=\"box-sizing: border-box; border-radius: 0px !important;\"></span></a>");


}

res.write("</div>");
}



exports.admin_inq_update = function(req, res){
    var user = req.user;
    assert(user.admin);
	

    res.writeHead(200, {'Content-Type':'text/html'});
	
	database.admin_inq_update0(req.param('idx'), req.param('reply'), function(err,data) {
							
							res.write('<script>');

							res.write('location.href=\"./admin_inq_board\"');
							res.write('</script>');
	 return	res.end();
	});
};

exports.admin_inq_update0 = function(req, res){
    var user = req.user;
    assert(user.admin);
	
	

    res.writeHead(200, {'Content-Type':'text/html'});

	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>문의내용답변</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"문의내용답변");
	div_left(res);
	div_content1(res);
	div_content2(res);	
	
	table_style(res);	
	
	res.write("<table class=\"type10\">");
		
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">"+req.param('content')+"의 문의내용답변</th>");
	res.write("</tr>");
	res.write("</thead>");
	
	res.write("<tbody>");
	        //res.write("<tr>"+req.param('content')+"</tr>");
			res.write("<form action=\"./admin_inq_update\" method=\"post\" id=\"inq_update\">");
			res.write("<tr>")
		res.write("<td>");
        	res.write("<textarea rows=\"5\" form=\"inq_update\" cols=\"100\" name=\"reply\">");
		res.write("</textarea>");
		res.write("</td>");
        	res.write("</tr>");
        	res.write("</thead>");
        	res.write("<tbody>");
            res.write("<tr>");

        	res.write("<input type=\"hidden\" name=\"idx\" value=\""+req.param('idx')+"\" /> ");			
        	res.write("</tr>");
			res.write('</tbody>');
			res.write('</table>');
        	res.write("<input type=\"submit\" value=\"수정완료\" /> ");			
			res.write('</form>');
		

		res.write('</body>');
		res.write('</html>');
		res.end();
};

exports.admin_inq_delete0 = function(req, res){
    var user = req.user;
    assert(user.admin);
	

    res.writeHead(200, {'Content-Type':'text/html'});
	
	database.admin_inq_delete0(req.param('idx'), function(err,data) {
							
							res.write('<script>');

							res.write('location.href=\"./admin_inq_board\"');
							res.write('</script>');
	 return	res.end();
	});
};


exports.admin_inq_board = function(req, res){
	var user = req.user;
	
	assert(user.admin);

	res.writeHead(200, {'Content-Type':'text/html'});

	database.admin_inq_board( function(err,data) { 

	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>1:1문의</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"1:1문의");
	div_left(res);
	div_content1(res);
	div_content2(res);	
	
	table_style(res);	
	
	res.write("<table class=\"type10\">");
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">문의번호</th>");
	res.write("<th scope=\"cols\">문의제목</th>");
	res.write("<th scope=\"cols\">문의날짜</th>");
	res.write("<th scope=\"cols\">문의작성자</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");
	
	
	for ( var i=0; i<data.rows.length; i++){	
			res.write('<tr>');
		
		res.write('<td>'+data.rows[i].idx+'</td>');	
		res.write('<td><a href=\"./admin_inq_board_open?idx='+data.rows[i].idx+'\">'+data.rows[i].title+'</a></td>');	
		res.write('<td>'+data.rows[i].date.format("yyyy년 MM년 dd일 a/p hh시 mm분 ss초")+'</td>');
		res.write('<td>'+data.rows[i].owner+'</td>');
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

exports.admin_inq_board_open = function(req, res){
	var user = req.user;
	
	assert(user.admin);
	assert(req.param('idx'));

	res.writeHead(200, {'Content-Type':'text/html'});

	database.admin_inq_board_open( req.param('idx'), function(err,data) { 

	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>1:1문의</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"1:1문의");
	div_left(res);
	div_content1(res);
	div_content2(res);
	
	
	table_style(res);	
	
	res.write("<table class=\"type10\">");
	
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
		
/*디자인을 위해 밑쪽으로 붙임. 수정전 원본
	res.write("<form action=\"./admin_inq_update0\" method=\"post\" />");
	res.write("<input type=\"hidden\" name=\"idx\" value=\""+data.rows[0].idx+"\" /> ");	
	res.write("<input type=\"hidden\" name=\"title\" value=\""+data.rows[0].title+"\" /> ");
	res.write("<input type=\"hidden\" name=\"content\" value=\""+data.rows[0].content+"\" /> ");
	res.write("<input type=\"submit\" value=\"문의답장\" />");
	res.write("</form>");
	
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

//kaguya

	
	res.write("<form action=\"./admin_inq_update0\" method=\"post\" />");
	res.write("<input type=\"hidden\" name=\"idx\" value=\""+data.rows[0].idx+"\" /> ");	
	
	res.write("<input type=\"hidden\" name=\"title\" value=\""+data.rows[0].title+"\" /> ");
	res.write("<input type=\"hidden\" name=\"content\" value=\""+data.rows[0].content+"\" /> ");


	res.write("<input type=\"submit\" value=\"문의답장\" />");

	res.write("</form>");
	

	res.write("<form action=\"./admin_inq_delete0\" method=\"post\" />");
	res.write("<input type=\"hidden\" name=\"idx\" value=\""+data.rows[0].idx+"\" /> ");
	
	res.write("<input type=\"submit\" value=\"문의삭제\" />");
	res.write("</form>");	


	div_content2(res);

	res.write('</body>');
	res.write('</html>');
	res.end();

},req,res);

//at1
//	res.render('admin_master', {user: user});
};

//att1

exports.admin_notice_delete0 = function(req, res){
	var user = req.user;
	assert(user.admin);
	
    res.writeHead(200, {'Content-Type':'text/html'});
    database.admin_notice_delete0(req.param('idx'), function(err, data){
	res.write('<script>');
	res.write('location.href=\"./admin_notice\"');
	res.write('</script>');
	if(err) return res.end();
	else{ res.end();}
});
}


exports.admin_notice_insert0 = function(req, res){
	var user = req.user;
	assert(user.admin);
	
    res.writeHead(200, {'Content-Type':'text/html'});
    database.admin_notice_insert0( req.param('title'),req.param('content'), function(err, data){
	res.write('<script>');
	res.write('location.href=\"./admin_notice\"');
	res.write('</script>');
	if(err) return res.end();
	else{ res.end();}
});
};


exports.admin_notice_insert = function(req, res){
    var user = req.user;
    assert(user.admin);
	

    res.writeHead(200, {'Content-Type':'text/html'});
	
	
							
	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>공지사항</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"공지사항");
	div_left(res);
	div_content1(res);
	div_content2(res);
	
	table_style(res);
	res.write("<table class=\"type10\">");	
	res.write('<form action=\"./admin_notice_insert0\" method=\"post\" id=\"inform\">');						
	res.write("<th>공지제목:<input type=\"text\" size=\"100\" name=\"title\" maxlength=\"50\"/> </th>");
	res.write("<tbody>");
	res.write('<tr>');
		
	res.write("<td><h3>공지내용</h3>");
	res.write("<textarea rows=\"5\" form=\"inform\"  cols=\"100\" name=\"content\">");
	res.write("</textarea>");
	res.write("</td>");
	/*res.write("<td>공지내용:<input type=\"text\"  name=\"content\"/> </td>");*/
	res.write('</tr>');
	res.write('</tbody>');
	res.write('</table>');
	res.write('<input type=\"submit\" value=\"글생성\"/>');
	res.write('</form>');






res.write('</body>');
res.write('</html>');
res.end();
	 return	res.end();
	
};

exports.admin_notice_update = function(req, res){
    var user = req.user;
    assert(user.admin);
	

    res.writeHead(200, {'Content-Type':'text/html'});
	
	database.admin_notice_update(req.param('idx'), req.param('title'), req.param('content'), function(err,data) {
							
							res.write('<script>');

							res.write('location.href=\"./admin_notice\"');
							res.write('</script>');
	 return	res.end();
	});
};

exports.admin_notice_update0 = function(req, res){
    var user = req.user;
    assert(user.admin);
	
	

    res.writeHead(200, {'Content-Type':'text/html'});

	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>공지사항</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"공지사항");
	div_left(res);
	div_content1(res);
	div_content2(res);	
	
	table_style(res);	
	
	res.write("<table class=\"type10\">");
			res.write("<form action=\"./admin_notice_update\" method=\"post\" id=\"inform2\">");

        	res.write("<th>공지제목:<input type=\"text\" size=\"100\" name=\"title\" value=\""+req.param('title')+"\" /> ");
        	res.write("</tr>");
        	res.write("<tbody>");
            res.write("<tr>");
        	res.write("<td><h3>공지내용</h3>")
		res.write("<textarea rows=\"5\" form=\"inform2\" cols=\"100\" name=\"content\"/>"+req.param('content')+"</textarea>");
		res.write("</textarea>");
		res.write("</td>");
        	res.write("<input type=\"hidden\" name=\"idx\" value=\""+req.param('idx')+"\" /> ");			
        	res.write("</tr>");
			res.write('</tbody>');
			res.write('</table>');
        	res.write("<input type=\"submit\" value=\"수정완료\" /> ");			
			res.write('</form>');
			

		res.write('</body>');
		res.write('</html>');
		res.end();
};


exports.admin_notice_open = function(req, res){
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

div_header(res,"공지사항");
div_left(res);
div_content1(res);
div_content2(res);

table_style(res);	

res.write("<table class=\"type10\">");

if(err) return res.end();	
if(err === 'NO_USERS') return res.end();

	res.write("<thead>");
	res.write("<tr>");
	/*res.write("<th scope=\"cols\">"+data.rows[0].idx+"</th>")*/
	//res.write("<th scope=\"cols\">"+data.rows[0].title+"</th>");
	/*res.write("<th scope=\"cols\">"+data.rows[0].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+"</th>");*/
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");

	res.write('<tr>');
	res.write("<td>"+data.rows[0].title+"</td>");
	res.write('</tr>');
	res.write('<tr>');
	res.write('<td  style=\"white-space : pre-wrap;\" \"text-align:left; vertical-align:top\">'+data.rows[0].content+'</td>');
	res.write('</tr>');
	res.write('</tbody>');
	res.write('</table>');

	res.write("<form action=\"./admin_notice_update0\" method=\"post\" />");	
	res.write("<input type=\"hidden\" name=\"idx\" value=\""+data.rows[0].idx+"\" /> ");	

	res.write("<input type=\"hidden\" name=\"title\" value=\""+data.rows[0].title+"\" /> ");

res.write("<input type=\"hidden\" name=\"content\" value=\""+data.rows[0].content+"\" /> ");

res.write("<input type=\"submit\" value=\"글수정\" />");
res.write("</form>");

res.write("<form action=\"./admin_notice_delete0\" method=\"post\" />");
res.write("<input type=\"hidden\" name=\"idx\" value=\""+data.rows[0].idx+"\" /> ");
res.write("<input type=\"submit\" value=\"글삭제\" />");
res.write("</form>");	

//res.write('</tbody>');
//res.write('</table>');


res.write('</body>');
res.write('</html>');
res.end();

},req,res);

//at1
//	res.render('admin_master', {user: user});
};

//att

exports.admin_notice = function(req, res){
var user = req.user;

assert(user.admin);

//	res.writeHead(200, {'Content-Type':'text/html'});

database.admin_notice( function(err,data) { 

res.write("<html><head>");
res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
res.write("<title>공지사항</title>");
res.write("</head>");
res.write("<body>");

div_header(res,"공지사항");
div_left(res);
div_content1(res);
div_content2(res);

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
	res.write('<td><a href=\"./admin_notice_open?idx='+data.rows[i].idx+'\">'+data.rows[i].title+'</a></td>');	
	res.write('<td>'+data.rows[i].date.format("yyyy년 MM월 dd일 a/p hh시 mm분 ss초")+'</td>');
	res.write('</tr>');

}



res.write('</tbody>');
res.write('</table>');
res.write('<form action=\"./admin_notice_insert\" method=\"get\">');
res.write('<input type=\"submit\" value=\"글쓰기\" />');
res.write('</form>');


res.write('</body>');
res.write('</html>');
res.end();

},req,res);

//at1
//	res.render('admin_master', {user: user});
};

exports.admin_log = function(req, res){
var user = req.user;
var user_all_ch = 0;
var user_all_ex = 0 ;
var user_all_money = 0;
assert(user.admin);

//	res.writeHead(200, {'Content-Type':'text/html'});

database.getUserAllAdmin( function(err,data) { 
	if(err === 'NO_USERS') 
		return res.render('유저가 존재하지 않습니다.', messageSent);

res.write("<html><head>");
res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
res.write("<title>유저관리</title>");
res.write("</head>");
res.write("<body>");

div_header(res,"유저관리");
div_left(res);
div_content1(res);
div_content2(res);

table_style(res);	

res.write("<table class=\"type10\">");
res.write("<thead>");
res.write("<tr>");
res.write("<th scope=\"cols\">그래프회원총충전금액</th>");
res.write("<th scope=\"cols\">그래프회원총환전금액</th>");
res.write("<th scope=\"cols\">그래프회원총보유금액</th>");
res.write("<th scope=\"cols\">그래프사총회원수</th>");
res.write("<th scope=\"cols\">그래프사총수익</th>");
res.write("</tr>");
res.write("</thead>");
res.write("<tbody>");


for ( var i=0; i<data.rows.length; i++){	
	user_all_ch = user_all_ch + parseInt(data.rows[i].all_charge_money);
	user_all_ex = user_all_ex + parseInt(data.rows[i].all_exch_money);
	user_all_money = user_all_money + parseInt(data.rows[i].balance_satoshis);

}

	profit1 = (- parseInt(user_all_ch) + parseInt(user_all_money) + parseInt(user_all_ex))*-1;
	res.write('<tr>');
	
	res.write('<td>'+user_all_ch.formatwon()+'</td>');	
	res.write('<td>'+user_all_ex.formatwon()+'</td>');	
	res.write('<td>'+user_all_money.formatwon()+'</td>');
	res.write('<td>'+data.rows.length+'</td>');		
	res.write('<td>'+profit1.formatwon()+'</td>');

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
exports.admin_ex_log = function(req, res){
var user = req.user;
assert(user.admin);

res.writeHead(200, {'Content-Type':'text/html'});

database.getex_log( function(err, data){

//	if(err === 'NO_LOG'){
//		console.log(err);
// 		res.write('NOT LOG');
//		return	res.end();
//		}
res.write("<html><head>");
res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");

res.write("<title>환전기록페이지</title>");
res.write("</head>");
res.write("<body>");

div_header(res,"환전기록");
div_left(res);
div_content1(res);	
div_content2(res);
table_style(res);

res.write("<table class=\"type10\">");
res.write("<thead>");
res.write("<tr>");
res.write("<th scope=\"cols\">회원아이디</th>");
res.write("<th scope=\"cols\">환전요청금액</th>");
res.write("<th scope=\"cols\">환전요청날짜</th>");
res.write("<th scope=\"cols\">환전상태</th>");
res.write("</tr>");
res.write("</thead>");
res.write("<tbody>");	

res.write("<tr>");

for ( var i=0; i<data.rows.length; i++){	
res.write('<tr>');

res.write('<td>'+data.rows[i].username+'</td>');
res.write('<td>'+data.rows[i].amount+'</td>');
res.write('<td>'+data.rows[i].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+'</td>');
res.write('<td>'+data.rows[i].status+'</td>');
res.write('</tr>');

}

res.write("</tbody>");
res.write("</table>");
res.write('</body>');
res.write('</html>');
res.end();
});
}

exports.admin_ch_log = function(req, res){
var user = req.user;
assert(user.admin);

res.writeHead(200, {'Content-Type':'text/html'});

database.getch_log( function(err, data){

//	if(err === 'NO_LOG'){
//		console.log(err);
// 		res.write('NOT LOG');
//		return	res.end();
//		}
res.write("<html><head>");
res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");

res.write("<title>충전기록페이지</title>");
res.write("</head>");
res.write("<body>");

div_header(res,"충전기록");
div_left(res);
div_content1(res);	
div_content2(res);
table_style(res);

res.write("<table class=\"type10\">");
res.write("<thead>");
res.write("<tr>");
res.write("<th scope=\"cols\">회원아이디</th>");
res.write("<th scope=\"cols\">충전요청금액</th>");
res.write("<th scope=\"cols\">충전요청날짜</th>");
res.write("<th scope=\"cols\">충전상태</th>");
res.write("</tr>");
res.write("</thead>");
res.write("<tbody>");	

res.write("<tr>");

for ( var i=0; i<data.rows.length; i++){	
res.write('<tr>');

res.write('<td>'+data.rows[i].username+'</td>');
res.write('<td>'+data.rows[i].amount+'</td>');
res.write('<td>'+data.rows[i].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+'</td>');
res.write('<td>'+data.rows[i].status+'</td>');
res.write('</tr>');

}

res.write('</body>');
res.write('</html>');
res.end();
});
}

exports.chex_action = function(req, res){
var user = req.user;
assert(user.admin);

res.writeHead(200, {'Content-Type':'text/html'});




database.chex_action(req.param('username'), req.param('type'), req.param('amount')  ,function(err,data) {
	if (err) {
					if( req.param('type') === 'charge'){
						res.write('<script>');
							res.write('location.href=\"./admin_charge\"');
							res.write('</script>');
							res.write('err');
							res.end();
							}
                        
						if( req.param('type') === 'exchange'){
							res.write('<script>');
							res.write('location.href=\"./admin_exchange\"');
							res.write('</script>');
							res.end();
							}
                        
                

}
});

};

exports.admin_exchange = function(req, res){
	var user = req.user;
	assert(user.admin);
	
	res.writeHead(200, {'Content-Type':'text/html'});

	database.getchex('exchange', function(err, data){

//	if(err === 'NO_LOG'){
//		console.log(err);
// 		res.write('NOT LOG');
//		return	res.end();
//		}
	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");

	res.write("<title>환전페이지</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"환전관리");
	div_left(res);
	div_content1(res);	
	div_content2(res);	
	table_style(res);

	res.write("<table class=\"type10\">");
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">회원아이디</th>");
	res.write("<th scope=\"cols\">환전요청금액</th>");
	res.write("<th scope=\"cols\">환전 요청날짜</th>");
	res.write("<th scope=\"cols\">환전 수락</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");	
	
	res.write("<tr>");

	for ( var i=0; i<data.rows.length; i++){	
	res.write('<tr>');

	res.write('<td>'+data.rows[i].username+'</td>');
	res.write('<td>'+data.rows[i].amount+'</td>');
	res.write('<td>'+data.rows[i].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+'</td>');

	res.write('<td>');
	res.write('<form method=\"post\" action=\"./chex_action\" >');
	res.write('<input type=\"hidden\" name=\"username\" value=\"'+data.rows[i].username+'\" />');
	res.write('<input type=\"hidden\" name=\"type\" value=\"'+data.rows[i].type+'\" />');
	res.write('<input type=\"hidden\" name=\"amount\" value=\"'+data.rows[i].amount+'\" />');
	res.write('<input type=\"submit\" value=\"환전수락\" />');
	res.write('</form>');
	res.write('</td>');

	res.write('</tr>');

	}


	res.write('</body>');
	res.write('</html>');
	res.end();
	});
}


exports.admin_charge = function(req, res){
	var user = req.user;
	assert(user.admin);
	
	res.writeHead(200, {'Content-Type':'text/html'});

	database.getchex('charge', function(err, data){

//	if(err === 'NO_LOG'){
//		console.log(err);
// 		res.write('NOT LOG');
//		return	res.end();
//		}
//	console.log(data.rows[0].username);
	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");

	res.write("<title>충전페이지</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"충전관리");
	div_left(res);
	div_content1(res);	
	div_content2(res);	
	table_style(res);

	res.write("<table class=\"type10\">");
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">회원아이디</th>");
	res.write("<th scope=\"cols\">충전요청금액</th>");
	res.write("<th scope=\"cols\">충전 요청날짜</th>");
	res.write("<th scope=\"cols\">충전 수락</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");	
	
	res.write("<tr>");

	for ( var i=0; i<data.rows.length; i++){	
	res.write('<tr>');

	res.write('<td>'+data.rows[i].username+'</td>');
	res.write('<td>'+data.rows[i].amount+'</td>');
	res.write('<td>'+data.rows[i].date.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초")+'</td>');

	res.write('<td>');
	res.write('<form method=\"post\" action=\"./chex_action\" >');
	res.write('<input type=\"hidden\" name=\"username\" value=\"'+data.rows[i].username+'\" />');
	res.write('<input type=\"hidden\" name=\"type\" value=\"'+data.rows[i].type+'\" />');
	res.write('<input type=\"hidden\" name=\"amount\" value=\"'+data.rows[i].amount+'\" />');
	res.write('<input type=\"submit\" value=\"충전수락\" />');
	res.write('</form>');
	res.write('</td>');

	res.write('</tr>');
	}

	/*div_content2(res);*/
	res.write('</body>');
	res.write('</html>');
	res.end();
	});
}
		
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

exports.admin_usermodify_ok = function(req, res){
    var user = req.user;
    assert(user.admin);

    res.writeHead(200, {'Content-Type':'text/html'});




    database.usermodify_ok(req.param('username'), req.param('password'), req.param('balance_satoshis'), req.param('userclass') , 
						   req.param('hp_number'), req.param('bank_name'), req.param('bank_type'), req.param('bank_number'), req.param('code') ,function(err,data) {
                if (err) {

                        res.write('<script>');
                        res.write('location.href=\"./admin_usercon\"');
                        res.write('</script>');
                        res.write('err');
                        }
                else{
                        res.write('<script>');
                        res.write('location.href=\"./admin_usercon\"');
                        res.write('</script>');
                }

        res.end();
});

};

exports.admin_usermodify = function(req, res){
	var user = req.user;
	assert(user.admin);

	res.writeHead(200, {'Content-Type':'text/html'});

	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");

	res.write("<title>유저 수정</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"유저관리");
	div_left(res);
	div_content1(res);	

	table_style(res);

	username = req.param('username');
	password = req.param('password');
	balance_satoshis = req.param('balance_satoshis');
	userclass = req.param('userclass');
	hp_number = req.param('hp_number');
	bank_name = req.param('bank_name');
	bank_type = req.param('bank_type');
	bank_number = req.param('bank_number');
	code = req.param('code');		

		res.write("<table class=\"type10\">");
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">회원아이디</th>");
	res.write("<th scope=\"cols\">회원암호</th>");
	res.write("<th scope=\"cols\">회원보유금액</th>");
	res.write("<th scope=\"cols\">회원권한</th>");
	res.write("<th scope=\"cols\">회원전화번호</th>");
	res.write("<th scope=\"cols\">은행명</th>");
	res.write("<th scope=\"cols\">예금주</th>");
	res.write("<th scope=\"cols\">계좌번호</th>");
	res.write("<th scope=\"cols\">코드</th>");
	res.write("<th scope=\"cols\">회원정보수정</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");	
	
	res.write("<tr>");

	res.write("<form action=\"./admin_usermodify_ok\" method=\"post\">");

	res.write("<td>");
	res.write("<input type=\"text\" name=\"username\" value=\""+username+"\"/>");
	res.write("</td>");	

		
	res.write("<td>");
	res.write("<input type=\"text\" name=\"password\" value=\""+password+"\"/>");
	
	res.write("</td>");


	res.write("<td>");
	res.write("<input type=\"text\" name=\"balance_satoshis\" value=\""+balance_satoshis+"\"/>");
	res.write("</td>");


	res.write("<td>");
	res.write("<input type=\"text\" name=\"userclass\" value=\""+userclass+"\"/>");
	res.write("</td>");


	res.write("<td>");
	res.write("<input type=\"text\" name=\"hp_number\" value=\""+hp_number+"\"/>");
	res.write("</td>");



	res.write("<td>");
	res.write("<input type=\"text\" name=\"bank_name\" value=\""+bank_name+"\"/>")
	res.write("</td>");
;

	
	res.write("<td>");
	res.write("<input type=\"text\" name=\"bank_type\" value=\""+bank_type+"\"/>");
	res.write("</td>");



	res.write("<td>");
	res.write("<input type=\"text\" name=\"bank_number\" value=\""+bank_number+"\"/>");
	res.write("</td>");



	res.write("<td>");
	res.write("<input type=\"text\" name=\"code\" value=\""+code+"\"/>");		res.write("</td>");

	
	res.write("<td>");
	res.write("<input type=\"submit\" value=\"회원정보수정\"/>");
	res.write("</td>");


	res.write("</tr>");

	res.write("</form>");

	res.write('</table>');

	div_content2(res);	

	res.write('</body>');
	res.write('</html>');
	res.end();
};

exports.admin_userallow = function(req, res){
	var user = req.user;
	assert(user.admin);

	res.writeHead(200, {'Content-Type':'text/html'});

	
	username1 = req.param('username');
	userack1  = req.param('userack');

	database.modifyuserack(username1, userack1, function(err,data) { 
		if (err) {
			
			res.write('<script>');
			res.write('location.href=\"./admin_usercon\"');
			res.write('</script>');
			res.write('err');
			}		
		else{
			res.write('<script>');
			res.write('location.href=\"./admin_usercon\"');
			res.write('</script>');
		}			
		
	res.end();
});

};

exports.admin_usercon = function(req, res){
	var user = req.user;
	assert(user.admin);

//	res.writeHead(200, {'Content-Type':'text/html'});

	database.getUserAllAdmin( function(err,data) { 
		if(err === 'NO_USERS') 
			return res.render('유저가 존재하지 않습니다.', messageSent);

	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>유저관리</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"유저관리");
	div_left(res);
	div_content1(res);
	div_content2(res);
	
	
	table_style(res);	
	
	res.write("<table class=\"type10\">");
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">번호</th>");
	res.write("<th scope=\"cols\">회원아이디</th>");
	res.write("<th scope=\"cols\">가입날짜</th>");
	res.write("<th scope=\"cols\">보유금액</th>");
	res.write("<th scope=\"cols\">회원종류</th>");
	res.write("<th scope=\"cols\">회원전화번호</th>");
	res.write("<th scope=\"cols\">은행</th>");
	res.write("<th scope=\"cols\">예금주</th>");
	res.write("<th scope=\"cols\">계좌번호</th>");
	res.write("<th scope=\"cols\">코드</th>");
	res.write("<th scope=\"cols\">총충전금액</th>");
	res.write("<th scope=\"cols\">총환전금액</th>");
	res.write("<th scope=\"cols\">수익</th>");
	res.write("<th scope=\"cols\">유저상태</th>");
	res.write("<th scope=\"cols\">유저변경</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");
	for ( var i=0; i<data.rows.length; i++){	
		profit1 = (- parseInt(data.rows[i].all_charge_money) + parseInt(data.rows[i].balance_satoshis) + parseInt(data.rows[i].all_exch_money))*-1;
		res.write('<tr>');
		res.write('<td>'+data.rows[i].id+'</td>');
		res.write('<td>'+data.rows[i].username+'</td>');	
		res.write('<td>'+data.rows[i].created.format("yyyy/MM/dd a/phh:mm:ss")+'</td>');	
		res.write('<td>'+data.rows[i].balance_satoshis.formatwon()+'</td>');	
		res.write('<td>'+data.rows[i].userclass+'</td>');	
		res.write('<td>'+data.rows[i].hp_number+'</td>');	
		res.write('<td>'+data.rows[i].bank_name+'</td>');	
		res.write('<td>'+data.rows[i].bank_type+'</td>');	
		res.write('<td>'+data.rows[i].bank_number+'</td>');	
		res.write('<td>'+data.rows[i].code+'</td>');
		res.write('<td>'+data.rows[i].all_charge_money.formatwon()+'</td>');
		res.write('<td>'+data.rows[i].all_exch_money.formatwon()+'</td>');	
		res.write('<td>'+profit1.formatwon()+'</td>');


		if(data.rows[i].userack ==='wait'){
		
		res.write('<td>대기중');
		}
		if(data.rows[i].userack ==='ack'){
		res.write('<td>완료');
		}
		if(data.rows[i].userack ==='reject'){
		res.write('<td>차단');
		}
	
		res.write("<form action=\"./admin_userallow\" method=\"post\">");
		if(data.rows[i].userack === 'wait'){
			
			res.write('<input type=\"hidden\" name=\"userack\" value=\"ack\">');
			
			res.write("<input type=\"submit\" value=\"승인\">");
		}


		if(data.rows[i].userack === 'ack'){
			
			res.write('<input type=\"hidden\" name=\"userack\" value=\"reject\">');
			res.write("<input type=\"submit\" value=\"접속차단\">");
		}

		if(data.rows[i].userack === 'reject'){
			
			res.write('<input type=\"hidden\" name=\"userack\" value=\"ack\">');
			res.write("<input type=\"submit\" value=\"접속차단해제\">");
		}

		res.write('<input type=\"hidden\" name=\"username\" value=\"'+data.rows[i].username+'\">');
		
		res.write("</form>");


		res.write('</td>');
		//rewrite
		res.write('<td>');
		res.write("<form action=\"./admin_usermodify\" method=\"post\">");
		res.write("<input type=\"hidden\" name=\"username\" value=\""+data.rows[i].username+"\"/>");

		res.write("<input type=\"hidden\" name=\"password\" value=\""+data.rows[i].password+"\"/>");
		res.write("<input type=\"hidden\" name=\"balance_satoshis\" value=\""+data.rows[i].balance_satoshis+"\"/>");
		res.write("<input type=\"hidden\" name=\"userclass\" value=\""+data.rows[i].userclass+"\"/>");
		res.write("<input type=\"hidden\" name=\"hp_number\" value=\""+data.rows[i].hp_number+"\"/>");
		res.write("<input type=\"hidden\" name=\"bank_name\" value=\""+data.rows[i].bank_name+"\"/>");
		res.write("<input type=\"hidden\" name=\"bank_type\" value=\""+data.rows[i].bank_type+"\"/>");
		res.write("<input type=\"hidden\" name=\"bank_number\" value=\""+data.rows[i].bank_number+"\"/>");
		res.write("<input type=\"hidden\" name=\"code\" value=\""+data.rows[i].code+"\"/>");
		res.write("</br>")
		res.write("<input type=\"submit\" value=\"정보수정\"/>");
		res.write("</form>");
		res.write('</td>');

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

exports.bet_crash = function(req, res){
	var user = req.user;
	assert(user.admin);
	res.render('bet_crash', {user: user});
};


exports.bet_crash_act = function(req, res, next){
	var user = req.user;
	var act = req.params.act;

	
	assert(user.admin);
        res.redirect('/bet_crash');
	res.render('bet_crash', {user: user});
	
	if(act != 'act'){

	fs = require('fs');
	rel = fs.readFileSync('./../bustabit-gameserver/server/crash_rel.txt', 'utf8');
	// wait for the result, then use it

	  fs = require('fs');	
	  fs.writeFile('./../bustabit-gameserver/server/crash_set.txt', rel , function(err) {
	  if(err) throw err;
	  console.log('베팅 크래시!!');
});	

			}	
};

exports.giveAway = function(req, res) {
    var user = req.user;
    assert(user.admin);
    res.render('giveaway', { user: user });
};

exports.giveAwayHandle = function(req, res, next) {
    var user = req.user;
    assert(user.admin);

    if (config.PRODUCTION) {
        var ref = req.get('Referer');
        if (!ref) return next(new Error('Possible xsfr')); //Interesting enough to log it as an error

        if (ref.lastIndexOf('https://www.bustabit.com/admin-giveaway', 0) !== 0)
            return next(new Error('Bad referrer got: ' + ref));
    }

    var giveAwayUsers = req.body.users.split(/\s+/);
    var bits = parseFloat(req.body.bits);

    if (!Number.isFinite(bits) || bits <= 0)
        return next('Problem with bits...');

    var satoshis = Math.round(bits * 100);

    database.addRawGiveaway(giveAwayUsers, satoshis , function(err) {
        if (err) return res.redirect('/admin-giveaway?err=' + err);

        res.redirect('/admin-giveaway?m=Done');
    });
};
