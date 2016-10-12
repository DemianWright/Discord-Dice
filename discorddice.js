/*
 * Miscellaneous.
 */
const Discord = require('discord.io');
const fs = require('fs');

var mybot;

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
const regexRollMessage = /^\/?r?\s?\(?(.*d\d+.*)\)?$/i;
const regexModifiers = /([+-]\s?\d*)/gi;

const regexDND = /^([ad]?)\s?(\d*)d(\d+)\s?([+-].+)*$/i;
const regexStdD = /^(\d+)?d(\d+)\s?([+-]\d+)?$/i;
// TODO: Eldritch.

// var supportedGames = ['stdd','ex','or','sr','dnd','l5r','wod']
// var supportedGamesNames = ['Standard', 'Exalted', 'The One Ring', 'Shadowrun', 'Dungeons & Dragons', 'Legend of the Five Rings', 'World of Darkness'];
const gidxStdd = 0;
const gidxDnd = 1;
const supportedGames = ['stdd', 'dnd']
const supportedGamesNames = ['Standard', 'Dungeons & Dragons'];

var selectedGameIndex = -1;

// Unsupported for now.
const regexExalted = /^\d+?e/i;
const regexWOD = /^\d+?w/i;
const regexShadowrun = /^\d+?s/i;
const regexL5R = /^\d+?k/i;
const regexOneRing = /^\d+?r/i;

/*
 * Unit conversions.
 */
