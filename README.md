# Discord Dice #
A node.js based dice rolling application for Discord.

## Discord Dice Commands ##
To send a Discord Dice command add an exclamation mark (!) to the beginning of the message.
Dice rolling commands have their own message format.
All commands are case-insensitive.

Commands | Description
---------|------------
`dd`<br />`ddice`<br />`discorddice` | Toggles Discord Dice on/off.
`don`<br />`dice`<br />`diceon`<br />`startdice` | Starts Discord Dice and listen to commands.
`doff`<br />`nodice`<br />`diceoff`<br />`stopdice` | Stops Discord Dice and only listen for a start/stop/toggle command.
`bold`<br/>`bolds`<br/>`bolding` | Toggles bolding 1 and maximum dice values in dice results.
`bs` *mode*<br />`sb` *mode*<br />`bottle` *mode*<br />`spin` *mode*<br />`bottlespin` *mode*<br />`spinbottle` *mode* | Spin a bottle once to randomly generate a compass direction. An optional mode argument may be provided.
Bottle spin mode: *none* | Generates a cardinal or ordinal / intercardinal direction. (E.g. north or northeast)
Bottle spin mode: `c` or `cardinal` | Generates a cardinal direction. (E.g. north or east)
Bottle spin mode: `h`, `16`, or `half` | Generates a cardinal or ordinal direction or one of the eight half winds. (E.g. north, northeast, or north-northeast)
`cf`<br />`fc`<br />`coin`<br />`flip`<br />`coinflip`<br />`flipcoin` | Flips a minimum of 1 or a maximum of 100 coins at once. (Value clamped to bounds.)
`g`<br />`game` | Lists supported games.
`g` *name*<br />`game` *name*| Starts playing the specified game.

## Rolling Dice ##
Once a game has been started, to perform a dice roll send a message in any one of the following formats.
`<roll>` stands for a game-specific roll message format described later.
All spaces in the commands below are optional: `r <roll>` and `r<roll>` are equivalent.

    /r (<roll>)
    /r <roll>
    / <roll>
    r <roll>
     (<roll>)
     <roll>



### Supported Games ###
Use these game names with the game command.

Name | Description
-----|------------
`stdd` | Standard dice with with support for a +/- modifier on the final result.
`dnd`  | Dungeons & Dragons. Supports final result modifier, advantage and disadvantage rolls.

# Legend #
A legend of symbols used in the message formats.
If a value is given for a symbol that is smaller or greater than the specified minimum or maximum value, the given value is set the minimum or maximum value respectively.

Symbol | Description
-------|--------------
X       | The number of dice to roll. Minimum 1, maximum 600.
Y       | The number of faces on the dice to roll. Minimum 2, no maximum limit. If less than 2 is given, 2 is used.
+Z / -Z | The number to add or remove from the final roll result. No limits.
d       | Stands for the literal character 'd' or 'D'.

# Games #
## Standard Dice (stdd) ##
The space before the modifier is optional: `XdY +Z` and `XdY+Z` are equivalent.
Roll message formats:

    XdY
    XdY +Z
    XdY -Z
    dY
    dY +Z
    dY -Z

### Examples ###
The full chat message for a roll could be for example `/r1d6`, `2d20+10`, or `(2d12 -1)`.

Roll Message | Description
-------------|------------
`d1`         | Roll one two-sided die. You can throw a minimum of one die and a die can have a minimum of two faces.) Final result will be either 1 or 2.
`1d6`        | Roll one six-sided die. Final result will be between 1 and 6.
`3d12`       | Roll three 12-sided dice and count the sum of the results. Final result will be between 3 and 36.
`2d20 +5`    | Roll two 20-sided dice, count the sum of the results, and add five to it. Final result will be between 7 and 45.
`1d8-4`      | Roll one eight-sided and remove four from the result. Final result will be between -3 and 4.

## Dungeons & Dragons (dnd) ##
Roll message formats:

    Same as all Standard Dice roll messages.

### Advantage Rolls ###
Advantage rolls only take the highest die result into the final result.
The are done by prefixing the standard roll message with `a`. (Case in-sensitive.)
When doing an advantage roll, you must roll a minimum of two dice.
If less dice are provided (or no number at all) two dice are rolled.

The space before the modifier is optional: `aXdY +Z` and `aXdY+Z` are equivalent.
Roll message formats:

    aXdY
    aXdY +Z
    aXdY -Z
    adY
    adY +Z
    adY -Z

#### Examples ####
The full chat message for an advantage roll could be for example `/ a3d8` or `rad20`.

Roll Message | Description
-------------|------------
`ad20`       | Roll two 20-sided dice and take the highest result. Final result will be between 1 and 20.
`a3d10-4`    | Roll three 10-sided dice, take the highest result, and subtract four from it. Final result will be between -1 and 6.

### Disadvantage Rolls ###
Disadvantage rolls only take the lowest die result into the final result.
The are done by prefixing the standard roll message with `d`. (Case in-sensitive.)
When doing a disadvantage roll, you must roll a minimum of two dice.
If less dice are provided (or no number at all) two dice are rolled.

The space before the modifier is optional: `ddY -Z` and `ddY-Z` are equivalent.
Roll message formats:

    dXdY
    dXdY +Z
    dXdY -Z
    ddY
    ddY +Z
    ddY -Z

#### Examples ####
The full chat message for an advantage roll could be for example `d2d8-2` or `r d3d12`.

Roll Message | Description
-------------|------------
`d2d12`      | Roll two 12-sided dice and take the lowest result. Result will be between 1 and 12.
`d4d6 +1`    | Roll four six-sided dice, take the lowest result, and add one to it. Result will be between 2 and 7.
