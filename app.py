from flask import Flask, render_template, request, jsonify, make_response, session
import openai
from openai import OpenAI
import json
import logging

# Import database functions for user authentication (NEW)
try:
    from database import (
        init_database, create_user, authenticate_user, create_session, 
        get_user_from_session, delete_session, get_user_profile, update_user_profile
    )
    DB_AVAILABLE = True
except ImportError:
    print("Warning: Database module not available")
    DB_AVAILABLE = False

app = Flask(__name__)
app.secret_key = 'mindfulbite-secret-key-change-in-production'  # NEW

# Initialize database on startup (NEW)
if DB_AVAILABLE:
    try:
        init_database()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")

# OpenRouter Configuration
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

# Configure logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper function to get current user (NEW)
def get_current_user():
    """Get current user from session token"""
    if not DB_AVAILABLE:
        return None
    session_token = request.cookies.get('session_token')
    if session_token:
        return get_user_from_session(session_token)
    return None

# NEW AUTHENTICATION ROUTES - Added without modifying existing routes

@app.route('/login')
def login_page():
    """Serve the login page"""
    return render_template('login.html')

@app.route('/api/register', methods=['POST'])
def register():
    """Handle user registration"""
    if not DB_AVAILABLE:
        return jsonify({"success": False, "error": "Database not available"}), 500
    
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Basic validation
        if not username or not email or not password:
            return jsonify({"success": False, "error": "All fields are required"}), 400
        
        if len(username) < 3:
            return jsonify({"success": False, "error": "Username must be at least 3 characters"}), 400
        
        if len(password) < 6:
            return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400
        
        if '@' not in email:
            return jsonify({"success": False, "error": "Please enter a valid email"}), 400
        
        # Create user
        result = create_user(username, email, password)
        
        if result['success']:
            logger.info(f"✅ New user registered: {username}")
            return jsonify({"success": True, "message": "Account created successfully! Please login."})
        else:
            return jsonify({"success": False, "error": result['error']}), 400
        
    except Exception as e:
        logger.error(f"❌ Registration error: {e}")
        return jsonify({"success": False, "error": "Registration failed"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    if not DB_AVAILABLE:
        return jsonify({"success": False, "error": "Database not available"}), 500
    
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({"success": False, "error": "Username and password are required"}), 400
        
        # Authenticate user
        auth_result = authenticate_user(username, password)
        
        if auth_result['success']:
            user = auth_result['user']
            
            # Create session
            session_token = create_session(user['id'])
            
            if session_token:
                # Create response with session cookie
                response = make_response(jsonify({
                    "success": True, 
                    "message": "Login successful",
                    "user": user
                }))
                
                # Set secure session cookie (7 days)
                response.set_cookie(
                    'session_token', 
                    session_token,
                    max_age=7*24*60*60,  # 7 days
                    httponly=True,
                    secure=False,  # Set to True in production with HTTPS
                    samesite='Lax'
                )
                
                logger.info(f"✅ User logged in: {user['username']}")
                return response
            else:
                return jsonify({"success": False, "error": "Failed to create session"}), 500
        else:
            return jsonify({"success": False, "error": auth_result['error']}), 401
        
    except Exception as e:
        logger.error(f"❌ Login error: {e}")
        return jsonify({"success": False, "error": "Login failed"}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    if not DB_AVAILABLE:
        return jsonify({"success": False, "error": "Database not available"}), 500
    
    try:
        session_token = request.cookies.get('session_token')
        
        if session_token:
            delete_session(session_token)
        
        response = make_response(jsonify({"success": True, "message": "Logged out successfully"}))
        response.set_cookie('session_token', '', expires=0)
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Logout error: {e}")
        return jsonify({"success": False, "error": "Logout failed"}), 500

@app.route('/api/current_user', methods=['GET'])
def current_user():
    """Get current user info"""
    if not DB_AVAILABLE:
        return jsonify({"success": False, "user": None})
    
    user = get_current_user()
    if user:
        return jsonify({"success": True, "user": user})
    else:
        return jsonify({"success": False, "user": None})

@app.route('/api/profile', methods=['GET'])
def get_profile():
    """Get user profile data"""
    if not DB_AVAILABLE:
        return jsonify({"success": False, "error": "Database not available"}), 500
    
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        profile = get_user_profile(user['id'])
        
        if profile:
            # Remove sensitive fields
            safe_profile = {
                'weight': profile.get('weight'),
                'height': profile.get('height'),
                'age': profile.get('age'),
                'gender': profile.get('gender'),
                'activity_level': profile.get('activity_level'),
                'bmi': profile.get('bmi'),
                'daily_calories': profile.get('daily_calories')
            }
            return jsonify({"success": True, "profile": safe_profile})
        else:
            return jsonify({"success": True, "profile": {}})
        
    except Exception as e:
        logger.error(f"❌ Profile fetch error: {e}")
        return jsonify({"success": False, "error": "Failed to fetch profile"}), 500

@app.route('/api/profile', methods=['POST'])
def update_profile():
    """Update user profile data"""
    if not DB_AVAILABLE:
        return jsonify({"success": False, "error": "Database not available"}), 500
    
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        data = request.get_json()
        
        weight = data.get('weight')
        height = data.get('height')
        age = data.get('age')
        gender = data.get('gender')
        activity_level = data.get('activity_level')
        
        # Convert string numbers to float/int
        if weight:
            weight = float(weight)
        if height:
            height = float(height)
        if age:
            age = int(age)
        
        # Validate inputs
        if weight and (weight < 20 or weight > 500):
            return jsonify({"success": False, "error": "Weight must be between 20-500 kg"}), 400
        
        if height and (height < 100 or height > 250):
            return jsonify({"success": False, "error": "Height must be between 100-250 cm"}), 400
        
        if age and (age < 10 or age > 120):
            return jsonify({"success": False, "error": "Age must be between 10-120 years"}), 400
        
        if gender and gender not in ['male', 'female', 'other']:
            return jsonify({"success": False, "error": "Invalid gender selection"}), 400
        
        if activity_level and activity_level not in ['sedentary', 'light', 'moderate', 'active', 'very_active']:
            return jsonify({"success": False, "error": "Invalid activity level"}), 400
        
        # Update profile
        success = update_user_profile(
            user['id'], 
            weight=weight, 
            height=height, 
            age=age, 
            gender=gender, 
            activity_level=activity_level
        )
        
        if success:
            # Get updated profile
            updated_profile = get_user_profile(user['id'])
            safe_profile = {
                'weight': updated_profile.get('weight'),
                'height': updated_profile.get('height'),
                'age': updated_profile.get('age'),
                'gender': updated_profile.get('gender'),
                'activity_level': updated_profile.get('activity_level'),
                'bmi': updated_profile.get('bmi'),
                'daily_calories': updated_profile.get('daily_calories')
            }
            
            logger.info(f"✅ Profile updated for user: {user['username']}")
            return jsonify({"success": True, "profile": safe_profile})
        else:
            return jsonify({"success": False, "error": "Failed to update profile"}), 500
        
    except ValueError as e:
        return jsonify({"success": False, "error": "Invalid number format"}), 400
    except Exception as e:
        logger.error(f"❌ Profile update error: {e}")
        return jsonify({"success": False, "error": "Failed to update profile"}), 500

# EXISTING ROUTES UNCHANGED - keeping everything as is

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/api/food_search')
def food_search():
    """
    LLM-powered food search and nutrition analysis
    
    Query Parameters:
    - query: Food search term (required)
    
    Returns:
    - Structured JSON with nutrition data and food details
    """
    query = request.args.get('query', '')
    
    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400
    
    try:
        # Get structured food data from LLM
        food_data = get_food_nutrition_from_llm(query)
        
        if not food_data:
            return jsonify({'error': 'Could not analyze this food item'}), 404
        
        # Return in expected format
        return jsonify({
            'products': [food_data],
            'count': 1,
            'page': 1,
            'page_size': 1
        })
        
    except Exception as e:
        logger.error(f"Food search error: {e}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/api/find_alternatives')
def find_alternatives():
    """
    LLM-powered healthier alternative suggestions
    
    Query Parameters:
    - food_name: Original food name (required)
    - calories: Original food calories (optional)
    - category: Food category (optional)
    
    Returns:
    - List of healthier alternatives with nutrition data
    """
    food_name = request.args.get('food_name', '')
    calories = request.args.get('calories', 0)
    category = request.args.get('category', '')
    
    if not food_name:
        return jsonify({'error': 'food_name parameter is required'}), 400
    
    try:
        # Get alternative suggestions from LLM
        alternatives = get_healthier_alternatives_from_llm(food_name, calories, category)
        
        return jsonify({
            'alternatives': alternatives,
            'count': len(alternatives)
        })
        
    except Exception as e:
        logger.error(f"Alternative search error: {e}")
        return jsonify({'error': f'Alternative search failed: {str(e)}'}), 500

@app.route('/api/test_alternatives')
def test_alternatives():
    """
    Test endpoint for debugging alternatives functionality
    """
    try:
        # Test with a simple pizza example
        alternatives = get_healthier_alternatives_from_llm("pizza", 280, "Frozen Foods")
        
        return jsonify({
            'success': True,
            'alternatives_count': len(alternatives),
            'alternatives': alternatives,
            'debug_info': {
                'food_name': 'pizza',
                'original_calories': 280,
                'category': 'Frozen Foods'
            }
        })
        
    except Exception as e:
        logger.error(f"Test alternatives error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'debug_info': {
                'food_name': 'pizza',
                'original_calories': 280,
                'category': 'Frozen Foods'
            }
        }), 500

def get_food_nutrition_from_llm(food_query):
    """
    Get comprehensive nutrition data for a food item using LLM
    """
    try:
        prompt = f"""
        Analyze the food item: "{food_query}"
        
        Provide comprehensive nutrition data in JSON format with this exact structure:
        {{
            "product_name": "Full product name",
            "brands": "Brand name if applicable",
            "categories": "Food category (e.g., 'Snacks', 'Beverages', 'Frozen Foods')",
            "nutriscore_grade": "A, B, C, D, or E (healthiness rating)",
            "code": "unique_identifier_for_this_product",
            "nutriments": {{
                "energy-kcal_100g": calories_per_100g,
                "proteins_100g": protein_grams_per_100g,
                "carbohydrates_100g": carbs_grams_per_100g,
                "fat_100g": fat_grams_per_100g,
                "fiber_100g": fiber_grams_per_100g,
                "sugars_100g": sugar_grams_per_100g,
                "sodium_100g": sodium_grams_per_100g,
                "calcium_100g": calcium_grams_per_100g,
                "iron_100g": iron_grams_per_100g,
                "vitamin-c_100g": vitamin_c_grams_per_100g,
                "potassium_100g": potassium_grams_per_100g,
                "vitamin-a_100g": vitamin_a_grams_per_100g
            }},
            "ingredients_text": "Detailed ingredient list if known, or 'Ingredient information not available'"
        }}
        
        Requirements:
        - Use realistic nutrition values based on typical foods
        - Nutri-Score: A (healthiest) to E (least healthy)
        - All nutrient values per 100g
        - If exact data unknown, provide reasonable estimates
        - No explanatory text, just the JSON object
        """
        
        response = client.chat.completions.create(
            model="openrouter/horizon-beta",  # Using Claude through OpenRouter
            messages=[
                {"role": "system", "content": "You are a nutrition expert. Provide accurate food nutrition data in the exact JSON format requested. Return only valid JSON with no additional text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )
        
        # Parse the LLM response
        response_text = response.choices[0].message.content.strip()
        logger.info(f"LLM nutrition response: {response_text}")
        
        # Clean the response (remove any markdown formatting)
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        food_data = json.loads(response_text)
        return food_data
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}")
        return None
    except Exception as e:
        logger.error(f"LLM nutrition analysis error: {e}")
        return None

def get_healthier_alternatives_from_llm(food_name, original_calories, category):
    """
    Get healthier alternative suggestions using LLM
    """
    try:
        logger.info(f"🔍 Finding alternatives for: {food_name}, calories: {original_calories}, category: {category}")
        
        prompt = f"""
        Find 4-5 healthier alternatives for: "{food_name}"
        Original food has {original_calories} calories per 100g
        Category: {category}
        
        Requirements:
        1. Each alternative must have FEWER calories than {original_calories}
        2. Must be similar food type (pizza alternatives for pizza, burger alternatives for burger)
        3. Must be realistic products people can actually buy
        4. Include health benefits explanation
        
        Return ONLY a JSON array in this exact format:
        [
            {{
                "product_name": "Healthier alternative name",
                "brands": "Brand name or Generic",
                "categories": "{category}",
                "nutriscore_grade": "A or B",
                "code": "alt_001",
                "nutriments": {{
                    "energy-kcal_100g": 200,
                    "proteins_100g": 12,
                    "carbohydrates_100g": 25,
                    "fat_100g": 6,
                    "fiber_100g": 3,
                    "sugars_100g": 2,
                    "sodium_100g": 0.5,
                    "calcium_100g": 0.1,
                    "iron_100g": 0.002,
                    "vitamin-c_100g": 0.01,
                    "potassium_100g": 0.3,
                    "vitamin-a_100g": 0.00005
                }},
                "ingredients_text": "List of ingredients",
                "health_benefits": "Why this is healthier than the original"
            }}
        ]
        
        IMPORTANT: Return ONLY the JSON array, no other text.
        """
        
        logger.info(f"🤖 Sending prompt to OpenRouter...")
        
        response = client.chat.completions.create(
            model="openrouter/horizon-beta",  # Using same model as nutrition function
            messages=[
                {"role": "system", "content": "You are a nutrition expert. Return only valid JSON arrays for food alternatives. No explanations, just the JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=2000
        )
        
        # Parse the LLM response
        response_text = response.choices[0].message.content.strip()
        logger.info(f"📝 Raw LLM alternatives response: {response_text[:200]}...")
        
        # Clean the response (remove any markdown formatting)
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '').strip()
        elif response_text.startswith('```'):
            response_text = response_text.replace('```', '').strip()
        
        # Try to parse JSON
        alternatives = json.loads(response_text)
        
        # Validate the response
        if not isinstance(alternatives, list):
            logger.error(f"❌ Expected list, got {type(alternatives)}")
            return []
        
        if len(alternatives) == 0:
            logger.warning(f"⚠️ LLM returned empty alternatives list")
            return []
        
        # Validate each alternative has required fields
        valid_alternatives = []
        for alt in alternatives:
            if (isinstance(alt, dict) and 
                'product_name' in alt and 
                'nutriments' in alt and
                'energy-kcal_100g' in alt['nutriments']):
                valid_alternatives.append(alt)
            else:
                logger.warning(f"⚠️ Skipping invalid alternative: {alt}")
        
        logger.info(f"✅ Successfully parsed {len(valid_alternatives)} valid alternatives")
        return valid_alternatives
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON parsing error for alternatives: {e}")
        logger.error(f"❌ Raw response was: {response_text if 'response_text' in locals() else 'No response'}")
        
        # Return a fallback alternative if JSON parsing fails
        return create_fallback_alternatives(food_name, original_calories, category)
        
    except Exception as e:
        logger.error(f"❌ LLM alternative analysis error: {e}")
        return create_fallback_alternatives(food_name, original_calories, category)

def create_fallback_alternatives(food_name, original_calories, category):
    """
    Create fallback alternatives when LLM fails
    """
    logger.info(f"🔧 Creating fallback alternatives for {food_name}")
    
    # Simple fallback based on food type
    fallback_alternatives = []
    
    if 'pizza' in food_name.lower():
        fallback_alternatives = [
            {
                "product_name": "Thin Crust Veggie Pizza",
                "brands": "Generic",
                "categories": "Frozen Foods",
                "nutriscore_grade": "B",
                "code": "fallback_pizza_001",
                "nutriments": {
                    "energy-kcal_100g": max(180, int(original_calories * 0.7)),
                    "proteins_100g": 12,
                    "carbohydrates_100g": 22,
                    "fat_100g": 5,
                    "fiber_100g": 3,
                    "sugars_100g": 2,
                    "sodium_100g": 0.6,
                    "calcium_100g": 0.15,
                    "iron_100g": 0.002,
                    "vitamin-c_100g": 0.008,
                    "potassium_100g": 0.25,
                    "vitamin-a_100g": 0.00006
                },
                "ingredients_text": "Whole wheat flour, vegetables, part-skim mozzarella, tomato sauce",
                "health_benefits": "Lower calories, more vegetables, less fat than regular pizza"
            }
        ]
    elif 'burger' in food_name.lower():
        fallback_alternatives = [
            {
                "product_name": "Turkey Burger",
                "brands": "Generic",
                "categories": "Prepared Foods",
                "nutriscore_grade": "B",
                "code": "fallback_burger_001",
                "nutriments": {
                    "energy-kcal_100g": max(200, int(original_calories * 0.8)),
                    "proteins_100g": 20,
                    "carbohydrates_100g": 15,
                    "fat_100g": 8,
                    "fiber_100g": 2,
                    "sugars_100g": 1,
                    "sodium_100g": 0.5,
                    "calcium_100g": 0.08,
                    "iron_100g": 0.003,
                    "vitamin-c_100g": 0.002,
                    "potassium_100g": 0.35,
                    "vitamin-a_100g": 0.00002
                },
                "ingredients_text": "Ground turkey, whole grain bun, lettuce, tomato",
                "health_benefits": "Leaner protein, fewer calories than beef burger"
            }
        ]
    else:
        # Generic healthier alternative
        fallback_alternatives = [
            {
                "product_name": f"Healthier {food_name}",
                "brands": "Generic",
                "categories": category or "Food Products",
                "nutriscore_grade": "B",
                "code": "fallback_generic_001",
                "nutriments": {
                    "energy-kcal_100g": max(150, int(original_calories * 0.75)),
                    "proteins_100g": 10,
                    "carbohydrates_100g": 20,
                    "fat_100g": 6,
                    "fiber_100g": 4,
                    "sugars_100g": 3,
                    "sodium_100g": 0.4,
                    "calcium_100g": 0.1,
                    "iron_100g": 0.002,
                    "vitamin-c_100g": 0.01,
                    "potassium_100g": 0.3,
                    "vitamin-a_100g": 0.00005
                },
                "ingredients_text": "Healthier ingredients with reduced calories",
                "health_benefits": f"Lower calorie version of {food_name} with better nutrition profile"
            }
        ]
    
    logger.info(f"✅ Created {len(fallback_alternatives)} fallback alternatives")
    return fallback_alternatives

if __name__ == '__main__':
    app.run(debug=True) 