const regexConversionSymbols = /(mm|cm|m|km|in|"|''|ft|'|yd|mi|mg|g|kg|oz|lb|st)/;
const regexConversion = /^\/?c?\s?\(?(.*\d+\s?(?:mm|cm|m|km|in|"|''|ft|'|yd|mi|mg|g|kg|oz|lb|st))\s?(?:to|in|as|>|=)\s?(mm|cm|m|km|in|"|''|ft|'|yd|mi|mg|g|kg|oz|lb|st)\)?$/i;
const regexValueSymbols = /(?:(\d*(?:,|\.)?\d+)\s?(mm|cm|m|km|in|"|''|ft|'|yd|mi|mg|g|kg|oz|lb|st)\s?)+$/i;

const lengthUnitSymbols = ['mm', 'cm', 'm', 'km', 'in', '"', "''", 'ft', "'", 'yd', 'mi'];

const inchInMmeters = 0.0254;
const footInMeters = 0.3048;
const yardInMeters = 0.9144;
const mileInMeters = 1609.344;

const weigthUnitSymbols = ['mg', 'g', 'kg', 'oz', 'lb', 'st'];

const ounceInGrams = 28.349523125;
const poundInGrams = 453.59237;
const stoneInGrams = 6350.29318;

/*
 * Bottle spinning.
 */
const sixteenWindCompassArguments = ['h', '16', 'half'];
const cardinalCompassArguments = ['c', 'cardinal'];
const cardinalCompassDirections = ['north', 'east', 'south', 'west'];
const ordinalCompassDirections = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
const sixteenWindDirections = ['north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest'];

/*
 * DnD
 */

var recordInitiatives = false;
var initiatives;

/*
 * Other features.
 */

const gamesSupportingInitiatives = [gidxDnd];

/*
 * Helper functions.
 */

/**
 * Uses the bot the send a message to chat.
 */
const botMessage = function(channelID, messageText) {
	// Message is not undefined, null, or contains only whitespace.
	if (typeof messageText !== 'undefined' && messageText != null) {
		mybot.sendMessage({
			to : channelID,
			message : messageText
		});
	}
}

/**
 * Returns a random integer in range [min, max].
 */
const getRandomInt = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a string containing the elements of the array in a comma separated list.
 */
const arrayToString = function(array) {
	var string = '';
	const length = array.length;

	array.forEach(function(item, idx) {
		string += item;

		if (idx < length - 1) {
			string += ', ';
		}
	});

	return string;
}

/**
 * Returns a string containing the names and codes of the specified games in a comma separated list.
 */
const toGameList = function(arrayOfGameIndices) {
	var string = '';

	if (arrayOfGameIndices === null) {
		var length = supportedGames.length;

		supportedGames.forEach(function(code, idx) {
			string += supportedGamesNames[idx] + ' (' + code + ')';

			if (idx < length - 1) {
				string += ', ';
			}
		});
	} else{
		var length = arrayOfGameIndices.length;

		arrayOfGameIndices.forEach(function(gidx, idx) {
			string += supportedGamesNames[gidx] + ' (' + supportedGames[gidx] + ')';

			if (idx < length - 1) {
				string += ', ';
			}
		});
	}

	return string;
}

/**
 * Returns the specified string without any whitespace characters and in all lower case letters.
 */
const stripWhitespaceToLowerCase = function(str) {
	return str != null && str.replace(/\s+/g, '').toLowerCase();
}

/**
 * Returns the specified number of random integers generated in the inclusive range [minValue, maxValue].
 */
const getRandomInts = function(count, minValue, maxValue) {
	var values = [];

	for(var i = 0; i < count; i++) {
		values.push(getRandomInt(minValue, maxValue));
	}

	return values;
}

/**
 * Returns a string containing the specified roll values in a comma separated list with the minimum and maximum values bolded.
 */
const toRollList = function(rollValues, minValue, maxValue) {
	var string = '';
	const lastIndex = rollValues.length - 1;

	rollValues.forEach(function(val, idx) {
		if (val === minValue || val === maxValue) {
			string += minMaxBold + val + minMaxBold;
		} else {
			string += val;
		}

		if (idx < lastIndex) {
			string += ', ';
		}		
	});

	return string;
}

/**
 * Returns the sum of all values in a numeric array.
 */
const arraySum = function(arr){
	// How is it that Javascript doesn't have something like this by default?
	var sum = 0;

	for(var idx = arr.length; idx; sum += arr[--idx]);

	return sum;
};

/**
 * Returns the sum of all values in an array of strings representing integers.
 */
const intStringArraySum = function(strArr) {
	var sum = 0;

	strArr.forEach(function(str){
		sum += parseInt(str);
	});

	return sum;
};

/*
 * ================ UNIT CONVERSIONS ================
 */
const toFromMeters = function(value, unit, toMeters) {
	const num = parseFloat(value);

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

const toFromGrams = function(value, unit, toGrams) {
	const num = parseFloat(value);

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

const unitConversion = function(inputArray, toUnit) {
	console.log("Unit Conversion: " + inputArray);

	// Input array format: number, unit, number, unit, etc.
	const length = inputArray.length;
	const lengths = lengthUnitSymbols.indexOf(toUnit) > -1;

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
const standardDice = function(user, diceArray) {
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
	console.log(user + ' rolls: ' + diceMsg);

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

	return resultText + '\n\t**' + user.toUpperCase() + '** ROLLED  :  ' + diceMsg + ' = [ **' + total + '** ]';
};

/*
 * ======== DND DICE ========
 */
const initiativesSorter = function(a, b) {
	// Largest first.
	return b[0] - a[0]
}

const getInitiatives = function() {
	var output = '**INITIATIVES**\n';
	const length = initiatives.length;

	if (length > 0) {
		initiatives.sort(initiativesSorter);

		initiatives.forEach(function(item, idx) {
			output += item[0] + ': ' + item[1] + "\n";
		});		
	} else {
		output += '–';
	}

	return output;
}

const dndDice = function(user, diceArray) {
	if (!diceArray) {
		return null;
	}

	// Index 0 is the whole message.
	const highLow = diceArray[1].toLowerCase();
	var count = parseInt(diceArray[2], 10);
	var size = parseInt(diceArray[3], 10);
	var modStr = undefined === diceArray[4] ? null : diceArray[4];

	// Minimum 1 die.
	count = isNaN(count) ? 1 : (count < 1 ? 1 : count);

	// Maximum 1000 dice. The message may fail to post if rolling too many dice.
	count = count > 1000 ? 1000 : count;

	// Minimum size 2 die.
	size = size < 2 ? 2 : size;

	var minMax;

	if (highLow === 'a') {
		minMax = 1;
	} else if (highLow === 'd') {
		minMax = -1;
	} else {
		minMax = 0;
	}

	// Minimum 2 dice with advantage/disadvantage.
	count = minMax === 0 ? count : (count === 1 ? 2 : count);

	console.log(user + " rolls DnD Dice\n\tHigh/Low: " + highLow + "\n\tCount: " + count + "\n\tSize: " + size + "\n\tMod: " + modStr);

	// Resolve initial roll.

	var rollResults = getRandomInts(count, 1, size);
	var resultText = toRollList(rollResults, 1, size) + "\n\t**" + user.toUpperCase() + '** ROLLED ';
	var total = 0;

	if (recordInitiatives) {
		resultText += 'INITIATIVE ';
	}

	if (minMax === 0) {
		total = arraySum(rollResults);
	} else if (minMax > 0) {
		total = Math.max.apply(null, rollResults);
		resultText += 'W/ ADV. ';
	} else {
		total = Math.min.apply(null, rollResults);
		resultText += 'W/ DISADV. ';
	}

	resultText += ': `' + highLow + count + 'd' + size;

	// Resolve modifiers.

	if (modStr !== null) {
		var valString = stripWhitespaceToLowerCase(modStr);
		var value = intStringArraySum(valString.match(regexModifiers));
		var sign = value < 0 ? '' : '+'; 

		resultText += valString + '` ─> `' + total + sign + value;
		total += value
	}

	resultText += '` = `[ ' + total + ' ]`';

	if (recordInitiatives) {
		initiatives.push([total, user]);
	}

	console.log('\n\t= ' + total);

	return resultText;
};

/*
 * ===================== OLD UNSUPPORTED STUFF =====================
 */
var shuffle = function(array) {
	var rentIndex = array.length, temporaryValue, randomIndex;

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

var owodDice = function(message) {
	var dice = message.match(/([0-9]+)o/);
	var diff = message.match(/o([0-9]+)/);
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
	if (diff) {
		diff = parseInt(again[1], 10);
	} else {
		diff = 6;
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
		if (result >= diff) {
			successes += 1;
		}
		if (result === 1) {
			successes -= 1;
			builder += boldOnes + result + boldOnes;
		} else if (result >= diff) {
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
	return builder + '\n' + '**SUCCESSES: ' + successes + '**';
};

var baseDice = function(message) {
	var dice;
	var diceSize;
	var total = 0;
	var builder = '';
	var result;
	var parts = message.split('+')
	parts.forEach(function(part, index) {
		dice = part.match(/([0-9]+)d([0-9]+)/);
		if (dice) {
			diceSize = parseInt(dice[2], 10);
			dice = parseInt(dice[1], 10);
		} else {
			dice = 0;
			total += parseInt(part);
		}
		while (dice > 0) {
			result = Math.floor(Math.random() * diceSize);
			if (result === 0) {
				result = diceSize;
			}
			if (result === 1) {
				builder += boldOnes + result + boldOnes;
			} else if (result === diceSize) {
				builder += '**' + result + '**';
			} else {
				builder += result;
			}
			total += result;
			dice -= 1;
			if (dice > 0 || index < parts.length - 1) {
				builder += ',';
			}
		}
	});

	return builder + '\n' + '**TOTAL: ' + total + '**';
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

var starWarsDice = function(message) {
	var dice = message.match(/sw([a-zA-Z]+)/);
	var result;
	var results = {};
	var builder = '';
	var dieTypes = {
			b : ['', '', 's', 'sa', 'aa', 'a'],
			s : ['', '', 'f', 'f', 't', 't'],
			a : ['', 's', 's', 'ss', 'a', 'a', 'as', 'aa'],
			d : ['', 'f', 'ff', 't', 't', 't', 'tt', 'ft'],
			p : ['', 's', 's', 'ss', 'ss', 'a', 'as', 'as', 'as', 'aa', 'aa', 'r'],
			c : ['', 'f', 'f', 'ff', 'ff', 't', 't', 'ft', 'ft', 'tt', 'tt', 'e'],
			f : ['d', 'd', 'd', 'd', 'd', 'd', 'dd', 'l', 'l', 'll', 'll', 'll']
	}
	if (dice) {
		dice = dice[1].split('');
	}
	while (dice.length > 0) {
		result = Math.floor(Math.random() * dieTypes[dice[0]].length);
		result = dieTypes[dice[0]][result].split('');

		result.forEach(function(r) {
			switch (r) {
				case 's':
					if (!results.successes) {
						results.successes = 1;
					} else {
						results.successes += 1;
					}
					break;
				case 'a':
					if (!results.advantages) {
						results.advantages = 1;
					} else {
						results.advantages += 1;
					}
					break;
				case 'r':
					if (!results.triumphs) {
						results.triumphs = 1;
					} else {
						results.triumphs += 1;
					}
					break;
				case 'f':
					if (!results.failures) {
						results.failures = 1;
					} else {
						results.failures += 1;
					}
					break;
				case 't':
					if (!results.threats) {
						results.threats = 1;
					} else {
						results.threats += 1;
					}
					break;
				case 'e':
					if (!results.despirs) {
						results.despairs = 1;
					} else {
						results.despairs += 1;
					}
					break;
				case 'l':
					if (!results.light) {
						results.light = 1;
					} else {
						results.light += 1;
					}
					break;
				case 'd':
					if (!results.light) {
						results.light = 1;
					} else {
						results.light += 1;
					}
					break;
			}
		});

		dice.shift();
	}
	return JSON.stringify(results, null, 4).replace('{', '').replace('\n}', '').replace(/"/g, '');
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

var initiativeHandler = function(message, user) {
	var raw = message.substr(1);
	var parts = raw.split(' ');
	var command = parts[0];
	var highest = -9999999;
	if (parts[1]) {
		if (parts[1].toLowerCase() === 'me' || parts[1].toLowerCase() === 'my') {
			parts[1] = user.username.replace(/ /g, '');
		}
	}
	if (parts[2]) {
		if (parts[2].toLowerCase() === 'me' || parts[2].toLowerCase() === 'my') {
			parts[2] = user.username.replace(/ /g, '');
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
const bottleSpin = function(mode) {
	console.log('Bottle Spin, mode: ' + mode);

	var resultText = 'The bottle points ';

	if (typeof mode === 'undefined') {
		resultText += ordinalCompassDirections[getRandomInt(0, 7)] + '.';
	} else if (sixteenWindCompassArguments.indexOf(mode) > -1) {
		resultText += sixteenWindDirections[getRandomInt(0, 15)] + '.';
	} else if (cardinalCompassArguments.indexOf(mode) > -1) {
		resultText += cardinalCompassDirections[getRandomInt(0, 3)] + '.';
	} else {
		resultText = "Invalid bottle spin mode, please use one of the following.\n\tCardinal directions: " + arrayToString(cardinalCompassArguments) + "\n\tCardinal or ordinal directions: *nothing*\n\tSixteen winds directions: " + arrayToString(sixteenWindCompassArguments);
	}

	return resultText;
}

/*
 * ========= COIN FLIP =========
 */
const coinFlip = function(count) {
	console.log('Coin Flip: ' + count);

	var resultText = 'Coin Flip: ';

	// If count is greater than 1 or NaN.
	if (Math.abs(count) > 1) {
		resultText = 'Coin Flips: ';

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

		resultText += '\nHeads: ' + headsCount + ' | Tails: ' + tailsCount;
	} else {
		resultText += Math.random() >= 0.5 ? 'Heads' : 'Tails';
	}

	return resultText;
}

/*
 * ========== PARSE ROLL ==========
 */
const parseRoll = function(channelID, user, rollMessage) {
	var resultText;
	var rolls = rollMessage.split(',');

	rolls = null === rolls ? [rollMessage] : rolls;

	const length = rolls.length;

	console.log('rolls: ' + rolls);

	for (var i = 0; i < length; i++) {
		roll = rolls[i].trim();
		console.log('roll: ' + roll);

		switch (selectedGameIndex) {
			case 0:
				resultText = standardDice(user, roll.match(regexStdD));
				break;
			case 1:
				resultText = dndDice(user, roll.match(regexDND));
				break;
			default:
				console.log('Unsupported game \'' + selectedGameIndex + '\' selected!');
		}

		botMessage(channelID, resultText);
	}
}

/*
 * ===================== PARSE UNIT CONVERSION =====================
 */
const parseUnitConversion = function(inputString, toUnitSymbol) {
	// Remove all whitespace.
	// Convert to lower case.
	// Replace commas with periods for floating point numbers.
	// Split string by specific symbols.
	// Capture said symbols.
	var data = inputString.replace(/\s+/g, '').toLowerCase().replace(',', '\.').split(regexConversionSymbols);

	// Remove the last element in the array which is empty.
	data.splice(data.length - 1, 1);

	return unitConversion(data, toUnitSymbol);
};

/*
 * ==================== DISCORD DICE COMMAND ====================
 */
const parseDiscordDiceCommand = function(user, channelID, message) {
	var args = message.substring(1).toLowerCase().split(' ');
	var msg = '';

	switch (args[0]) {
		case 'dd':
		case 'don':
		case 'dice':
		case 'ddice':
		case 'diceon':
		case 'startdice':
			if (activeChannels.indexOf(channelID) === -1) {
				activeChannels += channelID;

				fs.writeFileSync('./config.json', JSON.stringify({
					discord : config,
					activeChannels : activeChannels
				}).replace(/\r?\n|\r/g, ''));

				console.log(user + ' enabled Discord Dice @ ' + channelID);
				msg = 'Discord Dice enabled.';
			}
			break;

		case 'g':
			if (activeChannels.indexOf(channelID) !== -1) {
				if (args.length > 1) {
					if (supportedGames.indexOf(args[1]) > -1) {
						selectedGameIndex = supportedGames.indexOf(args[1]);
						msg = 'Using ' + supportedGamesNames[selectedGameIndex] + ' dice.';

						if (activeChannels.indexOf(channelID) === -1) {
							activeChannels += channelID;
							console.log(user + ' enabled Discord Dice @ ' + channelID);
						}

						console.log(msg);
					} else {
						msg = 'Unknown game \'' + args[1] + '\'.';
					}
				} else {
					msg = 'Please specify one of the supported games: ' + toGameList(null);
				}
			}
			break;

		case 'doff':
		case 'nodice':
		case 'diceoff':
		case 'stopdice':
			var index = activeChannels.indexOf(channelID);

			if (index !== -1) {
				console.log('Channel ID: ' + channelID);

				if (selectedGameIndex !== -1) {
					msg = 'Stopped playing ' + supportedGamesNames[selectedGameIndex] + " dice.\n";
				}

				activeChannels = activeChannels.replace(channelID, '');
				msg += 'Discord Dice disabled.';

				console.log(msg);

				fs.writeFileSync('./config.json', JSON.stringify({
					discord : config,
					activeChannels : activeChannels
				}).replace(/\r?\n|\r/g, ''));
			}
			break;

		case 'bold':
		case 'bolds':
			if (activeChannels.indexOf(channelID) === -1) {
				msg = 'Disabled bolding ones and maximum dice results.';

				if ('**' === minMaxBold) {
					minMaxBold = '';
				} else {
					msg = 'Enabled bolding ones and maximum dice results.';
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
			if (activeChannels.indexOf(channelID) !== -1) {
				var count = 1;

				if (args.length > 1) {
					count = parseInt(args[1]);

					// Limit to 1.
					count = count < 1 ? 1 : count;

					// Limit to 100.
					count = count > 100 ? 100 : count;
				}

				msg = coinFlip(count);
			}
			break;

		case 'bs':
		case 'sb':
		case 'bottle':
		case 'spin':
		case 'bottlespin':
		case 'spinbottle':
			if (activeChannels.indexOf(channelID) !== -1) {
				msg = bottleSpin(args[1]);
			}
			break;

		case 'i':
		case 'in':
		case 'it':
		case 'ini':
		case 'init':
			if (activeChannels.indexOf(channelID) !== -1 && selectedGameIndex !== -1) {
				if (gamesSupportingInitiatives.indexOf(selectedGameIndex) > -1) {
					if (recordInitiatives) {
						msg = getInitiatives();
						recordInitiatives = false;
					} else {
						recordInitiatives = true;
						initiatives = [];
						msg = 'All rolls from now on will be recorded as initiatives. Use the initiative command again to print the list of initiatives and stop recording rolls.';
					}
				} else {
					msg = 'The currently selected game (' + supportedGamesNames[selectedGameIndex] + ') does not support initiative rolls.';
				}
			} else {
				msg = 'Please select one of the supported games before using this command: ' + toGameList(gamesSupportingInitiatives);
			}
			break;

		default:
			msg = 'Unknown command \'' + args[0] + '\'.';
	}

	return msg;
}

/*
 * ============ MAIN PROCESS ============
 */
const mainProcess = function() {
	mybot = new Discord.Client({
		token : config.token,
		autorun : true
	});

	mybot.on('message', function(user, userID, channelID, message) {
		var chatMessage;

		// Is the message a Discord Dice command?
		if (message.charAt(0) == '!') {
			chatMessage = parseDiscordDiceCommand(user, channelID, message);
		} else if (activeChannels.indexOf(channelID) > -1) {
			// Else let regex do its magic.

			var unitConversionMessage = regexConversion.exec(message);

			// Only parse for roll messages of a game is selected.
			if (selectedGameIndex !== -1) {
				var rollMessage = regexRollMessage.exec(message);
			}

			if (unitConversionMessage) {
				chatMessage = parseUnitConversion(unitConversionMessage[1], unitConversionMessage[2]);
			} else if (rollMessage) {
				/*
				 * Group 0 is the whole message, index 1 contains the actual roll message(s). Doesn't return anything because there may be multiple rolls.
				 */
				parseRoll(channelID, user, rollMessage[1]);
			}
			// Else, normal chat message.
		}

		// Will not send anything if the message is undefined or empty.
		botMessage(channelID, chatMessage);
	});
};

if (!fs.existsSync('./config.json')) {
	fs.writeFileSync('./config.json', JSON.stringify({
		discord : {
			token : 'YOUR TOKEN'
		}
	}).replace(/\r?\n|\r/g, ''));
}

config = require('./config.json').discord;
activeChannels = require('./config.json').activeChannels || '';

if (config.token === 'YOUR TOKEN') {
	var pw = true;
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	console.log('Enter your Discord Bot Token: ');
	process.stdin.on('data', function(token) {
		config.token = token.replace(/\r?\n|\r/g, '');
		fs.writeFileSync('./config.json', JSON.stringify({
			discord : config
		}).replace(/\r?\n|\r/g, ''));
		mainProcess();
	});
} else {
	mainProcess();
}
