import sqlite3
import os
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
                role TEXT DEFAULT 'member'
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
        conn.commit()

# Ensure database is initiated when this module is imported/started
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
                    (telegram_id, username_val, "member")
                )
                conn.commit()
    except Exception as e:
        print(f"Error in register_user: {e}")

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
    """
    Returns the total sum of expenses for the current calendar month,
    along with a detailed report grouped by category.
    """
    try:
        current_month = datetime.now().strftime("%Y-%m")  # Format: YYYY-MM
        with get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Total expenses of this month
            cursor.execute(
                "SELECT SUM(amount) FROM finance WHERE date LIKE ?", 
                (f"{current_month}%",)
            )
            total_row = cursor.fetchone()
            total_sum = total_row[0] if total_row and total_row[0] is not None else 0.0
            
            # 2. Expenses grouped by category
            cursor.execute(
                "SELECT category, SUM(amount) FROM finance WHERE date LIKE ? GROUP BY category", 
                (f"{current_month}%",)
            )
            categories_rows = cursor.fetchall()
            categories = {row[0]: row[1] for row in categories_rows}
            
            return {
                "total": total_sum,
                "categories": categories,
                "month_name": datetime.now().strftime("%B %Y")
            }
    except Exception as e:
        print(f"Error in get_monthly_report: {e}")
        return {"total": 0.0, "categories": {}, "month_name": datetime.now().strftime("%B %Y")}

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
    """Returns a list of all active items in the shopping list as a list of dictionaries."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, item_name, added_by FROM shopping_list ORDER BY id ASC")
            rows = cursor.fetchall()
            
            shopping_list = []
            for row in rows:
                shopping_list.append({
                    "id": row[0],
                    "item_name": row[1],
                    "added_by": row[2]
                })
            return shopping_list
    except Exception as e:
        print(f"Error in get_shopping_list: {e}")
        return []

def delete_shopping_item(item_id: int):
    """Deletes an item from the shopping list by its ID (when purchased)."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            # Check if exists
            cursor.execute("SELECT id FROM shopping_list WHERE id = ?", (item_id,))
            if cursor.fetchone():
                cursor.execute("DELETE FROM shopping_list WHERE id = ?", (item_id,))
                conn.commit()
                return True
            return False
    except Exception as e:
        print(f"Error in delete_shopping_item: {e}")
        return False
