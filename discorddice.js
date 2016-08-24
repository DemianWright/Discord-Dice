/*
 * Miscellaneous.
 */
var Discord = require('discord.js');
var fs = require('fs');

var mybot = new Discord.Client();

var config;
var activeChannels = [];
var minMaxBold = '**';

// Unsupported.
var tracker = {};
var back = [];
var forward = [];
var output = '';
var currentActors = [];
var fateMasterDeck = [-4, -3, -2, -3, -2, -1, -2, -1, 0, -3, -2, -1, -2, -1, 0, -1, 0, 1, -2, -1, 0, -1, 0, 1, 0, 1, 2, -3, -2, -1, -2, -1, 0, -1, 0, 1, -2, -1, 0, -1, 0, 1, 0, 1, 2, -1, 0, 1, 0, 1, 2, 1, 2, 3, -2, -1, 0, -1, 0, 1, 0, 1, 2, -1, 0, 1, 0, 1, 2, 1, 2, 3, 0, 1, 2, 1, 2, 3, 2, 3, 4];
var fateDeck = [];

/*
 * Games.
 */

// All regex matches are case insensitive.
var regexRollMessage = /^\/?r?\s?\(?(.*d\d+.*)\)?$/i;

var regexDND = /^([ad]?)\s?(\d*)d(\d+)\s?([+-]\d+)?$/i;
var regexStdD = /^(\d+)?d(\d+)\s?([+-]\d+)?$/i;
//TODO: Eldritch.

// var supportedGames = ['stdd','ex','or','sr','dnd','l5r','wod']
// var supportedGamesNames = ['Standard', 'Exalted', 'The One Ring', 'Shadowrun', 'Dungeons & Dragons', 'Legend of the Five Rings', 'World of Darkness'];
var supportedGames = ['stdd', 'dnd']
var supportedGamesNames = ['Standard', 'Dungeons & Dragons'];
var selectedGameIndex = -1;

// Unsupported for now.
var regexExalted = /^\d+?e/i;
var regexWOD = /^\d+?w/i;
var regexShadowrun = /^\d+?s/i;
var regexL5R = /^\d+?k/i;
var regexOneRing = /^\d+?r/i;

/*
 * Unit conversions.
 */
