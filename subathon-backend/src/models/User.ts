import { Schema, model, Types } from "mongoose";

const schema = new Schema({
    _id: {type: String, required: true},
    username: {type: String, required: true},
    displayname: {type: String, required: true},
    mod: {type: Boolean, required: true},
    sub: {type: Boolean, required: true},
    previousCheck: {type: Number, required: true},
    seconds: {type: Number, required: true, default: 0},
    messages: {type: Number, required: true, default: 0},
    badges: {type: String}
});

export default model('User', schema);