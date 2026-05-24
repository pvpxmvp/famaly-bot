import asyncio
import logging
import os
import sys
from aiogram import Bot, Dispatcher, Router, F, types
from aiogram.filters import CommandStart, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from aiogram.fsm.storage.memory import MemoryStorage

# Import local database functions
import database

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Fetch Token from Environment Variable
BOT_TOKEN = os.getenv("BOT_TOKEN")

if not BOT_TOKEN:
    logger.critical("BOT_TOKEN environment variable is not defined! Please set BOT_TOKEN.")
    # We do not crash here so the file can be inspected, but explain it clearly
    BOT_TOKEN = "PLACEHOLDER_TOKEN"

# Initialize bot and dispatcher
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())
router = Router()

# Define States for FSM
class ExpenseState(StatesGroup):
    waiting_for_amount = State()
    waiting_for_category = State()
    waiting_for_description = State()

class ShoppingState(StatesGroup):
    waiting_for_item = State()

# --- Main Keyboards ---
def get_main_menu_keyboard():
    """Returns the persistent bottom reply keyboard."""
    kb = [
        [
            KeyboardButton(text="💰 Финансы"),
            KeyboardButton(text="📝 Список покупок")
        ]
    ]
    return ReplyKeyboardMarkup(
        keyboard=kb,
        resize_keyboard=True,
        placeholder="Выберите действие из меню..."
    )

# --- Handlers ---

@router.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext):
    """Handles the /start command, registering the user and displaying the menu."""
    await state.clear()
    
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name or f"User_{user_id}"
    
    # Register in DB
    database.register_user(user_id, username)
    logger.info(f"User {username} (ID: {user_id}) triggered start.")

    welcome_text = (
        f"👋 Привет, {message.from_user.first_name}!\n\n"
        "🤖 Я твой умный семейный помощник для ведения бюджета и списков покупок.\n\n"
        "💳 С моей помощью вы можете:\n"
        "• Совместно вести учет расходов семьи по категориям\n"
        "• Просматривать отчеты за текущий месяц\n"
        "• Создавать и обновлять общий список покупок в реальном времени\n\n"
        "Используйте кнопки меню ниже для управления!"
    )
    
    await message.answer(welcome_text, reply_markup=get_main_menu_keyboard())


@router.message(F.text == "💰 Финансы")
async def process_finance_menu(message: types.Message, state: FSMContext):
    """Displays financial stats for the current month and an add expense button."""
    await state.clear()
    report = database.get_monthly_report()
    
    total = report["total"]
    categories = report["categories"]
    month_name = report["month_name"]
    
    # Standard translation list for prettier categories
    cat_icons = {
        "Продукты": "🛒",
        "ЖКХ": "🔌",
        "Машина": "🚗",
        "Другое": "📦"
    }

    category_details = ""
    for standard_cat in ["Продукты", "ЖКХ", "Машина", "Другое"]:
        amount_spent = categories.get(standard_cat, 0.0)
        icon = cat_icons.get(standard_cat, "🔹")
        category_details += f"{icon} {standard_cat}: **{amount_spent:,.2f} руб.**\n"

    # Also show any custom categories if they exist
    for cat, amount_spent in categories.items():
        if cat not in ["Продукты", "ЖКХ", "Машина", "Другое"]:
            category_details += f"🔹 {cat}: **{amount_spent:,.2f} руб.**\n"
            
    response_text = (
        f"📊 **Финансовый отчет**\n"
        f"🗓 **Период:** {month_name}\n\n"
        f"💳 **Общие расходы семьи:** {total:,.2f} руб.\n\n"
        f"📂 **Распределение по категориям:**\n"
        f"{category_details if category_details else 'Пока нет расходов в этом месяце. 📈'}"
    )
    
    # Inline button to initiate expense adding
    inline_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="➕ Добавить расход", callback_data="add_expense_init")]
        ]
    )
    
    await message.answer(response_text, parse_mode="Markdown", reply_markup=inline_kb)


