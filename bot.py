import logging
import os
import sys
from aiogram import Bot, Dispatcher, executor
from aiogram.contrib.fsm_storage.memory import MemoryStorage

# Import local handlers and database creation
import database
from handlers import register_family_handlers

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
    logger.critical("BOT_TOKEN environment variable is not defined! Please configure BOT_TOKEN.")
    BOT_TOKEN = "PLACEHOLDER_TOKEN"

# Initialize SQLite tables
try:
    database.init_db()
    logger.info("SQLite Database successfully initialized.")
except Exception as e:
    logger.error(f"Error initializing SQLite DB: {e}")

# Initialize core bot components
bot = Bot(token=BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(bot, storage=storage)

# Register premium modules and FSM transitions
register_family_handlers(dp)

if __name__ == "__main__":
    if BOT_TOKEN == "PLACEHOLDER_TOKEN" or not BOT_TOKEN:
        print("\n" + "="*60)
        print("⚠️  ERROR: BOT_TOKEN is missing!")
        print("Please configure BOT_TOKEN environment variable correctly before running.")
        print("Example: export BOT_TOKEN='your_telegram_bot_token'")
        print("="*60 + "\n")
    else:
        logger.info("Starting Telegram Family Hub Bot polling...")
        try:
            executor.start_polling(dp, skip_updates=True)
        except KeyboardInterrupt:
            print("Bot polling stopped by user.")
