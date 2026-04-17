const CONFIG = {
  botUsername: 'your_bot', // <-- BOT USERNAME'INGIZNI SHU YERGA YOZING
  channelLink: 'https://t.me/pubguc_uz', // Obuna bo'lish kerak bo'lgan kanal havolasi
  earnDelay: 3000, // Vazifani bajarishdagi kutish vaqti (ms)
  apiUrl: window.location.origin.includes('localhost') ? 'http://localhost:8080' : window.location.origin, // Backend API manzili (Vercel uchun dinamik)
};
