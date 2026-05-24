import asyncio
import logging
import random
from aiogram import Dispatcher, types
from aiogram.dispatcher import FSMContext
from aiogram.dispatcher.filters.state import State, StatesGroup
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

import database

logger = logging.getLogger(__name__)

# --- FSM States Setup ---
class ExpenseState(StatesGroup):
    waiting_for_amount = State()
    waiting_for_category = State()
    waiting_for_description = State()

class ShoppingState(StatesGroup):
    waiting_for_item = State()

class CalendarState(StatesGroup):
    waiting_for_date = State()
    waiting_for_text = State()

# --- Keyboards & Views Builders ---

def get_main_menu_keyboard():
    """Builds the primary Interactive Family Hub Keyboard."""
    kb = InlineKeyboardMarkup(row_width=2)
    kb.add(
        InlineKeyboardButton("💰 Финансы & Бюджет", callback_data="menu_finance"),
        InlineKeyboardButton("📝 Покупки Семьи", callback_data="menu_shopping")
    )
    kb.add(
        InlineKeyboardButton("📅 Календарь Событий", callback_data="menu_calendar"),
        InlineKeyboardButton("🧹 Дежурный по дому", callback_data="menu_duty")
    )
    return kb

def get_back_button(target_menu="main_menu"):
    """Fast back-navigation helper button."""
    return InlineKeyboardButton("🔙 Назад в меню", callback_data=target_menu)

# --- Interactive Main Menu Handler ---

async def send_main_menu(message: types.Message, user_id: int, first_name: str, username: str):
    """Generates the premium interactive home hub."""
    # Register user in DB
    name = username or first_name or f"Пользователь_{user_id}"
    database.register_user(user_id, name)

    welcome_text = (
        f"🙋‍♂️ **Семейный Центр Управления**\n"
        f"💼 Рады видеть вас, *{first_name}*!\n"
        f"─────────────────────────\n"
        f"Интерактивный хаб для ведения домашнего хозяйства, общего бюджета "
        f"и совместных планов в реальном времени. Все изменения мгновенно "
        f"синхронизируются для всех участников семьи.\n\n"
        f"📎 *Выберите модуль управления на панели ниже:*🗣"
    )
    await message.answer(
        welcome_text,
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard()
    )

# --- Commands ---

async def cmd_start(message: types.Message, state: FSMContext):
    """Start command initializing menu and persistent layout."""
    await state.finish()
    await send_main_menu(
        message, 
        message.from_user.id, 
        message.from_user.first_name, 
        message.from_user.username
    )

# --- Main Hub Callbacks ---

async def cb_main_menu(callback_query: types.CallbackQuery, state: FSMContext):
    """Returns to interactive main menu from any callback."""
    await state.finish()
    await callback_query.answer()
    
    welcome_text = (
        f"🙋‍♂️ **Семейный Центр Управления**\n"
        f"💼 Рады видеть вас, *{callback_query.from_user.first_name}*!\n"
        f"─────────────────────────\n"
        f"Интерактивный хаб для ведения домашнего хозяйства, общего бюджета "
        f"и совместных планов в реальном времени.\n\n"
        f"📎 *Выберите модуль управления на панели ниже:*🗣"
    )
    await callback_query.message.edit_text(
        welcome_text,
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard()
    )

# --- 1. Finance Module ---

async def cb_menu_finance(callback_query: types.CallbackQuery, state: FSMContext):
    """Displays monthly household financial status and interactive utilities."""
    await state.finish()
    await callback_query.answer()
    
    report = database.get_monthly_report()
    total = report["total"]
    categories = report["categories"]
    users_spent = report["users_spent"]
    month_name = report["month_name"]

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

    for cat, amount_spent in categories.items():
        if cat not in ["Продукты", "ЖКХ", "Машина", "Другое"]:
            category_details += f"🔹 {cat}: **{amount_spent:,.2f} руб.**\n"

    users_details = ""
    if users_spent:
        for user, amt in users_spent.items():
            users_details += f"👤 {user}: **{amt:,.2f} руб.**\n"
    else:
        users_details = "Участники пока ничего не тратили."

    finance_text = (
        f"💰 **Семейный Бюджет и Траты**\n"
        f"🗓 **Период:** {month_name}\n"
        f"─────────────────────────\n"
        f"💳 **Всего потрачено семьей:** {total:,.2f} руб.\n\n"
        f"📂 **Расходы по категориям:**\n"
        f"{category_details if category_details else 'Нет записей в текущем месяце.'}\n"
        f"─────────────────────────\n"
        f"👤 **Вклад участников:**\n"
        f"{users_details}"
    )

    kb = InlineKeyboardMarkup(row_width=1)
    kb.add(
        InlineKeyboardButton("➕ Добавить новый расход", callback_data="finance_add_init"),
        get_back_button()
    )
    await callback_query.message.edit_text(finance_text, parse_mode="Markdown", reply_markup=kb)


