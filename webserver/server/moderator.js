var assert = require('better-assert');
var lib = require('./lib');
var database = require('./database');
var qr = require('qr-image');
var uuid = require('uuid');
var _ = require('lodash');
var config = require('../config/config');

var menu_text = new Array();
menu_text[0] = "총판유저관리";
menu_text[1] = "총판수익";

var menu_url = new Array();
menu_url[0] = "./mod_usercon";
menu_url[1] = "./mod_log";

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

        res.write("table.type10 { box-sizong:border-box; -webkit-box-sizing:border-box; -moz-box-sizing:border-box; border-top:#ccc solid 0px; border-bottom:#ccc solid 1px; border-left:#ccc solid 1px; border-right:#ccc solid 1px; border-collapse: collapse;text-align: left;line-height: 1.5; width:100%;  margin: 20px 0px;}");
        res.write("table.type10 thead th {width: 150px;padding: 5px;font-weight: bold; font-size:14; line-height:1.5; vertical-align: top;color: #FFF; background:#373636; }");
        res.write("table.type10 tbody th {width: 200px; padding: 5px;}");
        res.write("table.type10 td { box-sizing:border-box; -webkit-box-sizing:border-box; -moz-box-sizing:border-box; border-right:1px solid #F0F2F4; border-bottom:1px solid #ccc; border-left:0px; margin: 0px; width : 0px; padding: 5px;vertical-align: top;}");
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
res.write("\" style=\"box-sizing: border-box; color: rgb(255, 255, 255); text-decoration: none;  border-radius: 0px !important; text-shadow: none; /*display: block;*/ position: relative; margin: 0px; border: 0px; padding: 0px; font-size: 30px; font-weight: 300;\">");
res.write("<i class=\"icon-settings\" style=\"box-sizing: border-box; font-family: Simple-Line-Icons; speak: none; font-style: normal; font-weight: 400; font-variant-ligatures: normal; font-variant-caps: normal; text-transform: none; line-height: 14px; -webkit-font-smoothing: antialiased; display: inline-block; width: 1.25em; text-align: center; top: 1px; position: relative; font-size: 0px; margin-right: 0px; text-shadow: none; color: rgb(107, 120, 139); margin-left: 0px;\">");
res.write("</i><span>&nbsp;</span><span class=\"title\" style=\"box-sizing: border-box; border-radius: 0px !important;\">");

res.write(menu_text[i]);

res.write("</span><span class=\"arrow\" style=\"box-sizing: border-box; border-radius: 0px !important;\"></span></a>");


}

res.write("</div>");
}


exports.mod_log = function(req, res){
var user = req.user;
var user_all_ch = 0;
var user_all_ex = 0 ;
var user_all_money = 0;


//	res.writeHead(200, {'Content-Type':'text/html'});

database.modgetuserall( req.user.username , function(err,data) { 
	if(err === 'NO_USERS') 
		return res.render('유저가 존재하지 않습니다.', messageSent);

res.write("<html><head>");
res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
res.write("<title>총판수익관리</title>");
res.write("</head>");
res.write("<body>");

div_header(res,"총판수익관리");
div_left(res);
div_content1(res);


table_style(res);	

res.write("<table class=\"type10\">");
res.write("<thead>");
res.write("<tr>");
res.write("<th scope=\"cols\">그래프총판총충전금액</th>");
res.write("<th scope=\"cols\">그래프총판총환전금액</th>");
res.write("<th scope=\"cols\">그래프총판총보유금액</th>");
res.write("<th scope=\"cols\">그래프사총판회원수</th>");
res.write("<th scope=\"cols\">그래프사총판수익</th>");
res.write("</tr>");
res.write("</thead>");
res.write("<tbody>");


for ( var i=0; i<data.rows.length; i++){	
	
	user_all_ch = user_all_ch + parseInt(data.rows[i].all_charge_money);
	user_all_ex = user_all_ch + parseInt(data.rows[i].all_exch_money);
	user_all_money = user_all_money + parseInt(data.rows[i].balance_satoshis);

}

	profit1 = (- parseInt(user_all_ch) + parseInt(user_all_money) + parseInt(user_all_ex))*-1;
	profit1 = (profit1 / 100 * 30) - ((profit1 / 100 * 30) % 1000);
	
	res.write('<tr>');
	
	res.write('<td>'+user_all_ch.formatwon()+'</td>');	
	res.write('<td>'+user_all_ex.formatwon()+'</td>');	
	res.write('<td>'+user_all_money.formatwon()+'</td>');
	res.write('<td>'+data.rows.length+'</td>');		
	res.write('<td>'+profit1.formatwon()+'</td>');

	res.write('</tr>');

res.write('</tbody>');
res.write('</table>');
div_content2(res);

res.write('</body>');
res.write('</html>');
res.end();

},req,res);

//at1
};


//exports.modusercon();

exports.mod_usercon = function(req, res){
	var user = req.user;
//	res.writeHead(200, {'Content-Type':'text/html'});

	
	database.modgetuserall( req.user.username , function(err,data) { 
		if(err === 'NO_USERS') 
			return res.render('유저가 존재하지 않습니다.', messageSent);

	res.write("<html><head>");
	res.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	res.write("<title>총판유저관리</title>");
	res.write("</head>");
	res.write("<body>");

	div_header(res,"총판유저관리");
	div_left(res);
	div_content1(res);
	div_content2(res);
	
	
	table_style(res);	
	
	res.write("<table class=\"type10\">");
	res.write("<thead>");
	res.write("<tr>");
	res.write("<th scope=\"cols\">회원번호</th>");
	res.write("<th scope=\"cols\">회원아이디</th>");
	res.write("<th scope=\"cols\">회원가입날짜</th>");
	res.write("<th scope=\"cols\">보유금액</th>");
	res.write("<th scope=\"cols\">코드</th>");
	res.write("<th scope=\"cols\">총충전금액</th>");
	res.write("<th scope=\"cols\">총환전금액</th>");
	res.write("<th scope=\"cols\">수익</th>");
	res.write("</tr>");
	res.write("</thead>");
	res.write("<tbody>");
	for ( var i=0; i<data.rows.length; i++){	
		profit1 = (- parseInt(data.rows[i].all_charge_money) + parseInt(data.rows[i].balance_satoshis) + parseInt(data.rows[i].all_exch_money))*-1;
		res.write('<tr>');
		res.write('<td>'+data.rows[i].id+'</td>');
		res.write('<td>'+data.rows[i].username+'</td>');	
		res.write('<td>'+data.rows[i].created.format("yyyy/MM/dd a/p hh:mm:ss")+'</td>');	
		res.write('<td>'+data.rows[i].balance_satoshis.formatwon()+'</td>');	
		res.write('<td>'+data.rows[i].code+'</td>');
		res.write('<td>'+data.rows[i].all_charge_money.formatwon()+'</td>');
		res.write('<td>'+data.rows[i].all_exch_money.formatwon()+'</td>');	
		res.write('<td>'+profit1.formatwon()+'</td>');

		
		res.write('</td>');
		//rewrite


		res.write('</tr>');
	}
	res.write('</tbody>');
	res.write('</table>');
	res.write('</body>');
	res.write('</html>');
	res.end();

},req,res);

//at1

};




