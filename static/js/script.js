// Global variables
let currentFood = null;
let currentAlternatives = [];
let selectedAlternative = null;
let currentUser = null; // NEW: Track current user

// DOM elements with null checks
const landingPage = document.getElementById('landingPage');
const mainApp = document.getElementById('mainApp');
const getStartedBtn = document.getElementById('getStartedBtn');
const foodInput = document.getElementById('foodInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const resultsSection = document.getElementById('resultsSection');
const originalFoodCard = document.getElementById('originalFoodCard');
const alternativesSection = document.getElementById('alternativesSection');
const alternativeButtons = document.getElementById('alternativeButtons');
const alternativeDetails = document.getElementById('alternativeDetails');
const comparisonSection = document.getElementById('comparisonSection');

// Profile elements 
const weightInput = document.getElementById('weight');
const heightInput = document.getElementById('height');
const ageInput = document.getElementById('age');
const genderSelect = document.getElementById('gender');
const activitySelect = document.getElementById('activity');
const bmiDisplay = document.getElementById('bmiDisplay');

//Authentication elements
const userInfo = document.getElementById('userInfo');
const loginPrompt = document.getElementById('loginPrompt');
const userWelcome = document.getElementById('userWelcome');
const logoutBtn = document.getElementById('logoutBtn');
const headerUserInfo = document.getElementById('headerUserInfo');
const headerUserName = document.getElementById('headerUserName');
const headerLogoutBtn = document.getElementById('headerLogoutBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileStatus = document.getElementById('profileStatus');

// Debug: Log which elements are missing
        console.log('DOM Elements Check:');
const requiredElements = {
    landingPage, mainApp, getStartedBtn, foodInput, searchBtn, 
    loading, error, resultsSection, originalFoodCard, 
    alternativesSection, alternativeButtons, alternativeDetails, comparisonSection
};

for (const [name, element] of Object.entries(requiredElements)) {
    if (!element) {
                    console.warn(`Missing required element: ${name}`);
    } else {
        console.log(`Found element: ${name}`);
    }
}

const profileElements = {
    weightInput, heightInput, ageInput, genderSelect, activitySelect, bmiDisplay
};

for (const [name, element] of Object.entries(profileElements)) {
    if (!element) {
                    console.warn(`Missing profile element: ${name}`);
    } else {
        console.log(`Found profile element: ${name}`);
    }
}

// Event listeners with null checks
if (getStartedBtn) {
    getStartedBtn.addEventListener('click', showMainApp);
} else {
            console.error('Cannot attach event to getStartedBtn - element not found');
}

if (searchBtn) {
    searchBtn.addEventListener('click', searchFood);
} else {
            console.error('Cannot attach event to searchBtn - element not found');
}

// Real-time BMI calculation (only if elements exist)
if (weightInput && heightInput) {
    [weightInput, heightInput].forEach(input => {
        input.addEventListener('input', calculateBMI);
    });
} else {
            console.warn('BMI calculation not available - profile elements missing');
}

// Event delegation for dynamic content
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('alternative-btn')) {
        const index = parseInt(e.target.dataset.index);
        showAlternativeDetails(index);
    } else if (e.target.classList.contains('compare-btn')) {
        showComparison();
    } else if (e.target.classList.contains('see-more-btn')) {
        toggleIngredients(e.target);
    }
});

function showMainApp() {
    if (!landingPage || !mainApp) {
        console.error('Cannot transition - landing page or main app elements missing');
        return;
    }
    landingPage.style.display = 'none';
    mainApp.style.display = 'block';
}

