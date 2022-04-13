import TMI from 'tmi.js';
import Logs from './Logs';
import User from './models/User';
import fetch from 'node-fetch';
import Config from 'config';
import UserCache from './UserCache';

const client_id : string = Config.get('twitch.api.client_id');
const client_secret : string = Config.get('twitch.api.client_secret');

const streamer : string = Config.get('twitch.streamer');

const delay = (time: number) => {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
};

export default class Subathon {
    private static instance : Subathon = new Subathon();
    public static getInstance() : Subathon {
        return this.instance;
    }
    private live : boolean = false;
    public isLive() : boolean {
        return this.live;
    }
    private cd : Set<string> = new Set();
    async handleMessage(channel: string, tags: TMI.ChatUserstate, message: string) {
        if(!this.live) return;
        if(!tags['user-id']) return;
        if(channel != '#' + streamer) return;
        if(this.cd.has(tags['user-id'])) return;
        this.cd.add(tags['user-id']);
        setTimeout(() => {
            if(!tags['user-id']) return;
            this.cd.delete(tags['user-id']);
        }, 10 * 1000);
        try {
            const result = await User.updateOne(
                { _id: tags['user-id'] },
                {
                    $inc: { messages: 1 },
                    $set: {
                        username: tags.username,
                        displayname: tags['display-name'] || tags.username,
                        mod: tags.mod,
                        sub: tags.subscriber,
                        badges: tags['badges-raw']
                    }
                }
            );
            if(result.n == 0) {
                const user = new User({
                    _id: tags['user-id'],
                    username: tags.username,
                    displayname: tags['display-name'] || tags.username,
                    mod: tags.mod,
                    sub: tags.subscriber,
                    previousCheck: 0,
                    seconds: 0,
                    messages: 1,
                    badges: tags['badges-raw']
                });
                await user.save();
            }
        }
        catch (err) {
            Logs.error(`Failed to process message from ${tags.username}: ${err}`);
        }
    }
    private token : string = '';
    public getToken() : string {
        return this.token;
    }
    async updateToken() {
        this.token = (await (await fetch(`https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`, { method: 'POST' })).json()).access_token;
        Logs.info(`Twitch token updated`);
    }
    async setup() {
        await this.updateToken();
        setInterval(() => {
            this.updateToken().catch((err: any) => {Logs.error(`Failed to update token: ${err}`);});
        }, 30 * 60 * 1000);
        this.updateCached();
        setInterval(async () => {
            this.updateCached();
            try {
                const liveData = await (await fetch(`https://api.twitch.tv/helix/streams?user_login=${streamer}`, { headers: { 'Client-ID': client_id, 'Authorization': 'Bearer ' + this.token } })).json();
                if(liveData.data) {
                    // Logs.info(`Stream is`, liveData.data.length == 0 ? `offline`.red : `online`.green);
                    this.live = liveData.data.length != 0;
                }
            }
            catch (err) {
                Logs.error(`Failed to update stream status: ${err}`);
            }
        }, 5000);
        setInterval(() => {
            if(!this.live) return;
            const t = +new Date();
            User.updateMany({ previousCheck: { $gt: t - 90 * 1000 } }, { $inc: { seconds: 5 } }).catch((err: any) => {Logs.error(`Failed to update time: ${err}`);});
        }, 5000);
        setInterval(async () => {
            try {
                const chatMembers = await (await fetch(`https://tmi.twitch.tv/group/user/${streamer}/chatters`)).json();
                const array : Array<{username: string, type: string}> = [];
                Object.entries(chatMembers.chatters).forEach((el : any[]) => {
                    const type : string = el[0];
                    const list : string[] = el[1];
                    list.forEach((username: string) => array.push({username, type}));
                });
                const allids = await UserCache.getUsersByLogins(array.map(el => el.username));
                const existingUsers : string[] = (await User.find({_id: { $in: allids.map(el => el.id) }}, {})).map((el : any) => el._id);
                const notExistingIds = allids.filter(el => !existingUsers.includes(el.id));

                const t = Date.now();
                await User.updateMany({_id: { $in: existingUsers }}, { $set: { previousCheck: t } });

                for(const u of notExistingIds) {
                    const user = new User({
                        _id: u.id,
                        username: u.login,
                        displayname: u.display_name || u.login,
                        mod: array.find(el => el.username == u.login)?.type == 'moderators',
                        sub: false,
                        previousCheck: t,
                        seconds: 0,
                        messages: 0,
                        badges: ''
                    });
                    user.save().catch(() => {});
                }
            }
            catch (err) {
                Logs.error(`Failed to update online chatters: ${err}`)
            }
        }, 60 * 1000);
    }
    private map : Map<string, any> = new Map();
    getCahced(settings: {showMods: boolean, showUnMods: boolean, showSubs: boolean, showUnSubs: boolean, sortBySeconds: boolean}) : any[] {
        const s = JSON.stringify(settings);
        return this.map.has(s) ? this.map.get(s) : [];
    }
    updateCached() {
        // This code is cringe
        this.cacheArray({showMods: false, showUnMods: true, showSubs: true, showUnSubs: true, sortBySeconds: false}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: false, showSubs: true, showUnSubs: true, sortBySeconds: false}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: true, showSubs: false, showUnSubs: true, sortBySeconds: false}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: true, showSubs: true, showUnSubs: false, sortBySeconds: false}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: false, showSubs: false, showUnSubs: true, sortBySeconds: false}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: false, showUnMods: true, showSubs: true, showUnSubs: false, sortBySeconds: false}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: false, showSubs: true, showUnSubs: false, sortBySeconds: false}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: false, showUnMods: true, showSubs: false, showUnSubs: true, sortBySeconds: false}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: true, showSubs: true, showUnSubs: true, sortBySeconds: false}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        
        this.cacheArray({showMods: false, showUnMods: true, showSubs: true, showUnSubs: true, sortBySeconds: true}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: false, showSubs: true, showUnSubs: true, sortBySeconds: true}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: true, showSubs: false, showUnSubs: true, sortBySeconds: true}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: true, showSubs: true, showUnSubs: false, sortBySeconds: true}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: false, showSubs: false, showUnSubs: true, sortBySeconds: true}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: false, showUnMods: true, showSubs: true, showUnSubs: false, sortBySeconds: true}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: false, showSubs: true, showUnSubs: false, sortBySeconds: true}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: false, showUnMods: true, showSubs: false, showUnSubs: true, sortBySeconds: true}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
        this.cacheArray({showMods: true, showUnMods: true, showSubs: true, showUnSubs: true, sortBySeconds: true}).catch((err: any) => {Logs.error(`Failed to update cached records: ${err}`)});
    }
    private async cacheArray(settings: {showMods: boolean, showUnMods: boolean, showSubs: boolean, showUnSubs: boolean, sortBySeconds: boolean}) {
        const array = [];
        const searchObj : any = {};
        if(settings.showMods && !settings.showUnMods) searchObj.mod = true;
        if(!settings.showMods && settings.showUnMods) searchObj.mod = false;
        if(settings.showSubs && !settings.showUnSubs) searchObj.sub = true;
        if(!settings.showSubs && settings.showUnSubs) searchObj.sub = false;
        const users = await User.find(searchObj).sort(settings.sortBySeconds ? { seconds : -1, username: 1 } : { messages : -1, username: 1 }).limit(100).exec();
        for(const ind in users) {
            array.push({
                place: +ind + 1,
                name: users[ind].displayname,
                messages: users[ind].messages,
                seconds: users[ind].seconds,
                badges: users[ind].badges || '',
                mod: users[ind].mod,
                sub: users[ind].sub
            });
        }
        this.map.set(JSON.stringify(settings), array);
    }
}