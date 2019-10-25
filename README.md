# KevBot  
## Discord Bot for Funzies.  

I made a small discord bot that me and my friends used to joke around and have fun with.  
  
Right now all it does it use the Twitter api to get Donald Trump's last 5 tweets, and hits an api to grab a random Chuck Norris joke.

It can also play music from youtube, but it can't play anything that is streaming live. Playing live streams does very bad things to your internet connection for some reason, so I went ahead and implemented a feature that checks if the video trying to be played is a live stream.

Other features will come. I just need to think of some more, and need to have the time to work on this outside of school.

This bot itself is not distributable in it's current state, but I felt the source code could be used as a reference for someone looking to get started with a small bot such as this.

Installation: <br/>
    1. Run "npm i" to install all dependencies.<br/>
    2. Run "npm start" to start the bot.<br/>

Commands: <br/>
    All commands start with "k.".<br/>
    1. godEmperor: Grabs the last 5 tweets from Donald Trump.<br/>
    2. Norris: Grabs a random Chuck Norris joke and puts it in chat.<br/>
    3. help: Displays a list of bot commands along with the commands for the music playing library.<br/>