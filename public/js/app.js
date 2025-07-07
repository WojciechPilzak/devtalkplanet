import Alpine from 'https://unpkg.com/alpinejs@3.x.x/dist/module.esm.js';
import {storage, ref, getDownloadURL, getDocs, collection, db} from "./firebase.js";
import calendarApp from "./calendar.js";




//document.addEventListener('alpine:init', () => {
window.Alpine = Alpine

Alpine.data('eventList', () => ({
    events: [],
    async init() {
        const res = await fetch('./events.json');
        const data = await res.json();
        this.events = data.events.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}));


// Rejestracja eventCountdown przed Alpine.start()
Alpine.data('eventCountdown', () => ({
    eventDate: new Date("September 19, 2025 08:00:00").getTime(),
    countdown: '',
    init() {
        setInterval(() => {
            const now = new Date().getTime();
            const distance = this.eventDate - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            this.countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            // Jeśli event się zacznie, wyświetl "Event Started!"
            if (distance < 0) {
                this.countdown = "Event Started!";
            }
        }, 1000);
    }
}));

Alpine.data('calendarApp', calendarApp);

    Alpine.data('counter', () => ({
        imageUrl: '',
        events: [],


        async init() {
            // Podaj ścieżkę do pliku w Firebase Storage
            const imageRef = ref(storage, 'public/IMG_1566.webp')

            try {
                this.imageUrl = await getDownloadURL(imageRef)
                const querySnapshout = await getDocs(collection(db, 'events'));
                this.events = querySnapshout.docs.map(doc => {
                    id: doc.id
                });
                console.log("Wydarzenia:", this.events);
            } catch (error) {
                console.error('Błąd ładowania obrazka:', error)
            }
        }
    }))
Alpine.data('events', () => ({
    imageUrl: '',
    events: [],
    selectedCity: '',
    selectedTags: [],
    selectedTechnologies: [],
    showPast: false,

    async init() {
        try {
            // Ładujemy dane z pliku JSON (zmień ścieżkę wg potrzeby)
            const res = await fetch('./eventsTest.json');
            this.events = await res.json();

            console.log("Załadowane eventy:", this.events);
        } catch (error) {
            console.error('Błąd ładowania pliku JSON:', error);
        }
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    get uniqueCities() {
        return [...new Set(this.events.map(e => e.city))].sort();
    },

    get availableTags() {
        return [...new Set(this.events.flatMap(e => e.tags || []))]
            .filter(tag => !this.selectedTags.includes(tag))
            .sort();
    },

    addTag(event) {
        const tag = event.target.value;
        if (tag && !this.selectedTags.includes(tag)) {
            this.selectedTags.push(tag);
        }
        event.target.value = '';
    },

    removeTag(tag) {
        this.selectedTags = this.selectedTags.filter(t => t !== tag);
    },



    addTechnology(event) {
        const tech = event.target.value;
        if (tech && !this.selectedTechnologies.includes(tech)) {
            this.selectedTechnologies.push(tech);
        }
        event.target.value = '';
    },

    removeTechnology(tech) {
        this.selectedTechnologies = this.selectedTechnologies.filter(t => t !== tech);
    },

    get availableTechnologies() {
        return [...new Set(this.events.flatMap(e => e.technologies || []))]
            .filter(tech => !this.selectedTechnologies.includes(tech))
            .sort();
    },


    filterEvents(events) {
        return events.filter(e => {
            const cityMatch = this.selectedCity === '' || e.city === this.selectedCity;
            const techMatch =
                this.selectedTechnologies.length === 0 ||
                this.selectedTechnologies.some(t => e.technologies?.includes(t));
            const tagMatch = this.selectedTags.length === 0 || this.selectedTags.some(t => e.tags?.includes(t));
            return cityMatch && techMatch && tagMatch;
        });
    },

    get filteredUpcomingEvents() {
        const now = new Date();
        return this.filterEvents(this.events.filter(e => new Date(e.date) > now));
    },

    get filteredPastEvents() {
        const now = new Date();
        return this.filterEvents(this.events.filter(e => new Date(e.date) <= now));
    }
}));


Alpine.data('eventApp', () => ({
    // State
    showModal: false,
    currentEvent: null,
    currentIndex: 0,
    currentFilter: 'all',
    events: [],

    // Init - ładowanie danych z JSON
    async init() {
        try {
            const res = await fetch('./events.json');
            const data = await res.json();
            this.events = data.events.sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
            console.error('Błąd ładowania eventów:', error);
            this.events = [];
        }


    },

    // Computed properties
    get filteredEvents() {
        if (this.currentFilter === 'upcoming') return this.upcomingEvents;
        if (this.currentFilter === 'past') return this.pastEvents;
        return this.events;
    },

    get upcomingEvents() {
        return this.events.filter(event => !this.isPastEvent(event));
    },

    get pastEvents() {
        return this.events.filter(event => this.isPastEvent(event));
    },

    get currentImage() {
        if (!this.currentEvent?.gallery?.images) return '';
        return this.currentEvent.gallery.images[this.currentIndex];
    },

    // Methods
    isPastEvent(event) {
        return new Date(event.date) < new Date();
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('pl-PL', options);
    },

    openGallery(event) {
        if (!event.gallery) return;

        this.currentEvent = event;
        this.currentIndex = 0;
        this.showModal = true;
        document.body.style.overflow = 'hidden';
    },

    closeGallery() {
        this.showModal = false;
        this.currentEvent = null;
        this.currentIndex = 0;
        document.body.style.overflow = 'auto';
    },

    nextImage() {
        if (this.currentIndex < this.currentEvent.gallery.images.length - 1) {
            this.currentIndex++;
        }
    },

    prevImage() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    },

    getThumbUrl(imageUrl) {
        // Cloudinary miniaturki
        return imageUrl.replace('/upload/', '/upload/c_fill,h_60,w_80/');
    },

    // Dodatkowe metody dla zarządzania eventami
    addEvent(eventData) {
        this.events.push(eventData);
        this.events.sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    updateEvent(eventId, updates) {
        const index = this.events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            this.events[index] = { ...this.events[index], ...updates };
        }
    },

    // Dodanie galerii do zakończonego eventu
    addGalleryToEvent(eventId, galleryData) {
        this.updateEvent(eventId, { gallery: galleryData });
    },

    // Automatyczne ładowanie zdjęć z Cloudinary (opcjonalne)
    async loadGalleryFromCloudinary(eventId, cloudinaryFolder) {
        try {
            // Tutaj będzie wywołanie do Cloudinary API
            const response = await fetch(
                `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/list/${cloudinaryFolder}.json`
            );
            const data = await response.json();

            const images = data.resources.map(img =>
                `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${img.public_id}`
            );

            const galleryData = {
                cloudinaryFolder: cloudinaryFolder,
                thumbnail: this.getThumbUrl(images[0]),
                images: images
            };

            this.addGalleryToEvent(eventId, galleryData);

        } catch (error) {
            console.error('Błąd ładowania galerii:', error);
        }
    }
}));

// Obsługa klawiatury dla galerii

Alpine.start()
//});
console.log('Dostępne komponenty:', Alpine.store || 'brak');
console.log("App.js załadowany.");

document.addEventListener('keydown', function(e) {
    const app = Alpine.$data(document.querySelector('[x-data="eventApp"]'));
    if (!app || !app.showModal) return;

    if (e.key === 'ArrowRight') {
        app.nextImage();
    } else if (e.key === 'ArrowLeft') {
        app.prevImage();
    }
});

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
