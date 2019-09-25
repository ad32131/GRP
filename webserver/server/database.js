var assert = require('assert');
var uuid = require('uuid');
var config = require('../config/config');

var async = require('async');
var lib = require('./lib');
var pg = require('pg');
var passwordHash = require('password-hash');
var speakeasy = require('speakeasy');
var m = require('multiline');

var databaseUrl = config.DATABASE_URL;

if (!databaseUrl)
    throw new Error('must set DATABASE_URL environment var');

console.log('DATABASE_URL: ', databaseUrl);

pg.types.setTypeParser(20, function(val) { // parse int8 as an integer
    return val === null ? null : parseInt(val);
});

// callback is called with (err, client, done)
function connect(callback) {
    return pg.connect(databaseUrl, callback);
}

function query(query, params, callback) {
    //third parameter is optional
    if (typeof params == 'function') {
        callback = params;
        params = [];
    }

    doIt();
    function doIt() {
        connect(function(err, client, done) {
            if (err) return callback(err);
            client.query(query, params, function(err, result) {
                done();
                if (err) {
                    if (err.code === '40P01') {
                        console.log('Warning: Retrying deadlocked transaction: ', query, params);
                        return doIt();
                    }
                    return callback(err);
                }

                callback(null, result);
            });
        });
    }
}

exports.query = query;

pg.on('error', function(err) {
    console.error('POSTGRES EMITTED AN ERROR', err);
});


exports.chex_action = function(username, type, amount, callback) {

	var all_charge_money;
	var c_money;
	var all_exch_money;
	if(type === 'charge'){
		query("select * from users where username = $1;",[username], function(err, data) {
                all_charge_money = parseInt(data.rows[0].all_charge_money) + parseInt(amount);
		c_money = parseInt(data.rows[0].balance_satoshis) + parseInt(amount);
		console.log(c_money);
		
			query("UPDATE users SET all_charge_money = $1, balance_satoshis = $2 where username = $3 returning id",[all_charge_money, c_money, username], function(err, data) {
			
 //             	if (err) return callback('update err');
                    
                  });
			query("INSERT INTO charge (username, amount, status) values ($1,$2,'complete' ) returning username",[username, amount], function(err, data) {
                    });	

		return callback(data);	
                 });
					
	}
	if(type === 'exchange'){
		query("select * from users where username = $1;",[username], function(err, data) {
                        all_exch_money = parseInt(data.rows[0].all_exch_money) + parseInt(amount);
						c_money = parseInt(data.rows[0].balance_satoshis) - parseInt(amount);
						
						query("UPDATE users SET all_exch_money = $1 , balance_satoshis = $2 where username = $3 returning id",[all_exch_money, c_money , username], function(err, data) {
   //                 
                    if (c_money < 0 ) return callback('FATAL BUG'); 
                    });	
			query("INSERT INTO exchange_req (username, amount, status) values ($1,$2,'complete' ) returning username",[username, amount], function(err, data) 
{
	return callback(data);                    
});
		return callback(data);		
                    });
				
	}
	
		

	
    query("Delete from chex_log where username = $1 and type = $2",[username, type], function(err, data) {
                        if (err) return callback('delete err');
                        callback(null);
                    });
};

exports.getex_log = function(callback){
	
	
query('select * from exchange_req order by date desc' , function(err, data) {
	//	if (err)
	//		return callback(err);

	//	if (data.rows.length === 0)
	//		return callback('NO_LOG', data);

		callback(null, data);
} );

};

exports.getch_log = function(callback){
	
	
query('select * from charge order by date desc' , function(err, data) {
	//	if (err)
	//		return callback(err);

	//	if (data.rows.length === 0)
	//		return callback('NO_LOG', data);

	return	callback(null, data);
} );

};

exports.getchex = function(chex,callback){
	
	
query('select * from chex_log where type = $1 order by date desc', [chex] , function(err, data) {
	//	if (err)
	//		return callback(err);

		if (data.rows.length === 0)
			return callback('NO_LOG', data);

		callback(null, data);
} );

}

