import fetch from 'node-fetch';
import Subathon from './Subathon';
import Config from 'config';

const client_id : string = Config.get('twitch.api.client_id');

export default class UserCache {
    private static cache : Map<string, {id: string, display_name: string, time: number}> = new Map();
    static initialize(){
        setInterval(() => {
            const t = Date.now();
            this.cache.forEach((value, key) => {
                if(value.time < t - 20 * 60 * 1000) this.cache.delete(key);
            });
        }, 60 * 1000);
    }
    public static async getUsersByLogins(logins: string[]) : Promise<Array<{id: string, login: string, display_name: string}>> {
        const res = Array<{id: string, login: string, display_name: string}>();
        const uncached : string[] = [];
        for(const login of logins) {
            if(this.cache.has(login)) {
                const data = this.cache.get(login);
                if(!data) continue;
                res.push({login, id: data.id, display_name: data.display_name});
            }
            else uncached.push(login);
        }
        for(let i = 0; i < uncached.length; i += 100) {
            const userData = await (await fetch(`https://api.twitch.tv/helix/users?${uncached.slice(i, i + 100).map(u => 'login=' + encodeURIComponent(u)).join('&')}`, { headers: { 'Client-ID': client_id, 'Authorization': 'Bearer ' + Subathon.getInstance().getToken() } })).json();
            if(userData.data) {
                for (const user of userData.data) {
                    this.cache.set(user.login, { id: user.id, display_name: user.display_name, time: Date.now() });
                    res.push({login: user.login, id: user.id, display_name: user.display_name || user.login});
                }
            }
            else throw new Error('No data field in twich users response');
        }
        return res;
    }
}
UserCache.initialize();