async def cb_finance_add_init(callback_query: types.CallbackQuery, state: FSMContext):
    """Starts po-shagoviy FSM for adding expense."""
    await callback_query.answer()
    await ExpenseState.waiting_for_amount.set()
    
    kb = InlineKeyboardMarkup().add(get_back_button("menu_finance"))
    await callback_query.message.edit_text(
        "💰 **Добавление нового расхода • Шаг 1 из 3**\n"
        "─────────────────────────\n"
        "✍️ Пожалуйста, введите **сумму** вашего расхода (например, `450` или `1250.50`):",
        parse_mode="Markdown",
        reply_markup=kb
    )


async def process_finance_amount(message: types.Message, state: FSMContext):
    """Validates and processes input amount."""
    raw_val = message.text.strip().replace(",", ".")
    try:
        amount = float(raw_val)
        if amount <= 0:
            await message.reply("⚠️ Сумма расхода должна быть строго больше нуля. Пожалуйста, введите корректное число:")
            return
            
        await state.update_data(amount=amount)
        await ExpenseState.next() # Moves to waiting_for_category
        
        kb = InlineKeyboardMarkup(row_width=2)
        kb.add(
            InlineKeyboardButton("🛒 Продукты", callback_data="fin_cat_Продукты"),
            InlineKeyboardButton("🔌 ЖКХ", callback_data="fin_cat_ЖКХ"),
            InlineKeyboardButton("🚗 Машина", callback_data="fin_cat_Машина"),
            InlineKeyboardButton("📦 Другое", callback_data="fin_cat_Другое")
        )
        kb.row(get_back_button("menu_finance"))
        
        await message.reply(
            f"💵 **Сумма:** {amount:,.2f} руб.\n"
            f"─────────────────────────\n"
            f"📂 **Добавление расхода • Шаг 2 из 3**\n"
            f"Выделите одну из основных категорий расходов ниже:",
            parse_mode="Markdown",
            reply_markup=kb
        )
    except ValueError:
        await message.reply("⚠️ Формат числа не распознан. Наберите числовое значение, например `750` или `1240.50`:")


async def cb_finance_select_category(callback_query: types.CallbackQuery, state: FSMContext):
    """Handles category choice from inline buttons."""
    await callback_query.answer()
    category = callback_query.data.split("fin_cat_")[1]
    
    await state.update_data(category=category)
    await ExpenseState.next() # Moves to waiting_for_description
    
    kb = InlineKeyboardMarkup().add(get_back_button("menu_finance"))
    await callback_query.message.edit_text(
        f"📂 **Категория:** {category}\n"
        f"─────────────────────────\n"
        f"📂 **Добавление расхода • Шаг 3 из 3**\n"
        f"✍️ Напишите краткое описание или цель расхода (например, 'Купила сыр и овощи' или 'Оплата интернета'):",
        parse_mode="Markdown",
        reply_markup=kb
    )


async def process_finance_description(message: types.Message, state: FSMContext):
    """Saves final expenditure inside SQLite SQLite database."""
    description = message.text.strip()
    user_data = await state.get_data()
    
    amount = user_data["amount"]
    category = user_data["category"]
    telegram_id = message.from_user.id
    
    success = database.add_expense(telegram_id, amount, category, description)
    await state.finish()
    
    if success:
        kb = InlineKeyboardMarkup().add(
            InlineKeyboardButton("📊 Показать бюджет", callback_data="menu_finance"),
            get_back_button()
        )
        await message.reply(
            f"✅ **Успешно записано!**\n"
            f"─────────────────────────\n"
            f"💵 **Скидка/Сумма:** {amount:,.2f} руб.\n"
            f"📂 **Категория:** {category}\n"
            f"📝 **Что взяли:** {description}\n\n"
            f"Все данные зафиксированы в общей SQLite базе.",
            parse_mode="Markdown",
            reply_markup=kb
        )
    else:
        await message.reply("⚠️ Ошибка базы данных при внесении данных.", reply_markup=get_main_menu_keyboard())

