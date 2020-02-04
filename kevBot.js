// Module imports.
const request = require("request"),
  twitterAuth = require("./twitterauth.json"),
  Twitter = require("twitter"),
  auth = require("./auth.json"),
  botMessages = require("./kevbotMessage.json"),
  ytsr = require("ytsr"),
  ytdl = require("ytdl-core"),
  chalk = require("chalk"),
  toZalgo = require("to-zalgo"),
  Discord = require("discord.js");

// Twitter api setup.
const TwitterAPI = new Twitter({
  consumer_key: twitterAuth.consumer_key,
  consumer_secret: twitterAuth.consumer_secret,
  access_token_key: twitterAuth.access_token_key,
  access_token_secret: twitterAuth.access_token_secret
});

// Object for mapping commands to class methods.
const botMsgEnum = {
  ".godEmperor": "_theDon",
  ".Norris": "_chuckNorrisJoke",
  ".help": "_getHelp",
  ".play": "_playSongHandler",
  ".skip": "_skipSong",
  ".stop": "_stopSong",
  ".search": "_searchSongsHandler",
  ".zalgo": "_sendZalgo",
  ".volume": "setVolume"
};

const trollEnum = {
  Arloq: "_trollArloq",
  Carabachi: "_trollCarabachi",
  Kilerbomb: "_trollKiler",
  Willy: "_trollWilly"
};

/**
 * @class KevBot
 *
 * Class for wrapping all discord bot functionality.
 */
class KevBot {
  /**
   * @constructor
   *
   * Initializes discord client, logs the bot in, adds base listeners,
   * and defines some default values for queue length and volume.
   */
  constructor() {
    this.bot = new Discord.Client();
    this.bot.login(auth.token);
    this._maxQueue = 5;
    this._songqueue = new Map();
    this._addBotListeners();
    this._volume = 5;
  }

  /**
   * @method setVolume
   * @param {*} msg Message sent in from user calling bot.
   * @param {*} val Value that is being used to set the volume with.
   */
  setVolume(msg, val) {
    if (isNaN(+val)) {
      msg.channel.send("Volume must be a number.");
      console.error(chalk.red`Volume value error for: ${val}`);
      return;
    }
    this._volume = val;
  }