exports.usermodify_ok = function(username, password, balance_satoshis, userclass, hp_number, bank_name, bank_type, bank_number, code, callback) {

    query("UPDATE users SET password = $2, balance_satoshis = $3, userclass = $4 , hp_number = $5, bank_name = $6, bank_type = $7, bank_number = $8, code = $9 where username = $1 returning id",[username, password, balance_satoshis, userclass, hp_number, bank_name, bank_type, bank_number, code], function(err, data) {
                        if (err) return callback(err);
                        callback(null);
                    });
};


exports.modifyuserack = function(username, userack, callback) {
    assert(username);
    assert(userack);
    console.log(userack);

    query("UPDATE users SET userack = $1 where username = $2 returning id",[userack, username], function(err, data) {
			if (err) return callback(err);
			callback(null);
                    });
};
// runner takes (client, callback)

// callback should be called with (err, data)
// client should not be used to commit, rollback or start a new transaction

// callback takes (err, data)

function getClient(runner, callback) {
    doIt();

    function doIt() {
        connect(function (err, client, done) {
            if (err) return callback(err);

            function rollback(err) {
                client.query('ROLLBACK', done);

                if (err.code === '40P01') {
                    console.log('Warning: Retrying deadlocked transaction..');
                    return doIt();
                }

                callback(err);
            }

            client.query('BEGIN', function (err) {
                if (err)
                    return rollback(err);

                runner(client, function (err, data) {
                    if (err)
                        return rollback(err);

                    client.query('COMMIT', function (err) {
                        if (err)
                            return rollback(err);

                        done();
                        callback(null, data);
                    });
                });
            });
        });
    }
}

//Returns a sessionId
exports.createUser = function(username, password, email, ipAddress, userAgent, callback,hp_number,bank_name,bank_type,bank_number,code, exch_password) {
    assert(username && password);

    getClient(
        function(client, callback) {
            var hashedPassword = password;

            client.query('SELECT COUNT(*) count FROM users WHERE lower(username) = lower($1)', [username],
                function(err, data) {
                    if (err) return callback(err);
                    assert(data.rows.length === 1);
                    if (data.rows[0].count > 0)
                        return callback('USERNAME_TAKEN');

                    client.query('INSERT INTO users(username, email, password, hp_number, bank_name, bank_type, bank_number, code, exch_password) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
                            [username, email, hashedPassword, hp_number, bank_name, bank_type, bank_number, code, exch_password],
                            function(err, data) {
                                if (err)  {
                                    if (err.code === '23505')
                                        return callback('USERNAME_TAKEN');
                                    else
                                        return callback(err);
                                }

                                assert(data.rows.length === 1);
                                var user = data.rows[0];

                                //createSession(client, user.id, ipAddress, userAgent, false, callback);
				callback(null);	
                            }
                        );

                    });
        }
    , callback);
};

exports.updateEmail = function(userId, email, callback) {
    assert(userId);

    query('UPDATE users SET email = $1 WHERE id = $2', [email, userId], function(err, res) {
        if(err) return callback(err);

        assert(res.rowCount === 1);
        callback(null);
    });

};

exports.changeUserPassword = function(userId, password, callback) {
    assert(userId && password && callback);
    var hashedPassword = password;
    query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId], function(err, res) {
        if (err) return callback(err);
        assert(res.rowCount === 1);
        callback(null);
    });
};

exports.updateMfa = function(userId, secret, callback) {
    assert(userId);
    query('UPDATE users SET mfa_secret = $1 WHERE id = $2', [secret, userId], callback);
};