var regexConversionSymbols = /(mm|cm|m|km|in|"|''|ft|'|yd|mi|mg|g|kg|oz|lb|st)/;
var regexConversion = /^\/?c?\s?\(?(.*\d+\s?(?:mm|cm|m|km|in|"|''|ft|'|yd|mi|mg|g|kg|oz|lb|st))\s?(?:to|in|as|>|=)\s?(mm|cm|m|km|in|"|''|ft|'|yd|mi|mg|g|kg|oz|lb|st)\)?$/i;
var regexValueSymbols = /(?:(\d*(?:,|\.)?\d+)\s?(mm|cm|m|km|in|"|''|ft|'|yd|mi|mg|g|kg|oz|lb|st)\s?)+$/i;

var lengthUnitSymbols = ['mm', 'cm', 'm', 'km', 'in', '"', "''", 'ft', "'", 'yd', 'mi'];

var inchInMmeters = 0.0254;
var footInMeters = 0.3048;
var yardInMeters = 0.9144;
var mileInMeters = 1609.344;

var weigthUnitSymbols = ['mg', 'g', 'kg', 'oz', 'lb', 'st'];

var ounceInGrams = 28.349523125;
var poundInGrams = 453.59237;
var stoneInGrams = 6350.29318;

/*
 * Bottle spinning.
 */
var sixteenWindCompassArguments = ['h', '16', 'half'];
var cardinalCompassArguments = ['c', 'cardinal'];
var cardinalCompassDirections = ['north', 'east', 'south', 'west'];
var ordinalCompassDirections = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
var sixteenWindDirections = ['north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest'];

/*
 * Helper functions.
 */
/**
 * Returns a random integer in range [min, max].
 */
var getRandomInt = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var getSupportedGamesString = function() {
	var string = '';
	var length = supportedGames.length;

	supportedGamesNames.forEach(function(name, idx) {
		string += name + ' (' + supportedGames[idx] + ')';

		if (idx < length - 1) {
			string += ', ';
		}
	});

	return string;
}

/*
 * ================ UNIT CONVERSIONS ================
 */
var toFromMeters = function(value, unit, toMeters) {
	var num = parseFloat(value);

	// Lazy but it works.

	switch (unit) {
		case "''":
		case "\"":
		case "in":
			if (toMeters)
				return num * inchInMmeters;
			else
				return num / inchInMmeters;
		case "'":
		case "ft":
			if (toMeters)
				return num * footInMeters;
			else
				return num / footInMeters;
		case "yd":
			if (toMeters)
				return num * yardInMeters;
			else
				return num / yardInMeters;
		case "mi":
			if (toMeters)
				return num * mileInMeters;
			else
				return num / mileInMeters;
		case "mm":
			if (toMeters)
				return num / Math.pow(10, 3);
			else
				return num * Math.pow(10, 3);
		case "cm":
			if (toMeters)
				return num / Math.pow(10, 2);
			else
				return num * Math.pow(10, 2);
		case "km":
			if (toMeters)
				return num * Math.pow(10, 3);
			else
				return num / Math.pow(10, 3);
		default:
			return num;
	}
}

var toFromGrams = function(value, unit, toGrams) {
	var num = parseFloat(value);

	// Lazy but it works.

	switch (unit) {
		case "oz":
			if (toGrams)
				return num * ounceInGrams;
			else
				return num / ounceInGrams;
		case "lb":
			if (toGrams)
				return num * poundInGrams;
			else
				return num / poundInGrams;
		case "st":
			if (toGrams)
				return num * stoneInGrams;
			else
				return num / stoneInGrams;
		case "mg":
			if (toGrams)
				return num / Math.pow(10, 3);
			else
				return num * Math.pow(10, 3);
		case "kg":
			if (toGrams)
				return num * Math.pow(10, 3);
			else
				return num / Math.pow(10, 3);
		default:
			return num;
	}
}

var unitConversion = function(inputArray, toUnit) {
	console.log("Unit Conversion: " + inputArray);

	// Input array format: number, unit, number, unit, etc.
	var length = inputArray.length;
	var lengths = lengthUnitSymbols.indexOf(toUnit) > -1;

	var value = 0;
	var unit = "";

	var inputBaseUnits = 0;
	var outputText = "";

	for (var idx = 0; idx < length - 1; idx += 2) {
		value = inputArray[idx];
		unit = inputArray[idx + 1];

		if (lengths) {
			inputBaseUnits += toFromMeters(value, unit, true);
		} else {
			inputBaseUnits += toFromGrams(value, unit, true);
		}

		outputText += value + " " + unit + " ";
	}

	var result = 0;

	if (lengths) {
		result = toFromMeters(inputBaseUnits, toUnit, false);
	} else {
		result = toFromGrams(inputBaseUnits, toUnit, false);
	}

	console.log("\t= " + result + " " + toUnit);

	return outputText + " = " + result.toFixed(2) + " " + toUnit;
}

/*
 * ============= STANDARD DICE =============
 */
var standardDice = function(rollerUsername, diceArray) {
	// TODO: Refactor into a separate function for reuse.

	console.log('Standard Dice: ' + diceArray);

	if (!diceArray) {
		return null;
	}

	// Index 0 is the whole message.
	var diceCount = parseInt(diceArray[1], 10);
	var diceSize = parseInt(diceArray[2], 10);
	var intMod = parseInt(diceArray[3], 10);

	var resultText = '';
	var total = 0;
	var diceRoll;

	// Minimum 1 die.
	diceCount = isNaN(diceCount) ? 1 : (diceCount < 1 ? 1 : diceCount);

	// Maximum 600 dice. Did some manual testing and it seems to be the limit on my machine.
	diceCount = diceCount > 600 ? 600 : diceCount;

	// Minimum size 2 die.
	diceSize = diceSize < 2 ? 2 : diceSize;

	// Default to +0.
	intMod = isNaN(intMod) ? 0 : intMod;

	var diceMsg = diceCount + 'd' + diceSize + '' + (intMod === 0 ? '' : (intMod > 0 ? '+' + intMod : intMod))
	console.log(rollerUsername + ' rolls: ' + diceMsg);

	while (diceCount > 0) {
		diceRoll = getRandomInt(1, diceSize);

		if (diceRoll === 1) {
			resultText += minMaxBold + diceRoll + minMaxBold;
		} else if (diceRoll === diceSize) {
			resultText += minMaxBold + diceRoll + minMaxBold;
		} else {
			resultText += diceRoll;
		}

		total += diceRoll;
		diceCount -= 1;

		if (diceCount > 0) {
			resultText += ', ';
		}
	}

	total += intMod;

	return resultText + '\n\t**' + rollerUsername.toUpperCase() + ' ROLLED:** ' + diceMsg + ' = [ **' + total + '** ]';
};

/*
 * ======== DND DICE ========
 */
var dndDice = function(rollerUsername, diceArray) {
	console.log('DnD Dice: ' + diceArray);

	if (!diceArray) {
		return null;
	}

	// Index 0 is the whole message.
	var diceCount = parseInt(diceArray[2], 10);
	var diceSize = parseInt(diceArray[3], 10);
	var intMod = parseInt(diceArray[4], 10);

	var resultText = '';
	var total = 0;
	var minMax = 0;
	var minDiceRoll;
	var maxDiceRoll = 0;
	var diceRoll;

	// Minimum 1 die.
	diceCount = isNaN(diceCount) ? 1 : (diceCount < 1 ? 1 : diceCount);

	// Maximum 600 dice. Did some manual testing and it seems to be the limit on my machine.
	diceCount = diceCount > 600 ? 600 : diceCount;

	// Minimum size 2 die.
	diceSize = diceSize < 2 ? 2 : diceSize;

	// Default to +0.
	intMod = isNaN(intMod) ? 0 : intMod;

	var intModText = intMod === 0 ? '' : (intMod > 0 ? '+' + intMod : intMod);

	// Push the minimum result to over the largest possible result of the first roll to make the first roll the minimum result.
	minDiceRoll = diceSize + 1;

	if (diceArray[1] == 'a') {
		minMax = 1;
	} else if (diceArray[1] == 'd') {
		minMax = -1;
	}

	// Minimum 2 dice with advantage/disadvantage.
	diceCount = minMax === 0 ? diceCount : (diceCount === 1 ? 2 : diceCount);

	var diceMsg = (undefined === diceArray[1] ? '' : diceArray[1]) + diceCount + 'd' + diceSize + '' + intModText;
	console.log(rollerUsername + ' rolls: ' + diceMsg);

	while (diceCount > 0) {
		diceRoll = getRandomInt(1, diceSize);

		if (diceRoll === 1 || diceRoll === diceSize) {
			resultText += minMaxBold + diceRoll + minMaxBold;
		} else {
			resultText += diceRoll;
		}

		if (minMax === 0) {
			total += diceRoll;
		} else if (minMax > 0) {
			maxDiceRoll = Math.max(diceRoll, maxDiceRoll);
		} else {
			minDiceRoll = Math.min(diceRoll, minDiceRoll);
		}

		diceCount -= 1;

		if (diceCount > 0) {
			resultText += ', ';
		}
	}

	resultText += '\n\t**' + rollerUsername.toUpperCase() + ' ROLLED';

	if (intMod === 0) {
		switch (minMax) {
			case 1:
				resultText += ' W/** ***ADV.*** : `' + diceMsg + '` = `[ ' + maxDiceRoll + ' ]`';
				console.log('\t= ' + maxDiceRoll);
				break;
			case -1:
				resultText += ' W/** ***DISADV.*** : `' + diceMsg + '` = `[ ' + minDiceRoll + ' ]`';
				console.log('\t= ' + minDiceRoll);
				break;
			default:
				resultText += ' :** `' + diceMsg + '` = `[ ' + total + ' ]`';
				console.log('\t= ' + total);
				break;
		}
	} else {
		switch (minMax) {
			case 1:
				resultText += ' W/** ***ADV.*** : `' + diceMsg + '` ─> `' + maxDiceRoll + intModText + '`';
				maxDiceRoll += intMod;
				resultText += ' = `[ ' + maxDiceRoll + ' ]`';
				console.log('\t= ' + maxDiceRoll);
				break;
			case -1:
				resultText += ' W/** ***DISADV.*** : `' + diceMsg + '` ─> `' + minDiceRoll + intModText + '`';
				minDiceRoll += intMod;
				resultText += ' = `[ ' + minDiceRoll + ' ]`';
				console.log('\t= ' + minDiceRoll);
				break;
			default:
				resultText += ' :** `' + diceMsg + '` ─> `' + total + intModText + '`';
				total += intMod;
				resultText += ' = `[ ' + total + ' ]`';
				console.log('\t= ' + total);
				break;
		}
	}
	return resultText;
};

/*
 * ===================== OLD UNSUPPORTED STUFF =====================
 */
var shuffle = function(array) {
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

var exaltedDice = function(message) {
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
			builder += minMaxBold + result + minMaxBold;
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

var wodDice = function(message) {
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
			builder += minMaxBold + result + minMaxBold;
		} else if (result >= again) {
			builder += '**' + result + '**';
		} else if (result >= 8) {
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

var fudgeDice = function() {
	var dice = 4;
	var diceSize = 3;
	var total = 0;
	var builder = '';
	var result;

	while (dice > 0) {
		result = Math.floor(Math.random() * diceSize);
		switch (result) {
			case 0:
				builder += '-';
				break;
			case 1:
				builder += ' ';
				break;
			case 2:
				builder += '+';
				break;
		}
		total += (result - 1);
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	return builder + '\n' + '**TOTAL: ' + total + '**';
};

var fateCards = function(message) {
	if (fateDeck.length === 0) {
		fateDeck = fateMasterDeck.slice(0);
		shuffle(fateDeck);
		mybot.reply(message, 'Fate Deck Shuffled');
	}
	return fateDeck.pop() + ', ' + fateDeck.length + ' cards remaining';
};

var fateCount = function() {
	var counts = {
		'-4' : 0,
		'-3' : 0,
		'-2' : 0,
		'-1' : 0,
		'0' : 0,
		'1' : 0,
		'2' : 0,
		'3' : 0,
		'4' : 0
	}, avg = 0, count = 0;
	fateDeck.forEach(function(result) {
		counts[result] += 1;
		avg += result;
		count++;
	});
	counts.average = (avg / count);
	return JSON.stringify(counts);
};

var shadowrunDice = function(message) {
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
			builder += minMaxBold + result + minMaxBold;
		} else if (result >= 6) {
			builder += '**' + result + '**';
		} else if (result >= 5) {
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

var oneRingDice = function(message) {
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
	return builder + '\n' + '**TOTAL: ' + (function() {
		if (success) {
			return ' AUTOMATIC SUCCESS';
		} else
			return total;
	})() + '**';
};

var l5rDice = function(message) {
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
		results.forEach(function(res, index) {
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

var initiativeHandler = function(message) {
	var raw = message.content.substr(1);
	var parts = raw.split(' ');
	var command = parts[0];
	var highest = -9999999;
	if (parts[1]) {
		if (parts[1].toLowerCase() === 'me' || parts[1].toLowerCase() === 'my') {
			parts[1] = message.author.username.replace(/ /g, '');
		}
	}
	if (parts[2]) {
		if (parts[2].toLowerCase() === 'me' || parts[2].toLowerCase() === 'my') {
			parts[2] = message.author.username.replace(/ /g, '');
		}
	}
	var sendMessage = function(msg) {
		mybot.reply(message, msg);
	};
	var decodeInitiative = function(str) {
		if (parseInt(str, 10).toString() !== 'NaN') {
			return parseInt(str, 10);
		} else {
			str = str.replace(/\**/g, '').replace(/\*/g, '');
			return parseInt(str, 10);
		}
	};
	var reset = function() {
		var oldTracker = JSON.parse(JSON.stringify(tracker));
		tracker = {};
		back.push(function(un) {
			if (un === 'undo') {
				tracker = oldTracker;
				sendMessage('Undoing reset');
			} else {
				tracker = {};
				sendMessage('Redoing reset');
			}
		});
	};
	var next = function() {
		var active = [];
		var oldActors = [];
		Object.keys(tracker).forEach(function(actor) {
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
			active.forEach(function(actor) {
				actor.acted = true;
				actor.motes = Math.min(actor.motes + 5, actor.maxmotes);
				output += ' ' + actor.name;
				if (actor.maxmotes > 0) {
					output += '(' + actor.motes + '/' + actor.maxmotes + ')';
				}
				output += ',';
			});
			output = output.replace(/,$/, '');
			sendMessage(output);
			back.push(function(un) {
				if (un === 'undo') {
					active.forEach(function(actor, index) {
						actor.acted = false;
						actor.motes = oldActors[index].motes;
					});
					sendMessage('Undoing next turn');
				} else {
					active.forEach(function(actor) {
						actor.acted = true;
						actor.motes = Math.min(actor.motes + 5, actor.maxmotes);
					});
					sendMessage('Redoing next turn');
				}
			});
		} else {
			sendMessage('NEW TURN');
			currentActors = [];
			Object.keys(tracker).forEach(function(actorId) {
				var actor = tracker[actorId];
				actor.acted = false;
			});
			list();
			back.push(function(un) {
				if (un === 'undo') {
					Object.keys(tracker).forEach(function(actorId) {
						var actor = tracker[actorId];
						actor.acted = true;
					});
					sendMessage('Undoing New Turn');
				} else {
					Object.keys(tracker).forEach(function(actorId) {
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
	var add = function() {
		var name = parts[1];
		var actor = {
			name : name,
			initiative : parseInt(parts[2], 10) || 0,
			motes : parseInt(parts[3], 10) || 0,
			maxmotes : parseInt(parts[3], 10) || 0,
			acted : false
		};
		tracker[name] = actor;
		back.push(function(un) {
			if (un === 'undo') {
				delete tracker[name];
				sendMessage('Deleting ' + name);
			} else {
				tracker[name] = actor;
				sendMessage('Readding ' + name);
			}
		});
	};
	var remove = function() {
		var actor = tracker[parts[1]];
		var name = actor.name;
		if (!!actor) {
			delete tracker[name];
			back.push(function(un) {
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
	var list = function() {
		var output = [], toPrint = '';
		Object.keys(tracker).forEach(function(name) {
			var actor = tracker[name];
			var data = '';
			var isActive = false;
			currentActors.forEach(function(act) {
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
				data += '(' + actor.motes + '/' + actor.maxmotes + ')';
			}
			if (isActive) {
				data += '**';
			} else if (actor.acted) {
				data += '*';
			}
			output.push(data);
		});
		output.sort(function(a, b) {
			return decodeInitiative(b.split(' ')[0]) - decodeInitiative(a.split(' ')[0])
		});
		output.forEach(function(val) {
			toPrint += val + '\n';
		});
		sendMessage('\n' + toPrint.replace(/\n$/, ''));
	};
	var set = function() {
		var trait = parts[2].toLowerCase() === 'init' ? 'initiative' : parts[2].toLowerCase();
		var oldValue = tracker[parts[1]][trait];
		var newValue = parseInt(parts[3], 10);
		var name = parts[1];
		tracker[name][trait] = newValue;
		back.push(function(un) {
			if (un === 'undo') {
				tracker[name][trait] = oldValue;
				sendMessage('Reset ' + name + '\'s ' + trait + ' to ' + oldValue);
			} else {
				tracker[name][trait] = newValue;
				sendMessage('Re-set ' + name + '\'s ' + trait + ' to ' + newValue);
			}
		});
	};
	var modify = function() {
		var trait = parts[2].toLowerCase() === 'init' ? 'initiative' : parts[2].toLowerCase();
		var oldValue = tracker[parts[1]][trait];
		var newValue = oldValue + parseInt(parts[3], 10);
		var name = parts[1];
		tracker[name][trait] = newValue;
		back.push(function(un) {
			if (un === 'undo') {
				tracker[name][trait] = oldValue;
				sendMessage('Reset ' + name + '\'s ' + trait + ' to ' + oldValue);
			} else {
				tracker[name][trait] = newValue;
				sendMessage('Re-set ' + name + '\'s ' + trait + ' to ' + newValue);
			}
		});
	};
	var withering = function() {
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
		back.push(function(un) {
			if (un === 'undo') {
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
	var check = function() {
		var name = parts[1];
		var output = tracker[name].initiative + ' ' + name + '(' + tracker[name].motes + '/' + tracker[name].maxmotes + ')';
		sendMessage(output);
	};
	var help = function() {
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
				// duel();
				break;
			case 'default':
				sendMessage('Not Recognized Command');
		}
	} catch (e) {
		sendMessage('INPUT ERROR');
	}
};

/*
 * =========== BOTTLE SPIN ===========
 */
var bottleSpin = function(message, mode) {
	console.log('Bottle Spin, mode: ' + mode);

	var resultText = 'The bottle points ';

	if (typeof mode === 'undefined') {
		resultText += ordinalCompassDirections[getRandomInt(0, 7)];
	} else if (sixteenWindCompassArguments.indexOf(mode) > -1) {
		resultText += sixteenWindDirections[getRandomInt(0, 15)];
	} else if (cardinalCompassArguments.indexOf(mode) > -1) {
		resultText += cardinalCompassDirections[getRandomInt(0, 3)];
	}

	if (resultText) {
		mybot.reply(message, resultText + '.');
	}
}

/*
 * ========= COIN FLIP =========
 */
var coinFlip = function(message, count) {
	console.log('Coin Flip: ' + count);

	var resultText = 'Coin Flip: ';

	if (count > 1) {
		resultText = 'Coin Flips: ';
	}

	var headsCount = 0;
	var tailsCount = 0;

	for (var i = 0; i < count; i++) {
		if (Math.random() >= 0.5) {
			resultText += 'H';
			headsCount++;
		} else {
			resultText += 'T';
			tailsCount++;
		}

		if (i < count - 1) {
			resultText += ', ';
		}
	}

	if (count != 1) {
		resultText += '\nHeads: ' + headsCount + ' | Tails: ' + tailsCount;
	}

	if (resultText) {
		mybot.reply(message, resultText);
	}
}

/*
 * ========== PARSE ROLL ==========
 */
var parseRoll = function(message, rollMessage) {
	var resultText;
	var rolls = rollMessage.split(',');

	rolls = null === rolls ? [rollMessage] : rolls;

	var length = rolls.length;

	console.log('rolls: ' + rolls);
	for (var i = 0; i < length; i++) {
		roll = rolls[i].trim();
		console.log('roll: ' + roll);

		switch (selectedGameIndex) {
			case 0:
				resultText = standardDice(message.author.username, roll.match(regexStdD));
				break;
			case 1:
				resultText = dndDice(message.author.username, roll.match(regexDND));
				break;
			default:
				console.log('<DD> Unsupported game \'' + selectedGameIndex + '\' selected!');
		}

		if (resultText) {
			mybot.reply(message, resultText);
		}
	}
}

/*
 * ===================== PARSE UNIT CONVERSION =====================
 */
var parseUnitConversion = function(message, inputString, toUnitSymbol) {
	// Remove all whitespace.
	// Convert to lower case.
	// Replace commas with periods for floating point numbers.
	// Split string by specific symbols.
	// Capture said symbols.
	// Remove the last element in the array which is empty.
	var data = inputString.replace(/\s+/g, '').toLowerCase().replace(',', '\.').split(regexConversionSymbols);
	console.log(data);
	data.splice(data.length - 1, 1);
	console.log(data);

	var resultText = unitConversion(data, toUnitSymbol);

	if (resultText) {
		mybot.reply(message, resultText);
	}
};

/*
 * ==================== DISCORD DICE COMMAND ====================
 */
var parseDiscordDiceCommand = function(message) {
	var args = message.content.substring(1).toLowerCase().split(' ');
	var msg;

	switch (args[0]) {
		case 'dd':
		case 'don':
		case 'dice':
		case 'ddice':
		case 'diceon':
		case 'startdice':
			if (activeChannels.indexOf(message.channel.id) === -1) {
				activeChannels.push(message.channel.id);
				console.log('<DD> Channel ID: ' + message.channel.id);
				msg = '<DD> Discord Dice enabled.';
			}
			break;

		case 'g':
			if (activeChannels.indexOf(message.channel.id) !== -1) {
				if (args.length > 1) {
					if (supportedGames.indexOf(args[1]) > -1) {
						selectedGameIndex = supportedGames.indexOf(args[1]);
						msg = '<DD> Using ' + supportedGamesNames[selectedGameIndex] + ' dice.';

						if (activeChannels.indexOf(message.channel.id) === -1) {
							activeChannels.push(message.channel.id);
							console.log('<DD> Discord Dice enabled @ ' + message.channel.id);
						}
					} else {
						msg = '<DD> Unknown game \'' + args[1] + '\'.';
					}
				} else {
					msg = '<DD> Please specify one of the supported games: ' + getSupportedGamesString();
				}
			}
			break;

		case 'doff':
		case 'nodice':
		case 'diceoff':
		case 'stopdice':
			var index = activeChannels.indexOf(message.channel.id);

			if (index !== -1) {
				console.log('<DD> Channel ID: ' + message.channel.id);

				if (selectedGameIndex !== -1) {
					msg = '<DD> Stopped playing ' + supportedGamesNames[selectedGameIndex] + ' dice.';
					mybot.reply(message, msg);
				}

				activeChannels.splice(index, 1);
				msg = '<DD> Discord Dice disabled.';
			}
			break;

		case 'bold':
		case 'bolds':
			if (activeChannels.indexOf(message.channel.id) === -1) {
				msg = '<DD> Disabled bolding ones and maximum dice results.';

				if ('**' === minMaxBold) {
					minMaxBold = '';
				} else {
					msg = '<DD> Enabled bolding ones and maximum dice results.';
					minMaxBold = '**';
				}
			}
			break;

		case 'cf':
		case 'fc':
		case 'coin':
		case 'flip':
		case 'coinflip':
		case 'flipcoin':
			if (activeChannels.indexOf(message.channel.id) !== -1) {
				var count = 1;

				if (args.length > 1) {
					count = parseInt(args[1]);

					// Limit to 1.
					count = count < 1 ? 1 : count;

					// Limit to 100.
					count = count > 100 ? 100 : count;
				}

				msg = coinFlip(message, count);
			}
			break;

		case 'bs':
		case 'sb':
		case 'bottle':
		case 'spin':
		case 'bottlespin':
		case 'spinbottle':
			if (activeChannels.indexOf(message.channel.id) !== -1) {
				msg = bottleSpin(message, args[1]);
			}
			break;

		default:
			msg = '<DD> Unknown command \'' + args[0] + '\'.';
	}

	if (typeof msg !== 'undefined') {
		console.log(msg);
		mybot.reply(message, msg);
	}
}

/*
 * ============ MAIN PROCESS ============
 */

var mainProcess = function() {
	mybot.on('message', function(message) {
		// Is the message a Discord Dice command?
		if (message.content.charAt(0) == '!') {
			parseDiscordDiceCommand(message);
		} else if (activeChannels.indexOf(message.channel.id) > -1) {
			// Else let regex do its magic.

			var unitConversionMessage = regexConversion.exec(message.content);

			// Only parse for roll messages of a game is selected.
			if (selectedGameIndex !== -1) {
				var rollMessage = regexRollMessage.exec(message.content);
			}

			if (unitConversionMessage) {
				parseUnitConversion(message, unitConversionMessage[1], unitConversionMessage[2]);
			} else if (rollMessage) {
				if (rollMessage[1].charAt(0) === '!') {
					initiativeHandler(message);
				} else {
					// Group 0 is the whole message, index 1 contains the actual roll message
					parseRoll(message, rollMessage[1]);
				}
			}
			// Else, normal chat message.
		}
	});

	mybot.login(config.email, config.password);
	console.log('<DD> Ready.');
};

if (!fs.existsSync('./config.json')) {
	fs.writeFileSync('./config.json', JSON.stringify({
		discord : {
			email : 'YOUR EMAIL',
			password : 'YOUR PASSWORD'
		}
	}).replace(/\r?\n|\r/g, ''));
}

config = require('./config.json').discord;

if (config.email === 'YOUR EMAIL') {
	var pw = true;
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	console.log('Enter your Discord Email Login: ');
	process.stdin.on('data', function(email) {
		if (pw) {
			pw = false;
			console.log('Enter your Discord Password: ');
		}
		process.stdin.on('data', function(password) {
			process.stdin.on('data', function() {
			});
			process.stdin.pause();
			config.email = email.replace(/\r?\n|\r/g, '');
			config.password = password.replace(/\r?\n|\r/g, '');
			fs.writeFileSync('./config.json', JSON.stringify({
				discord : config
			}).replace(/\r?\n|\r/g, ''));
			mainProcess();
		});
	});
} else {
	mainProcess();
}
