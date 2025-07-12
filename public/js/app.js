import Alpine from 'https://unpkg.com/alpinejs@3.x.x/dist/module.esm.js';
import {
    storage,
    ref,
    getDownloadURL,
    getDocs,
    collection,
    db,
    getDoc,
    doc
} from "./firebase.js";

window.Alpine = Alpine

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

    async loadEventDetails(event) {
        if (event.details || event.detailsLoading) return;
        event.detailsLoading = true;

        try {
            console.log("event.id =", event.id);

            const docRef = doc(db, "eventDetails", event.id);
            const docSnap = await getDoc(docRef);

            console.log("docSnap.exists() =", docSnap.exists());
            console.log("docSnap.data() =", docSnap.data());

            if (docSnap.exists()) {
                const data = docSnap.data();
                event.details = {
                    location: data.location?.venue || 'Brak danych',
                    address: data.location?.address || '',
                    duration: data.duration_hours ? `${data.duration_hours}h` : 'Brak danych',
                    description: data.description || 'Brak opisu',
                    speakers: data.speakers || [],
                    link: data.link || null,
                    gallery: data.gallery?.slice(0, 10) || [],
                };
            } else {
                event.details = { description: 'Brak detali — dokument nie istnieje' };
            }
        } catch (e) {
            console.error('Błąd Firebase:', e);
            event.details = { description: 'Błąd ładowania detali.' };
        }
    },




    get availableTechnologies() {
        return [...new Set(this.events.flatMap(e => e.technologies || []))]
            .filter(tech => !this.selectedTechnologies.includes(tech))
            .sort();
    },


    filterEvents(events) {
        return events.filter(e => {
            e.details = null;
            e.detailsLoading = false;

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

Alpine.start()

console.log("App.js załadowany.");


const test = async () => {
    const ref = doc(db, 'eventDetails', 'ljc-meetup-july-2025');
    const snap = await getDoc(ref);
    console.log('TEST snapshot exists:', snap.exists());
    console.log('TEST snapshot data:', snap.data());
};

test();