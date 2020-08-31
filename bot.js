// require the discord.js module
const Discord = require("discord.js");

// create a new Discord client
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const { getInfo } = require('ytdl-getinfo');

const { Transform } = require('stream');

const googleSpeech = require('@google-cloud/speech');

var pinyin = require("chinese-to-pinyin");

var fs = require("fs");

const googleSpeechClient = new googleSpeech.SpeechClient();

let notifications = new Map();

let silenced = new Set();

const ENGLISH = "en-US";

const CHINESE = "zh-CN";

var VOLUME = 1;

const eng_commands = {
    play: "go ahead and play",
    stop: "go ahead and skip",
    toggle: "go ahead and toggle"
}

const chn_commands = {
    play: "ji qi ren fang",
    stop: "ji qi ren guo", 
    toggle: "ji qi ren huan"
}

var commands = new Map();
commands.set(ENGLISH, eng_commands);
commands.set(CHINESE, chn_commands);

var songQueue = [];



// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once("ready", () => {
    console.log("Ready!");
});

// login to Discord with your app's token
const TOKEN = process.env.DC_TOKEN;
client.login(TOKEN);

var clientConnections = new Map();
var currDispatchers = new Map();
var songQueues = new Map();
var modes = new Map();

client.on("message", message => {
    const msg = message.content;
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
                    clientConnections.set(message.guild.id, clientConnection);
                    currDispatchers.set(message.guild.id, null);
                    songQueues.set(message.guild.id, []);
                    modes.set(message.guild.id, ENGLISH);
                    const clientVoice = clientConnection.channel;
                    VOLUME = 0;
                    play(clientVoice, "https://www.youtube.com/watch?v=7nQ2oiVqKHw", message, 
                        (x) => {VOLUME = 0.5; currDispatchers.set(message.guild.id, null)});
                    console.log("conncted to voice channel")
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
                                languageCode: modes.get(message.guild.id)
                            };
                            const request = {
                                config: requestConfig
                            };
                            const recognizeStream = googleSpeechClient
                                .streamingRecognize(request)
                                .on('error', err => {
                                    console.log("recognize stream error");
                                })
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
                                    const mode = modes.get(message.guild.id);
                                    const breakWord = mode == ENGLISH ? " " : ""
                                    var transList = transcription.split(breakWord);
                                    if (transList.length >= 4){
                                        var voice_cmd = transList.slice(0, 4).join(breakWord);
                                        var argument = transList.slice(4).join(breakWord);
                                        console.log(romanize(voice_cmd, mode));
                                        switch (romanize(voice_cmd, mode)) {
                                            case commands.get(mode).play: 
                                                console.log(user.username);
                                                console.log(message.guild.name);
                                                getInfo(argument).then(info => {
                                                    console.log(info.items[0].webpage_url)
                                                    //play(clientVoice, info.items[0].webpage_url, message);
                                                    var songQueue = songQueues.get(message.guild.id);
                                                    songQueue.push({property: "youtube", url: info.items[0].webpage_url});
                                                    var currDispatcher = currDispatchers.get(message.guild.id);
                                                    if (!currDispatcher) {
                                                        console.log("starts playing");
                                                        playFromQueue(message);
                                                    }
                                                }).catch(err => {
                                                    currDispatcher = null;
                                                    console.log("song error");
                                                    playFromQueue(message); });
                                            break; 
                                            case commands.get(mode).stop:
                                                stop(message);
                                            break;
                                            case commands.get(mode).toggle:
                                                if (mode == ENGLISH){
                                                    modes.set(message.guild.id, CHINESE);
                                                    message.channel.send("Chinese mode");
                                                }
                                                else {
                                                    modes.set(message.guild.id, ENGLISH);
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
                modes.set(message.guild.id, ENGLISH); 
                message.channel.send("English mode");
            break; 
            case "chn":
                modes.set(message.guild.id, CHINESE);
                message.channel.send("Chinese mode");
            break;
            case "mode":
                message.channel.send(modes.get(message.guild.id));
            break;
            case "checkq":
                songQueue = songQueues.get(message.guild.id);
                if (songQueue){
                    songQueue.forEach((ele, idx, arr) => 
                        message.channel.send(`${idx}. type: ${ele.property}, url: ${ele.url}`));
                }
            break;
            case "restart":
                playFromQueue(message);
                break;
            case "playAttachment":
                if (message.attachments.size > 0){
                    const url = Array.from(message.attachments.values())[0].attachment;
                    const regex = RegExp("https.*\.mp3$");
                    if (regex.test(url)){
                        //const clientVoice = clientConnection.channel;
                        //playLocal(clientVoice, url, message);
                        var songQueue = songQueues.get(message.guild.id);
                        var currDispatcher = currDispatchers.get(message.guild.id);
                        songQueue.push({property: "local", url: url});
                        if (!currDispatcher) {
                            console.log("starts playing");
                            playFromQueue(message);
                        }
                    } else {
                        message.channel.send("must be a mp3 file");
                        return;
                    }
                }
                else{
                    message.channel.send("where's ur attachments?");
                    return;
                }
            break;
            case "hh":
                var text = fs.readFileSync("./helpText").toString('utf-8');
                message.channel.send(text);
            break;
         }
     }
});

function playFromQueue(message){
    console.log(`when started, guild is ${message.guild.name}`);
    const clientConnection = clientConnections.get(message.guild.id);
    const clientVoice = clientConnection.channel;
    var songQueue = songQueues.get(message.guild.id);
    if (songQueue.length == 0){
        message.channel.send("empty queue");
        currDispatchers.set(message.guild.id, null);
        return;
    }
    const song = songQueue.shift();
    if (song.property == "youtube") {
        play(clientVoice, song.url, message, playFromQueue);
    }
    else {
        playLocal(clientVoice, song.url, message, playFromQueue);
    }
}

function romanize(content, language){
    switch(language){
        case ENGLISH:
            return content;
        break; 
        case CHINESE:
            return pinyin(content, {removeTone: true})
    }
}

function play(clientVoice, link, message, callback = (x) => {currDispatchers.set(message.guild.id, null); return;} ){
    if (!clientVoice){
        return message.reply("Bot is not summoned yet");
    }
    const clientConnection = clientConnections.get(message.guild.id);
    const dispatcher = clientConnection
    .play(ytdl(link, { type: 'opus', quality: "lowest", highWaterMark: 1<<20}, 
        {highWaterMark: 1024 * 1024 * 10}))
    .on("finish", () => {callback(message)})
    .on("error", error => {
        currDispatchers.set(message.guild.id, null);
        console.log("youtube error");
        playFromQueue(message);
        console.error(error)});
    dispatcher.setVolumeLogarithmic(VOLUME);
    currDispatchers.set(message.guild.id, dispatcher);
}

function playLocal(clientVoice, fp, message, callback = (x) => {currDispatchers.set(message.guild.id, null); return;}){
    if (!clientVoice){
        return message.reply("Bot is not summoned yet");
    }
    const clientConnection = clientConnections.get(message.guild.id);
    const dispatcher = clientConnection
    .play(fp)
    .on("finish", () => {callback(message)})
    .on("error", error => {
        currDispatchers.set(message.guild.id, null); 
        console.error(error)});
    dispatcher.setVolumeLogarithmic(VOLUME);
    currDispatchers.set(message.guild.id, dispatcher);
}

function stop(message) {
    currDispatcher = currDispatchers.get(message.guild.id);
    if (currDispatcher) {
        currDispatcher.end();
        currDispatchers.set(message.guild.id, null);
        //playFromQueue(message);
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
