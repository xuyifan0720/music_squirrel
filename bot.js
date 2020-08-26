// require the discord.js module
const Discord = require("discord.js");

// create a new Discord client
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const { getInfo } = require('ytdl-getinfo');

const { Transform } = require('stream');

const googleSpeech = require('@google-cloud/speech');

var pinyin = require("chinese-to-pinyin");

const googleSpeechClient = new googleSpeech.SpeechClient();

let notifications = new Map();

let silenced = new Set();

var currDispatcher = null;

const ENGLISH = "en-US";

const CHINESE = "zh-CN";

var mode = ENGLISH;

const eng_commands = {
    play: "go ahead and play",
    stop: "go ahead and stop",
    toggle: "go ahead and toggle"
}

const chn_commands = {
    play: "ji qi ren fang",
    stop: "ji qi ren guo", 
    toggle: "ji qi ren huan"
}

let commands = new Map();
commands.set(ENGLISH, eng_commands);
commands.set(CHINESE, chn_commands);

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once("ready", () => {
    console.log("Ready!");
});

// login to Discord with your app's token
client.login("NzQ1NzM3OTcyMTcwODgzMDcy.Xz2Imw.csrtgzlIq9bYVGE4GG5ba4EHjoQ");

var clientConnection = null;

client.on("message", message => {
    const msg = message.content
    if (msg.substring(0, 1) == "!") {
        var args = msg.substring(1).split(" ");
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case "ping":
                message.reply("Pong");
            break;
            case "summon":
                if (args.length >= 1){
                    silenced.add(args.join(" "));
                    silenced.forEach(val => {console.log(val);});
                }
                const voiceChannel = message.member.voice.channel;
                if (!voiceChannel){
                    return message.reply("You need to be in a voice channel to summon me");
                }
                voiceChannel.join()
                .then(connection => {
                    clientConnection = connection; 
                    const clientVoice = clientConnection.channel;
                    play(clientVoice, "https://www.youtube.com/watch?v=7nQ2oiVqKHw", message, 0);
                    const receiver = connection.receiver;
                    clientConnection.on("speaking", (user, speaking) => {
                        if (speaking){
                            //console.log(`I'm listening to ${user.username}`);
                            if (user.username != "squirralburrito" && speaking.bitfield > 0 && silenced.has(user.username)){
                                playLocal(clientVoice, "./puck.mp3", message);
                            }
                            const audioStream = receiver.createStream(user, {mode: 'pcm'});
                            const requestConfig = {
                                encoding: 'LINEAR16',
                                sampleRateHertz: 48000,
                                languageCode: mode
                            };
                            const request = {
                                config: requestConfig
                            };
                            const recognizeStream = googleSpeechClient
                                .streamingRecognize(request)
                                .on('error', console.error)
                                .on('data', response => {
                                    const transcription = response.results
                                        .map(result => result.alternatives[0].transcript)
                                        .join('\n')
                                        .toLowerCase()
                                    console.log(`I heard: ${transcription}`)
                                    Array.from(notifications.keys()).forEach(k => {
                                        if (transcription.indexOf(k) != -1){
                                            message.channel.send(`<@${notifications.get(k)}>, youre mentioned`);
                                        }
                                    })
                                    const breakWord = mode == ENGLISH ? " " : ""
                                    var transList = transcription.split(breakWord);
                                    console.log(transList.length);
                                    if (transList.length >= 4){
                                        var voice_cmd = transList.slice(0, 4).join(breakWord);
                                        var argument = transList.slice(4).join(breakWord);
                                        console.log(romanize(voice_cmd, mode));
                                        switch (romanize(voice_cmd, mode)) {
                                            case commands.get(mode).play: 
                                                getInfo(argument).then(info => {
                                                    console.log(info.items[0].webpage_url)
                                                    play(clientVoice, info.items[0].webpage_url, message);
                                                }).catch(err => console.error);
                                            break; 
                                            case commands.get(mode).stop:
                                                stop();
                                            break;
                                            case commands.get(mode).toggle:
                                                if (mode == ENGLISH){
                                                    mode = CHINESE;
                                                    message.channel.send("Chinese mode");
                                                }
                                                else {
                                                    mode = ENGLISH;
                                                    message.channel.send("English mode");
                                                }   
                                            break;
                                        }
                                    }
                                    
                              });

                            const convertTo1ChannelStream = new ConvertTo1ChannelStream();

                            audioStream.pipe(convertTo1ChannelStream).pipe(recognizeStream);

                            audioStream.on('end', async () => {
                                //console.log('audioStream end')
                            });
                        } else {
                            console.log(`I stopped listening to ${user.username}`);
                        }
                    });
                })
                .catch(err => {return message.reply(`error occured ${err}`);})
            break;
            case "consent":
                const clientVoice = clientConnection.channel;
                play(clientVoice, "https://www.youtube.com/watch?v=aaoYpJpEpgA", message);
            break;
            case "notify":
                args.forEach(val => {notifications.set(val.toLowerCase(), message.member.user.id)});
                console.log(message.member.user.id);
            break;
            case "release":
                if (args.length == 0){
                    silenced.clear();
                } else {
                    silenced.delete(args.join(" "));
                }      
            break;
            case "imprison":
                silenced.add(args.join(" "));
            break;
            case "eng":
                mode = ENGLISH; 
                message.channel.send("English mode");
            break; 
            case "chn":
                mode = CHINESE;
                message.channel.send("Chinese mode");
            break;
            case "mode":
                message.channel.send(mode);
            break;
         }
     }
});

function romanize(content, language){
    switch(language){
        case ENGLISH:
            return content;
        break; 
        case CHINESE:
            return pinyin(content, {removeTone: true})
    }
}

function play(clientVoice, link, message, vol = 1){
    if (!clientVoice){
        return message.reply("Bot is not summoned yet");
    }
    const dispatcher = clientConnection
    .play(ytdl(link))
    .on("finish", () => {})
    .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(vol);
    currDispatcher = dispatcher;
}

function playLocal(clientVoice, fp, message){
    if (!clientVoice){
        return message.reply("Bot is not summoned yet");
    }
    const dispatcher = clientConnection
    .play(fp)
    .on("finish", () => {})
    .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(1);
    currDispatcher = dispatcher;
}

function stop() {
    if (currDispatcher) {
        currDispatcher.end();
    }
}


function convertBufferTo1Channel(buffer) {
    const convertedBuffer = Buffer.alloc(buffer.length / 2)

    for (let i = 0; i < convertedBuffer.length / 2; i++) {
        const uint16 = buffer.readUInt16LE(i * 4)
        convertedBuffer.writeUInt16LE(uint16, i * 2)
    }

    return convertedBuffer
}

class ConvertTo1ChannelStream extends Transform {
    constructor(source, options) {
        super(options)
    }

    _transform(data, encoding, next) {
        next(null, convertBufferTo1Channel(data))
    }
}
