# 🍎 MindfulBite - AI-Powered Food Choice Navigator

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technical Architecture](#technical-architecture)
4. [Installation & Setup](#installation--setup)
5. [Usage Guide](#usage-guide)
6. [User Authentication](#user-authentication)
7. [API Integration](#api-integration)
8. [File Structure](#file-structure)
9. [Database Schema](#database-schema)
10. [Configuration](#configuration)
11. [Development](#development)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**MindfulBite** is an intelligent web application that leverages **AI/LLM technology** to help users make healthier food choices. The application analyzes food items using advanced language models and provides personalized healthier alternatives with detailed nutritional comparisons and weight impact predictions.

### 🎨 Key Objectives
- **AI-Powered Analysis**: Use Large Language Models for comprehensive food analysis
- **Health-Focused**: Guide users toward healthier food alternatives with scientific backing
- **Personalized**: Calculate weight impact based on individual user profiles and BMI
- **User Authentication**: Secure SQLite-based user accounts with profile management
- **Educational**: Provide detailed nutritional comparisons and health insights
- **Professional UI**: Clean, modern interface with responsive design

### 🌟 Core Value Proposition
Transform eating habits through AI-driven food analysis that provides personalized healthier alternatives, backed by comprehensive nutrition data and individualized health calculations.

---

## ✨ Key Features

### 🔐 **User Authentication System**
- **Secure Registration**: Username, email, and password-based accounts
- **Session Management**: 7-day secure session tokens with automatic expiry
- **Password Security**: SHA-256 hashing with unique salt per user
- **Profile Management**: Save and load user health metrics

### 🤖 **AI-Powered Food Analysis**
- **LLM Integration**: Advanced language model for food recognition and analysis
- **Comprehensive Nutrition Data**: Calories, macronutrients, micronutrients
- **Brand Recognition**: Identifies specific brands and product variations
- **Ingredient Analysis**: Detailed ingredient lists and nutritional breakdown

### 🥗 **Intelligent Alternative Suggestions**
- **AI-Generated Alternatives**: 5 healthier options for any food item
- **Nutri-Score Integration**: Color-coded health ratings (A-E scale)
- **Calorie Comparison**: Clear calorie reduction indicators
- **Category-Specific**: Alternatives within the same food category

### 📊 **Personalized Health Insights**
- **BMI Calculation**: Automatic BMI calculation and categorization
- **Daily Calorie Needs**: Mifflin-St Jeor equation for accurate calorie requirements
- **Weight Impact Analysis**: Personalized weight change predictions
- **Activity Level Integration**: Sedentary to very active lifestyle adjustments

### 🎨 **Modern User Interface**
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Professional Aesthetics**: Custom color palette (#D8E2DC, #F5EBE0)
- **Intuitive Navigation**: Clear user flow from search to alternatives
- **Interactive Elements**: Hover effects, smooth transitions, modal dialogs

---

## 🏗️ Technical Architecture

### **Frontend Stack**
- **HTML5**: Semantic markup with accessibility considerations
- **CSS3**: Modern styling with Flexbox/Grid layouts, custom properties
- **Vanilla JavaScript (ES6+)**: Async/await, fetch API, DOM manipulation
- **Google Fonts**: Roboto (body), Bitcount Prop Single (headings)

### **Backend Stack**
- **Flask (Python)**: Lightweight web framework with RESTful API design
- **SQLite**: Local database for user authentication and profiles
- **OpenAI SDK**: LLM integration via OpenRouter.ai
- **Security**: Session tokens, password hashing, CSRF protection

### **AI Integration**
- **OpenRouter.ai**: LLM API gateway for food analysis
- **OpenAI Models**: GPT-based models for food recognition and alternative suggestions
- **Structured Output**: JSON-formatted nutrition data and alternatives
- **Prompt Engineering**: Optimized prompts for accurate food analysis

### **Database Design**
- **Users Table**: Authentication and account management
- **User Profiles**: Health metrics and calculated values
- **User Sessions**: Secure session management
- **Search History**: Optional search tracking (implemented but not utilized)

---

## 🚀 Installation & Setup

### **Prerequisites**
- Python 3.8 or higher
- pip (Python package installer)
- OpenRouter.ai API key (for LLM integration)

### **Step 1: Clone Repository**
```bash
git clone <your-repository-url>
cd GA
```

### **Step 2: Install Dependencies**
```bash
pip install -r requirements.txt
```

### **Step 3: Configure API Key**
Update the API key in `app.py`:
```python
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="your-openrouter-api-key-here",
)
```

### **Step 4: Initialize Database**
```bash
python database.py
```

### **Step 5: Run Application**
```bash
python app.py
```

### **Step 6: Access Application**
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📖 Usage Guide

### **Getting Started**

1. **Create Account** (Optional but Recommended)
   - Navigate to the login page
   - Click "Sign Up" tab
   - Enter username, email, and password
   - Minimum requirements: 3+ character username, valid email, 6+ character password

2. **Set Up Profile** (For Personalized Insights)
   - Fill in weight (kg), height (cm), age, gender, and activity level
   - Click "Save Profile" button
   - BMI and daily calorie needs calculated automatically

3. **Search for Food**
   - Enter any food item in the search box (e.g., "pizza", "chocolate", "apple")
   - Click "Find Alternatives" or press Enter
   - View detailed nutrition information

4. **Explore Alternatives**
   - Click "Find Healthier Alternatives" button
   - Browse 5 AI-suggested healthier options
   - Compare nutrition facts and calorie differences
   - Click on alternatives to see detailed information

5. **Analyze Comparisons**
   - Use "Compare Foods" feature for side-by-side analysis
   - View personalized weight impact predictions
   - See daily, weekly, and monthly calorie differences

### **User Interface Guide**

#### **Main Search Interface**
- **Food Search Box**: Enter any food item or product name
- **Results Card**: Displays nutrition facts, ingredients, and Nutri-Score
- **Profile Section**: Optional health metrics for personalized calculations
- **Alternatives Section**: Shows healthier options with calorie comparisons

#### **Authentication Interface**
- **Login/Signup Toggle**: Switch between login and registration forms
- **User Dashboard**: Welcome message and logout options when logged in
- **Profile Management**: Save and update health metrics

#### **Alternative Display**
- **Alternative Cards**: Each shows product name, brand, calories, and Nutri-Score
- **Calorie Comparison**: Green/red indicators for calorie savings/additions
- **Detailed View**: Click for comprehensive nutrition breakdown
- **Ingredients**: "See Ingredients" button for full ingredient lists

---

## 🔐 User Authentication

### **Registration Process**
```python
# User registration with validation
{
    "username": "min 3 characters",
    "email": "valid email format",
    "password": "min 6 characters"
}
```

### **Login System**
- **Session-based**: Secure tokens stored in HTTP-only cookies
- **7-day Expiry**: Automatic session timeout for security
- **Multi-device**: Users can log in from multiple devices

### **Profile Management**
```python
# User profile data structure
{
    "weight": "float (kg)",
    "height": "float (cm)", 
    "age": "integer (years)",
    "gender": "male/female/other",
    "activity_level": "sedentary/light/moderate/active/very_active",
    "bmi": "calculated automatically",
    "daily_calories": "calculated using Mifflin-St Jeor equation"
}
```

### **Security Features**
- **Password Hashing**: SHA-256 with unique salt per user
- **Session Tokens**: Cryptographically secure random tokens
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Protection**: Parameterized queries throughout

---

## 🔌 API Integration

### **OpenRouter.ai LLM Integration**

#### **Food Analysis Endpoint**
```python
# Food nutrition analysis
POST https://openrouter.ai/api/v1/chat/completions
{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
            "role": "system",
            "content": "Food nutrition analysis prompt..."
        },
        {
            "role": "user", 
            "content": "pizza"
        }
    ]
}
```

#### **Alternative Suggestions Endpoint**
```python
# Healthier alternatives generation
POST https://openrouter.ai/api/v1/chat/completions
{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
            "role": "system",
            "content": "Generate 5 healthier alternatives..."
        },
        {
            "role": "user",
            "content": "Food: pizza, Calories: 270, Category: Prepared Foods"
        }
    ]
}
```

### **Internal API Endpoints**

#### **Authentication Routes**
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `POST /api/logout` - Session termination
- `GET /api/current_user` - Check authentication status

#### **Profile Routes**
- `GET /api/profile` - Retrieve user profile
- `POST /api/profile` - Update user profile

#### **Food Analysis Routes**
- `GET /api/food_search?query={food}` - Analyze food item
- `GET /api/find_alternatives?food_name={name}&calories={cal}&category={cat}` - Get alternatives

---

## 📁 File Structure

```
GA/
├── app.py                     # Main Flask application
├── database.py               # SQLite database operations
├── requirements.txt          # Python dependencies
├── README.md                # Project documentation
├── mindfulbite.db           # SQLite database file (auto-generated)
├── templates/
│   ├── index.html           # Main application page
│   └── login.html           # Authentication interface
├── static/
│   ├── css/
│   │   └── style.css        # Application styling
│   └── js/
│       └── script.js        # Frontend JavaScript logic
└── view_data.py             # Database inspection utility
```

### **Core Files Description**

#### **app.py** - Flask Application
- Main web server and API endpoints
- LLM integration for food analysis
- Authentication route handlers
- Session management

#### **database.py** - Database Operations
- SQLite connection management
- User authentication functions
- Profile management operations
- Security utilities (password hashing, session tokens)

#### **templates/index.html** - Main Interface
- Single-page application layout
- Food search and results display
- User profile management
- Alternative food suggestions

#### **templates/login.html** - Authentication
- Tabbed login/signup interface
- Form validation and error handling
- Responsive design for all devices

#### **static/css/style.css** - Styling
- Custom CSS with design system
- Responsive grid layouts
- Animation and transition effects
- Color palette and typography

#### **static/js/script.js** - Frontend Logic
- Food search and API integration
- User authentication handling
- Profile management and BMI calculation
- Dynamic UI updates and interactions

---

## 🗄️ Database Schema

### **Users Table**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);
```

### **User Profiles Table**
```sql
CREATE TABLE user_profiles (
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
);
```

### **User Sessions Table**
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

---

## ⚙️ Configuration

### **Environment Variables**
```python
# app.py configuration
SECRET_KEY = 'mindfulbite-secret-key-change-in-production'
OPENROUTER_API_KEY = 'your-openrouter-api-key'
OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
DATABASE_NAME = 'mindfulbite.db'
```

### **LLM Model Configuration**
```python
# Current model settings
MODEL = "gpt-3.5-turbo"  # Can be changed to other compatible models
MAX_TOKENS = 1000
TEMPERATURE = 0.7
```

### **Session Configuration**
```python
# Session settings
SESSION_LIFETIME = 7 * 24 * 60 * 60  # 7 days in seconds
COOKIE_HTTPONLY = True
COOKIE_SECURE = False  # Set to True in production with HTTPS
COOKIE_SAMESITE = 'Lax'
```

---

## 🛠️ Development

### **Adding New Features**

1. **Backend Changes**
   - Add new routes to `app.py`
   - Update database schema in `database.py`
   - Test API endpoints with tools like Postman

2. **Frontend Changes**
   - Update HTML templates
   - Add CSS styling in `style.css`
   - Implement JavaScript functionality in `script.js`

3. **Database Changes**
   - Modify `database.py` for new tables/columns
   - Run `python database.py` to apply changes
   - Update database schema documentation

### **Code Style Guidelines**
- **Python**: Follow PEP 8 conventions
- **JavaScript**: Use ES6+ features, async/await patterns
- **CSS**: Use BEM methodology for class naming
- **HTML**: Semantic markup with accessibility considerations

### **Testing**
```bash
# Test database operations
python database.py

# Test API endpoints
# Use browser or curl to test routes

# View database contents
python view_data.py
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **Database Connection Error**
```bash
# Solution: Reinitialize database
python database.py
```

#### **LLM API Authentication Error**
```python
# Check API key in app.py
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="verify-your-api-key-here",
)
```

#### **Session/Login Issues**
```bash
# Clear browser cookies and try again
# Or restart the Flask application
```

#### **Missing Dependencies**
```bash
# Reinstall requirements
pip install -r requirements.txt
```

### **Debug Mode**
The application runs in debug mode by default. Check the console for detailed error messages:
```python
# In app.py
if __name__ == '__main__':
    app.run(debug=True)  # Shows detailed error messages
```

### **Database Inspection**
Use the included utility to view database contents:
```bash
python view_data.py
```

---

## 🎯 Key Benefits

### **For Users**
- **Health Improvement**: Discover healthier food alternatives effortlessly
- **Personalized Insights**: Get calculations based on individual health metrics
- **Educational Value**: Learn about nutrition facts and ingredient analysis
- **Convenience**: Quick food analysis without manual research

### **For Developers**
- **Modern Architecture**: Clean separation of frontend and backend concerns
- **Scalable Design**: Modular structure for easy feature additions
- **Security-First**: Comprehensive authentication and data protection
- **AI Integration**: Ready-to-use LLM integration for food analysis

### **Technical Advantages**
- **No External Dependencies**: Runs entirely on local infrastructure
- **Fast Performance**: Lightweight Flask backend with optimized frontend
- **Cross-Platform**: Works on any system with Python support
- **Maintainable Code**: Clear structure and comprehensive documentation

---

## 📞 Support

For issues, questions, or contributions:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Ensure all dependencies are installed correctly
4. Verify API key configuration

---

**Built with ❤️ using Flask, SQLite, and OpenAI technology**

