# MindfulBite MVP - Food Choice Navigator

## 🎯 Overview
This is the MVP (Minimum Viable Product) version of MindfulBite, a web application that helps users analyze their food choices and discover healthier alternatives.

## ✨ Features
- **Food Search**: Search for common food items with autocomplete
- **Nutritional Analysis**: View detailed nutritional information including calories, macros, and micronutrients
- **Pros & Cons**: See the benefits and drawbacks of your food choices
- **Healthier Alternatives**: Get suggestions for better food options
- **Nutritional Comparison**: Compare original food with alternatives side-by-side
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Current MVP Includes
- **5 Food Items**: Pizza, Hamburger, French Fries, Soda, Ice Cream
- **10 Alternatives**: Healthier options for each food item
- **Hardcoded Data**: No external APIs (yet)
- **Simple Interface**: Clean, user-friendly design
- **Basic Comparison**: Visual nutritional comparison

## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### Installation & Setup
1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application**:
   ```bash
   python app.py
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5000`

## 📱 How to Use

1. **Search for Food**: 
   - Type a food item in the search box (try: pizza, hamburger, soda)
   - Use autocomplete suggestions
   - Press Enter or click "Analyze Food"

2. **View Analysis**:
   - See nutritional breakdown
   - Review pros and cons
   - Explore healthier alternatives

3. **Compare Options**:
   - Click "Compare Nutrition" on any alternative
   - View side-by-side comparison

## 📊 Available Foods
Currently supported foods:
- **Pizza** → Cauliflower Pizza, Veggie Wrap
- **Hamburger** → Turkey Burger, Black Bean Burger  
- **French Fries** → Baked Sweet Potato, Air Fryer Carrots
- **Soda** → Sparkling Water, Green Tea
- **Ice Cream** → Frozen Yogurt, Banana Nice Cream

## 🔧 Technical Stack
- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data**: Hardcoded Python dictionaries
- **Styling**: Custom CSS with responsive design

## 📁 Project Structure
```
mindful-bite/
├── app.py              # Flask backend
├── data.py             # Hardcoded food data
├── requirements.txt    # Dependencies
├── static/
│   ├── css/
│   │   └── style.css   # Styling
│   └── js/
│       └── script.js   # Frontend logic
└── templates/
    └── index.html      # Main page
```

## 🎨 UI Features
- **Modern Design**: Clean gradient background with card-based layout
- **Interactive Elements**: Hover effects and smooth transitions
- **Loading States**: Visual feedback during searches
- **Error Handling**: User-friendly error messages
- **Mobile Responsive**: Adapts to different screen sizes

## 🔮 Next Steps (Future Enhancements)
1. **Real Data Integration**: Connect to USDA FoodData Central API
2. **User Authentication**: Save preferences and search history
3. **Smart Recommendations**: ML-based suggestion algorithm
4. **Filter System**: Health, eco-friendly, religious, calorie-based filters
5. **Expanded Database**: More food items and alternatives
6. **Advanced Comparison**: Charts and visual analytics
7. **User Profiles**: Personalized recommendations

## 🐛 Known Limitations (MVP)
- Limited to 5 food items
- Hardcoded data only
- Basic comparison functionality
- No user accounts or data persistence
- Simple recommendation logic

## 📧 Development Notes
This MVP demonstrates the core functionality and user interface of MindfulBite. It's designed to validate the concept and gather user feedback before implementing more complex features.

The codebase is modular and ready for future enhancements including external API integration, database connectivity, and advanced recommendation algorithms. 