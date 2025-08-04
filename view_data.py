import sqlite3
from datetime import datetime

# Connect to database
conn = sqlite3.connect('mindfulbite.db')
conn.row_factory = sqlite3.Row

print(" MINDFULBITE DATABASE CONTENTS")
print("=" * 50)

# Show users
print("\n USERS:")
users = conn.execute('SELECT * FROM users').fetchall()
for user in users:
    print(f"  ID: {user['id']}")
    print(f"  Username: {user['username']}")
    print(f"  Email: {user['email']}")
    print(f"  Created: {user['created_at']}")
    print(f"  Last Login: {user['last_login']}")
    print(f"  Active: {user['is_active']}")
    print("-" * 30)

# Show profiles
print("\n USER PROFILES:")
profiles = conn.execute('SELECT * FROM user_profiles').fetchall()
for profile in profiles:
    print(f"  User ID: {profile['user_id']}")
    print(f"  Weight: {profile['weight']} kg")
    print(f"  Height: {profile['height']} cm")
    print(f"  Age: {profile['age']}")
    print(f"  Gender: {profile['gender']}")
    print(f"  Activity: {profile['activity_level']}")
    print(f"  BMI: {profile['bmi']}")
    print(f"  Daily Calories: {profile['daily_calories']}")
    print(f"  Updated: {profile['updated_at']}")
    print("-" * 30)

# Show active sessions
print("\n ACTIVE SESSIONS:")
sessions = conn.execute('SELECT * FROM user_sessions WHERE expires_at > datetime("now")').fetchall()
for session in sessions:
    token_preview = session['session_token'][:20] + "..."
    print(f"  User ID: {session['user_id']}")
    print(f"  Token: {token_preview}")
    print(f"  Expires: {session['expires_at']}")
    print("-" * 30)

if not sessions:
    print("  No active sessions")

conn.close()
print("\n Database view complete!") 