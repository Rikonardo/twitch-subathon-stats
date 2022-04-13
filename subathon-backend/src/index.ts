import Config from 'config';
import Mongoose from 'mongoose';
import Logs from './Logs';
import SocketServer from './SocketServer';
import Subathon from './Subathon';
import TwitchBot from './TwitchBot';

const MONGO : string = Config.get('mongo.uri');

async function start() {
    const startDate = new Date();
    try{
        Mongoose.Schema.Types.String.checkRequired(v => v != null);
        await Mongoose.connect(MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        await TwitchBot.getInstance().connect();
        await Subathon.getInstance().setup();
        await SocketServer.getInstance();
        setInterval(() => {SocketServer.getInstance().broadcastUpdates()}, 5000);
        Logs.info(`Started in ${+new Date() - +startDate} ms`);
    }
    catch (e) {
        Logs.crash('Start failed', e);
    }
}
Logs.info(`Starting...`);
start();