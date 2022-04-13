import 'colors';

const getTimestamp = () => {
    const dt = new Date()
    return `[${
        dt.getDate().toString().padStart(2, '0')}.${
        (dt.getMonth()+1).toString().padStart(2, '0')}.${
        dt.getFullYear().toString().padStart(4, '0')} ${
        dt.getHours().toString().padStart(2, '0')}:${
        dt.getMinutes().toString().padStart(2, '0')}:${
        dt.getSeconds().toString().padStart(2, '0')}]`
}

export default {
    info(...args: any[]){
        console.log(getTimestamp(), '[INFO]'.cyan, ...args);
    },
    warn(...args: any[]){
        console.warn(getTimestamp(), '[WARN]'.yellow, ...args);
    },
    error(...args: any[]){
        console.error(getTimestamp(), '[ERROR]'.red, ...args);
    },
    crash(...args: any[]){
        this.error(...args);
        process.exit(-1);
    }
}