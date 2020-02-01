const request = require("request"),
  twitterAuth = require("../twitterauth.json"),
  Twitter = require("twitter"),
  auth = require("../auth.json")
  botMessages = require("../kevbotMessage.json"),
  ytsr = require("ytsr"),
  ytdl = require("ytdl-core");

const TwitterAPI = new Twitter({
  consumer_key: twitterAuth.consumer_key,
  consumer_secret: twitterAuth.consumer_secret,
  access_token_key: twitterAuth.access_token_key,
  access_token_secret: twitterAuth.access_token_secret
});

const Discord = require("discord.js"),
  auth = require("./auth.json"),
  botModules = require("./Modules/kevBotMods.js"),
  request = require("request"),
  kevBot = new Discord.Client();

  const botMsgEnum = {
    ".godEmperor": "theDon",
    ".Norris": "chuckNorrisJoke",
    ".help": "getHelp",
    ".play": "checkStream",
    ".skip": true, // WIP
    ".search": true,
    ".volume": true
  };

class kevBot {
  constructor() {
    this.bot = new Discord.Client();
    this.bot.login(auth.token);
    this._addBotListeners();
  }

  _messageListener(message){
    console.log(message.content);
      if (message.author.bot) {
        return;
      } else {
        if (message.content.substring(0, 2) == "k.") {
          // Checking if the message begins with "k." to determine when the bot is being utilized.
          let args = message.content.substring(1).split(" "), // Builds and array of arguments for the current command.
            cmd = args[0]; // Grabs the command from the list of arguments, which is always the first argument.
          args = args.splice(1);
          console.assert("USER COMMAND: ", cmd);
          if (botMsg[cmd]) {
            this[botMsgEnum[cmd]](message, args);
          } else {
            message.channel.send(
              'Invalid command entered. Please use "k.help" to get a list of commands.'
            );
          }
        }
      }
  }

  _errorListener(err){
    console.log("error", err);
  }

  _readyListener(){
    console.log("KevBot Ready");
  }

  _addBotListeners(){
    this.bot.on("message", message => this._messageListener(message));
    this.bot.on("error", err => this._errorListener(err));
    this.bot.on("ready", () => this._readyListener());
  }
}

const kevBotFunctions = {
  checkStream: (message, args) => {
    searcher
      .search(args.join(" "), {
        type: "video"
      })
      .then(result => {
        if (result.first.liveBroadcastContent === "live") {
          setTimeout(() => {
            message.channel.send(
              "Live Stream selected. Leaving to prevent DDOS hell"
            );
            kevBot.music.bot.leaveFunction(message);
          }, 2000);
        }
      })
      .catch(err => {
        console.log("error occured while searching videos.");
      });
  },
  theDon: message => {
    const options = {
      screen_name: "realDonaldTrump",
      count: 5
    };
    TwitterAPI.get(
      "statuses/user_timeline", {
        screen_name: "realDonaldTrump",
        count: 5
      },

      (error, tweets, response) => {
        if (error) {
          kevBot.channel.send("Can't get your dose of the Don... :(");
          console.log(error);
        } else {
          tweets.forEach(function (tweet) {
            let responseMessage =
              "User: " + tweet.user.name + "\n" + "Content: " + tweet.text;
            message.channel.send(responseMessage);
          });
        }
      }
    );
  },
  chuckNorrisJoke: message => {
    request(
      "https://api.chucknorris.io/jokes/random",
      (error, response, body) => {
        if (error) {
          kevBot.channel.send(
            "Error Occured Getting your Chuck Norris Joke BAHD"
          );
          console.log(error);
        } else {
          const content = JSON.parse(body);
          message.channel.send(`STUPID CHUCK NORRIS JOKE: ${content.value}`);
        }
      }
    );
  },
  getHelp: message => {
    let helpMessage = "I'm working on it.";
    message.channel.send(botMessages.help);
  },
  searchSong: async query => await ytsr(query),
  playSong: url =>
};

module.exports = kevBotFunctions;