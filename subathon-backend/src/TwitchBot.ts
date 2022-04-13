import TMI from 'tmi.js';
import Config from 'config';
import Subathon from './Subathon';
import Logs from './Logs';
import User from './models/User';

function secondsToTime(sec_num: number) {
    let hours : any = Math.floor(sec_num / 3600);
    let minutes : any = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds : any = (sec_num - (hours * 3600) - (minutes * 60));

    if (hours < 10) {hours   = "0" + hours;}
    if (minutes < 10) {minutes = "0" + minutes;}
    if (seconds < 10) {seconds = "0" + seconds;}
    return hours + ':' + minutes + ':' + seconds;
}

export default class TwitchBot {
    private static instance : TwitchBot = new TwitchBot();
    public static getInstance() : TwitchBot {
        return this.instance;
    }
    private client : TMI.Client;
    private cooldown : Set<string> = new Set();
    private cooldown2 : Set<string> = new Set();
    async connect() {
        await this.client.connect();
    }
    constructor() {
        this.client = new TMI.Client(Config.get("twitch.bot"));
        this.client.on('message', (channel, tags, message, self) => {
            this.processCommands(channel, tags, message);
            Subathon.getInstance().handleMessage(channel, tags, message);
        });
    }

    async getUserStats(id: string | undefined) : Promise<string> {
        const user = id ? await User.findOne({ _id: id }) : null;
        return user ? `отправлено ${user.messages} сообщений, проведено в чате ${secondsToTime(user.seconds)}` : `отправлено 0 сообщений, проведено в чате ${secondsToTime(0)}`;
    }
    async processCommands(channel: string, tags: TMI.ChatUserstate, message: string) {
        try{
            const text = message.trim();
            var args = text.split(" ");
            if(args[0].toLowerCase() == "!сабатон"){
                if(!this.cooldown.has("!сабатон")){
                    this.cooldown.add("!сабатон");
                    setTimeout(() => {
                        this.cooldown.delete("!сабатон");
                    }, 10000);
                    if(args.length >= 2){
                        var txt = "";
                        for (let index = 1; index < args.length; index++) {
                            txt += args[index] + " ";
                        }
                        if(!txt.includes("!") && !txt.includes("/") && !txt.includes("."))
                            this.client.say(channel, `${txt} Таблица лидеров среди зрителей -> https://subathon.zakviel.ru`);
                        else
                            this.client.say(channel, `@${tags.username} Ваша статистика: ${await this.getUserStats(tags['user-id'])} Таблица лидеров среди зрителей -> https://subathon.zakviel.ru`);
                    }
                    else
                        this.client.say(channel, `@${tags.username} Ваша статистика: ${await this.getUserStats(tags['user-id'])} Таблица лидеров среди зрителей -> https://subathon.zakviel.ru`);
                }
            }
            if(args[0].toLowerCase() == "!сабафон"){
                if(!this.cooldown2.has("!сабафон")){
                    this.cooldown2.add("!сабафон");
                    setTimeout(() => {
                        this.cooldown2.delete("!сабафон");
                    }, 10000);
                    if(args.length >= 2){
                        var txt = "";
                        for (let index = 1; index < args.length; index++) {
                            txt += args[index] + " ";
                        }
                        if(!txt.includes("!") && !txt.includes("/") && !txt.includes("."))
                            this.client.say(channel, `${txt} Правила Сабафона: https://clck.ru/Wy2qA Сабафон - это стрим-марафон с максимальной длительностью в 7 суток. Начинаем мы 21.08.21. Статистика зрителей сабафона - !сабатон`);
                        else
                            this.client.say(channel, `@${tags.username} Правила Сабафона: https://clck.ru/Wy2qA Сабафон - это стрим-марафон с максимальной длительностью в 7 суток. Начинаем мы 21.08.21. Статистика зрителей сабафона - !сабатон`);
                    }
                    else
                        this.client.say(channel, `@${tags.username} Правила Сабафона: https://clck.ru/Wy2qA Сабафон - это стрим-марафон с максимальной длительностью в 7 суток. Начинаем мы 21.08.21. Статистика зрителей сабафона - !сабатон`);
                }
            }
        }
        catch (err) {
            Logs.error(`Failed to process command from ${tags.username}: ${err}`)
        }
    }
}