// Main search function powered by LLM
async function searchFood() {
    if (!foodInput) {
        console.error('Cannot search - food input element missing');
        showError('Search functionality not available');
        return;
    }
    
    const query = foodInput.value.trim();
    if (!query) {
        showError('Please enter a food item to search');
        return;
    }
    
    showLoading(true);
    hideError();
    
    try {
        // Search for main food using LLM
        const response = await fetch(`/api/food_search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        console.log('LLM food search response:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (!data.products || data.products.length === 0) {
            showError('Could not analyze this food item. Try common foods like "pizza", "burger", or brand names.');
            return;
        }

        // Use the first result as the main food
        currentFood = data.products[0];
        displayOriginalFood(currentFood);

        // Search for alternatives using dedicated LLM endpoint
        console.log('About to call findAlternativesLLM with:', currentFood);
        await findAlternativesLLM(currentFood);
        console.log('findAlternativesLLM completed');

        // Show results
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
        
    } catch (err) {
        console.error('Search error:', err);
        showError(`Error: ${err.message}`);
    } finally {
        showLoading(false);
    }
}

// LLM-powered alternative finding
async function findAlternativesLLM(food) {
            console.log('Finding alternatives using LLM for:', food.product_name);
    
    try {
        const calories = getCalories(food);
        const category = food.categories || '';
        
        const response = await fetch(`/api/find_alternatives?food_name=${encodeURIComponent(food.product_name)}&calories=${calories}&category=${encodeURIComponent(category)}`);
        
        if (!response.ok) {
            throw new Error('Alternative search failed');
        }
        
        const data = await response.json();
        console.log('LLM alternatives response:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (data.alternatives && data.alternatives.length > 0) {
            console.log('Found', data.alternatives.length, 'alternatives, setting currentAlternatives');
            currentAlternatives = data.alternatives;
            console.log('About to call displayAlternativeButtons');
            displayAlternativeButtons(data.alternatives);
            console.log('displayAlternativeButtons call completed');
        } else {
            console.log('No alternatives found or empty array');
            // Show no alternatives message
            if (alternativeButtons) {
                alternativeButtons.innerHTML = `
                    <div style="text-align: center; padding: 20px; background: #fff3cd; border-radius: 8px; margin: 10px 0;">
                        <h4 style="margin: 0 0 10px 0;">No healthier alternatives found</h4>
                        <p style="margin: 0; color: #666;">Try searching for more specific product names or brands.</p>
                    </div>
                `;
                alternativeButtons.style.display = 'block';
                
                // Show the parent alternatives section
                if (alternativesSection) {
                    alternativesSection.style.display = 'block';
                }
            }
        }
        
    } catch (err) {
        console.error('LLM alternative search error:', err);
        if (alternativeButtons) {
            alternativeButtons.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #f8d7da; border-radius: 8px; margin: 10px 0;">
                    <h4 style="margin: 0 0 10px 0;">Alternative search failed</h4>
                    <p style="margin: 0; color: #666;">Error: ${err.message}</p>
                </div>
            `;
        }
        currentAlternatives = [];
    }
}

