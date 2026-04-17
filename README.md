# PUBG UC Earn — Telegram Mini App

## Ishga tushirish bo'yicha qo'llanma

---

### 1. Telegram Bot yaratish

1. [@BotFather](https://t.me/BotFather) ga boring
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting (masalan: `PUBG UC Earn`)
4. Bot username'ini kiriting (masalan: `pubguc_earn_bot`)
5. Token oling va saqlang

---

### 2. Mini App ulash

BotFather'ga boring:
```
/mybots → Botingizni tanlang → Bot Settings → Menu Button → Configure Menu Button
```
URL sifatida hosting manzilini kiriting (masalan: `https://sizning-sayt.uz`).

---

### 3. index.html'ni sozlash

`index.html` fayldagi quyidagi qatorni o'zgartiring:

```javascript
const botUsername = 'your_bot'; // <-- BU YERGA BOT USERNAME'INGIZNI YOZING
```

---

### 4. Hosting

**Bepul variantlar:**
- [Vercel](https://vercel.com) — eng qulay, GitHub bilan bog'lash
- [Netlify](https://netlify.com) — drag-and-drop deploy
- [GitHub Pages](https://pages.github.com) — bepul

**Deploy qilish (Vercel):**
```bash
npm i -g vercel
cd pubg-uc-miniapp
vercel
```

---

### 5. Backend qo'shish (ixtiyoriy)

Hozir ilova `localStorage` ishlatadi. Real foydalanuvchilar uchun backend kerak.

**Stack tavsiyasi:**
- Node.js + Express
- PostgreSQL yoki MongoDB
- Render.com yoki Railway.app (bepul hosting)

**Asosiy API endpointlar:**
```
POST /api/user/init      → foydalanuvchi ro'yxatdan o'tkazish
POST /api/task/complete  → vazifa bajarish va coin berish
POST /api/exchange       → UC so'rovi yuborish
GET  /api/user/balance   → joriy balans
```

---

### 6. UC chiqarish

**Reseller yo'li (avtomatik):**
- [Midasbuy](https://www.midasbuy.com) — reseller akkount oching
- [UCVoucher](https://ucvoucher.com) — API orqali to'ldirish

**Manual yo'l (boshlang'ich):**
- Foydalanuvchi Player ID kiritadi
- Siz admin panel orqali to'ldirasiz
- Midasbuy yoki PUBG Mobile'dagi "Sovg'a" funksiyasi

---

### 7. Reklama integratsiyasi (asosiy daromad)

**Adsgram** — Telegram Mini App uchun eng mashhur:
```html
<script src="https://sad.adsgram.ai/js/sad.min.js"></script>
```
[Adsgram.ai](https://adsgram.ai) saytida ro'yxatdan o'ting → `blockId` oling.

Vazifadagi `type:'ad'` ni Adsgram SDK bilan almashtirsangiz, haqiqiy pul ishlaysiz.

---

### 8. Referal tizimi (backend)

```javascript
// Bot start handler'da
bot.onText(/\/start ref_(\d+)/, async (msg, match) => {
  const referrerId = match[1];
  const newUserId = msg.from.id;
  // referrerId ga +100 coin ber
  await db.addCoins(referrerId, 100);
});
```

---

## Fayl tuzilmasi

```
pubg-uc-miniapp/
├── index.html     ← asosiy Mini App (bu fayl)
├── README.md      ← shu qo'llanma
└── (kelajakda)
    ├── backend/
    │   ├── index.js
    │   └── db.js
    └── admin/
        └── index.html
```

---

## Muhim eslatmalar

- Mini App **HTTPS** da ishlashi shart
- Telegram WebApp API faqat botdan ochilganda ishlaydi
- UC ayirboshlash **haqiqiy pul** talab qiladi — reseller akkount kerak
- Adsgram yoki shunga o'xshash platforma bilan shartnoma tuzing
