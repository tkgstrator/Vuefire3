<template>
<div class="wrap">
  <h1>Presents</h1>
  <router-link to="/item">ワイアレスイヤホン一名様</router-link>
  <h4>クリックで賞品情報詳細が見れます</h4>
  <h3>12/03 00:00 - 12/05 23:59</h3>
  <h3>{{ hour }}:{{ minute }}:{{ second }}</h3>
  <div id="user">
    <h2>参加者{{ user_num }}名</h2>
    <!-- <h3 id="user-probability">あなたの当籤確率<span class="value">{{ (price / total * 100).toFixed(2) }} %</span></h3> -->
    <h3 id="user-probability">あなたは{{ success == screenName ? "当籤" : "落選" }}しました</h3>
    <h3 id="user-probability">{{ success == screenName ? uid : uid.shuffle() }}</h3>
    <h4>あなたの入札金額{{ price }} 円</h4>
  </div>
  <form v-if="uid != null" id="submit">
    <select v-model="selected">
      <option disabled value="">入札金額を選択してください </option>
      <option v-for="value in values">{{ value * 200 }}</option>
    </select>
  </form>
    <button v-if="uid != null" @click="bidding">入札する</button>
    <button v-if="uid == null" @click="signIn">参加する</button>
  <div id="rules">
    <h2>規約</h2>
    <ul>
      <li>誰でも参加することができます</li>
      <li>入札金額が上がれば当籤/落札確率が上がります</li>
      <li><span class="text-color-blue">落札できたとき</span>だけ入札金額をお支払いください</li>
      <li><span class="text-important">落札できなかったとき</span>は支払う必要はありません</li>
      <li>入札はいつでも取り消すことができます</li>
      <li>送料は落札者様負担になります</li>
      <li>返品・返金は一切できません</li>
      <li>お支払いはアマゾンギフトカード・PayPal・Paypayに対応しています</li>
      <li>TwitterのDMで配送先住所・支払いのやりとりを行います</li>
      <li>住所を明かしたくない場合はクロネコヤマトの匿名サービスを利用します（別途110円かかります）</li>
    </ul>
  </div>
</div>
</template>

<script>
import { getAuth, signInWithPopup, TwitterAuthProvider } from "@firebase/auth"
import { doc, getFirestore, onSnapshot, collection, setDoc, getDoc, updateDoc } from "@firebase/firestore"

String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

class Random {
  constructor(seed = 88675123) {
    this.mSeed1 = (Math.imul(0x6C078965, (seed ^ (seed >>> 30))) + 1) >>> 0;
    this.mSeed2 = (Math.imul(0x6C078965, (this.mSeed1 ^ (this.mSeed1 >>> 30))) + 2) >>> 0;
    this.mSeed3 = (Math.imul(0x6C078965, (this.mSeed2 ^ (this.mSeed2 >>> 30))) + 3) >>> 0;
    this.mSeed4 = (Math.imul(0x6C078965, (this.mSeed3 ^ (this.mSeed3 >>> 30))) + 4) >>> 0;
  }
  
  // XorShift
  getU32() {
    let n = (this.mSeed1 ^ (this.mSeed1 << 11)) >>> 0;
    this.mSeed1 = this.mSeed2;
    this.mSeed2 = this.mSeed3;
    this.mSeed3 = this.mSeed4;
    this.mSeed4 = ((n ^ (n >>> 8) ^ this.mSeed4 ^ (this.mSeed4 >>> 19))) >>> 0;
    return this.mSeed4;
  }
}

