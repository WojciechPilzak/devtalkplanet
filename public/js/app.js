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