<template>
<div>{{ user_name }}</div>
<div>予定参加者{{ user_num }}名</div>
<button @click="signIn">参加する</button>
</template>

<script>
import { getAuth, signInWithPopup, TwitterAuthProvider } from "@firebase/auth"
import { doc, getFirestore, onSnapshot, collection, setDoc, getDoc } from "@firebase/firestore"

export default {
  components: {
  },
  data() {
    return {
      user_name: null,
      db: getFirestore(),
      auth: getAuth(),
      user_num: null
    }
  },
  created() {
    // ページ表示時にログイン済みかどうかをチェックする
    this.auth.onAuthStateChanged((user) => {
      this.user_name = user.displayName
      this.register(user)
    })
    const unsub = onSnapshot(collection(this.db, "users"), (users) => {
      this.user_num = users.size
    })
  },
  methods: {
    // 新規アカウント登録/ログイン
    async register(user) {
      const document = await getDoc(doc(this.db, "users", user.uid))
      if (document.exists()) {
        console.log("Welcome back")
      } else {
        console.log("Welcome!")
        await setDoc(doc(this.db, "users", user.uid), {
          displayName: user.displayName,
          presentId: null,
          price: null,
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