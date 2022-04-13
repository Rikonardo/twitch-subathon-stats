import Logs from './Logs';
import User from './models/User';
import Config from 'config';
import IO from 'socket.io';
import Subathon from './Subathon';

const port : number = Config.get('http.port');

interface ConnMeta {
    socket: IO.Socket,
    settings: ConnSettings
};

interface ConnSettings {
    showMods: boolean,
    showUnMods: boolean,
    showSubs: boolean,
    showUnSubs: boolean,
    sortBySeconds: boolean,
    showTop100: boolean,
    username: string
};

interface UpdatePacket {
    lines: Array<{
            place: number,
            name: string,
            messages: number,
            seconds: number,
            badges: string,
            mod: boolean,
            sub: boolean
        }>,
    online: number,
    live: boolean
};

export default class SocketServer {
    private static instance : SocketServer = new SocketServer();
    public static getInstance() : SocketServer {
        return this.instance;
    }
    private io : IO.Server;
    private connections : Map<string, ConnMeta> = new Map();
    constructor(){
        this.io = new IO.Server(port, {
            cors: {
                origin: '*',
            }
        });
        this.io.on("connection", socket => {
            const meta : ConnMeta = {
                socket,
                settings: {
                    showMods: true,
                    showUnMods: true,
                    showSubs: true,
                    showUnSubs: true,
                    sortBySeconds: false,
                    showTop100: false,
                    username: ''
                }
            };
            const id = this.makeUniqConnId();
            this.connections.set(id, meta);
            this.sendConfiguredUpdate(meta);
            socket.on("update-settings", data => {
                try {
                    meta.settings.showMods = data.showMods;
                    meta.settings.showUnMods = data.showUnMods;
                    meta.settings.showSubs = data.showSubs;
                    meta.settings.showUnSubs = data.showUnSubs;
                    meta.settings.sortBySeconds = data.sortBySeconds;
                    meta.settings.showTop100 = data.showTop100;
                    meta.settings.username = data.username;
                }
                catch {}
                this.sendConfiguredUpdate(meta);
            });
            socket.on('disconnect', () => {
                this.connections.delete(id);
            });
        });
    }
    public broadcastUpdates() {
        this.connections.forEach(meta => this.sendConfiguredUpdate(meta));
    }
    makeUniqConnId() {
        let id = '';
        while (true) {
            id = Math.round(Math.random() * 10000000000).toString().padStart(10, '0');
            if(!this.connections.has(id)) break;
        }
        return id;
    }
    sendConfiguredUpdate(meta: ConnMeta) {
        (async () => {
            let array = Subathon.getInstance().getCahced({
                showMods: meta.settings.showMods,
                showUnMods: meta.settings.showUnMods,
                showSubs: meta.settings.showSubs,
                showUnSubs: meta.settings.showUnSubs,
                sortBySeconds: meta.settings.sortBySeconds
            });
            if(!meta.settings.showTop100) array = array.slice(0, 10);
            if(meta.settings.showTop100) array = array.slice(0, 100);
            if(meta.settings.username.length > 3 && !(!meta.settings.showMods && !meta.settings.showUnMods || !meta.settings.showSubs && !meta.settings.showUnSubs)) {
                if(!array.find(obj => obj.name.toLowerCase() == meta.settings.username.toLowerCase())) {
                    const searchObj : any = {};
                    if(meta.settings.showMods && !meta.settings.showUnMods) searchObj.mod = true;
                    if(!meta.settings.showMods && meta.settings.showUnMods) searchObj.mod = false;
                    if(meta.settings.showSubs && !meta.settings.showUnSubs) searchObj.sub = true;
                    if(!meta.settings.showSubs && meta.settings.showUnSubs) searchObj.sub = false;
                    const user = await User.findOne({ username: meta.settings.username.toLowerCase(), ...searchObj });
                    if(user) {
                        searchObj[meta.settings.sortBySeconds ? 'seconds' : 'messages'] = { $gt: user[meta.settings.sortBySeconds ? 'seconds' : 'messages'] };
                        const place = await User.countDocuments(searchObj) + 1;
                        array.push({
                            place,
                            name: user.displayname,
                            messages: user.messages,
                            seconds: user.seconds,
                            badges: user.badges || '',
                            mod: user.mod,
                            sub: user.sub
                        });
                    }
                }
            }
            const packet : UpdatePacket = {
                lines: array,
                online: this.connections.size,
                live: Subathon.getInstance().isLive()
            };
            try { meta.socket.emit('update', packet) } catch {}
        })().catch(err => Logs.error(`Failed to send update to user: ${err}`));
    }
}