@router.callback_query(F.data == "add_expense_init")
async def start_add_expense(callback_query: types.CallbackQuery, state: FSMContext):
    """Triggered upon clicking '[➕ Добавить расход]'. Starts FSM loop."""
    await callback_query.answer()
    await state.set_state(ExpenseState.waiting_for_amount)
    
    await callback_query.message.answer(
        "✍️ **Шаг 1 из 3:** Введите сумму расхода (числовое значение, например: 450 или 1200.50):",
        parse_mode="Markdown"
    )


@router.message(StateFilter(ExpenseState.waiting_for_amount))
async def process_expense_amount(message: types.Message, state: FSMContext):
    """Processes expenditure sum input and handles float conversion errors."""
    raw_text = message.text.strip().replace(",", ".") # support comma separator
    
    try:
        amount = float(raw_text)
        if amount <= 0:
            await message.answer("⚠️ Сумма расхода должна быть больше нуля. Попробуйте ввести заново:")
            return
            
        # Store in FSM context
        await state.update_data(amount=amount)
        
        # Move to categories choice
        await state.set_state(ExpenseState.waiting_for_category)
        
        # Build category selection inline buttons
        inline_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text="🛒 Продукты", callback_data="set_cat_Продукты"),
                    InlineKeyboardButton(text="🔌 ЖКХ", callback_data="set_cat_ЖКХ")
                ],
                [
                    InlineKeyboardButton(text="🚗 Машина", callback_data="set_cat_Машина"),
                    InlineKeyboardButton(text="📦 Другое", callback_data="set_cat_Другое")
                ]
            ]
        )
        
        await message.answer(
            f"💵 **Сумма принята:** {amount:,.2f} руб.\n\n"
            f"📂 **Шаг 2 из 3:** Выберите категорию расходов кнопкой ниже:",
            parse_mode="Markdown",
            reply_markup=inline_kb
        )
        
    except ValueError:
        await message.answer("⚠️ Не удалось распознать число. Пожалуйста, введите корректную сумму (например: 750 или 140.25):")


@router.callback_query(StateFilter(ExpenseState.waiting_for_category), F.data.startswith("set_cat_"))
async def process_expense_category(callback_query: types.CallbackQuery, state: FSMContext):
    """Processes category inline button click."""
    await callback_query.answer()
    category = callback_query.data.split("set_cat_")[1]
    
    await state.update_data(category=category)
    await state.set_state(ExpenseState.waiting_for_description)
    
    # Notify choice and guide to step 3
    await callback_query.message.edit_text(
        f"📂 **Категория выбрана:** {category}\n\n"
        f"📝 **Шаг 3 из 3:** Введите короткое описание расхода (что именно купили, например: 'Молоко и бананы' или 'Аренда гаража'):",
        parse_mode="Markdown"
    )


@router.message(StateFilter(ExpenseState.waiting_for_description))
async def process_expense_description(message: types.Message, state: FSMContext):
    """Saves final expenditure details inside SQLite database."""
    description = message.text.strip()
    user_data = await state.get_data()
    
    amount = user_data["amount"]
    category = user_data["category"]
    telegram_id = message.from_user.id
    
    # Save to SQLite database
    success = database.add_expense(telegram_id, amount, category, description)
    
    if success:
        await message.answer(
            f"✅ **Расход записан!**\n\n"
            f"💰 **Сумма:** {amount:,.2f} руб.\n"
            f"📂 **Категория:** {category}\n"
            f"📝 **Описание:** {description}\n\n"
            f"Спасибо, данные успешно синхронизированы в общий бюджет!",
            parse_mode="Markdown",
            reply_markup=get_main_menu_keyboard()
        )
    else:
        await message.answer(
            "⚠️ Произошла ошибка базы данных при сохранении. Попробуйте еще раз или перезапустите бота.",
            reply_markup=get_main_menu_keyboard()
        )
        
    await state.clear()


@router.message(F.text == "📝 Список покупок")
async def show_shopping_list(message: types.Message, state: FSMContext):
    """Displays current shopping list, each having an inline complete callback."""
    await state.clear()
    await send_or_update_shopping_list(message)


