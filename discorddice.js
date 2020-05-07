// Libraries.
const Discord = require('discord.js');
const fs = require('fs');

// Globals.
var bot;
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
 * Returns true if the bot is enabled on the specified channel.
 */
const botIsEnabled = function(channelID) {
	return activeChannels.indexOf(channelID) !== -1;
}

/**
 * Returns true if a game has been selected.
 */
const hasGameSelected = function() {
	return selectedGameIndex !== -1;
}

/**
 * Enables the bot on the specified channel and returns a chat message.
 */
const enableBot = function(channelID, user) {
	activeChannels += channelID;

	fs.writeFileSync('./config.json', JSON.stringify({
		discord : config,
		activeChannels : activeChannels,
		selectedGameIndex : selectedGameIndex
	}).replace(/\r?\n|\r/g, ''));

	console.log(user + ' enabled Discord Dice @ ' + channelID);
	
	return 'Discord Dice enabled.';
}

/**
 * Disables the bot on the specified channel and returns a chat message.
 */
const disableBot = function(channelID, user) {
	var msg = null;
	
	if (selectedGameIndex !== -1) {
		msg = 'Stopped playing ' + supportedGamesNames[selectedGameIndex] + " dice.\n";
	}

	msg += 'Discord Dice disabled.';
	
	activeChannels = activeChannels.replace(channelID, '');

	fs.writeFileSync('./config.json', JSON.stringify({
		discord : config,
		activeChannels : activeChannels,
		selectedGameIndex : selectedGameIndex
	}).replace(/\r?\n|\r/g, ''));
	
	console.log(user + ' disabled Discord Dice @ ' + channelID);
	
	return msg;
}

/**
 * Uses the bot the send a message to chat.
 */
const botMessage = function(message, messageText) {
	// Message is not undefined, null, and does not contain only whitespace.
	if (typeof messageText !== 'undefined' && messageText != null) {
		if (messageText.length > 2000) {
			message.reply("Result message too long. Try rolling less or smaller dice.");
		} else {
			message.reply(messageText);
		}
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

// TODO: Name after initiative roll.
// TODO: Nx rolls to repeat same roll.
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
	var resultText = "Results: " + (count > 100 ? toRollList(rollResults.slice(0, 100), 1, size) + "... (only showing first 100 results)" : toRollList(rollResults, 1, size)) + "\n\t**" + user.toUpperCase() + '** ROLLED ';
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
const parseRoll = function(message, rollMessage) {
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
				resultText = standardDice(message.author.username, roll.match(regexStdD));
				break;
			case 1:
				resultText = dndDice(message.author.username, roll.match(regexDND));
				break;
			default:
				console.log('Unsupported game \'' + selectedGameIndex + '\' selected!');
		}

		botMessage(message, resultText);
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

	// Bot on/off messages.
	switch (args[0]) {
		case 'dd':
		case 'ddice':
		case 'discorddice':
			if (botIsEnabled(channelID)) {
				msg = disableBot(channelID, user);
			} else {
				msg = enableBot(channelID, user);
			}
			break;

		case 'don':
		case 'dice':
		case 'diceon':
		case 'startdice':
			if (botIsEnabled(channelID)) {
				msg = 'Discord Dice is already enabled.';
			} else {
				msg = enableBot(channelID, user);
			}
			break;

		case 'doff':
		case 'nodice':
		case 'diceoff':
		case 'stopdice':
			if (botIsEnabled(channelID)) {
				msg = disableBot(channelID, user);
			} else {
				msg = 'Discord Dice is already disabled.';
			}
			break;

		case 'bold':
		case 'bolds':
		case 'bolding':
			if (botIsEnabled(channelID)) {
				msg = 'Disabled bolding ones and maximum dice results.';
		
				if ('**' === minMaxBold) {
					minMaxBold = '';
				} else {
					msg = 'Enabled bolding ones and maximum dice results.';
					minMaxBold = '**';
				}
			}
			break;

		case 'g':
		case 'game':
			if (botIsEnabled(channelID)) {
				if (args.length > 1) {
					if (supportedGames.indexOf(args[1]) > -1) {
						selectedGameIndex = supportedGames.indexOf(args[1]);
							
						fs.writeFileSync('./config.json', JSON.stringify({
							discord : config,
							activeChannels : activeChannels,
							selectedGameIndex : selectedGameIndex
						}).replace(/\r?\n|\r/g, ''));
						
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
	
		case 'cf':
		case 'fc':
		case 'coin':
		case 'flip':
		case 'coinflip':
		case 'flipcoin':
			if (botIsEnabled(channelID)) {
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
			if (botIsEnabled(channelID)) {
				msg = bottleSpin(args[1]);
			}
			break;
	
		case 'i':
		case 'in':
		case 'it':
		case 'ini':
		case 'init':
		case 'initiative':
			if (botIsEnabled(channelID)) {
				if (hasGameSelected()) {
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
	bot = new Discord.Client();

	bot.on('message', message => {
		var chatMessage;

		// Is the message a Discord Dice command?
		if (message.content.charAt(0) == '!') {
			chatMessage = parseDiscordDiceCommand(message.author.username, message.channel.id, message.content);
		} else if (activeChannels.indexOf(message.channel.id) > -1) {
			// Else let regex do its magic.

			var unitConversionMessage = regexConversion.exec(message.content);

			// Only parse for roll messages of a game is selected.
			if (selectedGameIndex !== -1) {
				var rollMessage = regexRollMessage.exec(message.content);
			}

			if (unitConversionMessage) {
				chatMessage = parseUnitConversion(unitConversionMessage[1], unitConversionMessage[2]);
			} else if (rollMessage) {
				/*
				 * Group 0 is the whole message, index 1 contains the actual roll message(s). Doesn't return anything because there may be multiple rolls.
				 */
				parseRoll(message, rollMessage[1]);
			}
			// Else, normal chat message.
		}

		// Will not send anything if the message is undefined or empty.
		botMessage(message, chatMessage);
	});

	bot.on('ready', () => {
		console.log(`Ready | ${bot.user.tag}!`);
	  
		if (selectedGameIndex !== -1) {
			console.log('Using ' + supportedGamesNames[selectedGameIndex] + ' dice.');
		}
	});
	
	bot.on('disconnect', function(msg, code) {
	    if (code === 0){
	    	return console.error(msg);
	    }
	    
	    console.log("Discord Dice tried to disconnect.");
	    bot.login(config.token);
	});

	bot.login(config.token);
};

if (!fs.existsSync('./config.json')) {
	fs.writeFileSync('./config.json', JSON.stringify({
		discord: {
			token: 'YOUR TOKEN'
		}
	}).replace(/\r?\n|\r/g, ''));
}

config = require('./config.json').discord;
activeChannels = require('./config.json').activeChannels || '';
selectedGameIndex = require('./config.json').selectedGameIndex;
selectedGameIndex = isNaN(selectedGameIndex) ? -1 : selectedGameIndex;

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
		console.log("Configured.");
		mainProcess();
	});
} else {
	console.log("Configured.");
	mainProcess();
}
