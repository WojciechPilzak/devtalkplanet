import Alpine from 'https://unpkg.com/alpinejs@3.x.x/dist/module.esm.js';
import {storage, ref, getDownloadURL, getDocs, collection, db} from "./firebase.js";



//document.addEventListener('alpine:init', () => {
window.Alpine = Alpine

    Alpine.data('counter', () => ({
        count: 0,
        imageUrl: '',
        events: [],
        increment() {
            this.count++;
        },
        decrement() {
            this.count--;
        },


        async init() {
            // Podaj ścieżkę do pliku w Firebase Storage
            const imageRef = ref(storage, 'public/IMG_1566.webp')

            try {
                this.imageUrl = await getDownloadURL(imageRef)
                const querySnapshout = await getDocs(collection(db, 'events'));
                this.events = querySnapshout.docs.map(doc => {
                    id: doc.id,
                    console.log(doc.data())
                });
                console.log("Wydarzenia:", this.events);
            } catch (error) {
                console.error('Błąd ładowania obrazka:', error)
            }
        }
    }))
Alpine.start()
//});

console.log("App.js załadowany.");




/*import {
    db,
    collection,
    getDocs,
    addDoc
} from "./js/firebase.js";

import { Calendar } from "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js";

// === FullCalendar: Kalendarz wydarzeń ===
function initCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) return;

    const calendar = new Calendar(calendarEl, {
        initialView: "dayGridMonth",
        events: async (fetchInfo, successCallback) => {
            const snapshot = await getDocs(collection(db, "events"));
            const events = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    title: data.title,
                    start: data.date,
                    url: data.link || null
                };
            });
            successCallback(events);
        }
    });

    calendar.render();
}

// === Archiwum wydarzeń (tylko przeszłe) ===
async function loadArchivedEvents() {
    const archiveEl = document.getElementById("eventArchive");
    if (!archiveEl) return;

    const now = new Date();
    const snapshot = await getDocs(collection(db, "events"));

    snapshot.forEach(doc => {
        const data = doc.data();
        const eventDate = new Date(data.date);

        if (eventDate < now) {
            const card = document.createElement("div");
            card.classList.add("event-card");
            card.innerHTML = `
        <img src="${data.image || 'https://via.placeholder.com/300x180'}" alt="${data.title}" />
        <h3>${data.title}</h3>
        <p>${eventDate.toLocaleDateString()}</p>
        ${data.link ? `<p><a href="${data.link}" target="_blank">Zobacz nagranie</a></p>` : ''}
      `;
            archiveEl.appendChild(card);
        }
    });
}

// === Partnerzy ===
async function loadPartners() {
    const partnerList = document.getElementById("partnerList");
    if (!partnerList) return;

    const snapshot = await getDocs(collection(db, "partners"));
    snapshot.forEach(doc => {
        const data = doc.data();
        const div = document.createElement("div");
        div.classList.add("partner-card");
        div.innerHTML = `
      <a href="${data.link}" target="_blank">
        <img src="${data.logo}" alt="${data.name}" />
      </a>
    `;
        partnerList.appendChild(div);
    });
}

// === Blog (dla Alpine.js) ===
window.loadPosts = async function () {
    const snapshot = await getDocs(collection(db, "blog"));
    this.posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

window.filteredPosts = function () {
    return () => {
        if (!this.search) return this.posts;
        const query = this.search.toLowerCase();
        return this.posts.filter(post =>
            post.title.toLowerCase().includes(query) ||
            post.summary.toLowerCase().includes(query)
        );
    };
};

// === Pobieranie wydarzeń (dla Alpine.js) ===
window.fetchEvents = async function () {
    const snapshot = await getDocs(collection(db, "events"));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// === Newsletter zapis (dla Alpine.js) ===
window.saveEmail = async function () {
    if (!this.email.includes("@")) {
        alert("Nieprawidłowy e-mail");
        return;
    }

    try {
        await addDoc(collection(db, "newsletter"), {
            email: this.email,
            date: new Date().toISOString()
        });
        this.success = true;
    } catch (error) {
        console.error("Błąd zapisu e-maila:", error);
    }
};

// === Start aplikacji ===
initCalendar();
loadArchivedEvents();
loadPartners();*/

/*
import { db, collection, getDocs } from "./firebase.js"

document.addEventListener('alpine:init', () => {
    Alpine.data('jsonLoader', () => ({
        items: [],
        async init() {
            const querySnapshot = await getDocs(collection(db, 'articles'))
            this.items = querySnapshot.docs.map(doc => doc.data())
        }
    }))
})

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// === FullCalendar init ===
function initCalendar() {
    const calendarEl = document.getElementById("calendar");
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        events: async function (fetchInfo, successCallback) {
            const snapshot = await db.collection("events").get();
            const events = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    title: data.title,
                    start: data.date,
                    url: data.link || null
                };
            });
            successCallback(events);
        }
    });
    calendar.render();

    // === Archiwum wydarzeń ===
    db.collection("events").get().then(snapshot => {
        const archiveEl = document.getElementById("eventArchive");
        const now = new Date();
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const eventDate = new Date(data.date);
            if (eventDate < now) {
                const card = document.createElement("div");
                card.classList.add("event-card");
                card.innerHTML = `
          <img src="${data.image || 'https://via.placeholder.com/300x180'}" alt="${data.title}" />
          <h3>${data.title}</h3>
          <p>${new Date(data.date).toLocaleDateString()}</p>
          ${data.link ? `<p><a href="${data.link}" target="_blank">Zobacz nagranie</a></p>` : ''}
        `;
                archiveEl.appendChild(card);
            }
        });
    });

    // === Partnerzy ===
    db.collection("partners").get().then(snapshot => {
        const list = document.getElementById("partnerList");
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const div = document.createElement("div");
            div.classList.add("partner-card");
            div.innerHTML = `
        <a href="${data.link}" target="_blank">
          <img src="${data.logo}" alt="${data.name}" />
        </a>
      `;
            list.appendChild(div);
        });
    });
}

// === Blog + wyszukiwarka (Alpine) ===
function loadPosts() {
    const comp = this;
    db.collection("blog").orderBy("date", "desc").get().then(snapshot => {
        comp.posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    });
}

Alpine.data.filteredPosts = function () {
    return function () {
        if (!this.search) return this.posts;
        return this.posts.filter(post =>
            post.title.toLowerCase().includes(this.search.toLowerCase()) ||
            post.summary.toLowerCase().includes(this.search.toLowerCase())
        );
    };
};

// === Newsletter zapis do Firestore ===
function saveEmail() {
    if (!this.email.includes('@')) return alert('Nieprawidłowy e-mail');
    db.collection("newsletter").add({ email: this.email, date: new Date().toISOString() })
        .then(() => this.success = true)
        .catch(console.error);
}*/