async def send_or_update_shopping_list(message: types.Message):
    """Formats current shopping list records into structured UI representation."""
    shopping_items = database.get_shopping_list()
    
    if not shopping_items:
        text = (
            "📝 **Семейный список покупок**\n\n"
            "🛒 На данный момент в списке нет товаров! Все куплено.\n\n"
            "Нажмите кнопку ниже, чтобы добавить первую покупку!"
        )
        inline_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="➕ Добавить в список", callback_data="add_shopping_init")]
            ]
        )
        await message.answer(text, parse_mode="Markdown", reply_markup=inline_kb)
    else:
        text = (
            "📝 **Семейный список покупок**\n"
            "Вычеркивайте купленные товары кликом по кнопкам ниже:\n\n"
        )
        
        # Build list containing each shopping item with interactive removal buttons
        kb_rows = []
        for index, item in enumerate(shopping_items, start=1):
            item_text = f"🛒 {item['item_name']} (от {item['added_by']})"
            # Each cross clears item on click
            kb_rows.append([
                InlineKeyboardButton(
                    text=f"❌ {item_text}", 
                    callback_data=f"buy_item_{item['id']}"
                )
            ])
            
        # Append addition option at the end
        kb_rows.append([
            InlineKeyboardButton(text="➕ Добавить в список", callback_data="add_shopping_init")
        ])
        
        inline_kb = InlineKeyboardMarkup(inline_keyboard=kb_rows)
        await message.answer(text, parse_mode="Markdown", reply_markup=inline_kb)


@router.callback_query(F.data == "add_shopping_init")
async def start_add_shopping(callback_query: types.CallbackQuery, state: FSMContext):
    """Initiates shopping adding dialog via FSM."""
    await callback_query.answer()
    await state.set_state(ShoppingState.waiting_for_item)
    
    await callback_query.message.answer(
        "✍️ Введите название товара или продукта, который необходимо купить (например: 'Сыр Ламбер 300г' или 'Стиральный порошок'):"
    )


@router.message(StateFilter(ShoppingState.waiting_for_item))
async def process_shopping_item_name(message: types.Message, state: FSMContext):
    """Filing new item inside SQLite shopping list."""
    item_name = message.text.strip()
    
    if not item_name:
        await message.answer("⚠️ Название товара не может быть пустым. Введите название:")
        return
        
    added_by = message.from_user.username or message.from_user.first_name or f"User_{message.from_user.id}"
    
    success = database.add_shopping_item(item_name, added_by)
    await state.clear()
    
    if success:
        await message.answer(f"✅ Товар '**{item_name}**' успешно добавлен в семейный список!", parse_mode="Markdown")
        # Instantly print updated shopping list
        await send_or_update_shopping_list(message)
    else:
        await message.answer("⚠️ Не удалось сохранить товар из-за сбоя базы данных.", reply_markup=get_main_menu_keyboard())


@router.callback_query(F.data.startswith("buy_item_"))
async def process_purchase(callback_query: types.CallbackQuery):
    """Deregister (deletes) purchased item using its database representation ID."""
    item_id = int(callback_query.data.split("buy_item_")[1])
    
    # Delete from DB
    success = database.delete_shopping_item(item_id)
    
    if success:
        # Prompt toast confirm
        await callback_query.answer("🟢 Куплено и убрано из списка!", show_alert=False)
        
        # We can update the message list instantly so it stays clean and interactive!
        # Delete old message to avoid spam or edit it. Let's send a new updated list and delete the old one
        try:
            await callback_query.message.delete()
        except Exception:
            pass # fallback if unable to delete old message
            
        await send_or_update_shopping_list(callback_query.message)
    else:
        await callback_query.answer("⚠️ Товар уже был куплен или удален!", show_alert=True)


# --- Bot Initialization and Lifespan ---

async def main():
    # Register router
    dp.include_router(router)
    
    # Clear webhook of potential old runs and start polling
    logger.info("Starting Telegram Bot Polling...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    if BOT_TOKEN == "PLACEHOLDER_TOKEN" or not BOT_TOKEN:
        print("\n" + "="*60)
        print("⚠️  ERROR: BOT_TOKEN is missing!")
        print("Please configure BOT_TOKEN environment variable correctly.")
        print("Example: export BOT_TOKEN='your_telegram_bot_token'")
        print("="*60 + "\n")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Bot polling stopped by user.")
