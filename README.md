# MindfulBite – Food Choice Navigator

MindfulBite is a web application that provides **AI-powered nutrition guidance**.  
Users can enter any food item and receive **healthier alternatives** with detailed nutrient comparisons.  
The system leverages **Large Language Models (LLMs)** to make food substitutions explainable, practical, and tailored to health goals.

## 🚀 Features
- AI-driven **food swapping mechanism** with healthier alternatives
- Nutritional analysis (calories, macronutrients, Nutri-Score, ingredient breakdown)
- Personalized metrics (BMI, daily caloric needs via Mifflin-St Jeor equation)
- Responsive design (desktop & mobile)
- Secure backend (SHA-256 password hashing, session management, input validation)

## 🛠️ Tech Stack
- **Backend:** Flask (Python)  
- **Frontend:** HTML5, CSS3, JavaScript  
- **Database:** SQLite  
- **AI Integration:** OpenRouter.ai (GPT-4, Claude)  

## 📊 Results
- **95% success rate** in nutritional analysis  
- **2–3 second** average response time  
- Successfully tested across diverse foods (e.g., *french fries* → baked sweet potato fries, *paneer butter masala* → grilled paneer curry)

## 📈 Future Work
- Image recognition for food input  
- Mobile apps (iOS & Android) with health API integration  
- Advanced dietary filters (vegan, low-sodium, gluten-free)

## 📂 Setup & Run
1. Clone this repository  
  
   git clone https://github.com/your-username/mindfulbite.git
   cd mindfulbite

2. Install dependencies

   pip install -r requirements.txt
   
3. Run the app

   python app.py
  
4. Open in browser: `http://127.0.0.1:5000/`