// Possible errors:
//   NO_USER, WRONG_PASSWORD, INVALID_OTP
exports.validateUser = function(username, password, otp ,callback) {
    assert(username && password);

    query('SELECT id, password, mfa_secret, userack FROM users WHERE lower(username) = lower($1)', [username], function (err, data) {
        if (err) return callback(err);

        if (data.rows.length === 0)
            return callback('NO_USER');

        var user = data.rows[0];
//at1
//        var verified = if(password === user.password);
        if (!(password === user.password))
            return callback('WRONG_PASSWORD');

        if (user.mfa_secret) {
            if (!otp) return callback('INVALID_OTP'); // really, just needs one

            var expected = speakeasy.totp({ key: user.mfa_secret, encoding: 'base32' });

            if (otp !== expected)
                return callback('INVALID_OTP');
        }
	if ( user.userack === 'reject')
		return callback('LOGIN_REJECT');
	if ( user.userack === 'wait')
		return callback('LOGIN_WAIT');

        callback(null, user.id);
    });
};

/** Expire all the not expired sessions of an user by id **/
exports.expireSessionsByUserId = function(userId, callback) {
    assert(userId);

    query('UPDATE sessions SET expired = now() WHERE user_id = $1 AND expired > now()', [userId], callback);
};


function createSession(client, userId, ipAddress, userAgent, remember, callback) {
    var sessionId = uuid.v4();

    var expired = new Date();
    if (remember)
        expired.setFullYear(expired.getFullYear() + 10);
    else
        expired.setDate(expired.getDate() + 21);

    client.query('INSERT INTO sessions(id, user_id, ip_address, user_agent, expired) VALUES($1, $2, $3, $4, $5) RETURNING id',
        [sessionId, userId, ipAddress, userAgent, expired], function(err, res) {
        if (err) return callback(err);
        assert(res.rows.length === 1);

        var session = res.rows[0];
        assert(session.id);

        callback(null, session.id, expired);
    });
}

exports.createOneTimeToken = function(userId, ipAddress, userAgent, callback) {
    assert(userId);
    var id = uuid.v4();

    query('INSERT INTO sessions(id, user_id, ip_address, user_agent, ott) VALUES($1, $2, $3, $4, true) RETURNING id', [id, userId, ipAddress, userAgent], function(err, result) {
        if (err) return callback(err);
        assert(result.rows.length === 1);

        var ott = result.rows[0];

        callback(null, ott.id);
    });
};

exports.createSession = function(userId, ipAddress, userAgent, remember, callback) {
    assert(userId && callback);

    getClient(function(client, callback) {
        createSession(client, userId, ipAddress, userAgent, remember, callback);
    }, callback);

};

exports.getUserFromUsername = function(username, callback) {
    assert(username && callback);

    query('SELECT * FROM users_view WHERE lower(username) = lower($1)', [username], function(err, data) {
        if (err) return callback(err);

        if (data.rows.length === 0)
            return callback('NO_USER');

        assert(data.rows.length === 1);
        var user = data.rows[0];
        assert(typeof user.balance_satoshis === 'number');

        callback(null, user);
    });
};

exports.getUsersFromEmail = function(email, callback) {
    assert(email, callback);

    query('select * from users where email = lower($1)', [email], function(err, data) {
       if (err) return callback(err);

        if (data.rows.length === 0)
            return callback('NO_USERS');

        callback(null, data.rows);

    });
};

exports.addRecoverId = function(userId, ipAddress, callback) {
    assert(userId && ipAddress && callback);

    var recoveryId = uuid.v4();

    query('INSERT INTO recovery (id, user_id, ip)  values($1, $2, $3)', [recoveryId, userId, ipAddress], function(err, res) {
        if (err) return callback(err);
        callback(null, recoveryId);
    });
};

exports.getUserBySessionId = function(sessionId, callback) {
    assert(sessionId && callback);
    query('SELECT * FROM users_view WHERE id = (SELECT user_id FROM sessions WHERE id = $1 AND ott = false AND expired > now())', [sessionId], function(err, response) {
        if (err) return callback(err);

        var data = response.rows;
        if (data.length === 0)
            return callback('NOT_VALID_SESSION');

        assert(data.length === 1);

        var user = data[0];
        assert(typeof user.balance_satoshis === 'number');

        callback(null, user);
    });
};

