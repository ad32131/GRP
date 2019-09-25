 var assert = require('better-assert');
 var async = require('async');
 var timeago = require('timeago');
 var database = require('./database');



 /**
  * GET
  * Public API
  * Show a single game info
  **/

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



exports.show = function(req, res, next) {
    var user = req.user;
    var gameId = parseInt(req.params.id);

    if (!gameId || typeof gameId !== 'number') return res.render('404');

    database.getGame(gameId, function(err, game) {
        if (err) {
            if (err === 'GAME_DOES_NOT_EXISTS')
                return res.render('404');

            return next(new Error('Unable to get game: \n' + err));
        }

        database.getGamesPlays(game.id, function(err, plays) {
            if (err)
                return next(new Error('Unable to get game information: \n' + err)); //If getGame worked this should work too
            game.timeago = timeago(game.created);
	    game.created = game.created.format("yyyy년  MM월  dd일  a/p hh시  mm분  ss초");
            res.render('game', { game: game, plays: plays, user: user });
        });
    });
};

 /**
  * GET
  * Public API
  * Shows the leader board
  **/
 exports.getLeaderBoard = function(req, res, next) {
     var user = req.user;
     var by = req.query.by;

     var byDb, order;
     switch(by) {
         case 'net_desc':
             byDb = 'net_profit';
             order = 'DESC';
             break;
         case 'net_asc':
             byDb = 'net_profit';
             order = 'ASC';
             break;
         default :
             byDb = 'gross_profit';
             order = 'DESC';
     }

     database.getLeaderBoard(byDb, order ,function(err, leaders) {
         if (err)
             return next(new Error('Unable to get leader board: \n' + err));

        res.render('leaderboard', { user: user, leaders: leaders, sortBy: byDb, order: order });
     });
 };
