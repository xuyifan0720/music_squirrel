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
!hh  
    Prints out help info.  
!summon   
    Summons the bot to the voice channel you are currently in.   
!chn   
    Changes to Chinese mode   
!eng   
    Changes to English mode   
!mode   
    Sees the current mode   
!playAttachment   
    If this is left as the comment of an attachment, the bot will try to add the attachment to the queue or play it immediately if the queue is empty   
!checkq   
    Prints out the song queue in the voice channel   
!imprison <username>   
    Imprisons the user in channel with <username>. Whenever an imprisoned user tries to speak, the bot tells him/her to shut up.   
!release <username>   
    Releases the user   
!release   
    Releases everyone from imprisonment   
!notify <nickname>   
    The bot will listen in the voice channel and whenever someone called <nickname>, the person who sent this command will be notified   

### Voice commands 
Go ahead and play <song>   
    Will play <song> from youtube   
Go ahead and stop   
    Will stop current song and move on to the next song in the queue   
Go ahead and toggle   
    Will change to Chinese mode   
机器人放<song>   
    Will play <song> from youtube (Only available in Chinese mode)   
机器人过   
    Chinese version of "Go ahead and stop"   
机器人换   
    Will change to English mode   

