import Alpine from 'https://unpkg.com/alpinejs@3.x.x/dist/module.esm.js';
import {storage, ref, getDownloadURL, getDocs, collection, db} from "./firebase.js";

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

Alpine.start()

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