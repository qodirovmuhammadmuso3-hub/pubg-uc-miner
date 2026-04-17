import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import (
    InlineKeyboardMarkup, 
    InlineKeyboardButton, 
    WebAppInfo, 
    MenuButtonWebApp,
    ReplyKeyboardMarkup,
    KeyboardButton
)
from dotenv import load_dotenv

# Sozlamalarni yuklash
load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
CHANNEL_ID = os.getenv("CHANNEL_ID")
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:8000")

# Logging
logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

async def check_subscription(user_id: int):
    """Foydalanuvchi kanalga a'zo ekanligini tekshiradi"""
    try:
        member = await bot.get_chat_member(chat_id=CHANNEL_ID, user_id=user_id)
        return member.status in ["member", "administrator", "creator"]
    except Exception as e:
        print(f"Subscription check error: {e}")
        return False

async def get_main_keyboard(user_id: int):
    """Asosiy menyu tugmalari"""
    is_sub = await check_subscription(user_id)
    kb = []
    if not is_sub:
        kb.append([InlineKeyboardButton(text="📢 Kanalga obuna bo'lish", url=f"https://t.me/{CHANNEL_ID.replace('@', '')}")])
        kb.append([InlineKeyboardButton(text="✅ Obunani tekshirish", callback_data="check_sub")])
    else:
        kb.append([InlineKeyboardButton(text="🎮 O'yinni boshlash", web_app=WebAppInfo(url=f"{WEBAPP_URL}/index.html"))])
    
    return InlineKeyboardMarkup(inline_keyboard=kb)

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    is_sub = await check_subscription(user_id)
    
    welcome_text = (
        f"Salom {message.from_user.first_name}! 👋\n\n"
        "PUBG UC Earn botiga xush kelibsiz. Bu yerda siz vazifalarni bajarib bepul UC olishingiz mumkin."
    )
    
    if not is_sub:
        welcome_text += "\n\n⚠️ Davom etish uchun kanalimizga obuna bo'ling:"
        
    await message.answer(welcome_text, reply_markup=await get_main_keyboard(user_id))

@dp.callback_query(F.data == "check_sub")
async def process_check_sub(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    if await check_subscription(user_id):
        await callback_query.message.edit_text(
            "✅ Rahmat! Obuna tasdiqlandi. Endi o'yinni boshlashingiz mumkin:",
            reply_markup=await get_main_keyboard(user_id)
        )
    else:
        await callback_query.answer("⚠️ Siz hali kanalga a'zo emassiz!", show_alert=True)

# Menu Buttonni sozlash (Bot ishga tushganda)
async def on_startup(bot: Bot):
    # Bu yerda 'Open' (yoki 'O'yin') tugmasini chap burchakka o'rnatamiz
    await bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="Open", 
            web_app=WebAppInfo(url=f"{WEBAPP_URL}/index.html")
        )
    )
    print("Menu Button o'rnatildi.")

async def main():
    print("Bot ishga tushdi...")
    # Startup funksiyasini chaqirish
    await on_startup(bot)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
