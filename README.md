# Twitch Subathon Stats

**Simple website to collect and display viewer statistics for Twitch Subathon.<br>
Originally created for Zakviel's Subathon, but can be used for any Twitch stream.**

---

Website automatically checks if stream is online and counts stats only if it is. Once in minute, website checks chat users list and updates viewing time for each user. It also uses chat-bot to answer some commands (can be configured in `subathon-backend/src/TwitchBot.ts`) and record message count (it has 10s cooldown to prevent spam).

Website is build with socket.io, so all stats are updated in real time.

---

All front-end logic including api url is located in `subathon-frontend/src/App.vue`.<br>
Subscription plans and other icons can be changed in `subathon-frontend/src/components/TableLine.vue`.<br>
Back-end configuration is located in `subathon-backend/config/default.json`.

Site is written to work with [MongoDB](https://www.mongodb.com/) database.