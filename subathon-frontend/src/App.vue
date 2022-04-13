<template>
  <main :class="{ connecting: !connected }">
    <div v-if="!connected">
      <div class="lds-dual-ring"></div>
      <p>Подключение{{ threedots }}</p>
    </div>
    <div v-else>
      <div class="settings">
        <div class="logo"><span class="logo-text">Лидерборд Сабатона</span></div>
        <div class="filter">
          <div :class="{active: settings.showMods}" @click="settings.showMods = !settings.showMods; updateSettings();">{{ settings.showMods ? '✔' : '✘' }} Модеры</div>
          <div :class="{active: settings.showUnMods}" @click="settings.showUnMods = !settings.showUnMods; updateSettings();">{{ settings.showUnMods ? '✔' : '✘' }} Немодеры</div>
          <div :class="{active: settings.showSubs}" @click="settings.showSubs = !settings.showSubs; updateSettings();">{{ settings.showSubs ? '✔' : '✘' }} Сабы</div>
          <div :class="{active: settings.showUnSubs}" @click="settings.showUnSubs = !settings.showUnSubs; updateSettings();">{{ settings.showUnSubs ? '✔' : '✘' }} Ансабы</div>
        </div>
        <div class="sort">
          <div :class="{active: settings.sortBySeconds}" @click="settings.sortBySeconds = true; updateSettings();">Время</div>
          <div :class="{active: !settings.sortBySeconds}" @click="settings.sortBySeconds = false; updateSettings();">Сообщения</div>
        </div>
      </div>
      <div class="lines" :class="{ waiting }">
        <TableLine v-for="(line, ind) in lines" :key="ind" :pose="line.place" :username="line.name" :messages="line.messages" :seconds="line.seconds" :badges="line.badges" :mod="line.mod" :sub="line.sub" :hightlight="settings.username"/>
        <p v-if="lines.length == 0" class="empty">Тут пусто</p>
        <input v-if="lines.length != 0" :value="settings.username" type="text" @input="updateUsername" placeholder="Введите свой ник твича">
      </div>
      <div class="show-more"><div @click="settings.showTop100 = !settings.showTop100; updateSettings();">{{ settings.showTop100 ? 'Показать топ-10' : 'Показать топ-100' }}</div></div>
    </div>
    <div class="copyright" v-if="connected">
      <p>
        <!-- Стрим: <b :class="{ green: live, red: !live }">{{ live ? 'Онлайн' : 'Оффлайн' }}</b><br> -->
        Сабатон завершен<br>
        Онлайн на сайте: <b>{{ online }}</b><br>
        Разработано <a href="https://rikonardo.com" target="_blank">Rikonardo</a><br>
        С ❤️ для Заквиеля
      </p>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import TableLine from './components/TableLine.vue'
import { io, Socket } from 'socket.io-client'

const API_URL = 'https://gay.yaoi.live';