// Display original food with LLM data
function displayOriginalFood(food) {
    const calories = getCalories(food);
    const protein = getNutrient(food, 'protein');
    const carbs = getNutrient(food, 'carbohydrate');
    const fat = getNutrient(food, 'fat');
    const fiber = getNutrient(food, 'fiber');
    const sugar = getNutrient(food, 'sugars');
    const sodium = getNutrient(food, 'sodium');
    const calcium = getNutrient(food, 'calcium');
    const iron = getNutrient(food, 'iron');
    const vitaminC = getNutrient(food, 'vitamin c');
    const vitaminA = getNutrient(food, 'vitamin a');
    const potassium = getNutrient(food, 'potassium');

    // Calculate weight impact
    const userProfile = getUserProfile();
    const dailyCalories = calculateDailyCalories(userProfile);
    
    let weightImpactSection = '';
    if (calories > 0) {
        const weeklyCalories = calories * 7;
        const monthlyCalories = calories * 30;
        
        const weeklyWeightKg = weeklyCalories / 7700;
        const monthlyWeightKg = monthlyCalories / 7700;
        
        const adjustedWeeklyKg = userProfile.weight ? 
            getPersonalizedWeightImpact(weeklyCalories, userProfile) : weeklyWeightKg;
        const adjustedMonthlyKg = userProfile.weight ? 
            getPersonalizedWeightImpact(monthlyCalories, userProfile) : monthlyWeightKg;
        
        weightImpactSection = `
            <div class="timeline-section" style="margin-top: 20px;">
                <h4 style="color: #333; margin-bottom: 10px; text-align: center;">Weight Impact if Eaten Regularly</h4>
                <p style="text-align: center; margin-bottom: 15px; color: #666; font-size: 0.9rem;">
                    Potential weight gain if you eat this food daily
                    ${userProfile.weight ? ' (personalized for your profile)' : ' (fill your profile above for personalized results)'}
                </p>
                <div class="timeline-grid">
                    <div class="timeline-item">
                        <div class="timeline-period">1 week daily</div>
                        <div class="timeline-weight negative-highlight">
                            +${adjustedWeeklyKg.toFixed(1)}kg
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-period">1 month daily</div>
                        <div class="timeline-weight negative-highlight">
                            +${adjustedMonthlyKg.toFixed(1)}kg
                        </div>
                    </div>
                    ${dailyCalories ? `
                    <div class="timeline-item">
                        <div class="timeline-period">% of daily needs</div>
                        <div class="timeline-weight" style="color: ${calories/dailyCalories > 0.3 ? '#c62828' : '#666'};">
                            ${((calories/dailyCalories) * 100).toFixed(0)}%
                        </div>
                    </div>
                    ` : ''}
        </div>
            </div>
        `;
    }

    if (originalFoodCard) {
        originalFoodCard.innerHTML = `
            <h3>${food.product_name || food.brands || 'Unknown Product'}</h3>
            ${food.brands ? `<div class="product-brand">${food.brands}</div>` : ''}
            ${food.nutriscore_grade ? `<div class="nutri-score-display">Nutri-Score: <span class="nutri-score nutri-${food.nutriscore_grade.toLowerCase()}">${food.nutriscore_grade.toUpperCase()}</span></div>` : ''}
            
            <div class="nutrition-grid">
                <div class="nutrition-item">
                    <span class="nutrition-value">${calories}</span>
                    <div class="nutrition-label">Calories</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${protein}g</span>
                    <div class="nutrition-label">Protein</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${carbs}g</span>
                    <div class="nutrition-label">Carbs</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${fat}g</span>
                    <div class="nutrition-label">Fat</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${fiber}g</span>
                    <div class="nutrition-label">Fiber</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${sugar}g</span>
                    <div class="nutrition-label">Sugar</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${sodium}mg</span>
                    <div class="nutrition-label">Sodium</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${calcium}mg</span>
                    <div class="nutrition-label">Calcium</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${iron}mg</span>
                    <div class="nutrition-label">Iron</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${vitaminC}mg</span>
                    <div class="nutrition-label">Vitamin C</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${potassium}mg</span>
                    <div class="nutrition-label">Potassium</div>
                </div>
                <div class="nutrition-item">
                    <span class="nutrition-value">${vitaminA}mcg</span>
                    <div class="nutrition-label">Vitamin A</div>
                </div>
            </div>
            ${weightImpactSection}
        `;
        
        originalFoodCard.style.display = 'block';
    }
}