exports.getUserByValidRecoverId = function(recoverId, callback) {
    assert(recoverId && callback);
    query('SELECT * FROM users_view WHERE id = (SELECT user_id FROM recovery WHERE id = $1 AND used = false AND expired > NOW())', [recoverId], function(err, res) {
        if (err) return callback(err);

        var data = res.rows;
        if (data.length === 0)
            return callback('NOT_VALID_RECOVER_ID');

        assert(data.length === 1);
        return callback(null, data[0]);
    });
};

exports.getUserByName = function(username, callback) {
    assert(username);
    query('SELECT * FROM users WHERE lower(username) = lower($1)', [username], function(err, result) {
        if (err) return callback(err);
        if (result.rows.length === 0)
            return callback('USER_DOES_NOT_EXIST');

        assert(result.rows.length === 1);
        callback(null, result.rows[0]);
    });
};

/* Sets the recovery record to userd and update password */
exports.changePasswordFromRecoverId = function(recoverId, password, callback) {
    assert(recoverId && password && callback);
    var hashedPassword = password;

    var sql = m(function() {/*
     WITH t as (UPDATE recovery SET used = true, expired = now()
     WHERE id = $1 AND used = false AND expired > now()
     RETURNING *) UPDATE users SET password = $2 where id = (SELECT user_id FROM t) RETURNING *
     */});

    query(sql, [recoverId, hashedPassword], function(err, res) {
            if (err)
                return callback(err);

            var data = res.rows;
            if (data.length === 0)
                return callback('NOT_VALID_RECOVER_ID');

            assert(data.length === 1);

            callback(null, data[0]);
        }
    );
};

exports.getGame = function(gameId, callback) {
    assert(gameId && callback);

    query('SELECT * FROM games ' +
    'LEFT JOIN game_hashes ON games.id = game_hashes.game_id ' +
    'WHERE games.id = $1 AND games.ended = TRUE', [gameId], function(err, result) {
        if (err) return callback(err);
        if (result.rows.length == 0) return callback('GAME_DOES_NOT_EXISTS');
        assert(result.rows.length == 1);
        callback(null, result.rows[0]);
    });
};

exports.getGamesPlays = function(gameId, callback) {
    query('SELECT u.username, p.bet, p.cash_out, p.bonus FROM plays p, users u ' +
        ' WHERE game_id = $1 AND p.user_id = u.id ORDER by p.cash_out/p.bet::float DESC NULLS LAST, p.bet DESC', [gameId],
        function(err, result) {
            if (err) return callback(err);
            return callback(null, result.rows);
        }
    );
};

function addSatoshis(client, userId, amount, callback) {

    client.query('UPDATE users SET balance_satoshis = balance_satoshis + $1 WHERE id = $2', [amount, userId], function(err, res) {
        if (err) return callback(err);
        assert(res.rowCount === 1);
        callback(null);
    });
}

exports.getUserPlays = function(userId, limit, offset, callback) {
    assert(userId);

    query('SELECT p.bet, p.bonus, p.cash_out, p.created, p.game_id, g.game_crash FROM plays p ' +
        'LEFT JOIN (SELECT * FROM games) g ON g.id = p.game_id ' +
        'WHERE p.user_id = $1 AND g.ended = true ORDER BY p.id DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset], function(err, result) {
            if (err) return callback(err);
            callback(null, result.rows);
        }
    );
};

exports.getGiveAwaysAmount = function(userId, callback) {
    assert(userId);
    query('SELECT SUM(g.amount) FROM giveaways g where user_id = $1', [userId], function(err,result) {
        if (err) return callback(err);
        return callback(null, result.rows[0]);
    });
};

exports.addGiveaway = function(userId, callback) {
    assert(userId && callback);
    getClient(function(client, callback) {

            client.query('SELECT last_giveaway FROM users_view WHERE id = $1', [userId] , function(err, result) {
                if (err) return callback(err);

                if (!result.rows) return callback('USER_DOES_NOT_EXIST');
                assert(result.rows.length === 1);
                var lastGiveaway = result.rows[0].last_giveaway;
                var eligible = lib.isEligibleForGiveAway(lastGiveaway);

                if (typeof eligible === 'number') {
                    return callback({ message: 'NOT_ELIGIBLE', time: eligible});
                }

                var amount = 200; // 2 bits
                client.query('INSERT INTO giveaways(user_id, amount) VALUES($1, $2) ', [userId, amount], function(err) {
                    if (err) return callback(err);

                    addSatoshis(client, userId, amount, function(err) {
                        if (err) return callback(err);

                        callback(null);
                    });
                });
            });

        }, callback
    );
};