# --- 2. Shopping Tracker Module ---

async def send_shopping_list_view(message: types.Message):
    """Sends current active list with deletion callbacks."""
    items = database.get_shopping_list()
    
    body = "📝 **Семейный список покупок**\n"
    body += "─────────────────────────\n"
    
    kb = InlineKeyboardMarkup(row_width=1)
    
    if not items:
        body += "🛒 Список покупок в данный момент пуст! Всё куплено."
    else:
        body += "Вычеркивайте купленные товары кликом по ним:\n\n"
        for item in items:
            btn_text = f"❌ {item['item_name']} (от {item['added_by']})"
            kb.add(InlineKeyboardButton(btn_text, callback_data=f"shop_buy_{item['id']}"))
            
    kb.row(
        InlineKeyboardButton("➕ Добавить товар", callback_data="shop_add_init"),
        InlineKeyboardButton("🧹 Очистить всё", callback_data="shop_clear_confirm")
    )
    kb.row(get_back_button())
    
    await message.answer(body, parse_mode="Markdown", reply_markup=kb)


async def cb_menu_shopping(callback_query: types.CallbackQuery, state: FSMContext):
    """Loads shopping tracker from callback."""
    await state.finish()
    await callback_query.answer()
    
    # Inline updates prevent chat clutter
    items = database.get_shopping_list()
    body = "📝 **Семейный список покупок**\n"
    body += "─────────────────────────\n"
    
    kb = InlineKeyboardMarkup(row_width=1)
    
    if not items:
        body += "🛒 Список покупок в данный момент пуст! Всё куплено."
    else:
        body += "Вычеркивайте купленные товары кликом по ним:\n\n"
        for item in items:
            btn_text = f"❌ {item['item_name']} (от {item['added_by']})"
            kb.add(InlineKeyboardButton(btn_text, callback_data=f"shop_buy_{item['id']}"))
            
    kb.row(
        InlineKeyboardButton("➕ Добавить товар", callback_data="shop_add_init"),
        InlineKeyboardButton("🧹 Очистить всё", callback_data="shop_clear_confirm")
    )
    kb.row(get_back_button())
    
    await callback_query.message.edit_text(body, parse_mode="Markdown", reply_markup=kb)


async def cb_shop_buy(callback_query: types.CallbackQuery):
    """Deletes/marks selected item as purchased."""
    item_id = int(callback_query.data.split("shop_buy_")[1])
    
    success = database.delete_shopping_item(item_id)
    if success:
        await callback_query.answer("🟢 Поздравляем, товар куплен и вычеркнут!", show_alert=False)
        # Redraw
        try:
            await callback_query.message.delete()
        except Exception:
            pass
        await send_shopping_list_view(callback_query.message)
    else:
        await callback_query.answer("⚠️ Товар уже был приобретен или удален.", show_alert=True)


async def cb_shop_clear_confirm(callback_query: types.CallbackQuery):
    """Asks for confirmation before washing all items away."""
    await callback_query.answer()
    
    kb = InlineKeyboardMarkup(row_width=2)
    kb.add(
        InlineKeyboardButton("🚨 Да, очистить целиком", callback_data="shop_clear_confirmed"),
        InlineKeyboardButton("❌ Отмена", callback_data="menu_shopping")
    )
    
    await callback_query.message.edit_text(
        "⚠️ **Внимание: Полная очистка списка**\n"
        "─────────────────────────\n"
        "Вы действительно хотите навсегда стереть ВСЕ товары из семейного списка?",
        parse_mode="Markdown",
        reply_markup=kb
    )


async def cb_shop_clear_confirmed(callback_query: types.CallbackQuery):
    """Executes total clean action."""
    database.clear_shopping_list()
    await callback_query.answer("🧹 Список покупок полностью очищен!", show_alert=True)
    
    try:
        await callback_query.message.delete()
    except Exception:
        pass
    await send_shopping_list_view(callback_query.message)


