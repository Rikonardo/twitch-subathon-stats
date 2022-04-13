<template>
  <div class="line" :class="{ hightlight: hightlight.toLowerCase() == username.toLowerCase() }">
    <div class="part1">
      <span class="pose">{{ pose }}</span>
      <span class="username"><img v-for="(badge, ind) in badgesArr" :src="badge.url" :alt="badge.title" :title="badge.title" :key="ind">{{ username }}</span>
    </div>
    <div class="part2">
      <span class="time">{{ time }}</span>
      <span class="messages">{{ messages }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const badgesData : any = {"subscriber/0":{"url":"https://static-cdn.jtvnw.net/badges/v1/4a9d321d-7f31-4cf3-9e08-2b073358c598/2","title":"Subscriber"},"subscriber/2":{"url":"https://static-cdn.jtvnw.net/badges/v1/e6247af1-ddf3-4fcc-b335-6fdc0ba11e1d/2","title":"2-Month Subscriber"},"subscriber/3":{"url":"https://static-cdn.jtvnw.net/badges/v1/2dd92774-b305-4b9e-8390-166b3775911a/2","title":"3-Month Subscriber"},"subscriber/6":{"url":"https://static-cdn.jtvnw.net/badges/v1/498e494a-beac-45e4-972f-02f374ce7e21/2","title":"6-Month Subscriber"},"subscriber/9":{"url":"https://static-cdn.jtvnw.net/badges/v1/0304430a-d1a4-4cc9-9494-190a812e483e/2","title":"9-Month Subscriber"},"subscriber/12":{"url":"https://static-cdn.jtvnw.net/badges/v1/f8711ce8-8c07-4d75-84b2-cf17ee8e40bd/2","title":"1-Year Subscriber"},"subscriber/18":{"url":"https://static-cdn.jtvnw.net/badges/v1/419de7f6-3d6c-41c8-a0cd-67f7f7206fcc/2","title":"1.5-Year Subscriber"},"subscriber/24":{"url":"https://static-cdn.jtvnw.net/badges/v1/8a277d46-5f0b-4bcc-a13e-15a4e7f64d69/2","title":"2-Year Subscriber"},"subscriber/30":{"url":"https://static-cdn.jtvnw.net/badges/v1/a2bfbc5c-1f02-4007-8862-ceb55c616ad3/2","title":"2.5-Year Subscriber"},"subscriber/36":{"url":"https://static-cdn.jtvnw.net/badges/v1/358a8a44-07bc-4827-b81d-9581b573a09f/2","title":"3-Year Subscriber"},"bits/100":{"url":"https://static-cdn.jtvnw.net/badges/v1/09d93036-e7ce-431c-9a9e-7044297133f2/2","title":"Cheer 100"},"bits/1000":{"url":"https://static-cdn.jtvnw.net/badges/v1/0d85a29e-79ad-4c63-a285-3acd2c66f2ba/2","title":"Cheer 1000"},"bits/5000":{"url":"https://static-cdn.jtvnw.net/badges/v1/57cd97fc-3e9e-4c6d-9d41-60147137234e/2","title":"Cheer 5000"},"bits/10000":{"url":"https://static-cdn.jtvnw.net/badges/v1/68af213b-a771-4124-b6e3-9bb6d98aa732/2","title":"Cheer 10000"},"moderator/1":{"url":"https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2","title":"Moderator"},"vip/1":{"url":"https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2","title":"VIP"},"broadcaster/1":{"url":"https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2","title":"Streamer"},"glitchcon2020/1":{"url":"https://static-cdn.jtvnw.net/badges/v1/1d4b03b9-51ea-42c9-8f29-698e3c85be3d/2","title":"GlitchCon 2020"},"partner/1":{"url":"https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/2","title":"Verified"}};

export default defineComponent({
  name: 'TableLine',
  props: {
    pose: {
      type: Number,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    messages: {
      type: Number,
      required: true
    },
    seconds: {
      type: Number,
      required: true
    },
    badges: {
      type: String,
      required: true
    },
    mod: {
      type: Boolean,
      required: true
    },
    sub: {
      type: Boolean,
      required: true
    },
    hightlight: {
      type: String,
      required: true
    }
  },
  computed: {
    time() {
      return this.secondsToTime(this.seconds);
    },
    badgesArr() {
      const badges : any[] = [];
      this.badges.split(',').forEach((name : string) => {
        if(badgesData[name]) badges.push(badgesData[name]);
      });
      if(!this.badges.includes('subscriber') && this.sub) badges.push(badgesData['subscriber/0']);
      if(!this.badges.includes('moderator') && this.mod) badges.push(badgesData['moderator/1']);
      return badges;
    }
  },
  methods: {
    secondsToTime(sec_num: number) {
      let hours : any = Math.floor(sec_num / 3600);
      let minutes : any = Math.floor((sec_num - (hours * 3600)) / 60);
      let seconds : any = (sec_num - (hours * 3600) - (minutes * 60));

      if (hours < 10) {hours   = "0" + hours;}
      if (minutes < 10) {minutes = "0" + minutes;}
      if (seconds < 10) {seconds = "0" + seconds;}
      return hours + ':' + minutes + ':' + seconds;
    }
  }
})
</script>

<style lang="scss" scoped>
  .line{
    display: flex;
    .pose{
      padding: 5px 12px;
      display: block;
      min-width: 30px;
    }
    .username{
      padding: 5px 12px;
      padding-left: 0;
      display: block;
      img{
        height: 20px;
        margin: -2px 5px -4px 0px;
      }
    }
    .time{
      padding: 2px 12px;
      display: block;
      margin-left: auto;
      font-family: "Roboto Mono", monospace;
      color: #888888;
    }
    .messages{
      padding: 2px 12px;
      padding-left: 0;
      display: block;
      min-width: 30px;
      text-align: right;
      font-family: "Roboto Mono", monospace;
      color: #888888;
    }
    &.hightlight{
      background: #eeeeee;
      border-radius: 5px;
      .username{
        font-weight: bold;
      }
    }
    .part1, .part2{
      display: flex;
    }
    .part2{
      margin-left: auto;
    }
    @media (max-width: 475px) {
      display: block;
      background: #0000000f;
      background: linear-gradient(90deg, #0000000f 0%, #00000006 100%);
      border-radius: 5px;
      margin-bottom: 8px;
      .pose{
        padding: 5px 5px 5px 12px;
      }
      .time{
        margin-left: 0;
      }
      .messages{
        min-width: auto;
        margin-left: 10px;
      }
    }
  }
</style>