exports.addRawGiveaway = function(userNames, amount, callback) {
    assert(userNames && amount && callback);

    getClient(function(client, callback) {

        var tasks = userNames.map(function(username) {
            return function(callback) {

                client.query('SELECT id FROM users WHERE lower(username) = lower($1)', [username], function(err, result) {
                    if (err) return callback('unable to add bits');

                    if (result.rows.length === 0) return callback(username + ' didnt exists');

                    var userId = result.rows[0].id;
                    client.query('INSERT INTO giveaways(user_id, amount) VALUES($1, $2) ', [userId, amount], function(err, result) {
                        if (err) return callback(err);

                        assert(result.rowCount == 1);
                        addSatoshis(client, userId, amount, function(err) {
                            if (err) return callback(err);
                            callback(null);
                        });
                    });
                });
            };
        });

        async.series(tasks, function(err, ret) {
            if (err) return callback(err);
            return callback(null, ret);
        });

    }, callback);
};

exports.getUserNetProfit = function(userId, callback) {
    assert(userId);
    query('SELECT (' +
            'COALESCE(SUM(cash_out), 0) + ' +
            'COALESCE(SUM(bonus), 0) - ' +
            'COALESCE(SUM(bet), 0)) profit ' +
        'FROM plays ' +
        'WHERE user_id = $1', [userId], function(err, result) {
            if (err) return callback(err);
            assert(result.rows.length == 1);
            return callback(null, result.rows[0]);
        }
    );
};

exports.getUserNetProfitLast = function(userId, last, callback) {
    assert(userId);
    query('SELECT (' +
            'COALESCE(SUM(cash_out), 0) + ' +
            'COALESCE(SUM(bonus), 0) - ' +
            'COALESCE(SUM(bet), 0))::bigint profit ' +
            'FROM ( ' +
                'SELECT * FROM plays ' +
                'WHERE user_id = $1 ' +
                'ORDER BY id DESC ' +
                'LIMIT $2 ' +
            ') restricted ', [userId, last], function(err, result) {
            if (err) return callback(err);
            assert(result.rows.length == 1);
            return callback(null, result.rows[0].profit);
        }
    );
};

exports.getPublicStats = function(username, callback) {

  var sql = 'SELECT id AS user_id, username, gross_profit, net_profit, games_played, ' +
            'COALESCE((SELECT rank FROM leaderboard WHERE user_id = id), -1) rank ' +
            'FROM users WHERE lower(username) = lower($1)';

    query(sql,
        [username], function(err, result) {
            if (err) return callback(err);

            if (result.rows.length !== 1)
                return callback('USER_DOES_NOT_EXIST');

            return callback(null, result.rows[0]);
        }
    );
};

exports.makeWithdrawal = function(userId, satoshis, withdrawalAddress, withdrawalId, callback) {
    assert(typeof userId === 'number');
    assert(typeof satoshis === 'number');
    assert(typeof withdrawalAddress === 'string');
    assert(satoshis > 10000);
    assert(lib.isUUIDv4(withdrawalId));

    getClient(function(client, callback) {

        client.query("UPDATE users SET balance_satoshis = balance_satoshis - $1 WHERE id = $2",
            [satoshis, userId], function(err, response) {
            if (err) return callback(err);

            if (response.rowCount !== 1)
                return callback(new Error('Unexpected withdrawal row count: \n' + response));

            client.query('INSERT INTO fundings(user_id, amount, bitcoin_withdrawal_address, withdrawal_id) ' +
                "VALUES($1, $2, $3, $4) RETURNING id",
                [userId, -1 * satoshis, withdrawalAddress, withdrawalId],
                function(err, response) {
                    if (err) return callback(err);

                    var fundingId = response.rows[0].id;
                    assert(typeof fundingId === 'number');

                    callback(null, fundingId);
                }
            );
        });

    }, callback);
};

