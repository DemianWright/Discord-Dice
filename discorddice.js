var Discord = require('discord.js');
var fs = require('fs');

var mybot = new Discord.Client();

var config;
var tracker = {};
var back = [];
var forward = [];
var output = '';
var currentActors = [];
var activeChannels = '';
var fateMasterDeck = [-4,-3,-2,-3,-2,-1,-2,-1,0,-3,-2,-1,-2,-1,0,-1,0,1,-2,-1,0,-1,0,1,0,1,2,-3,-2,-1,-2,-1,0,-1,0,1,-2,-1,0,-1,0,1,0,1,2,-1,0,1,0,1,2,1,2,3,-2,-1,0,-1,0,1,0,1,2,-1,0,1,0,1,2,1,2,3,0,1,2,1,2,3,2,3,4];
var fateDeck = [];

var shuffle = function (array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
};

var exaltedDice = function (message) {
	var dice = message.match(/([0-9]+)e/);
	var double = message.match(/[ed]([0-9]+)/);
	var reroll = message.match(/r([0-9]+)/);
	var target = message.match(/t([0-9]+)/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var count = message.match(/c([0-9]+)/);
	var cascade = message.match(/!/);
	var result;
	var builder = '';
	var successes = 0;
	var sucDice = 0;
	if (dice) {
		dice = parseInt(dice[1], 10);
	} else {
		dice = 0;
	}
	if (double) {
		double = parseInt(double[1], 10);
	} else {
		double = 10;
	}
	if (reroll) {
		reroll = reroll[1];
	} else {
		reroll = '';
	}
	if (target) {
		target = parseInt(target[1], 10);
	} else {
		target = 7;
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	if (count) {
		count = parseInt(count[1], 10);
	} else {
		count = 0;
	}
	while (dice > 0) {
		result = Math.floor(Math.random() * 10);
		while (reroll.indexOf(result) > -1) {
			result = Math.floor(Math.random() * 10);
		}
		if (result === 0) {
			result = 10;
		}
		if (result >= target) {
			if (cascade) {
				dice += 1;
			}
			successes += 1;
		}
		if (count) {
			if (result === count) {
				sucDice += 1;
			}
		} else {
			if (result >= target) {
				sucDice += 1;
			}
		}
		if (result >= double) {
			successes += 1;
		}
		if (result === 1) {
			builder += result;
		} else if (result >= double) {
			builder += '**' + result + '**';
		} else if (result >= target) {
			builder += '*' + result + '*';
		} else {
			builder += result;
		}
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	successes += auto;
	return builder + '\n' + '**SUCCESSES: ' + successes + '(' + sucDice + ')**';
};

var wodDice = function (message) {
	var dice = message.match(/([0-9]+)w/);
	var again = message.match(/w([0-9]+)/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var result;
	var builder = '';
	var successes = 0;
	var sucDice = 0;
	if (dice) {
		dice = parseInt(dice[1], 10);
	} else {
		dice = 0;
	}
	if (again) {
		again = parseInt(again[1], 10);
	} else {
		again = 10;
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	while (dice > 0) {
		result = Math.floor(Math.random() * 10);
		if (result === 0) {
			result = 10;
		}
		if (result >= 8) {
			successes += 1;
		}
		if (result >= again) {
			dice += 1;
			sucDice += 1;
		}
		if (result === 1) {
			builder += result;
		} else if (result >= again) {
			builder += '**' + result + '**';
		} else  if (result >= 8) {
			builder += '*' + result + '*';
		} else {
			builder += result;
		}
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	successes += auto;
	return builder + '\n' + '**SUCCESSES: ' + successes + '(' + sucDice + ')**';
};

var baseDice = function (message) {
	var dice = message.match(/([0-9]+)d([0-9]+)/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var diceSize;
	var total = 0;
	var builder = '';
	var result;
	if (dice) {
		diceSize = parseInt(dice[2], 10);
		dice = parseInt(dice[1], 10);
	} else {
		dice = 1;
		diceSize = 6;
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}while (dice > 0) {
		result = Math.floor(Math.random() * diceSize);
		if (result === 0) {
			result = diceSize;
		}
		if (result === 1) {
			builder += result;
		} else if (result === diceSize) {
			builder += '**' + result + '**';
		} else {
			builder += result;
		}
		total += result;
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	total += auto;
	return builder + '\n' + '**TOTAL: ' + total + '**';
};

var fudgeDice = function () {
	var dice = 4;
	var diceSize = 3;
	var total = 0;
	var builder = '';
	var result;

	while (dice > 0) {
		result = Math.floor(Math.random() * diceSize);
		switch (result) {
			case 0:
				builder+='-';
				break;
			case 1:
				builder+=' ';
				break;
			case 2:
				builder+='+';
				break;
		}
		total += (result-1);
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	return builder + '\n' + '**TOTAL: ' + total + '**';
};

var fateCards = function (message) {
	if (fateDeck.length === 0) {
		fateDeck = fateMasterDeck.slice(0);
		shuffle(fateDeck);
		mybot.reply(message, 'Fate Deck Shuffled');
	}
	return fateDeck.pop() + ', ' + fateDeck.length + ' cards remaining';
};

var fateCount = function () {
	var counts = {
		'-4':0,
		'-3':0,
		'-2':0,
		'-1':0,
		'0':0,
		'1':0,
		'2':0,
		'3':0,
		'4':0
	},
		avg = 0,
		count = 0;
	fateDeck.forEach(function(result) {
		counts[result]+=1;
		avg+=result;
		count++;
	});
	counts.average=(avg/count);
	return JSON.stringify(counts);
};

var shadowrunDice = function (message) {
	var dice = message.match(/([0-9]+)s/);
	var edge = message.match(/e/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var result;
	var builder = '';
	var successes = 0;
	var sucDice = 0;
	if (dice) {
		dice = parseInt(dice[1], 10);
	} else {
		dice = 0;
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	while (dice > 0) {
		result = Math.floor(Math.random() * 6);
		if (result === 0) {
			result = 6;
		}
		if (result >= 5) {
			successes += 1;
		}
		if (result === 6 && !!edge) {
			dice += 1;
			sucDice += 1;
		}
		if (result === 1) {
			builder += result;
		} else if (result >= 6) {
			builder += '**' + result + '**';
		} else  if (result >= 5) {
			builder += '*' + result + '*';
		} else {
			builder += result;
		}
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	successes += auto;
	return builder + '\n' + '**SUCCESSES: ' + successes + '(' + sucDice + ')**';
};

var oneRingDice = function (message) {
	var dice = message.match(/([0-9]+)r/);
	var shadow = message.match(/s/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var result;
	var builder = '';
	var total = 0;
	var success = false;
	if (dice) {
		dice = parseInt(dice[1], 10);
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	result = Math.floor(Math.random() * 12);
	if (result === 0) {
		builder += 'ভ';
		if (shadow) {
			total += 12;
			success = true;
		}
	} else if (result === 11) {
		builder += 'ᚠ';
		if (!shadow) {
			total += 12;
			success = true;
		}
	} else {
		builder += result.toString();
		total += result;
	}
	while (dice > 0) {
		builder += ',';
		result = Math.floor(Math.random() * 6) + 1;

		total += result;
		if (result <= 3) {
			builder += '*' + result + '*';
		} else if (result === 6) {
			builder += '**' + result + '**';
		} else {
			builder += result.toString();
		}
		dice -= 1;
	}
	total += auto;
	return builder + '\n' + '**TOTAL: ' + (function () {if (success) { return ' AUTOMATIC SUCCESS';} else return total;})() + '**';
};

var l5rDice = function (message) {
	var dice = message.match(/([0-9]+)k/);
	var keep = message.match(/k([0-9]+)/);
	var explode = message.match(/e([0-9]+)/);
	var reroll = message.match(/r([0-9]+)/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var results = [];
	var total = 0;
	var final = 0;
	var highest = 0;
	var highIndex = 0;
	var result;
	var builder = '';
	if (dice) {
		dice = parseInt(dice[1], 10);
	} else {
		dice = 0;
	}
	if (keep) {
		keep = parseInt(keep[1], 10);
	} else {
		keep = 1;
	}
	if (explode) {
		explode = parseInt(explode[1], 10);
	} else {
		explode = 10;
	}
	if (reroll) {
		reroll = reroll[1];
	} else {
		reroll = '';
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	while (dice > 0) {
		total = 0;
		do {
			result = Math.floor(Math.random() * 10);
			if (reroll.indexOf(result.toString()) > -1) {
				result = Math.floor(Math.random() * 10);
			}
			if (result === 0) {
				result = 10;
			}
			total += result;
		} while (result >= explode);
		results.push(total);
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	while (keep > 0) {
		highest = 0;
		highIndex = 0;
		results.forEach(function (res, index) {
			if (res > highest) {
				highest = res;
				highIndex = index;
			}
		});
		final += highest;
		if (highest >= explode) {
			results[highIndex] = '**' + results[highIndex] + '**';
		}
		results[highIndex] = '*' + results[highIndex] + '*';
		keep -= 1;
	}
	final += auto;
	builder = results.join(',');
	return builder + '\n' + '**TOTAL: ' + final + '**';
};

var initiativeHandler = function (message) {
	var raw = message.content.substr(1);
	var parts = raw.split(' ');
	var command = parts[0];
	var highest = -9999999;
	if (parts[1]) {
		if (parts[1].toLowerCase() === 'me' || parts[1].toLowerCase() === 'my') {
			parts[1] = message.author.username.replace(/ /g,'');
		}
	}
	if (parts[2]) {
		if (parts[2].toLowerCase() === 'me' || parts[2].toLowerCase() === 'my') {
			parts[2] = message.author.username.replace(/ /g,'');
		}
	}
	var sendMessage = function (msg) {
		mybot.reply(message,msg);
	};
	var decodeInitiative = function (str) {
		if (parseInt(str,10).toString() !== 'NaN') {
			return parseInt(str,10);
		} else {
			str = str.replace(/\**/g,'').replace(/\*/g,'');
			return parseInt(str,10);
		}
	};
	var reset = function () {
		var oldTracker = JSON.parse(JSON.stringify(tracker));
		tracker = {};
		back.push(function (un) {
			if (un==='undo') {
				tracker = oldTracker;
				sendMessage('Undoing reset');
			} else {
				tracker = {};
				sendMessage('Redoing reset');
			}
		});
	};
	var next = function () {
		var active = [];
		var oldActors = [];
		Object.keys(tracker).forEach(function (actor) {
			actor = tracker[actor];
			if (!actor.acted) {
				if (actor.initiative > highest) {
					highest = actor.initiative;
					active = [actor];
					oldActors = [JSON.parse(JSON.stringify(actor))];
				} else if (actor.initiative === highest) {
					active.push(actor);
					oldActors.push(JSON.parse(JSON.stringify(actor)));
				}
			}
		});
		if (active.length > 0) {
			currentActors = active;
			output = highest + ':';
			active.forEach(function (actor) {
				actor.acted = true;
				actor.motes = Math.min(actor.motes+5,actor.maxmotes);
				output += ' ' + actor.name;
				if (actor.maxmotes > 0) {
					output += '('  + actor.motes + '/' + actor.maxmotes + ')';
				}
				output += ',';
			});
			output = output.replace(/,$/, '');
			sendMessage(output);
			back.push(function (un) {
				if (un === 'undo') {
					active.forEach(function (actor, index) {
						actor.acted = false;
						actor.motes = oldActors[index].motes;
					});
					sendMessage('Undoing next turn');
				} else {
					active.forEach(function (actor) {
						actor.acted = true;
						actor.motes = Math.min(actor.motes+5,actor.maxmotes);
					});
					sendMessage('Redoing next turn');
				}
			});
		} else {
			sendMessage('NEW TURN');
			currentActors = [];
			Object.keys(tracker).forEach(function (actorId) {
				var actor = tracker[actorId];
				actor.acted = false;
			});
			list();
			back.push(function (un) {
				if (un === 'undo') {
					Object.keys(tracker).forEach(function (actorId) {
						var actor = tracker[actorId];
						actor.acted = true;
					});
					sendMessage('Undoing New Turn');
				} else {
					Object.keys(tracker).forEach(function (actorId) {
						var actor = tracker[actorId];
						actor.acted = false;
					});
					sendMessage('NEW TURN');
					list();
					sendMessage('Redoing New Turn');
				}
			});
		}
	};
	var add = function () {
		var name = parts[1];
		var actor = {
			name: name,
			initiative: parseInt(parts[2], 10) || 0,
			motes: parseInt(parts[3], 10) || 0,
			maxmotes: parseInt(parts[3], 10) || 0,
			acted: false
		};
		tracker[name] = actor;
		back.push(function (un) {
			if (un === 'undo') {
				delete tracker[name];
				sendMessage('Deleting ' + name);
			} else {
				tracker[name] = actor;
				sendMessage('Readding ' + name);
			}
		});
	};
	var remove = function () {
		var actor = tracker[parts[1]];
		var name = actor.name;
		if (!!actor) {
			delete tracker[name];
			back.push(function (un) {
				if (un === 'undo') {
					tracker[name] = actor;
					sendMessage('Re-adding ' + name);
				} else {
					delete tracker[name];
					sendMessage('Re-deleting ' + name);
				}
			});
		}
	};
	var list = function () {
		var output = [],
			toPrint = '';
		Object.keys(tracker).forEach(function (name) {
			var actor = tracker[name];
			var data = '';
			var isActive = false;
			currentActors.forEach(function(act){
				if (act.name === actor.name) {
					isActive = true;
				}
			});
			if (isActive) {
				data += '**';
			} else if (actor.acted) {
				data += '*';
			}
			data += actor.initiative + ' ' + name;
			if (actor.maxmotes > 0) {
				data += '('  + actor.motes + '/' + actor.maxmotes + ')';
			}
			if (isActive) {
				data += '**';
			} else if (actor.acted) {
				data += '*';
			}
			output.push(data);
		});
		output.sort(function (a, b) { return decodeInitiative(b.split(' ')[0]) - decodeInitiative(a.split(' ')[0]) });
		output.forEach(function (val) {
			toPrint += val + '\n';
		});
		sendMessage('\n' + toPrint.replace(/\n$/, ''));
	};
	var set = function () {
		var trait = parts[2].toLowerCase() === 'init' ? 'initiative' : parts[2].toLowerCase();
		var oldValue = tracker[parts[1]][trait];
		var newValue = parseInt(parts[3], 10);
		var name = parts[1];
		tracker[name][trait] = newValue;
		back.push(function (un) {
			if (un==='undo') {
				tracker[name][trait] = oldValue;
				sendMessage('Reset ' + name + '\'s ' + trait + ' to ' + oldValue);
			} else {
				tracker[name][trait] = newValue;
				sendMessage('Re-set ' + name + '\'s ' + trait + ' to ' + newValue);
			}
		});
	};
	var modify = function () {
		var trait = parts[2].toLowerCase() === 'init' ? 'initiative' : parts[2].toLowerCase();
		var oldValue = tracker[parts[1]][trait];
		var newValue = oldValue + parseInt(parts[3], 10);
		var name = parts[1];
		tracker[name][trait] = newValue;
		back.push(function (un) {
			if (un==='undo') {
				tracker[name][trait] = oldValue;
				sendMessage('Reset ' + name + '\'s ' + trait + ' to ' + oldValue);
			} else {
				tracker[name][trait] = newValue;
				sendMessage('Re-set ' + name + '\'s ' + trait + ' to ' + newValue);
			}
		});
	};
	var withering = function () {
		var aName = parts[1];
		var dName = parts[2];
		var attackerOldValue = tracker[aName].initiative;
		var attackerNewValue = attackerOldValue + parseInt(parts[3], 10) + 1;
		var defenderOldValue = tracker[dName].initiative;
		var defenderNewValue = defenderOldValue - parseInt(parts[3], 10);
		if (defenderNewValue <= 0 && defenderOldValue > 0) {
			attackerNewValue += 5;
			sendMessage(dName + ' is CRASHED');
		}
		tracker[aName].initiative = attackerNewValue;
		tracker[dName].initiative = defenderNewValue;
		back.push(function (un) {
			if (un==='undo') {
				tracker[aName].initiative = attackerOldValue;
				tracker[dName].initiative = defenderOldValue;
				sendMessage('Undoing withering attack');
			} else {
				tracker[aName].initiative = attackerNewValue;
				tracker[dName].initiative = defenderNewValue;
				sendMessage('Redoing withering attack');
			}
		});
	};
	var undo = function() {
		var func;
		if (back.length > 0) {
			func = back.pop();
			func('undo');
			forward.push(func);
		} else {
			sendMessage('Nothing to Undo');
		}
	};
	var redo = function() {
		var func;
		if (forward.length > 0) {
			func = forward.pop();
			func('redo');
			back.push(func);
		} else {
			sendMessage('Nothing to Redo');
		}
	};
	var check = function () {
		var name = parts[1];
		var output = tracker[name].initiative + ' ' + name + '('  + tracker[name].motes + '/' + tracker[name].maxmotes + ')';
		sendMessage(output);
	};
	var help = function () {
		var output = '\nreset\nnext\nadd NAME [INITIATIVE] [MAXMOTES]\nlist\ncheck NAME\nset NAME TRAIT VALUE\nmodify NAME TRAIT AMOUNT\nwithering ATTACKER DEFENDER AMOUNT\ndelete NAME\nundo\nredo\nhelp';
		sendMessage(output);
	};
	try {
		switch (command) {
			case 'reset':
				reset();
				break;
			case 'next':
				next();
				break;
			case 'add':
				add();
				break;
			case 'list':
				list();
				break;
			case 'check':
				check();
				break;
			case 'set':
				set();
				break;
			case 'modify':
				modify();
				break;
			case 'withering':
				withering();
				break;
			case 'delete':
			case 'remove':
				remove();
				break;
			case 'undo':
				undo();
				break;
			case 'redo':
				redo();
				break;
			case 'help':
				help();
				break;
			case 'duel':
				//duel();
				break;
			case 'default':
				sendMessage('Not Recognized Command');
		}
	} catch (e) {
		sendMessage('INPUT ERROR');
	}
};

var mainProcess = function () {

mybot.on('message', function(message) {
	var result;
	var msg = message.content.match(/\((.+)\)/);
	if (message.content === '!startDice') {
		if (activeChannels.indexOf(message.channel.id) === -1) {
			activeChannels+=message.channel.id;
		}
	} else if (message.content === '!stopDice') {
		activeChannels = activeChannels.replace(message.channel.id,'');
	} else if (activeChannels.indexOf(message.channel.id) > -1) {
		if (msg) {
			if (msg[1].match(/^[0-9]+?e/)) {
				result = exaltedDice(msg[1]);
			} else if (msg[1].match(/^[0-9]+?w/)) {
				result = wodDice(msg[1]);
			} else if (msg[1].match(/^[0-9]+?d/)) {
				result = baseDice(msg[1]);
			} else if (msg[1].match(/^[0-9]+?s/)) {
				result = shadowrunDice(msg[1]);
			} else if (msg[1].match(/^[0-9]+?k/)) {
				result = l5rDice(msg[1]);
			} else if (msg[1].match(/^[0-9]+?r/)) {
				result = oneRingDice(msg[1]);
			} else if (msg[1] === 'fudge') {
				result = fudgeDice();
			} else if (msg[1] === 'fdraw') {
				result = fateCards(message);
			} else if (msg[1] === 'fshuffle') {
				fateDeck = fateMasterDeck.slice(0);
				shuffle(fateDeck);
				result = 'Fate Deck Shuffled';
			} else if (msg[1] === 'fcount') {
				result = fateCount();
			}
			if (result) {
				mybot.reply(message, result);
			}
		} else if (message.content.match(/^!/)) {
			initiativeHandler(message);
		}
	}
});

mybot.login(config.email,config.password);
};

if (!fs.existsSync('./config.json')) {
	fs.writeFileSync('./config.json', JSON.stringify({discord:{email:'YOUR EMAIL', password:'YOUR PASSWORD'}}).replace(/\r?\n|\r/g,''));
}

config = require('./config.json').discord;

if (config.email === 'YOUR EMAIL') {
	var pw=true;
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	console.log('Enter your Discord Email Login: ');
	process.stdin.on('data', function (email) {
		if (pw) {
			pw = false;
			console.log('Enter your Discord Password: ');
		}
		process.stdin.on('data', function (password) {
			process.stdin.on('data', function (){});
			process.stdin.pause();
			config.email = email.replace(/\r?\n|\r/g,'');
			config.password = password.replace(/\r?\n|\r/g,'');
			fs.writeFileSync('./config.json', JSON.stringify({discord:config}).replace(/\r?\n|\r/g,''));
			mainProcess();
		});
	});
} else {
	mainProcess();
}