// Display LLM-generated alternatives
function displayAlternativeButtons(alternatives) {
            console.log('displayAlternativeButtons called with:', alternatives.length, 'alternatives');
    console.log('alternativeButtons element:', alternativeButtons);
    
    if (alternatives.length === 0) {
        if (alternativeButtons) {
            alternativeButtons.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #fff3cd; border-radius: 8px; margin: 10px 0;">
                    <h4 style="margin: 0 0 10px 0;">No healthier alternatives found</h4>
                    <p style="margin: 0; color: #666;">Try searching for more specific product names or brands.</p>
                </div>
            `;
            
            // Show the parent alternatives section
            if (alternativesSection) {
                alternativesSection.style.display = 'block';
            }
        }
        return;
    }
    
    if (alternativeButtons) {
        console.log('Rendering', alternatives.length, 'alternatives to DOM');
        
        alternativeButtons.innerHTML = '<h3>AI-Recommended Healthier Alternatives</h3>' + 
            alternatives.map((alternative, index) => {
                const calories = getCalories(alternative);
                const nutriScore = alternative.nutriscore_grade ? 
                    `<span class="nutri-score nutri-${alternative.nutriscore_grade.toLowerCase()}">${alternative.nutriscore_grade.toUpperCase()}</span>` : '';
                const brand = alternative.brands ? `<div class="brand">${alternative.brands}</div>` : '';
                const healthBenefit = alternative.health_benefits ? `<div class="health-benefit">${alternative.health_benefits}</div>` : '';
                
                return `
                    <button class="alternative-btn" data-index="${index}">
                        <div class="alt-name">${alternative.product_name || 'Unknown Product'}</div>
                        ${brand}
                        <div class="alt-info">
                            <span class="alt-calories">${calories} cal</span>
                            ${nutriScore}
                        </div>
                        ${healthBenefit}
                    </button>
                `;
            }).join('');
            
        alternativeButtons.style.display = 'block';
        
        // Show the parent alternatives section
        if (alternativesSection) {
            alternativesSection.style.display = 'block';
            console.log('alternativesSection shown');
        }
        
        console.log('alternatives rendered, display set to block');
        console.log('alternativeButtons innerHTML length:', alternativeButtons.innerHTML.length);
    } else {
        console.error('alternativeButtons element not found!');
    }
}

// Show detailed alternative information
function showAlternativeDetails(index) {
    selectedAlternative = currentAlternatives[index];
    if (!selectedAlternative) return;

    const calories = getCalories(selectedAlternative);
    const protein = getNutrient(selectedAlternative, 'protein');
    const carbs = getNutrient(selectedAlternative, 'carbohydrate');
    const fat = getNutrient(selectedAlternative, 'fat');
    const fiber = getNutrient(selectedAlternative, 'fiber');
    const sugar = getNutrient(selectedAlternative, 'sugars');
    const sodium = getNutrient(selectedAlternative, 'sodium');
    const calcium = getNutrient(selectedAlternative, 'calcium');
    const iron = getNutrient(selectedAlternative, 'iron');
    const vitaminC = getNutrient(selectedAlternative, 'vitamin c');
    const vitaminA = getNutrient(selectedAlternative, 'vitamin a');
    const potassium = getNutrient(selectedAlternative, 'potassium');

    if (alternativeDetails) {
        alternativeDetails.innerHTML = `
            <h3>${selectedAlternative.product_name || selectedAlternative.brands || 'Unknown Product'}</h3>
            ${selectedAlternative.brands ? `<div class="product-brand">${selectedAlternative.brands}</div>` : ''}
            ${selectedAlternative.nutriscore_grade ? `<div class="nutri-score-display">Nutri-Score: <span class="nutri-score nutri-${selectedAlternative.nutriscore_grade.toLowerCase()}">${selectedAlternative.nutriscore_grade.toUpperCase()}</span></div>` : ''}
            ${selectedAlternative.health_benefits ? `<div class="health-benefits"><strong>Why it's healthier:</strong> ${selectedAlternative.health_benefits}</div>` : ''}
            
            <table class="nutrition-table">
                <thead>
                    <tr>
                        <th>Nutrient</th>
                        <th>Amount (per 100g)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Calories</td><td>${calories}</td></tr>
                    <tr><td>Protein</td><td>${protein}g</td></tr>
                    <tr><td>Carbohydrates</td><td>${carbs}g</td></tr>
                    <tr><td>Fat</td><td>${fat}g</td></tr>
                    <tr><td>Fiber</td><td>${fiber}g</td></tr>
                    <tr><td>Sugar</td><td>${sugar}g</td></tr>
                    <tr><td>Sodium</td><td>${sodium}mg</td></tr>
                    <tr><td>Calcium</td><td>${calcium}mg</td></tr>
                    <tr><td>Iron</td><td>${iron}mg</td></tr>
                    <tr><td>Potassium</td><td>${potassium}mg</td></tr>
                    <tr><td>Vitamin C</td><td>${vitaminC}mg</td></tr>
                    <tr><td>Vitamin A</td><td>${vitaminA}mcg</td></tr>
                </tbody>
            </table>

            <div class="action-buttons">
                <button class="see-more-btn">See Ingredients</button>
                <button class="compare-btn">Compare Foods</button>
            </div>

            <div class="ingredients-section" style="display: none;">
                <div class="ingredients-list">
                    ${getIngredients(selectedAlternative)}
                </div>
            </div>
        `;
        
        alternativeDetails.style.display = 'block';
    }
}

// Updated nutrition extraction for LLM format
function getNutrient(food, nutrientName) {
    if (!food || !food.nutriments) return 0;
    
    const searchName = nutrientName.toLowerCase();
    let value = 0;
    
    // LLM nutriment mapping (matches backend structure)
    switch (searchName) {
        case 'energy':
        case 'calories':
            value = food.nutriments['energy-kcal_100g'] || food.nutriments['energy_100g'] || 0;
            break;
        case 'protein':
            value = food.nutriments['proteins_100g'] || 0;
            break;
        case 'carbohydrate':
        case 'carbs':
            value = food.nutriments['carbohydrates_100g'] || 0;
            break;
        case 'total lipid':
        case 'fat':
            value = food.nutriments['fat_100g'] || 0;
            break;
        case 'fiber':
        case 'fibre':
            value = food.nutriments['fiber_100g'] || 0;
            break;
        case 'sugars':
        case 'sugar':
            value = food.nutriments['sugars_100g'] || 0;
            break;
        case 'sodium':
            value = food.nutriments['sodium_100g'] || 0;
            // Convert from g to mg (LLM provides in grams)
            value = value * 1000;
            break;
        case 'calcium':
            value = food.nutriments['calcium_100g'] || 0;
            // Convert from g to mg
            value = value * 1000;
            break;
        case 'iron':
            value = food.nutriments['iron_100g'] || 0;
            // Convert from g to mg
            value = value * 1000;
            break;
        case 'vitamin c':
            value = food.nutriments['vitamin-c_100g'] || 0;
            // Convert from g to mg
            value = value * 1000;
            break;
        case 'vitamin a':
            value = food.nutriments['vitamin-a_100g'] || 0;
            // Convert from g to μg
            value = value * 1000000;
            break;
        case 'potassium':
            value = food.nutriments['potassium_100g'] || 0;
            // Convert from g to mg
            value = value * 1000;
            break;
        default:
            return 0;
    }
    
    // Handle very small values and round appropriately
    value = parseFloat(value);
    if (isNaN(value) || value < 0.1) return 0;
    if (value < 1) return Math.round(value * 10) / 10;
    return Math.round(value * 100) / 100;
}

function getCalories(food) {
    return getNutrient(food, 'calories') || 0;
}

function getIngredients(food) {
    if (food && food.ingredients_text && food.ingredients_text.trim()) {
        return `<div class="ingredient-item">${food.ingredients_text}</div>`;
    }
    
    return '<div class="ingredient-item">Ingredient information not available for this product</div>';
}

// Keep existing BMI and weight calculation functions
function calculateBMI() {
    if (!weightInput || !heightInput || !bmiDisplay) return;
    
    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value);
    
    if (weight && height && weight > 0 && height > 0) {
        const bmi = weight / ((height / 100) ** 2);
        const category = getBMICategory(bmi);
        const recommendation = getBMIRecommendation(category);
        
        if (bmiDisplay) {
            bmiDisplay.innerHTML = `
                <div class="bmi-value">BMI: ${bmi.toFixed(1)}</div>
                <div class="bmi-category ${category.toLowerCase()}">${category}</div>
                <div class="bmi-recommendation">${recommendation}</div>
            `;
        }
    } else {
        if (bmiDisplay) {
            bmiDisplay.innerHTML = '';
        }
    }
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
}

function getBMIRecommendation(category) {
    const recommendations = {
        'Underweight': 'Consider increasing caloric intake with nutrient-dense foods.',
        'Normal': 'Maintain your healthy weight with balanced nutrition.',
        'Overweight': 'Consider reducing caloric intake and increasing physical activity.',
        'Obese': 'Consult healthcare provider for personalized weight management plan.'
    };
    return recommendations[category] || '';
}

function getUserProfile() {
    return {
        weight: weightInput && weightInput.value ? parseFloat(weightInput.value) : null,
        height: heightInput && heightInput.value ? parseFloat(heightInput.value) : null,
        age: ageInput && ageInput.value ? parseInt(ageInput.value) : null,
        gender: genderSelect && genderSelect.value ? genderSelect.value : null,
        activity: activitySelect && activitySelect.value ? activitySelect.value : null
    };
}

function calculateDailyCalories(profile) {
    if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
        return 2000;
    }
    
    let bmr;
    if (profile.gender === 'male') {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }
    
    const activityMultipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    };
    
    const multiplier = activityMultipliers[profile.activity] || 1.55;
    return Math.round(bmr * multiplier);
}

function getPersonalizedWeightImpact(calories, userProfile) {
    const caloriesPerKg = 7700;
    let weightChange = calories / caloriesPerKg;
    
    if (userProfile.weight && userProfile.height && userProfile.age) {
        const dailyNeeds = calculateDailyCalories(userProfile);
        const metabolicFactor = dailyNeeds / 2000;
        weightChange = weightChange / metabolicFactor;
    }
    
    return Math.abs(weightChange);
}

// Remaining comparison and utility functions...
function showComparison() {
    if (!currentFood || !selectedAlternative) return;

    const originalCal = getCalories(currentFood);
    const altCal = getCalories(selectedAlternative);
    const calorieSavings = originalCal - altCal;

    const userProfile = getUserProfile();
    
    if (comparisonSection) {
        comparisonSection.innerHTML = `
            <h2>AI-Powered Food Comparison</h2>
            
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Nutrient</th>
                        <th class="original-col">${currentFood.product_name || currentFood.brands || 'Original Product'}</th>
                        <th class="alternative-col">${selectedAlternative.product_name || selectedAlternative.brands || 'Alternative Product'}</th>
                        <th>Difference</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Calories</td>
                        <td class="original-col">${originalCal}</td>
                        <td class="alternative-col">${altCal}</td>
                        <td class="${calorieSavings > 0 ? 'positive-highlight' : 'negative-highlight'}">
                            ${calorieSavings > 0 ? '-' : '+'}${Math.abs(calorieSavings)} cal
                        </td>
                    </tr>
                </tbody>
            </table>
            
            ${getDetailedWeightComparison(currentFood, selectedAlternative, userProfile)}
        `;
        
        comparisonSection.style.display = 'block';
    }
}

function getDetailedWeightComparison(originalFood, alternative, userProfile) {
    const originalCal = getCalories(originalFood);
    const altCal = getCalories(alternative);
    
    const periods = ['1 week', '1 month', '3 months', '6 months', '1 year'];
    const multipliers = [7, 30, 90, 180, 365];
    
    let html = `
        <div class="weight-comparison-container">
            <h3>Weight Impact Comparison (Daily Consumption)</h3>
            <p style="text-align: center; margin-bottom: 15px; color: #666;">
                AI-calculated weight impact analysis
            </p>
            <table class="weight-comparison-table">
                <thead>
                    <tr>
                        <th>Time Period</th>
                        <th class="original-col">Original Food</th>
                        <th class="alternative-col">Alternative Food</th>
                        <th>Your Savings</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let yearlyWeightSavings = 0;
    
    for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        const days = multipliers[i];
        
        const originalExcess = Math.max(0, originalCal - (2000 / days));
        const altExcess = Math.max(0, altCal - (2000 / days));
        
        const originalWeight = getPersonalizedWeightImpact(originalExcess * days, userProfile);
        const altWeight = getPersonalizedWeightImpact(altExcess * days, userProfile);
        const weightSavings = originalWeight - altWeight;
        
        if (period === '1 year') {
            yearlyWeightSavings = weightSavings;
        }
        
        const savingsClass = weightSavings > 0.1 ? 'positive-highlight' : 
                           weightSavings < -0.1 ? 'negative-highlight' : '';
        const savingsSign = weightSavings > 0 ? '-' : weightSavings < 0 ? '+' : '';
        
        html += `
            <tr>
                <td><strong>${period} daily</strong></td>
                <td class="original-col">${originalWeight > 0 ? '+' + originalWeight.toFixed(1) + 'kg' : 'No gain'}</td>
                <td class="alternative-col">${altWeight > 0 ? '+' + altWeight.toFixed(1) + 'kg' : 'No gain'}</td>
                <td class="${savingsClass}">
                    ${Math.abs(weightSavings) > 0.1 ? savingsSign + Math.abs(weightSavings).toFixed(1) + 'kg' : 'Same'}
                </td>
            </tr>
        `;
    }
    
    html += `
                </tbody>
            </table>
            <div class="weight-summary">
    `;
    
    if (yearlyWeightSavings > 1) {
        if (comparisonSection) {
            comparisonSection.innerHTML += `<p class="positive-highlight">Excellent choice! You could avoid gaining <strong>${yearlyWeightSavings.toFixed(1)}kg</strong> per year by choosing the AI-recommended alternative daily.</p>`;
        }
    } else if (yearlyWeightSavings > 0.1) {
        if (comparisonSection) {
            comparisonSection.innerHTML += `<p class="positive-highlight">Smart choice! You could save <strong>${yearlyWeightSavings.toFixed(1)}kg</strong> per year with this LLM-suggested alternative.</p>`;
        }
    } else {
        if (comparisonSection) {
            comparisonSection.innerHTML += `<p>Both foods have similar weight impact when consumed daily.</p>`;
        }
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

function toggleIngredients(button) {
    const ingredientsSection = button.closest('.action-buttons').nextElementSibling;
    if (ingredientsSection && ingredientsSection.classList.contains('ingredients-section')) {
        if (ingredientsSection.style.display === 'none') {
            ingredientsSection.style.display = 'block';
            button.textContent = 'Hide Ingredients';
        } else {
            ingredientsSection.style.display = 'none';
            button.textContent = 'See Ingredients';
        }
    }
}

function showError(message) {
    if (error) {
        error.textContent = message;
        error.style.display = 'block';
        setTimeout(() => {
            error.style.display = 'none';
        }, 5000);
    }
}

function hideError() {
    if (error) {
        error.style.display = 'none';
    }
}

function showLoading(show) {
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
} 

// NEW: Authentication and Profile Management Functions

// Check authentication status on page load
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/current_user');
        const data = await response.json();
        
        if (data.success && data.user) {
            currentUser = data.user;
            updateUserInterface();
            loadUserProfile();
        } else {
            updateUserInterface();
        }
    } catch (error) {
        console.log('No active session');
        updateUserInterface();
    }
}

// Update UI based on authentication status
function updateUserInterface() {
    if (currentUser) {
        // User is logged in
        if (userInfo && loginPrompt) {
            userInfo.style.display = 'block';
            loginPrompt.style.display = 'none';
            if (userWelcome) {
                userWelcome.textContent = `Welcome, ${currentUser.username}!`;
            }
        }
        
        if (headerUserInfo && headerUserName) {
            headerUserInfo.style.display = 'flex';
            headerUserName.textContent = currentUser.username;
        }
    } else {
        // User is not logged in
        if (userInfo && loginPrompt) {
            userInfo.style.display = 'none';
            loginPrompt.style.display = 'block';
        }
        
        if (headerUserInfo) {
            headerUserInfo.style.display = 'none';
        }
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = null;
            updateUserInterface();
            showProfileStatus('Logged out successfully', 'success');
            // Clear profile data from form
            if (weightInput) weightInput.value = '';
            if (heightInput) heightInput.value = '';
            if (ageInput) ageInput.value = '';
            if (genderSelect) genderSelect.value = '';
            if (activitySelect) activitySelect.value = '';
            if (bmiDisplay) bmiDisplay.style.display = 'none';
        } else {
            showProfileStatus('Logout failed', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showProfileStatus('Logout failed', 'error');
    }
}

// Load user profile data
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (data.success && data.profile) {
            populateProfileForm(data.profile);
            if (data.profile.weight && data.profile.height) {
                displayBMI(data.profile);
            }
        }
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

// Populate profile form with data from database
function populateProfileForm(profile) {
    if (weightInput && profile.weight) weightInput.value = profile.weight;
    if (heightInput && profile.height) heightInput.value = profile.height;
    if (ageInput && profile.age) ageInput.value = profile.age;
    if (genderSelect && profile.gender) genderSelect.value = profile.gender;
    if (activitySelect && profile.activity_level) activitySelect.value = profile.activity_level;
}

// Save profile to database
async function saveProfile() {
    if (!currentUser) {
        showProfileStatus('Please login to save your profile', 'error');
        return;
    }
    
    const profileData = {
        weight: weightInput?.value ? parseFloat(weightInput.value) : null,
        height: heightInput?.value ? parseFloat(heightInput.value) : null,
        age: ageInput?.value ? parseInt(ageInput.value) : null,
        gender: genderSelect?.value || null,
        activity_level: activitySelect?.value || null
    };
    
    // Filter out empty values
    const cleanedProfile = Object.fromEntries(
        Object.entries(profileData).filter(([key, value]) => value !== null && value !== '')
    );
    
    if (Object.keys(cleanedProfile).length === 0) {
        showProfileStatus('Please fill in at least one profile field', 'error');
        return;
    }
    
    try {
        if (saveProfileBtn) {
            saveProfileBtn.disabled = true;
            saveProfileBtn.textContent = 'Saving...';
        }
        
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cleanedProfile)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showProfileStatus('Profile saved successfully!', 'success');
            if (data.profile.weight && data.profile.height) {
                displayBMI(data.profile);
            }
        } else {
            showProfileStatus(data.error || 'Failed to save profile', 'error');
        }
    } catch (error) {
        console.error('Profile save error:', error);
        showProfileStatus('Failed to save profile', 'error');
    } finally {
        if (saveProfileBtn) {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save Profile';
        }
    }
}

// Display BMI information with database data
function displayBMI(profile) {
    if (bmiDisplay && profile.bmi) {
        bmiDisplay.style.display = 'block';
        
        const category = getBMICategory(profile.bmi);
        const recommendation = getBMIRecommendation(category);  // Pass category string, not BMI number
        
        bmiDisplay.innerHTML = `
            <div class="bmi-info">
                <span class="bmi-label">BMI:</span>
                <span class="bmi-value">${profile.bmi}</span>
                <span class="bmi-category">(${category})</span>
            </div>
            <div class="bmi-recommendation">${recommendation}</div>
            <div class="daily-calories">Daily Calorie Needs: ${profile.daily_calories || 'Not calculated'} cal</div>
        `;
    }
}

// Show profile status message
function showProfileStatus(message, type) {
    if (profileStatus) {
        profileStatus.textContent = message;
        profileStatus.className = `profile-status ${type}`;
        profileStatus.style.display = 'block';
        
        setTimeout(() => {
            profileStatus.style.display = 'none';
        }, 5000);
    }
}

// Add event listeners for authentication
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener('click', logout);
}

if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', saveProfile);
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

        console.log('MindfulBite with authentication initialized'); 