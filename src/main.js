import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { initializeApp } from "firebase/app";
import { doc, getFirestore } from "firebase/firestore";
import { TwitterAuthProvider, getAuth, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDEX6HlNFYBl0DjMtMtMDjlsZRmpxmswEM",
  authDomain: "tkgpresent.firebaseapp.com",
  projectId: "tkgpresent",
  storageBucket: "tkgpresent.appspot.com",
  messagingSenderId: "687475377996",
  appId: "1:687475377996:web:27021ebb3d4e26850df1e9",
};

const app = initializeApp(firebaseConfig);

createApp(App).use(store).use(router).mount("#app");
