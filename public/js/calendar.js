import { db, collection, getDocs } from './firebase.js';

export default () => ({
    calendar: null,
    allEvents: [],
    filteredEvents: [],
    searchQuery: '',
    dateFilter: '',
    currentView: 'dayGridMonth',
    isLoading: true,
    eventsCount: 0,

    async init() {
        console.log('Inicjalizacja kalendarza...');

        // Sprawdź czy FullCalendar jest dostępny globalnie
        if (typeof FullCalendar === 'undefined') {
            console.error('FullCalendar nie jest załadowany! Dodaj <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.js"></script> do HTML.');
            return;
        }

        try {
            await this.loadEventsFromFirebase();
            this.initializeCalendar();
        } catch (error) {
            console.error('Błąd podczas inicjalizacji:', error);
            this.isLoading = false;
        }
    },

    async loadEventsFromFirebase() {
        this.isLoading = true;
        console.log('Ładowanie wydarzeń z Firebase...');

        try {
            const querySnapshot = await getDocs(collection(db, 'events'));
            this.allEvents = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    start: data.date,
                    end: data.endDate || null,
                    color: data.color || '#007bff',
                    extendedProps: {
                        location: data.location || '',
                        description: data.description || '',
                        category: data.category || ''
                    }
                };
            });

            // Początkowo wszystkie wydarzenia są wyświetlane
            this.filteredEvents = [...this.allEvents];
            this.eventsCount = this.allEvents.length;

            console.log(`Załadowano ${this.allEvents.length} wydarzeń z Firebase`);
        } catch (error) {
            console.error('Błąd podczas ładowania wydarzeń:', error);
            this.allEvents = [];
            this.filteredEvents = [];
        }

        this.isLoading = false;
    },

    initializeCalendar() {
        const container = this.$refs.calendarContainer;

        if (!container) {
            console.error('Element x-ref="calendarContainer" nie został znaleziony!');
            return;
        }

        this.calendar = new FullCalendar.Calendar(container, {
            initialView: this.currentView,
            locale: 'pl',
            headerToolbar: {
                left: '',
                center: 'title',
                right: ''
            },
            height: 'auto',
            events: this.filteredEvents,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            weekends: true,
            eventDisplay: 'block',
            displayEventTime: true,
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },

            // Kliknięcie w wydarzenie
            eventClick: (info) => {
                const event = info.event;
                const details = [
                    `📌 ${event.title}`,
                    `📅 ${event.start.toLocaleDateString('pl-PL')}`,
                    event.end ? `⏰ ${event.start.toLocaleTimeString('pl-PL')} - ${event.end.toLocaleTimeString('pl-PL')}` : `⏰ ${event.start.toLocaleTimeString('pl-PL')}`,
                    event.extendedProps.location ? `📍 ${event.extendedProps.location}` : '',
                    event.extendedProps.description ? `📝 ${event.extendedProps.description}` : '',
                    event.extendedProps.category ? `🏷️ ${event.extendedProps.category}` : ''
                ].filter(Boolean).join('\n');

                alert(details);
            },

            // Kliknięcie w datę
            dateClick: (info) => {
                console.log('Kliknięto datę:', info.dateStr);
                this.dateFilter = info.dateStr;
                this.filterEvents();
            }
        });

        this.calendar.render();
        console.log('Kalendarz wyrenderowany');
    },

    // Wyszukiwanie i filtrowanie
    filterEvents() {
        console.log('Filtrowanie wydarzeń...', {
            searchQuery: this.searchQuery,
            dateFilter: this.dateFilter
        });

        this.filteredEvents = this.allEvents.filter(event => {
            const matchesSearch = this.searchInEvent(event, this.searchQuery);
            const matchesDate = this.filterByDate(event, this.dateFilter);
            return matchesSearch && matchesDate;
        });

        console.log(`Przefiltrowane wydarzenia: ${this.filteredEvents.length}/${this.allEvents.length}`);

        // Aktualizuj kalendarz
        if (this.calendar) {
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(this.filteredEvents);
        }
    },

    searchInEvent(event, query) {
        if (!query) return true;

        const searchIn = [
            event.title || '',
            event.extendedProps?.description || '',
            event.extendedProps?.location || '',
            event.extendedProps?.category || ''
        ].join(' ').toLowerCase();

        return searchIn.includes(query.toLowerCase());
    },

    filterByDate(event, dateFilter) {
        if (!dateFilter) return true;

        const eventDate = new Date(event.start).toISOString().split('T')[0];
        return eventDate === dateFilter;
    },

    // Kontrolki kalendarza
    toggleView(viewName) {
        if (this.calendar) {
            this.calendar.changeView(viewName);
            this.currentView = viewName;
        }
    },

    goToPrev() {
        if (this.calendar) this.calendar.prev();
    },

    goToNext() {
        if (this.calendar) this.calendar.next();
    },

    goToToday() {
        if (this.calendar) this.calendar.today();
    },

    // Czyszczenie filtrów
    clearFilters() {
        this.searchQuery = '';
        this.dateFilter = '';
        this.filterEvents();
    },

    // Odświeżanie danych z Firebase
    async refreshEvents() {
        await this.loadEventsFromFirebase();
        this.filterEvents();
    },

    // Import z pliku JSON (dodatkowa opcja)
    loadEventsFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);

                let importedEvents = [];
                if (Array.isArray(jsonData)) {
                    importedEvents = jsonData;
                } else if (jsonData.events && Array.isArray(jsonData.events)) {
                    importedEvents = jsonData.events;
                } else {
                    throw new Error('Plik JSON powinien zawierać tablicę wydarzeń');
                }

                // Dodaj do istniejących wydarzeń
                this.allEvents = [...this.allEvents, ...importedEvents];
                this.filterEvents();
                alert(`Zaimportowano ${importedEvents.length} wydarzeń z pliku!`);

            } catch (error) {
                alert('Błąd podczas importowania pliku: ' + error.message);
                console.error('Błąd JSON:', error);
            }
        };
        reader.readAsText(file);

        // Wyczyść input
        event.target.value = '';
    },

    // Eksport do JSON
    exportEvents() {
        const dataStr = JSON.stringify(this.allEvents, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `wydarzenia_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
});