import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrQ748diFy08The8iht3NW3IcgzqfbGEI",
  authDomain: "mysimplecounter.firebaseapp.com",
  projectId: "mysimplecounter",
  storageBucket: "mysimplecounter.firebasestorage.app",
  messagingSenderId: "230753060482",
  appId: "1:230753060482:web:73cd28e5c493a0dd9d969b",
  measurementId: "G-TYZPYVG8LW",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI Элементы
const authSection = document.getElementById("auth-section");
const counterSection = document.getElementById("counter-section");
const loginBox = document.getElementById("login-box");
const regBox = document.getElementById("reg-box");

const countingNumber = document.getElementById("counting-number");
const btnPlus = document.getElementById("btn-plus");
const btnMinus = document.getElementById("btn-minus");
const resetBtn = document.getElementById("reset-btn");
const finalNumber = document.getElementById("final-number");
const forwardRadio = document.querySelector('input[value="forward"]');
const backwardRadio = document.querySelector('input[value="backward"]');

let currentUserProfile = null;
let currentUserCounterData = null;

// === ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ФОРМ ===
document.getElementById("link-to-reg").addEventListener("click", async () => {
  loginBox.classList.add("hidden");
  regBox.classList.remove("hidden");
});
document.getElementById("link-to-login").addEventListener("click", async () => {
  regBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
});

// === РЕГИСТРАЦИЯ ===
document.getElementById("btn-do-reg").addEventListener("click", async () => {
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const pass = document.getElementById("reg-pass").value;
  const errDiv = document.getElementById("reg-err");

  if (!name) {
    errDiv.innerText = "Укажите имя";
    errDiv.style.display = "block";
    return;
  }

  try {
    const profile = await createUserWithEmailAndPassword(auth, email, pass);
    // Создаем дефолтные настройки счетчика в Firestore
    await setDoc(doc(db, "counters", profile.user.uid), {
      currentNumber: 0,
      finalNumber: 999,
      countingType: "forward",
      authorName: name,
    });
    // Создаем профиль в Firestore
    await setDoc(doc(db, "users", profile.user.uid), {
      displayName: name,
      email: email,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    errDiv.innerText = e.message;
    errDiv.style.display = "block";
  }
});

// === LOGIN ===
document.getElementById("btn-do-login").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-pass").value;
  const errDiv = document.getElementById("login-err");

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    console.error(e);
    errDiv.innerText = "Ошибка: неверный логин или пароль";
    errDiv.style.display = "block";
  }
});

// === EXIT ===
document.getElementById("btn-logout").addEventListener("click", async () => {
  signOut(auth);
});

// === ЗАГРУЖАЕМ ДАННЫЕ из Firebase ===
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Загружаем профиль
    const snapshot = await getDoc(doc(db, "users", user.uid));
    const usersCounterSnapshot = await getDoc(doc(db, "counters", user.uid));
    if (snapshot.exists()) {
      currentUserProfile = snapshot.data();
      document.getElementById("display-name").innerText =
        currentUserProfile.displayName;
    } else {
      document.getElementById("display-name").innerText = "Без профиля";
    }
    authSection.classList.add("hidden");
    counterSection.classList.remove("hidden");

    // Загружаем счетчик пользователя
    if (usersCounterSnapshot.exists()) {
      currentUserCounterData = usersCounterSnapshot.data();
      countingNumber.textContent = currentUserCounterData.currentNumber;
      finalNumber.value = currentUserCounterData.finalNumber;
      if (currentUserCounterData.countingType === "forward") {
        forwardRadio.checked = true;
      } else {
        backwardRadio.checked = true;
      }
    }
  } else {
    authSection.classList.remove("hidden");
    counterSection.classList.add("hidden");
    currentUserProfile = null;
  }
});

// === РАБОТА С СЧЕТЧИКОМ ===

btnPlus.addEventListener("click", () => {
  sendData("plus");
});
btnMinus.addEventListener("click", () => {
  sendData("minus");
});

async function sendData(calculate) {
  // ======= ??????????????
  let currentCount = Number(document.getElementById("counting-number").textContent);
  let currentFinal = Number(document.getElementById("final-number").value);
  // ======= ??????????????

  if(calculate === "plus") {
    currentCount < currentFinal ? currentCount += 1 : currentCount;
  } else {
    currentCount > 0 ? currentCount -= 1 : currentCount;
  };
  await setDoc(
    doc(db, "counters", auth.currentUser.uid),
    {
      currentNumber: currentCount
    },
    { merge: true },
  );
}

// update final number
finalNumber.addEventListener('change', async () => {
  let currentFinalNumber = Number(document.getElementById("final-number").value);
  await setDoc(
    doc(db, "counters", auth.currentUser.uid),
    {
      finalNumber: currentFinalNumber
    },
    { merge: true },
  );
});

// update counter type
const switchers = document.querySelectorAll('input[name="type-switcher"]');
for(let i=0; i<switchers.length; i++) {
  switchers[i].addEventListener('change', async () => {
    let currentChecked = document.querySelector('input[name="type-switcher"]:checked');
    await setDoc(
      doc(db, "counters", auth.currentUser.uid),
      {
        countingType: currentChecked.value
      },
      { merge: true },
    );
  });
}

// reset counter
resetBtn.addEventListener('click', async () => {
  let resetNumber = document.querySelector('input[name="type-switcher"]:checked').value === "forward"?0:+finalNumber.value;
  await setDoc(
    doc(db, "counters", auth.currentUser.uid),
    {
      currentNumber: resetNumber
    },
    { merge: true },
  );
});

// === REAL-TIME CONNECTION ===
// Мы не просто "скачиваем" данные один раз. Мы "подписываемся" на изменения:
onAuthStateChanged(auth, async () => {
  const unsubscribe = onSnapshot(
    doc(db, "counters", auth.currentUser.uid),
    (snapshot) => {
      countingNumber.innerHTML = "";

      const data = snapshot.data();
      countingNumber.textContent = data.currentNumber;
    },
  );
});
