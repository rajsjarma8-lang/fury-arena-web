// This script runs in the background to handle push notifications
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCmsoZNCa9ceaNpRKNbJA9soqhygNBmoAw",
  authDomain: "free-fire-pro-58613.firebaseapp.com",
  projectId: "free-fire-pro-58613",
  storageBucket: "free-fire-pro-58613.firebasestorage.app",
  messagingSenderId: "723586708415",
  appId: "1:723586708415:web:fa77a5765e80825bc2a70a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