  /**
   * @method _messageListener
   * @param {*} message Message sent from user calling bot.
   *
   * Listener for handling messages in the discord server.
   */
  _messageListener(message) {
    this._checkTroll(message);
    console.log(chalk.whiteBright`${message.member}: ${message.content}`);
    if (message.author.bot) {
      return;
    } else {
      if (message.content.substring(0, 2) === "k.") {
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
  /**
   * @method _checkTroll
   * @param {*} msg
   *
   * Method for trolling people in the chat.
   */
  _checkTroll(msg) {
    if (message.content.includes("tpg")) {
      this._trollAll(msg);
      return;
    }

    if(message.content.includes("meme")){
      this[trollEnum[message.author.username]](msg);
    }
  }

  /**
   * @method _getUserInfo
   * @param {*} msg 
   * 
   * Method for getting the voice channel and user permissions associated with
   * a user calling KevBot for playing music.
   */
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

  /**
   * @method _validateSongQuery
   * @param {*} msg 
   * @param {*} query 
   * 
   * Method for validating queries made for searching songs.
   */
  _validateSongQuery(msg, query) {
    if (query && query.length > 5) {
      return true;
    } else {
      console.error(chalk.red`Invalid song query: ${query}`);
      msg.channel.send(`Invalid Song Query: "${query}"`);
      return false;
    }
  }

  /**
   * @method _searchSongsHandler
   * @param {*} msg 
   * @param {*} query 
   * 
   * Method for handling a song search query. WIP
   */
  async _searchSongsHandler(msg, query) {
    msg.channel.send("This feature is still a work in progress. Sorry.");
    return;
    const results = await ytsr(query, {
        limit: 5
      }),
      userInfo = this._getUserInfo(msg);

    if (!userInfo) {
      return;
    } else {
    }
  }

  /**
   * @method __createQueue
   * @param {*} msg 
   * @param {*} guild 
   * 
   * Method for creating a song queue.
   */
  __createQueue(msg, guild) {
    const queueObj = {
      textChannel: msg.channel,
      voiceChannel: msg.member.voiceChannel,
      connection: null,
      songs: [],
      volume: this._volume,
      playing: true
    };
    console.log(chalk.white`Creating queue for guild: ${guild.id}`);
    msg.reply("No queue present, creating queue...");
    this._songqueue.set(guild.id, queueObj);
    return queueObj;
  }

  /**
   * @method __setUpDispatcher
   * @param {*} song 
   * @param {*} queue 
   * @param {*} guild 
   * 
   * Method for handling creating a dispatcher for playing music and setting up the
   * appropriate listeners for songs ending or errors.
   */
  __setUpDispatcher(song, queue, guild) {
    const dispatcher = queue.connection
      .playStream(ytdl(song))
      .on("end", () => {
        queue.textChannel.send("Song over.");
        console.log(
          chalk.gray`Queue empty. Leaving channel: ${queue.voiceChannel}`
        );
        queue.songs.shift();
        this.__playSong(queue, guild, queue.songs[0]);
      })
      .on("error", e => {
        queue.textChannel.send(
          `Error Occurred when trying to play song. Sorry!`
        );
        console.error(chalk.red`Error Occurred playing song: ${e}`);
      });

    queue.textChannel.send(`Playing song at volume: ${this._volume}`);
    dispatcher.setVolumeLogarithmic(this._volume / 5);
  }

  /**
   * @method __playSong
   * @param {*} queue 
   * @param {*} guild 
   * @param {*} song 
   * 
   * Method for setting up everything needed to play music.
   */
  __playSong(queue, guild, song) {
    if (!song) {
      queue.textChannel.send("Queue empty. Bye!");
      queue.voiceChannel.leave();
      this._songqueue.delete(guild.id);
      return;
    }
    queue.textChannel.send(`Loading song...`);
    this.__setUpDispatcher(song, queue, guild);
  }

  /**
   * @method __updateQueue
   * @param {*} msg 
   * @param {*} queue 
   * @param {*} query 
   * 
   * Method for updating a queue or creating a new one if none is present
   * for the guild the bot call was made in.
   */
  async __updateQueue(msg, queue, query) {
    if (!queue) {
      const newQueue = this.__createQueue(msg, msg.guild);
      try {*
        newQueue.songs.push(song);
        this.__playSong(newQueue, msg.guild, song);
      } catch (e) {
        console.log(
          chalk.red`Error occured when connecting to the voice chat${e}`
        );
        return e;
      }
    } else {
      if (queue.songs.length < this._maxQueue) {
        console.log(queue);
        const song = await this.__getSongURL(msg, query);
        queue.songs.push(song);
      }
    }
  }

  /**
   * @method __getSongURL
   * @param {*} msg 
   * @param {*} query 
   * 
   * Method for getting a url to a youtube video based on
   * the query that was sent for music.
   */
  async __getSongURL(msg, query) {
    try {
      console.log(chalk.white`Querying songs for: "${query}"`);
      msg.channel.send(`Querying songs for: ${query}...`);
      const result = await ytsr(query, {
        limit: 5
      });
      return result.items.filter(item => item.type === "video")[0].link;
    } catch (e) {
      console.error(chalk.red`Error Occurred when getting song url: ${e}`);
      return e;
    }
  }

  /**
   * @method _playSongHandler
   * @param {*} msg 
   * @param {*} query 
   * 
   * Handler for when the k.play command is sent.
   */
  async _playSongHandler(msg, query) {
    const songQuery = query && query.join(" ");
    if (!this._validateSongQuery(msg, songQuery)) {
      return;
    }
    this.__updateQueue(msg, this._songqueue.get(msg.guild.id), songQuery);
  }


  /**
   * @method _errorListener
   * @param {*} err 
   * 
   * Method for displaying an error message whenever the bot encounters
   * an error.
   */
  _errorListener(err) {
    console.log(chalk.red("error", err));
  }

  /**
   * @method _readyListener
   * 
   * Handler for whenever the bot emits the ready event.
   */
  _readyListener() {
    console.log(chalk.green("KevBot Ready"));
  }

  /**
   * @method _getHelp
   * @param {*} msg 
   * 
   * Method for displaying the help menu. WIP
   */
  _getHelp(msg) {
    msg.channel.send("Help is currently a work in progress.");
  }
  
  /**
   * @method _skipSong
   * @param {*} msg 
   * 
   * Method for skipping a song in the queue.
   */
  _skipSong(msg) {
    if (!msg.member.voiceChannel) {
      console.log(
        chalk.red`${msg.member} attempted to skip a song without being in the voice channel.`
      );
      msg.channel.send(
        `@${msg.member} You need to be in the voice channel to skip songs.`
      );
      return;
    }
    const queue = this._songqueue.get(msg.guild.id);
    if (queue) {
      msg.channel.send("Skipping current song...");
      queue.connection.dispatcher.end();
    } else {
      msg.channel.send(`@${msg.member} There is no queue to skip songs in....`);
      console.error(
        `${msg.member} tried to skip songs when no queue was present.`
      );
    }
  }

  /**
   * @method _stopSong
   * @param {*} msg 
   * 
   * Method for stopping all music and clearing the queue.
   */
  _stopSong(msg) {
    if (!msg.member.voiceChannel) {
      console.log(
        chalk.red`${msg.member} attempted to stop music without being in the voice channel.`
      );
      msg.channel.send(
        `@${msg.member} You need to be in the voice channel to stop music.`
      );
      return;
    }
    const queue = this._songqueue.get(msg.guild.id);
    if (queue) {
      msg.channel.send("Stopping music and clearing queue...");
      queue.songs = [];
      queue.connection.dispatcher.end();
    } else {
      msg.channel.send("There is no queue to stop music for....");
      console.error(
        `${msg.member} tried to stop music when no queue was present.`
      );
    }
  }

  /**
   * @method _addBotListeners
   * 
   * Method for adding listeners to the bot on startup.
   */
  _addBotListeners() {
    this.bot.on("message", message => this._messageListener(message));
    this.bot.on("error", err => this._errorListener(err));
    this.bot.on("ready", () => this._readyListener());
  }

  /**
   * @method _theDon
   * @param {*} message
   * 
   * Method for displaying the last 5 tweets from Donald Trump. 
   */
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

  /**
   * @method _sendZalgo
   * @param {*} msg 
   * @param {*} args 
   * 
   * Method for taking a string and double converting it to crazy text.
   */
  _sendZalgo(msg, args) {
    if (args) {
      msg.channel.send(toZalgo(toZalgo(args.join(" "))));
    } else {
      msg.channel.send("You need to provide some text for changing.");
    }
  }

  /**
   * @method _chuckNorrisJoke
   * @param {*} message 
   * 
   * Method for grabbing and displaying a random chuck norris joke.
   */
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