export default {
  components: {
  },
  data() {
    return {
      user_name: null, // 自分の名前
      uid: null, // 自分のID
      price: 0, // 自分の入札額
      db: getFirestore(),
      auth: getAuth(),
      user_num: null,
      values: [...Array(26)].map((_, i) => i),
      selected: 0,
      total: 0,
      timer: null,
      hour: 0,
      minute: 0,
      second: 0,
      success: null,
      screenName: null
    }
  },
  created() {
    // ページ表示時にログイン済みかどうかをチェックする
    this.auth.onAuthStateChanged((user) => {
      if (user != null) {
        this.user_name = user.displayName
        this.screenName = user.reloadUserInfo.screenName
        this.uid = user.uid
        this.register(user)
      }
    })

    const unsub = onSnapshot(collection(this.db, "users"), (data) => {
      this.user_num = data.size
      const users = data.docs.map((user) => { 
        return user.data()
       })

       const prices = users.map((user) => {
         return parseInt(user.price)
       })

       this.total = users.reduce((prev, next) => prev.price + next.price, 0)

       const seed = 7629671 // tkg -> hex -> dec
       const rnd = new Random(seed)
       const random_number = rnd.getU32()
       let sum = 0

       users.forEach((user) => {
         let price = (parseInt(user.price) / 100)
         sum += price
         if (rnd.getU32() * sum / Math.pow(2, 32) < price) {
           this.success = user.uid
         }
       })

       this.reminder()
    })
  },
  methods: {
    // 残り時間を表示
    countTime() {
      const limitDate = new Date(2021, 11, 5, 23, 59)
      const nowDate = new Date()
      if (limitDate > nowDate) {
      const elapsedTime = new Date(limitDate - nowDate)
        this.hour = ("00" + elapsedTime.getUTCHours() + elapsedTime.getUTCDate() * 24).slice(-2)
        this.minute = ("00" + elapsedTime.getUTCMinutes()).slice(-2)
        this.second = ("00" + elapsedTime.getUTCSeconds()).slice(-2)
      } else {
        this.hour = "00"
        this.minute = "00"
        this.second = "00"
      }
    },
    reminder() {
      this.timer = setInterval(this.countTime, 1000)
    },
    // 金額を更新
    async bidding() {
      this.price = parseInt(this.selected)
      await updateDoc(doc(this.db, "users", this.uid), {
          price: parseInt(this.selected),
        })
    },
    // 新規アカウント登録/ログイン
    async register(user) {
      const document = await getDoc(doc(this.db, "users", user.uid))
      if (document.exists()) {
        // 自分の情報を読み込んで上書きする
        this.price = document.data().price
      } else {
        await setDoc(doc(this.db, "users", user.uid), {
          displayName: user.displayName,
          presentId: null,
          price: 0,
          uid: this.uid = user.reloadUserInfo.screenName
        })
      }
    },
    signIn() {
      const provider = new TwitterAuthProvider()
      signInWithPopup(this.auth, provider)
      .then((result) => {
        this.user_name = result.user.displayName
      })
      .catch((error) => {
        console.log(error)
      })
    }
  }
}
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+Antique:wght@300;400&display=swap");
@import url("https://fonts.googleapis.com/css?family=Raleway");

#app {
  font-family: 'Zen Kaku Gothic Antique', sans-serif;
  color: #85837a;
  text-align: center;
}

body {
  background: #f6f6f4;
  font-family: 'Raleway', sans-serif; 
  font-size: 20px; 
}

h1 {
  font-size: 40px;
  margin: 0px;
  padding: 0px;
}

h3 {
  font-size: 20px;
  margin: 0px;
  padding: 0px;
  color: #364549;
}

h4 {
  font-size: 14px;
  margin: 0px;
  padding: 0px;
}

div.wrap {
  vertical-align: middle;
}

div.wrap div {
  margin: 20px 0;
}

#rules {
  display: block;
}

ul {
  /* display: block; */
  max-width: 600px;
  text-align: left;
  font-size: 14px;
  margin: 0 auto;
}

a {
  text-decoration: none;
}

select {
  font-family: "Raleway", sans-serif;
  font-weight: 800;
  margin: 0 auto;
  color: #EC6F66;
  width: 200px;
  height: 35px;
  cursor: pointer;
  border: solid white;
}

button {
  color: #EC6F66;
  background-color: white;
  width: 120px;
  height: 35px;
  cursor: pointer;
  border: none;
  margin: 10px 0;
}

.value {
  color: red;
}

.text-color-blue {
  color: blue;
}

.text-important {
  color: red;
}
</style>