async def cb_shop_add_init(callback_query: types.CallbackQuery, state: FSMContext):
    """Fires adding shopping state."""
    await callback_query.answer()
    await ShoppingState.waiting_for_item.set()
    
    kb = InlineKeyboardMarkup().add(get_back_button("menu_shopping"))
    await callback_query.message.edit_text(
        "📝 **Добавление покупки в список**\n"
        "─────────────────────────\n"
        "✍️ Напишите название товара или продукта, который необходимо купить (например: `Багет хрустящий` или `Зубная паста`):",
        parse_mode="Markdown",
        reply_markup=kb
    )


async def process_shopping_item_name(message: types.Message, state: FSMContext):
    """Inserts item details to DB and redraws the loop."""
    item_name = message.text.strip()
    if not item_name:
        await message.reply("⚠️ Название товара не может быть пустым. Введите название:")
        return
        
    added_by = message.from_user.username or message.from_user.first_name or f"User_{message.from_user.id}"
    success = database.add_shopping_item(item_name, added_by)
    await state.finish()
    
    if success:
        await message.reply(f"✅ Товар '**{item_name}**' записан в чек-лист покупки!")
        await send_shopping_list_view(message)
    else:
        await message.reply("⚠️ Не удалось зарегистрировать вещь в базе данных.", reply_markup=get_main_menu_keyboard())

# --- 3. Calendar Module ---

async def send_calendar_view(message: types.Message):
    """Renders calendar tasks."""
    events = database.get_calendar_events()
    
    body = "📅 **Семейный Календарь & Важные Даты**\n"
    body += "─────────────────────────\n"
    
    kb = InlineKeyboardMarkup(row_width=1)
    
    if not events:
        body += "⛱ Нет запланированных событий или важных дат! Добавьте новые, чтобы не забыть."
    else:
        body += "Предстоящие дела и семейные праздники:\n\n"
        for ev in events:
            date_part = ev['event_date']
            body += f"🔹 **[{date_part}]** {ev['event_text']} _(от {ev['added_by']})_\n"
            kb.add(InlineKeyboardButton(f"🗑 Удалить [{date_part}]", callback_data=f"cal_del_{ev['id']}"))
            
    body += "\n"
    kb.row(
        InlineKeyboardButton("🗓 Добавить событие", callback_data="cal_add_init"),
        get_back_button()
    )
    
    await message.answer(body, parse_mode="Markdown", reply_markup=kb)


async def cb_menu_calendar(callback_query: types.CallbackQuery, state: FSMContext):
    """Loads calendar from callback loop."""
    await state.finish()
    await callback_query.answer()
    
    events = database.get_calendar_events()
    body = "📅 **Семейный Календарь & Важные Даты**\n"
    body += "─────────────────────────\n"
    
    kb = InlineKeyboardMarkup(row_width=1)
    if not events:
        body += "⛱ Нет запланированных событий или важных дат! Добавьте новые, чтобы не забыть."
    else:
        body += "Предстоящие дела и семейные праздники:\n\n"
        for ev in events:
            date_part = ev['event_date']
            body += f"🔹 **[{date_part}]** {ev['event_text']} _(от {ev['added_by']})_\n"
            kb.add(InlineKeyboardButton(f"🗑 Удалить: {ev['event_text'][:20]}...", callback_data=f"cal_del_{ev['id']}"))
            
    body += "\n"
    kb.row(
        InlineKeyboardButton("🗓 Добавить событие", callback_data="cal_add_init"),
        get_back_button()
    )
    
    await callback_query.message.edit_text(body, parse_mode="Markdown", reply_markup=kb)


async def cb_calendar_delete(callback_query: types.CallbackQuery):
    """Removes a planned activity."""
    event_id = int(callback_query.data.split("cal_del_")[1])
    
    success = database.delete_calendar_event(event_id)
    if success:
        await callback_query.answer("🗑 Событие удалено из календаря!", show_alert=False)
        try:
            await callback_query.message.delete()
        except Exception:
            pass
        await send_calendar_view(callback_query.message)
    else:
        await callback_query.answer("⚠️ Не удалось удалить или событие уже стерто.", show_alert=True)


