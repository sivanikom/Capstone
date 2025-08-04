import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

DATABASE_NAME = 'mindfulbite.db'

def get_db_connection():
    """Create and return a database connection"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row  # This enables column access by name: row['column_name']
    return conn

def hash_password(password):
    """Hash a password with salt"""
    salt = secrets.token_hex(32)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{password_hash}"

def verify_password(password, hashed):
    """Verify a password against its hash"""
    try:
        salt, password_hash = hashed.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == password_hash
    except ValueError:
        return False

def init_database():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    try:
        # Users table for authentication
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # User profiles table for health metrics
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                weight REAL,
                height REAL,
                age INTEGER,
                gender TEXT CHECK(gender IN ('male', 'female', 'other')),
                activity_level TEXT CHECK(activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
                bmi REAL,
                daily_calories REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # User sessions table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        conn.commit()
        logger.info("✅ Database initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def create_user(username, email, password):
    """Create a new user account"""
    conn = get_db_connection()
    try:
        # Check if username or email already exists
        existing = conn.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            (username, email)
        ).fetchone()
        
        if existing:
            return {"success": False, "error": "Username or email already exists"}
        
        # Hash password and create user
        password_hash = hash_password(password)
        cursor = conn.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, password_hash)
        )
        
        user_id = cursor.lastrowid
        
        # Create empty profile for the user
        conn.execute(
            'INSERT INTO user_profiles (user_id) VALUES (?)',
            (user_id,)
        )
        
        conn.commit()
        logger.info(f"✅ User created successfully: {username}")
        return {"success": True, "user_id": user_id}
        
    except Exception as e:
        logger.error(f"❌ User creation failed: {e}")
        conn.rollback()
        return {"success": False, "error": "Failed to create user"}
    finally:
        conn.close()

def authenticate_user(username, password):
    """Authenticate user login"""
    conn = get_db_connection()
    try:
        user = conn.execute(
            'SELECT id, username, email, password_hash, is_active FROM users WHERE username = ? OR email = ?',
            (username, username)
        ).fetchone()
        
        if not user:
            return {"success": False, "error": "User not found"}
        
        if not user['is_active']:
            return {"success": False, "error": "Account is deactivated"}
        
        if not verify_password(password, user['password_hash']):
            return {"success": False, "error": "Invalid password"}
        
        # Update last login
        conn.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            (user['id'],)
        )
        conn.commit()
        
        return {
            "success": True,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email']
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Authentication failed: {e}")
        return {"success": False, "error": "Authentication failed"}
    finally:
        conn.close()

def create_session(user_id):
    """Create a new session for the user"""
    conn = get_db_connection()
    try:
        # Clean up expired sessions
        conn.execute(
            'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP'
        )
        
        # Create new session token
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=7)  # 7 days expiry
        
        conn.execute(
            'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
            (user_id, session_token, expires_at)
        )
        
        conn.commit()
        return session_token
        
    except Exception as e:
        logger.error(f"❌ Session creation failed: {e}")
        return None
    finally:
        conn.close()

def get_user_from_session(session_token):
    """Get user data from session token"""
    conn = get_db_connection()
    try:
        result = conn.execute('''
            SELECT u.id, u.username, u.email, us.expires_at
            FROM users u
            JOIN user_sessions us ON u.id = us.user_id
            WHERE us.session_token = ? AND us.expires_at > CURRENT_TIMESTAMP
        ''', (session_token,)).fetchone()
        
        if result:
            return {
                "id": result['id'],
                "username": result['username'],
                "email": result['email']
            }
        return None
        
    except Exception as e:
        logger.error(f"❌ Session lookup failed: {e}")
        return None
    finally:
        conn.close()

def delete_session(session_token):
    """Delete a session (logout)"""
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM user_sessions WHERE session_token = ?', (session_token,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"❌ Session deletion failed: {e}")
        return False
    finally:
        conn.close()

def get_user_profile(user_id):
    """Get user profile data"""
    conn = get_db_connection()
    try:
        profile = conn.execute(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            (user_id,)
        ).fetchone()
        
        if profile:
            return dict(profile)
        return None
        
    except Exception as e:
        logger.error(f"❌ Profile lookup failed: {e}")
        return None
    finally:
        conn.close()

def update_user_profile(user_id, weight=None, height=None, age=None, gender=None, activity_level=None):
    """Update user profile with health metrics"""
    conn = get_db_connection()
    try:
        # Calculate BMI if weight and height are provided
        bmi = None
        daily_calories = None
        
        if weight and height:
            height_m = height / 100  # Convert cm to meters
            bmi = round(weight / (height_m ** 2), 1)
        
        # Calculate daily calories using Mifflin-St Jeor equation
        if weight and height and age and gender:
            if gender.lower() == 'male':
                bmr = 10 * weight + 6.25 * height - 5 * age + 5
            else:  # female or other
                bmr = 10 * weight + 6.25 * height - 5 * age - 161
            
            activity_multipliers = {
                'sedentary': 1.2,
                'light': 1.375,
                'moderate': 1.55,
                'active': 1.725,
                'very_active': 1.9
            }
            
            multiplier = activity_multipliers.get(activity_level, 1.55)
            daily_calories = round(bmr * multiplier)
        
        # Build update query dynamically
        updates = []
        params = []
        
        if weight is not None:
            updates.append('weight = ?')
            params.append(weight)
        if height is not None:
            updates.append('height = ?')
            params.append(height)
        if age is not None:
            updates.append('age = ?')
            params.append(age)
        if gender is not None:
            updates.append('gender = ?')
            params.append(gender)
        if activity_level is not None:
            updates.append('activity_level = ?')
            params.append(activity_level)
        if bmi is not None:
            updates.append('bmi = ?')
            params.append(bmi)
        if daily_calories is not None:
            updates.append('daily_calories = ?')
            params.append(daily_calories)
        
        updates.append('updated_at = CURRENT_TIMESTAMP')
        params.append(user_id)
        
        query = f"UPDATE user_profiles SET {', '.join(updates)} WHERE user_id = ?"
        
        conn.execute(query, params)
        conn.commit()
        
        logger.info(f"✅ Profile updated for user {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Profile update failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

# Initialize database when module is imported
if __name__ == "__main__":
    init_database() 