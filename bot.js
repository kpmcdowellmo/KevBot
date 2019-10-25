"use-strict";
//Import libraries
/*
 * Current bug with music playing feature is that playing livestreamed content has actually caused us to DDOS our own internet
 * connections. Not sure why this is, but it's super crazy. 
 */
const Discord = require("discord.js"),
  auth = require("./auth.json"),
  botModules = require("./Modules/kevBotMods.js"),
  request = require("request"),
  kevBot = new Discord.Client();

const botMsg = {
    ".godEmperor": botModules.theDon,
    ".Norris": botModules.chuckNorrisJoke,
    ".help": botModules.getHelp,
    ".play": botModules.checkStream
  },
  musicPlayerCommands = {
    ".skip": true,
    ".search": true,
    ".volume": true
  };

kevBot.login(auth.token); // Bot login

kevBot.music = require("discord.js-musicbot-addon");
kevBot.music.start(kevBot, {
  youtubeKey: auth.youtubeKey,
  botPrefix: "k."
}); // Initializes music search through youtube by listening for commands such as "k.play".

kevBot.on("ready", () => {
  console.log("KevBot Ready");
}); // Message displayed whenever the bot is finished initializing.

kevBot.on("message", message => { // Message listener.
  console.log(message.content);
  if (message.author.bot) {
    return;
  } else {
    if (message.content.substring(0, 2) == "k.") { // Checking if the message begins with "k." to determine when the bot is being utilized.
      let args = message.content.substring(1).split(" "), // Builds and array of arguments for the current command.
        cmd = args[0]; // Grabs the command from the list of arguments, which is always the first argument.
      args = args.splice(1);
      console.assert("USER COMMAND: ", cmd);
      if (botMsg[cmd]) {
        botMsg[cmd](message, args);
      } else if (!musicPlayerCommands[cmd]) {
        message.channel.send(
          'Invalid command entered. Please use "k.help" to get a list of commands.'
        );
      }
    }
  }
});

kevBot.on("error", err => {
  console.log("error", err);
});