async def cb_calendar_add_init(callback_query: types.CallbackQuery, state: FSMContext):
    """Starts Calendar FSM workflow."""
    await callback_query.answer()
    await CalendarState.waiting_for_date.set()
    
    kb = InlineKeyboardMarkup().add(get_back_button("menu_calendar"))
    await callback_query.message.edit_text(
        "📅 **Новое Семейное Событие • Шаг 1 из 2**\n"
        "─────────────────────────\n"
        "✍️ Введите **дату** события (например, `24.05`, `30 Июня` или `Каждую пятницу`):",
        parse_mode="Markdown",
        reply_markup=kb
    )


async def process_calendar_date(message: types.Message, state: FSMContext):
    """Saves date parameter and prompts for description."""
    date_text = message.text.strip()
    if not date_text:
        await message.reply("⚠️ Дата обязательна. Попробуйте написать еще раз:")
        return
        
    await state.update_data(event_date=date_text)
    await CalendarState.next() # Moves to waiting_for_text
    
    kb = InlineKeyboardMarkup().add(get_back_button("menu_calendar"))
    await message.reply(
        f"🗓 **Дата зарегистрирована:** {date_text}\n"
        f"─────────────────────────\n"
        f"📅 **Новое Семейное Событие • Шаг 2 из 2**\n"
        f"✍️ Напишите описание события (напр. 'День Рождения Папы 🎉' или 'Запись к стоматологу 🦷'):",
        parse_mode="Markdown",
        reply_markup=kb
    )


async def process_calendar_text(message: types.Message, state: FSMContext):
    """Inserts final calendar entry to DB."""
    event_desc = message.text.strip()
    user_data = await state.get_data()
    event_date = user_data["event_date"]
    
    added_by = message.from_user.username or message.from_user.first_name or f"User_{message.from_user.id}"
    
    success = database.add_calendar_event(event_desc, event_date, added_by)
    await state.finish()
    
    if success:
        await message.reply(f"✅ Событие на **{event_date}** успешно добавлено в Семейный Календарь!")
        await send_calendar_view(message)
    else:
        await message.reply("⚠️ Ошибка SQLite при внесении в календарь.", reply_markup=get_main_menu_keyboard())

# --- 4. Interactive Duty Lottery ("Дежурный по дому") ---

async def cb_menu_duty(callback_query: types.CallbackQuery, state: FSMContext):
    """Renders domestic duties list or lets you roll lottery."""
    await state.finish()
    await callback_query.answer()
    
    users = database.get_all_users()
    
    family_members_list = ""
    if users:
         for idx, u in enumerate(users, start=1):
             family_members_list += f"{idx}. 👤 **{u['username']}**\n"
    else:
         family_members_list = "База участников пока пуста. Запустите бота первыми!"

    duty_text = (
        f"🧹 **Дежурный по Дому • Выбор судьбы**\n"
        f"─────────────────────────\n"
        f"Надоело спорить, кто сегодня моет посуду, выносит мусор или убирает гостиную? "
        f"Доверьте это авторитету беспристрастного великого жребия! 🎲\n\n"
        f"Список домашних участников (кандидатов):\n"
        f"{family_members_list}\n"
        f"─────────────────────────\n"
        f"Нажмите кнопку ниже, чтобы запустить анимированную крутилку судьбы!"
    )
    
    kb = InlineKeyboardMarkup(row_width=1)
    kb.add(
        InlineKeyboardButton("🎲 Бросить жребий!", callback_data="duty_roll_dice"),
        get_back_button()
    )
    await callback_query.message.edit_text(duty_text, parse_mode="Markdown", reply_markup=kb)


