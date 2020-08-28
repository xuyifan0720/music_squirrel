# music_squirrel

music_squirrel is a discord bot written in node. It supports voice commands for music in English and Chinese and it lets you play local music files to all your friends in the discord channel. 

## Usage 
To use the code for your discord bot, first create one in discord. Then, running the following commands. 
```
export DC_TOKEN=<token for your discord bot>
export GOOGLE_APPLICATION_CREDENTIALS=<path to google-credentials.json>
node bot.js
```

## Bot commands
### Text commands
!summon \n
    Summons the bot to the voice channel you are currently in. \n
!chn \n
    Changes to Chinese mode \n
!eng \n
    Changes to English mode \n
!mode \n
    Sees the current mode \n
!playAttachment \n
    If this is left as the comment of an attachment, the bot will try to add the attachment to the queue or play it immediately if the queue is empty \n
!checkq \n
    Prints out the song queue in the voice channel \n
!imprison <username> \n
    Imprisons the user in channel with <username>. Whenever an imprisoned user tries to speak, the bot tells him/her to shut up. \n
!release <username> \n
    Releases the user \n
!release \n
    Releases everyone from imprisonment \n
!notify <nickname> \n
    The bot will listen in the voice channel and whenever someone called <nickname>, the person who sent this command will be notified \n

### Voice commands 
Go ahead and play <song> \n
    Will play <song> from youtube \n
Go ahead and stop \n
    Will stop current song and move on to the next song in the queue \n
Go ahead and toggle \n
    Will change to Chinese mode \n
机器人放<song> \n
    Will play <song> from youtube (Only available in Chinese mode) \n
机器人过 \n
    Chinese version of "Go ahead and stop" \n
机器人换 \n
    Will change to English mode \n

