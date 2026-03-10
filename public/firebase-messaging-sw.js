// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// We cannot use import.meta.env here since it is a standard service worker script.
// Please replace these placeholders with your actual string values from Firebase console.
const firebaseConfig = {
    apiKey: "AIzaSyDvyZGjQsgZuZ5VT3wmqAI0edN040x_FxM",
    authDomain: "mytogether-daf3f.firebaseapp.com",
    projectId: "mytogether-daf3f",
    storageBucket: "mytogether-daf3f.firebasestorage.app",
    messagingSenderId: "972280179999",
    appId: "1:972280179999:web:634f04c0d7662ad569542a",
    measurementId: "G-7WLNHLWN6D"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Customize notification here
    const notificationTitle = payload.notification.title || "New Notification";
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg' // Update this to your icon path, e.g., '/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