async def cb_duty_roll_dice(callback_query: types.CallbackQuery):
    """Runs a simulated lottery shuffle animation on telegram message editing."""
    await callback_query.answer()
    
    users = database.get_all_users()
    if not users:
        # Fallback to current user if none found
        cur_id = callback_query.from_user.id
        cur_name = callback_query.from_user.username or callback_query.from_user.first_name or f"User_{cur_id}"
        database.register_user(cur_id, cur_name)
        users = [{"username": cur_name}]
        
    names = [u["username"] for u in users]
    
    # Let's perform a delightful text-changing delay simulation (asyncio.sleep)
    animations = [
        "🎲 **Кубик подлетает...**\n───◯───",
        "✨ **Судьба перебирает варианты...**\n───●───",
        "🧼 **Трём мыло и готовим щётки...**\n───◯───",
        "🌀 **Крутится барабан пылесоса...**\n───●───"
    ]
    
    for anim in animations:
        try:
            await callback_query.message.edit_text(
                f"🧹 **Дежурный по Дому**\n"
                f"─────────────────────────\n"
                f"{anim}",
                parse_mode="Markdown"
            )
            await asyncio.sleep(0.5)
        except Exception:
            # Skip if error occurs
            pass
            
    # Draw real winner
    winner = random.choice(names)
    
    final_text = (
        f"🧹 **Дежурный по Дому • Жребий брошен!**\n"
        f"─────────────────────────\n"
        f"🎉 Барабанная дробь стихла...\n\n"
        f"🧼 Нашим сегодняшним дежурным по дому назначается:\n"
        f"👑 **{winner}**! 🧹🍳🍕\n\n"
        f"Желаем удачи и отличного настроения при наведении чистоты!"
    )
    
    kb = InlineKeyboardMarkup(row_width=1)
    kb.add(
        InlineKeyboardButton("🎲 Бросить жребий ещё раз!", callback_data="duty_roll_dice"),
        get_back_button()
    )
    
    try:
        await callback_query.message.edit_text(final_text, parse_mode="Markdown", reply_markup=kb)
    except Exception as e:
        logger.error(f"Error drawing lottery final text: {e}")

# --- Handler Registrations ---

def register_family_handlers(dp: Dispatcher):
    """Registers all commands and interactive callback handlers to the given dispatcher."""
    # Commands
    dp.register_message_handler(cmd_start, commands=["start", "help"], state="*")
    
    # Main Navigation Callbacks
    dp.register_callback_query_handler(cb_main_menu, lambda c: c.data == "main_menu", state="*")
    dp.register_callback_query_handler(cb_menu_finance, lambda c: c.data == "menu_finance", state="*")
    dp.register_callback_query_handler(cb_menu_shopping, lambda c: c.data == "menu_shopping", state="*")
    dp.register_callback_query_handler(cb_menu_calendar, lambda c: c.data == "menu_calendar", state="*")
    dp.register_callback_query_handler(cb_menu_duty, lambda c: c.data == "menu_duty", state="*")
    
    # 1. Finance Process Handlers
    dp.register_callback_query_handler(cb_finance_add_init, lambda c: c.data == "finance_add_init", state="*")
    dp.register_message_handler(process_finance_amount, state=ExpenseState.waiting_for_amount)
    dp.register_callback_query_handler(cb_finance_select_category, lambda c: c.data.startswith("fin_cat_"), state=ExpenseState.waiting_for_category)
    dp.register_message_handler(process_finance_description, state=ExpenseState.waiting_for_description)
    
    # 2. Shopping Process Handlers
    dp.register_callback_query_handler(cb_shop_add_init, lambda c: c.data == "shop_add_init", state="*")
    dp.register_callback_query_handler(cb_shop_buy, lambda c: c.data.startswith("shop_buy_"), state="*")
    dp.register_callback_query_handler(cb_shop_clear_confirm, lambda c: c.data == "shop_clear_confirm", state="*")
    dp.register_callback_query_handler(cb_shop_clear_confirmed, lambda c: c.data == "shop_clear_confirmed", state="*")
    dp.register_message_handler(process_shopping_item_name, state=ShoppingState.waiting_for_item)
    
    # 3. Calendar Process Handlers
    dp.register_callback_query_handler(cb_calendar_add_init, lambda c: c.data == "cal_add_init", state="*")
    dp.register_callback_query_handler(cb_calendar_delete, lambda c: c.data.startswith("cal_del_"), state="*")
    dp.register_message_handler(process_calendar_date, state=CalendarState.waiting_for_date)
    dp.register_message_handler(process_calendar_text, state=CalendarState.waiting_for_text)
    
    # 4. Duty Lottery Callbacks
    dp.register_callback_query_handler(cb_duty_roll_dice, lambda c: c.data == "duty_roll_dice", state="*")