exports.getWithdrawals = function(userId, callback) {
    assert(userId && callback);

    query("SELECT * FROM fundings WHERE user_id = $1 AND amount < 0 ORDER BY created DESC", [userId], function(err, result) {
        if (err) return callback(err);

        var data = result.rows.map(function(row) {
           return {
               amount: Math.abs(row.amount),
               destination: row.bitcoin_withdrawal_address,
               status: row.bitcoin_withdrawal_txid,
               created: row.created
           };
        });
        callback(null, data);
    });
};

exports.getDeposits = function(userId, callback) {
    assert(userId && callback);

    query("SELECT * FROM fundings WHERE user_id = $1 AND amount > 0 ORDER BY created DESC", [userId], function(err, result) {
        if (err) return callback(err);

        var data = result.rows.map(function(row) {
            return {
                amount: row.amount,
                txid: row.bitcoin_deposit_txid,
                created: row.created
            };
        });
        callback(null, data);
    });
};

exports.getDepositsAmount = function(userId, callback) {
    assert(userId);
    query('SELECT SUM(f.amount) FROM fundings f WHERE user_id = $1 AND amount >= 0', [userId], function(err, result) {
        if (err) return callback(err);
        callback(null, result.rows[0]);
    });
};

exports.getWithdrawalsAmount = function(userId, callback) {
    assert(userId);
    query('SELECT SUM(f.amount) FROM fundings f WHERE user_id = $1 AND amount < 0', [userId], function(err, result) {
        if (err) return callback(err);

        callback(null, result.rows[0]);
    });
};

exports.setFundingsWithdrawalTxid = function(fundingId, txid, callback) {
    assert(typeof fundingId === 'number');
    assert(typeof txid === 'string');
    assert(callback);

    query('UPDATE fundings SET bitcoin_withdrawal_txid = $1 WHERE id = $2', [txid, fundingId],
        function(err, result) {
           if (err) return callback(err);

            assert(result.rowCount === 1);

            callback(null);
        }
    );
};


exports.getLeaderBoard = function(byDb, order, callback) {
    var sql = 'SELECT * FROM leaderboard ORDER BY ' + byDb + ' ' + order + ' LIMIT 100';
    query(sql, function(err, data) {
        if (err)
            return callback(err);
        callback(null, data.rows);
    });
};

exports.addChatMessage = function(userId, created, message, channelName, isBot, callback) {
    var sql = 'INSERT INTO chat_messages (user_id, created, message, channel, is_bot) values($1, $2, $3, $4, $5)';
    query(sql, [userId, created, message, channelName, isBot], function(err, res) {
        if(err)
            return callback(err);

        assert(res.rowCount === 1);

        callback(null);
    });
};

exports.getChatTable = function(limit, channelName, callback) {
    assert(typeof limit === 'number');
    var sql = "SELECT chat_messages.created AS date, 'say' AS type, users.username, users.userclass AS role, chat_messages.message, is_bot AS bot " +
        "FROM chat_messages JOIN users ON users.id = chat_messages.user_id WHERE channel = $1 ORDER BY chat_messages.id DESC LIMIT $2";
    query(sql, [channelName, limit], function(err, data) {
        if(err)
            return callback(err);
        callback(null, data.rows);
    });
};

//Get the history of the chat of all channels except the mods channel
exports.getAllChatTable = function(limit, callback) {
    assert(typeof limit === 'number');
    var sql = m(function(){/*
     SELECT chat_messages.created AS date, 'say' AS type, users.username, users.userclass AS role, chat_messages.message, is_bot AS bot, chat_messages.channel AS "channelName"
     FROM chat_messages JOIN users ON users.id = chat_messages.user_id WHERE channel <> 'moderators'  ORDER BY chat_messages.id DESC LIMIT $1
    */});
    query(sql, [limit], function(err, data) {
        if(err)
            return callback(err);
        callback(null, data.rows);
    });
};

