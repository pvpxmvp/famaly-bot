import sqlite3
from datetime import datetime

DB_FILE = "family.db"

def get_connection():
    """Returns a connection to the SQLite database."""
    return sqlite3.connect(DB_FILE)

def init_db():
    """Initializes the database, creating all tables if they don't exist yet."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Table 1: Users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                telegram_id INTEGER PRIMARY KEY,
                username TEXT,
                role TEXT DEFAULT 'family_member'
            );
        """)
        
        # Table 2: Finance tracker
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS finance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER,
                amount REAL,
                category TEXT,
                description TEXT,
                date TEXT
            );
        """)
        
        # Table 3: Shopping list
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shopping_list (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT,
                added_by TEXT
            );
        """)

        # Table 4: Family Calendar
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS calendar (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_text TEXT,
                event_date TEXT,
                added_by TEXT
            );
        """)
        conn.commit()

# Ensure database is initiated when this module is imported
try:
    init_db()
except Exception as e:
    print(f"Error initializing DB: {e}")

def register_user(telegram_id: int, username: str):
    """Registers a user if they don't already exist in the database."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT telegram_id FROM users WHERE telegram_id = ?", (telegram_id,))
            if not cursor.fetchone():
                username_val = username if username else f"User_{telegram_id}"
                cursor.execute(
                    "INSERT INTO users (telegram_id, username, role) VALUES (?, ?, ?)",
                    (telegram_id, username_val, "family_member")
                )
                conn.commit()
    except Exception as e:
        print(f"Error in register_user: {e}")

def get_all_users():
    """Returns a list of all registered users (dictionaries)."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT telegram_id, username, role FROM users")
            rows = cursor.fetchall()
            return [{"telegram_id": r[0], "username": r[1], "role": r[2]} for r in rows]
    except Exception as e:
        print(f"Error in get_all_users: {e}")
        return []

def add_expense(telegram_id: int, amount: float, category: str, description: str):
    """Saves a new financial expense to the database."""
    try:
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO finance (telegram_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)",
                (telegram_id, amount, category, description, current_time)
            )
            conn.commit()
            return True
    except Exception as e:
        print(f"Error in add_expense: {e}")
        return False

def get_monthly_report():
    """Returns total sum of expenses for current month and breakdown by category."""
    try:
        current_month = datetime.now().strftime("%Y-%m")
        with get_connection() as conn:
            cursor = conn.cursor()
            
            # Total expenses
            cursor.execute(
                "SELECT SUM(amount) FROM finance WHERE date LIKE ?", 
                (f"{current_month}%",)
            )
            total_row = cursor.fetchone()
            total_sum = total_row[0] if total_row and total_row[0] is not None else 0.0
            
            # Expenses by category
            cursor.execute(
                "SELECT category, SUM(amount) FROM finance WHERE date LIKE ? GROUP BY category", 
                (f"{current_month}%",)
            )
            categories_rows = cursor.fetchall()
            categories = {row[0]: row[1] for row in categories_rows}
            
            # Expenses with usernames
            cursor.execute("""
                SELECT u.username, SUM(f.amount) 
                FROM finance f
                LEFT JOIN users u ON f.telegram_id = u.telegram_id
                WHERE f.date LIKE ?
                GROUP BY f.telegram_id
            """, (f"{current_month}%",))
            users_spent_rows = cursor.fetchall()
            users_spent = {row[0] if row[0] else "Неизвестно": row[1] for row in users_spent_rows}
            
            return {
                "total": total_sum,
                "categories": categories,
                "users_spent": users_spent,
                "month_name": datetime.now().strftime("%B %Y")
            }
    except Exception as e:
        print(f"Error in get_monthly_report: {e}")
        return {"total": 0.0, "categories": {}, "users_spent": {}, "month_name": datetime.now().strftime("%B %Y")}

def add_shopping_item(item_name: str, added_by: str):
    """Adds a new item to the mutual shopping list."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO shopping_list (item_name, added_by) VALUES (?, ?)",
                (item_name, added_by)
            )
            conn.commit()
            return True
    except Exception as e:
        print(f"Error in add_shopping_item: {e}")
        return False

def get_shopping_list():
    """Returns a list of all active items in the shopping list."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, item_name, added_by FROM shopping_list ORDER BY id ASC")
            rows = cursor.fetchall()
            return [{"id": r[0], "item_name": r[1], "added_by": r[2]} for r in rows]
    except Exception as e:
        print(f"Error in get_shopping_list: {e}")
        return []

def delete_shopping_item(item_id: int):
    """Deletes an item from the shopping list by its ID."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM shopping_list WHERE id = ?", (item_id,))
            conn.commit()
            return True
    except Exception as e:
        print(f"Error in delete_shopping_item: {e}")
        return False

def clear_shopping_list():
    """Clears all items in the shopping list."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM shopping_list")
            conn.commit()
            return True
    except Exception as e:
        print(f"Error in clear_shopping_list: {e}")
        return False

def add_calendar_event(event_text: str, event_date: str, added_by: str):
    """Adds a family event/reminder to the calendar."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO calendar (event_text, event_date, added_by) VALUES (?, ?, ?)",
                (event_text, event_date, added_by)
            )
            conn.commit()
            return True
    except Exception as e:
        print(f"Error in add_calendar_event: {e}")
        return False

def get_calendar_events():
    """Returns a list of all forward events sorted by date."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, event_text, event_date, added_by FROM calendar ORDER BY event_date ASC")
            rows = cursor.fetchall()
            return [{"id": r[0], "event_text": r[1], "event_date": r[2], "added_by": r[3]} for r in rows]
    except Exception as e:
        print(f"Error in get_calendar_events: {e}")
        return []

def delete_calendar_event(event_id: int):
    """Removes a calendar event by ID."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM calendar WHERE id = ?", (event_id,))
            conn.commit()
            return True
    except Exception as e:
        print(f"Error in delete_calendar_event: {e}")
        return False
