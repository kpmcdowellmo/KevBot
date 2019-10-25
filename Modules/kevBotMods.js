const request = require("request"),
  twitterAuth = require("../twitterauth.json"),
  Twitter = require("twitter"),
  auth = require("../auth.json"),
  {
    YTSearcher
  } = require("ytsearcher"),
  searcher = new YTSearcher(auth.youtubeKey),
  botMessages = require("../kevbotMessage.json");

const TwitterAPI = new Twitter({
  consumer_key: twitterAuth.consumer_key,
  consumer_secret: twitterAuth.consumer_secret,
  access_token_key: twitterAuth.access_token_key,
  access_token_secret: twitterAuth.access_token_secret
});

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
  }
};

module.exports = kevBotFunctions;