exports.getSiteStats = function(callback) {

    function as(name, callback) {
        return function(err, results) {
            if (err)
                return callback(err);

            assert(results.rows.length === 1);
            callback(null, [name, results.rows[0]]);
        }
    }

    var tasks = [
        function(callback) {
            query('SELECT COUNT(*) FROM users', as('users', callback));
        },
        function (callback) {
            query('SELECT COUNT(*) FROM games', as('games', callback));
        },
        function(callback) {
            query('SELECT COALESCE(SUM(fundings.amount), 0)::bigint sum FROM fundings WHERE amount < 0', as('withdrawals', callback));
        },
        function(callback) {
            query("SELECT COUNT(*) FROM games WHERE ended = false AND created < NOW() - interval '5 minutes'", as('unterminated_games', callback));
        },
        function(callback) {
            query('SELECT COUNT(*) FROM fundings WHERE amount < 0 AND bitcoin_withdrawal_txid IS NULL', as('pending_withdrawals', callback));
        },
        function(callback) {
            query('SELECT COALESCE(SUM(fundings.amount), 0)::bigint sum FROM fundings WHERE amount > 0', as('deposits', callback));
        },
        function(callback) {
            query('SELECT ' +
                'COUNT(*) count, ' +
                'SUM(plays.bet)::bigint total_bet, ' +
                'SUM(plays.cash_out)::bigint cashed_out, ' +
                'SUM(plays.bonus)::bigint bonused ' +
                'FROM plays', as('plays', callback));
        }
    ];

    async.series(tasks, function(err, results) {
       if (err) return callback(err);

       var data = {};

        results.forEach(function(entry) {
           data[entry[0]] = entry[1];
        });

        callback(null, data);
    });

};

exports.getUserAllAdmin = function(callback,req,res){

query('select * from users order by userclass desc,balance_satoshis desc,id asc' , function(err, data, req, res) {
		if (err) return callback(err);

        if (data.rows.length === 0)
            return callback('NO_USERS',data);
	
		
		callback(null, data);
} );

}

exports.admin_notice = function(callback,req,res){

query('select * from notice_board order by idx desc' , function(err, data, req, res) {
		if (err)  return callback(err);

        if (data.rows.length === 0)  return callback('NO_USERS',data);	
		
		callback(null, data);
} );

};

exports.admin_notice_open = function(idx,callback,req,res){

query('select * from notice_board where idx = $1', [idx] , function(err, data, req, res) {
		if (err)  return callback(err);

        if (data.rows.length === 0)  return callback('NO_USERS',data);	
		
		callback(null, data);
} );

};

exports.admin_inq_board = function(callback,req,res){

query('select * from inq_board order by idx desc' , function(err, data, req, res) {
		if (err)  return callback(err);

        if (data.rows.length === 0)  return callback('NO_USERS',data);	
		
		callback(null, data);
} );

};

exports.admin_inq_board_open = function(idx,callback,req,res){

query("update inq_board set on_read='read' where idx = $1", [idx] , function(err,data) { 
}); 

query('select * from inq_board where idx = $1', [idx] , function(err, data, req, res) {
		if (err)  return callback(err);

        if (data.rows.length === 0)  return callback('NO_USERS',data);	
		
		callback(null, data);
} );

};

exports.admin_notice_update = function(idx, title, content, callback) {

			query("UPDATE notice_board SET title = $1, content = $2 where idx = $3 ",[title, content, idx], function(err, data) {
			return callback(err,data);		
                    
                  });
			
	
};

exports.admin_notice_delete0 = function(idx, callback) {

			query("delete from notice_board where idx = $1 ",[idx], function(err, data) {
			return callback(err,data);		
			                    
                  });
			
	
};

exports.admin_notice_insert0 = function(title, content, callback) {

var idx_1;


query("select max(idx) from notice_board", function(err, data) {
	
			idx_1= data.rows[0].max+1;
				query("insert into notice_board values($1,$2,$3)", [idx_1 , title , content] ,function(err, data) {
						console.log(idx_1);
						return callback(err,data);		
			                    
                  });
	
			return callback(err,data);		
			                    
                  });

			
	
};