interface UpdatePacket {
    lines: [
      {
        place: number,
        name: string,
        messages: number,
        seconds: number,
        badges: string,
        mod: boolean,
        sub: boolean
      }
    ],
    online: number,
    live: boolean
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

interface Data {
  threedots: string,
  connected: boolean,
  online: number,
  live: boolean,
  lines: Array<{
    place: number,
    name: string,
    messages: number,
    seconds: number,
    badges: string,
    mod: boolean,
    sub: boolean
  }>,
  settings: ConnSettings,
  waiting: boolean,
  socket: null | Socket
};

export default defineComponent({
  name: 'App',
  components: {
    TableLine
  },
  data() {
    const data : Data = {
      threedots: '.',
      connected: false,
      online: 0,
      live: false,
      lines: new Array<{
        place: number,
        name: string,
        messages: number,
        seconds: number,
        badges: string,
        mod: boolean,
        sub: boolean
      }>(),
      settings: {
        showMods: true,
        showUnMods: true,
        showSubs: true,
        showUnSubs: true,
        sortBySeconds: false,
        showTop100: false,
        username: ''
      },
      waiting: true,
      socket: null
    };
    return data
  },
  mounted() {
    setInterval(() => {
      if(this.threedots == '.') this.threedots = '..';
      else if(this.threedots == '..') this.threedots = '...';
      else if(this.threedots == '...') this.threedots = '.';
    }, 500);
    console.log()
    this.socket = io(['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:10000' : API_URL);
    this.socket.on('connect', () => {
      this.updateSettings();
    });
    this.socket.on('update', (data : UpdatePacket) => {
      this.connected = true;
      this.waiting = false;
      this.online = data.online;
      this.live = data.live;
      this.lines = data.lines;
    });
    this.socket.on('disconnect', () => {
      this.connected = false;
    });
  },
  methods: {
    updateSettings() {
      const settings : ConnSettings = this.settings;
      if(this.socket) {
        this.socket.emit('update-settings', settings);
        this.waiting = true;
      }
    },
    updateUsername(evt: any) {
      this.settings.username = evt.target.value;
      this.updateSettings();
    }
  }
});
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Montserrat&family=Roboto+Mono&display=swap');
body {
  margin: 0;
}
main {
  font-family: Montserrat, sans-serif;
  background-color: #eeeeee;
  background-size: cover;
  display: flex;
  height: 100vh;
  margin: 0;
  justify-content: center;
  align-items: center;
  .settings{
    position: relative;
    display: flex;
    .filter{
      div{
        display: block;
        margin: 7px 10px;
        &:last-child{
          margin-bottom: 10px;
        }
        cursor: pointer;
        transition: color .25s;
        &:hover{
          color: #888888;
        }
        &.active{
          font-weight: bold;
          color: #6441a5;
        }
      }
    }
    .logo{
      position: absolute;
      top: 12px;
      right: 12px;
      width: 200px;
      text-align: right;
      .logo-text{
        font-weight: bold;
        font-size: 24px;
        color: #888888;
      }
    }
    .sort{
      display: flex;
      margin-left: auto;
      margin-top: auto;
      position: absolute;
      right: 0;
      bottom: 0;
      div{
        display: block;
        padding: 10px;
        cursor: pointer;
        transition: .25s;
        background: #dadada;
        &:hover{
          background: #ffffff;
          color: #555555;
        }
        &.active{
          color: #6441a5;
          background: #ffffff;
        }
      }
    }
  }
  .lines{
    &.waiting{
      opacity: .5;
    }
    .empty{
      margin: 10px;
      color: #888888;
      text-align: center;
    }
    display: block;
    background: #ffffff;
    width: 500px;
    max-width: 80vw;
    max-height: calc(100vh - 400px);
    overflow-y: auto;
    padding: 10px 8px;
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
    input{
      width: calc(100% - 10px);
      padding: 2px 5px;
      border: none;
      border-bottom: 1px solid #888888;
      text-align: center;
      outline: none;
      &:focus{
        border-bottom: 1px solid #6441a5;
      }
    }
  }
  .show-more{
    div{
      margin: auto;
      margin-top: 10px;
      display: block;
      padding: 5px;
      cursor: pointer;
      transition: color .25s;
      width: fit-content;
      text-align: center;
      &:hover{
        color: #888888;
      }
    }
  }
  .copyright{
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100vw;
    p{
      text-align: center;
      color: #555555;
      .green {
        color: #2b9400;
      }
      .red {
        color: #940000;
      }
      a{
        text-decoration: none;
        font-weight: bold;
        color: #6441a5;
      }
    }
  }
  @media (max-height: 720px) {
    align-items: flex-start;
    .settings{
      margin-top: 5vh;
    }
    .lines{
      max-height: calc(100vh - 390px);
    }
  }
  &.connecting{
    align-items: center;
  }
}
.lds-dual-ring {
  display: block;
  width: 80px;
  height: 80px;
  margin: auto;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 64px;
  height: 64px;
  margin: 0px;
  border-radius: 50%;
  border: 6px solid #444444;
  border-color: #444444 transparent #444444 transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>