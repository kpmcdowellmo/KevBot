const request = require("request"),
  twitterAuth = require("./twitterauth.json"),
  Twitter = require("twitter"),
  auth = require("./auth.json"),
  botMessages = require("./kevbotMessage.json"),
  ytsr = require("ytsr"),
  ytdl = require("ytdl-core"),
  chalk = require("chalk"),
  toZalgo = require("to-zalgo");

const TwitterAPI = new Twitter({
  consumer_key: twitterAuth.consumer_key,
  consumer_secret: twitterAuth.consumer_secret,
  access_token_key: twitterAuth.access_token_key,
  access_token_secret: twitterAuth.access_token_secret
});

const Discord = require("discord.js"),
  kevBot = new Discord.Client();

const botMsgEnum = {
  ".godEmperor": "_theDon",
  ".Norris": "_chuckNorrisJoke",
  ".help": "_getHelp",
  ".play": "_playSongHandler",
  ".skip": "_skipSong", // WIP
  ".search": "_searchSongsHandler",
  ".zalgo": "_sendZalgo",
  ".volume": "setVolume"
};

class KevBot {
  constructor() {
    this.bot = new Discord.Client();
    this.bot.login(auth.token);
    this._maxQueue = 5;
    this._songqueue = new Map();
    this._addBotListeners();
    this._volume = 5;
  }

  setVolume(msg, val) {
    if (isNaN(+val)) {
      msg.channel.send("Volume must be a number.");
      console.error(chalk.red`Volume value error for: ${val}`);
      return;
    }
    this._volume = val;
  }

  _messageListener(message) {
    console.log(chalk.whiteBright`${message.member}: ${message.content}`);
    if (message.author.bot) {
      return;
    } else {
      if (message.content.substring(0, 2) == "k.") {
        // Checking if the message begins with "k." to determine when the bot is being utilized.
        let args = message.content.substring(1).split(" "), // Builds and array of arguments for the current command.
          cmd = args[0]; // Grabs the command from the list of arguments, which is always the first argument.
        args = args.splice(1);
        console.assert("USER COMMAND: ", cmd);
        if (botMsgEnum[cmd]) {
          console.log(this[botMsgEnum[cmd]]);
          this[botMsgEnum[cmd]](message, args);
        } else {
          message.channel.send(
            'Invalid command entered. Please use "k.help" to get a list of commands.'
          );
        }
      }
    }
  }

  _getUserInfo(msg) {
    if (!msg.member.voiceChannel) {
      console.error(chalk.red`User not in voice channel`);
      msg.channel.send(`You need to be in a voice channel to play music`);
      return false;
    }

    const result = {
      voiceChannel: msg.member.voiceChannel,
      permissions: msg.member.voiceChannel.permissionsFor(msg.client.user)
    };

    if (
      !result.permissions.has("CONNECT") &&
      !result.permissions.has("SPEAK")
    ) {
      return false;
    }

    return result;
  }

  _validateSongQuery(msg, query) {
    if (query && query.length > 5) {
      return true;
    } else {
      console.error(chalk.red`Invalid song query: ${query}`);
      msg.channel.send(`Invalid Song Query: "${query}"`);
      return false;
    }
  }

  async _searchSongsHandler(msg, query) {
    const results = await ytsr(query, {
        limit: 5
      }),
      userInfo = this._getUserInfo(msg);

    if (!userInfo) {
      return;
    } else {
    }
  }

  __createQueue(msg, guild) {
    const queueObj = {
      textChannel: msg.channel,
      voiceChannel: msg.member.voiceChannel,
      connection: null,
      songs: [],
      volume: this._volume,
      playing: true
    };
    this._songqueue.set(guild.id, queueObj);
    return queueObj;
  }

  __setUpDispatcher(song, queue, guild) {
    const dispatcher = queue.connection
      .playStream(ytdl(song))
      .on("end", () => {
        queue.textChannel.send("Queue empty. Leaving.");
        console.log(
          chalk.gray`Queue empty. Leaving channel: ${queue.voiceChannel}`
        );
        queue.songs.shift();
        this.__playSong(guild, queue.songs[0]);
      })
      .on("error", e => {
        console.error(chalk.red`Error Occurred playing song: ${e}`);
      });

    dispatcher.setVolumeLogarithmic(this._volume / 5);
  }

  __playSong(queue, guild, song) {
    if (!song) {
      queue.voiceChannel.leave();
      this._songqueue.delete(guild.id);
      return;
    }

    this.__setUpDispatcher(queue, guild, song);
  }

  async __updateQueue(msg, queue, query) {
    if (!queue) {
      const newQueue = this.__createQueue(msg, msg.guild);
      try {
        const song = await this.__getSongURL(query),
          connection = await newQueue.voiceChannel.join();
        newQueue.connection = connection;
        newQueue.songs.push(song);
        console.log("test");
        this.__playSong(song, newQueue, msg.guild);
      } catch (e) {
        console.log(
          chalk.red`Error occured when connecting to the voice chat${e}`
        );
        return e;
      }
    } else {
      if (queue.songs.length < this._maxQueue) {
        console.log(queue);
        const song = await this.__getSongURL(query);
        queue.songs.push(song);
      }
    }
  }

  async __getSongURL(query) {
    try {
      console.log(chalk.white`Querying songs for: "${query}"`);
      const result = await ytsr(query, {
        limit: 5
      });
      return result.items.filter(item => item.type === "video")[0].link;
    } catch (e) {
      console.error(chalk.red`Error Occurred when getting song url: ${e}`);
      return e;
    }
  }

  async _playSongHandler(msg, query) {
    const songQuery = query && query.join(" ");
    if (!this._validateSongQuery(msg, songQuery)) {
      return;
    }
    this.__updateQueue(msg, this._songqueue.get(msg.guild.id), songQuery);
  }

  _errorListener(err) {
    console.log(chalk.red("error", err));
  }

  _readyListener() {
    console.log(chalk.green("KevBot Ready"));
  }

  _getHelp(msg) {
    msg.channel.send("Help is currently a work in progress.");
  }

  _skipSong() {}

  _addBotListeners() {
    this.bot.on("message", message => this._messageListener(message));
    this.bot.on("error", err => this._errorListener(err));
    this.bot.on("ready", () => this._readyListener());
  }

  _theDon(message) {
    TwitterAPI.get(
      "statuses/user_timeline",
      {
        screen_name: "realDonaldTrump",
        count: 5
      },
      (error, tweets, response) => {
        if (error) {
          kevBot.channel.send("Can't get your dose of the Don... :(");
          console.log(chalk.red(error));
        } else {
          tweets.forEach(function(tweet) {
            let responseMessage =
              "User: " + tweet.user.name + "\n" + "Content: " + tweet.text;
            message.channel.send(responseMessage);
          });
        }
      }
    );
  }

  _getHelp(message) {
    let helpMessage = "I'm working on it.";
    message.channel.send(botMessages.help);
  }

  _chuckNorrisJoke(message) {
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
  }
}

module.exports = KevBot;