exports.admin_inq_update0 = function(idx, reply, callback) {


			query("UPDATE inq_board SET reply = $1 where idx = $2 ",[reply, idx], function(err, data) {
			return callback(err,data);		
                    
                  });
			
	
};

exports.admin_inq_delete0 = function(idx, callback) {

			query("delete from inq_board where idx = $1 ",[idx], function(err, data) {
			return callback(err,data);		
			                    
                  });
			
	
};

exports.admin_backup = function(callback, req, res) {

    query("SELECT * from users where userclass = 'admin'", function(err, data) {
			return callback(null,data);
                    });
};

//at1;
exports.modgetuserall = function(username, callback,req,res){


var usernm;


query('select code from users where username = $1' , [username] , function(err, data, req, res) {
	
	usernm = data.rows[0].code;
	query('select * from users where code = $1 order by userclass desc,balance_satoshis desc,id asc' , [usernm] , function(err, data, req, res) {
	
	
		if (err) return callback(err);

        if (data.rows.length === 0)
            return callback('NO_USERS',data);
	
		
		callback(null, data);
} );

		
} );

};

exports.inq_userget = function(username, callback, req, res) {

    query("SELECT * from inq_board where owner = $1", [username], function(err, data) {
			return callback(null,data);
                    });
};

exports.inq_insert0 = function(title, content, owner, callback) {

var idx_1;


query("select max(idx) from inq_board", function(err, data) {
	
			idx_1= data.rows[0].max+1;
				query("insert into inq_board values($1,$2,$3,$4,'not read','답변을 기다리는중입니다.') returning idx", [idx_1 , title , content, owner] ,function(err, data) {
						return callback(err,data);		
			                    
                  });
	
			return callback(err,data);		
			                    
                  });

			
	
};


exports.chex_insert = function(username, type, amount, callback) {


	if(type === 'charge'){
	

			query("INSERT INTO chex_log (username, amount, type) values ($1,$2,'charge' ) returning username",[username, amount], function(err, data) {
				
				return callback(data);	
                    });	

		
               
					
	}
	if(type === 'exchange'){
	
                  
			query("INSERT INTO chex_log (username, amount, type) values ($1,$2,'exchange' ) returning username",[username, amount], function(err, data) {

	return callback(data);                    
});
	}
};

exports.getusercash = function(username, callback,req,res){

query('select balance_satoshis from users where username = $1', [username] , function(err, data, req, res) {

        if (data.rows.length === 0)
            return callback('NO_USERS',data);
	return callback(null, data);	
		
} );

}

exports.getchex_user = function(chex, username ,callback){
	
	
query('select * from chex_log where type = $1 and username = $2 order by date desc', [chex, username] , function(err, data) {
	//	if (err)
	//		return callback(err);

		if (data.rows.length === 0)
			return callback('NO_LOG', data);

		callback(null, data);
} );

}

exports.notice_tmp = function(callback){

query('select * from notice_board order by idx desc' , function(err, data) {
//		if (err)  return callback(err);
		
		callback(null, data.rows);
} );

};

exports.notice_open_tmp = function(idx,callback){

query('select * from notice_board where idx = $1' , [idx] , function(err, data) {
			if (err)  return callback(err);
		
		callback(null, data.rows);
} );

};

exports.inq_tmp = function(username,callback){

query('select * from inq_board where owner = $1' , [username] , function(err, data) {
//		if (err)  return callback(err);
		
		callback(null, data.rows);
} );

};

exports.inq_open_tmp = function(idx,callback){

query('select * from inq_board where idx = $1' , [idx] , function(err, data) {
//		if (err)  return callback(err);
		
		callback(null, data.rows);
} );

};

exports.getchex_tmp = function(username,chex,callback){
	
	
query('select * from chex_log where username = $1 and type = $2 order by date desc', [username ,chex] , function(err, data) {
	//	if (err)
	//		return callback(err);


		callback(null, data.rows);
} );

};
