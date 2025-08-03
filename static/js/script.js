// MindfulBite - Clean JavaScript for Food Search and Alternatives

// Global state
let currentFood = null;
let currentAlternatives = [];
let selectedAlternative = null;

// DOM elements
const foodInput = document.getElementById('foodInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const originalFoodCard = document.getElementById('originalFoodCard');
const alternativesSection = document.getElementById('alternativesSection');
const alternativeButtons = document.getElementById('alternativeButtons');
const alternativeDetails = document.getElementById('alternativeDetails');
const comparisonSection = document.getElementById('comparisonSection');
const loading = document.getElementById('loading');
const error = document.getElementById('error');

// Profile elements
const weightInput = document.getElementById('weight');
const heightInput = document.getElementById('height');
const ageInput = document.getElementById('age');
const genderSelect = document.getElementById('gender');
const activitySelect = document.getElementById('activity');
const bmiDisplay = document.getElementById('bmiDisplay');

// Curated alternatives for common foods
const curatedAlternatives = {
    'pizza': ['cauliflower pizza', 'zucchini pizza', 'portobello pizza', 'whole wheat pizza'],
    'burger': ['turkey burger', 'veggie burger', 'portobello burger', 'chicken burger'],
    'fries': ['sweet potato fries', 'baked potato wedges', 'air fryer fries', 'zucchini fries'],
    'soda': ['sparkling water', 'kombucha', 'herbal tea', 'fruit infused water'],
    'ice cream': ['frozen yogurt', 'sorbet', 'banana ice cream', 'coconut ice cream'],
    'chips': ['baked chips', 'vegetable chips', 'popcorn', 'rice cakes'],
    'pasta': ['zucchini noodles', 'shirataki noodles', 'whole wheat pasta', 'lentil pasta'],
    'bread': ['whole grain bread', 'cauliflower bread', 'lettuce wraps', 'sweet potato slices'],
    'rice': ['cauliflower rice', 'quinoa', 'brown rice', 'wild rice'],
    'chocolate': ['dark chocolate', 'cacao nibs', 'carob', 'fruit']
};

// Landing page elements
const getStartedBtn = document.getElementById('getStartedBtn');
const landingPage = document.getElementById('landingPage');
const mainApp = document.getElementById('mainApp');

// Event listeners
getStartedBtn.addEventListener('click', () => {
    landingPage.style.display = 'none';
    mainApp.style.display = 'block';
});

searchBtn.addEventListener('click', searchFood);
foodInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchFood();
    });

// Profile event listeners for BMI calculation
[weightInput, heightInput].forEach(input => {
    input.addEventListener('input', calculateBMI);
    });
    
// Event delegation for dynamically created buttons
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

// Main search function
async function searchFood() {
    const query = foodInput.value.trim();
    if (!query) {
        showError('Please enter a food item to search');
        return;
    }
    
    showLoading(true);
    hideError();
    
    try {
        // Search for main food
        const response = await fetch(`/api/usda_search?query=${encodeURIComponent(query)}&pageSize=5`);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (!data.foods || data.foods.length === 0) {
            showError('No foods found. Try searching for common foods like "pizza", "burger", or "chicken".');
            return;
        }

        // Use the first result as the main food
        currentFood = data.foods[0];
        displayOriginalFood(currentFood);

        // Search for alternatives
        await findAlternatives(query);

        // Show results
        resultsSection.style.display = 'block';
        
    } catch (err) {
        console.error('Search error:', err);
        showError(`Error: ${err.message}`);
    } finally {
        showLoading(false);
    }
}

// Find healthier alternatives using hybrid approach (curated + category filtering)
async function findAlternatives(originalQuery) {
    console.log(`🔍 Finding alternatives for: ${originalQuery}`);
    console.log(`📋 Original food category: ${currentFood.foodCategory || 'Unknown'}`);
    
    const alternatives = [];
    
    // Step 1: Try curated alternatives for common foods
    const lowerQuery = originalQuery.toLowerCase();
    let foundCurated = false;
    
    for (const [key, alts] of Object.entries(curatedAlternatives)) {
        if (lowerQuery.includes(key)) {
            console.log(`✅ Found curated alternatives for "${key}":`, alts);
            foundCurated = true;
            
            // Search for each curated alternative
            for (const alt of alts) {
                try {
                    const response = await fetch(`/api/usda_search?query=${encodeURIComponent(alt)}&pageSize=3`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.foods && data.foods.length > 0) {
                            const filtered = data.foods.filter(food => 
                                food.fdcId !== currentFood.fdcId &&
                                getCalories(food) > 0 &&
                                getCalories(food) < getCalories(currentFood)
                            );
                            alternatives.push(...filtered);
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to search for curated term ${alt}:`, err);
                }
            }
            break;
        }
    }
    
    // Step 2: If we found curated alternatives, use them
    if (foundCurated && alternatives.length > 0) {
        const uniqueAlternatives = alternatives.filter((food, index, arr) => 
            arr.findIndex(f => f.fdcId === food.fdcId) === index
        ).slice(0, 6);
        
        console.log(`🎉 Using ${uniqueAlternatives.length} curated alternatives`);
        currentAlternatives = uniqueAlternatives;
        displayAlternatives(uniqueAlternatives);
        return;
    }
    
    // Step 3: For non-curated foods, use category-based filtering
    console.log(`🔍 No curated alternatives found, trying category-based search...`);
    
    if (currentFood.foodCategory) {
        try {
            const response = await fetch(`/api/usda_search?query=${encodeURIComponent(currentFood.foodCategory)}&pageSize=10`);
            if (response.ok) {
                const data = await response.json();
                if (data.foods && data.foods.length > 0) {
                    const filtered = data.foods.filter(food => 
                        food.fdcId !== currentFood.fdcId &&
                        getCalories(food) > 0 &&
                        getCalories(food) < getCalories(currentFood) &&
                        isSameCategoryOrSimilar(currentFood, food) &&
                        hasIngredientOverlap(currentFood, food)
                    );
                    alternatives.push(...filtered);
                }
            }
        } catch (err) {
            console.warn(`Failed to search by category:`, err);
        }
    }
    
    // Step 4: Display results or show no alternatives message
    const uniqueAlternatives = alternatives.filter((food, index, arr) => 
        arr.findIndex(f => f.fdcId === food.fdcId) === index
    ).slice(0, 6);
    
    if (uniqueAlternatives.length > 0) {
        console.log(`📋 Found ${uniqueAlternatives.length} category-based alternatives`);
        currentAlternatives = uniqueAlternatives;
        displayAlternatives(uniqueAlternatives);
    } else {
        console.log(`❌ No suitable alternatives found`);
        alternativesSection.style.display = 'block';
        alternativeButtons.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #fff3cd; border-radius: 10px; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin-bottom: 10px;">No healthier alternatives found</h4>
                <p style="color: #856404; margin: 0;">
                    We couldn't find suitable healthier alternatives for "${currentFood.description}" that match the same food category.
                </p>
            </div>
        `;
        currentAlternatives = [];
    }
}

// Check if two foods are in the same category or similar
function isSameCategoryOrSimilar(originalFood, alternativeFood) {
    // Check exact category match
    if (originalFood.foodCategory && alternativeFood.foodCategory) {
        if (originalFood.foodCategory === alternativeFood.foodCategory) {
            console.log(`✅ Same category: ${originalFood.foodCategory}`);
            return true;
        }
    }
    
    // Check for similar food types
    const originalDesc = originalFood.description.toLowerCase();
    const altDesc = alternativeFood.description.toLowerCase();
    
    const foodTypes = ['pizza', 'burger', 'sandwich', 'chicken', 'beef', 'pasta', 'bread', 'cheese', 'milk', 'yogurt'];
    
    for (const type of foodTypes) {
        if (originalDesc.includes(type) && altDesc.includes(type)) {
            console.log(`✅ Same food type: ${type}`);
            return true;
        }
    }
    
    console.log(`❌ Different category/type: "${originalDesc}" vs "${altDesc}"`);
    return false;
}

// Check if two foods have ingredient overlap
function hasIngredientOverlap(originalFood, alternativeFood) {
    const originalDesc = originalFood.description.toLowerCase();
    const altDesc = alternativeFood.description.toLowerCase();
    
    // Extract meaningful words from descriptions
    const originalWords = originalDesc.split(/[\s,]+/).filter(word => 
        word.length > 3 && 
        !['with', 'and', 'the', 'from', 'for'].includes(word)
    );
    
    const altWords = altDesc.split(/[\s,]+/).filter(word => 
        word.length > 3 && 
        !['with', 'and', 'the', 'from', 'for'].includes(word)
    );
    
    // Find common words
    const commonWords = originalWords.filter(word => altWords.includes(word));
    
    // Need at least 1 common meaningful word
    if (commonWords.length >= 1) {
        console.log(`✅ Ingredient overlap: ${commonWords.join(', ')}`);
        return true;
    }
    
    console.log(`❌ No ingredient overlap: "${originalDesc}" vs "${altDesc}"`);
    return false;
}

// Display the original food
function displayOriginalFood(food) {
    const calories = getCalories(food);
    const protein = getNutrient(food, 'Protein');
    const carbs = getNutrient(food, 'Carbohydrate');
    const fat = getNutrient(food, 'Total lipid');
    const fiber = getNutrient(food, 'Fiber');
    const sugar = getNutrient(food, 'Sugars');
    const sodium = getNutrient(food, 'Sodium');
    const calcium = getNutrient(food, 'Calcium');
    const iron = getNutrient(food, 'Iron');
    const vitaminC = getNutrient(food, 'Vitamin C');
    
    // Calculate weight impact for original food
    const userProfile = getUserProfile();
    const dailyCalories = calculateDailyCalories(userProfile);
    
    let weightImpactSection = '';
    if (calories > 0) {
        // Calculate how this food impacts weight if eaten regularly
        const weeklyCalories = calories * 7; // If eaten daily for a week
        const monthlyCalories = calories * 30; // If eaten daily for a month
        
        const weeklyWeightKg = (weeklyCalories / 7700);
        const monthlyWeightKg = (monthlyCalories / 7700);
        
        // Adjust for user profile if available
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

    originalFoodCard.innerHTML = `
        <h3>${food.description}</h3>
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
        </div>
        ${weightImpactSection}
    `;
}

// Display alternative buttons
function displayAlternatives(alternatives) {
    if (alternatives.length === 0) {
        alternativesSection.style.display = 'none';
        showError('No healthier alternatives found for this food.');
        return;
    }
    
    alternativeButtons.innerHTML = alternatives.map((food, index) => {
        const calories = getCalories(food);
        const originalCalories = getCalories(currentFood);
        const savings = originalCalories - calories;
        
        return `
            <button class="alternative-btn" data-index="${index}">
                <div>${food.description}</div>
                <small>${calories} cal (${savings > 0 ? '-' + savings : '+' + Math.abs(savings)} cal)</small>
                </button>
        `;
    }).join('');

    alternativesSection.style.display = 'block';
}

// Show details of selected alternative
function showAlternativeDetails(index) {
    selectedAlternative = currentAlternatives[index];
    if (!selectedAlternative) return;

    const calories = getCalories(selectedAlternative);
    const protein = getNutrient(selectedAlternative, 'Protein');
    const carbs = getNutrient(selectedAlternative, 'Carbohydrate');
    const fat = getNutrient(selectedAlternative, 'Total lipid');
    const fiber = getNutrient(selectedAlternative, 'Fiber');
    const sugar = getNutrient(selectedAlternative, 'Sugars');
    const sodium = getNutrient(selectedAlternative, 'Sodium');
    const calcium = getNutrient(selectedAlternative, 'Calcium');
    const iron = getNutrient(selectedAlternative, 'Iron');
    const vitaminC = getNutrient(selectedAlternative, 'Vitamin C');
    const vitaminA = getNutrient(selectedAlternative, 'Vitamin A');
    const potassium = getNutrient(selectedAlternative, 'Potassium');

    alternativeDetails.innerHTML = `
        <h3>${selectedAlternative.description}</h3>
        
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

// Show side-by-side comparison
function showComparison() {
    if (!currentFood || !selectedAlternative) return;

    const originalCal = getCalories(currentFood);
    const altCal = getCalories(selectedAlternative);
    const calorieSavings = originalCal - altCal;

    // Calculate personalized weight impact
    const userProfile = getUserProfile();
    const weightImpactKg = getPersonalizedWeightImpact(calorieSavings, userProfile);
    const periods = ['1 week', '1 month', '3 months', '6 months', '1 year'];
    const multipliers = [1, 4.3, 13, 26, 52];

    comparisonSection.innerHTML = `
        <h2>Food Comparison</h2>
        
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Nutrient</th>
                    <th class="original-col">${currentFood.description}</th>
                    <th class="alternative-col">${selectedAlternative.description}</th>
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
                <tr>
                    <td>Protein</td>
                    <td class="original-col">${getNutrient(currentFood, 'Protein')}g</td>
                    <td class="alternative-col">${getNutrient(selectedAlternative, 'Protein')}g</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Carbs</td>
                    <td class="original-col">${getNutrient(currentFood, 'Carbohydrate')}g</td>
                    <td class="alternative-col">${getNutrient(selectedAlternative, 'Carbohydrate')}g</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Fat</td>
                    <td class="original-col">${getNutrient(currentFood, 'Total lipid')}g</td>
                    <td class="alternative-col">${getNutrient(selectedAlternative, 'Total lipid')}g</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Fiber</td>
                    <td class="original-col">${getNutrient(currentFood, 'Fiber')}g</td>
                    <td class="alternative-col">${getNutrient(selectedAlternative, 'Fiber')}g</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Sugar</td>
                    <td class="original-col">${getNutrient(currentFood, 'Sugars')}g</td>
                    <td class="alternative-col">${getNutrient(selectedAlternative, 'Sugars')}g</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Sodium</td>
                    <td class="original-col">${getNutrient(currentFood, 'Sodium')}mg</td>
                    <td class="alternative-col">${getNutrient(selectedAlternative, 'Sodium')}mg</td>
                    <td>-</td>
                </tr>
            </tbody>
        </table>

        ${getAlternativeWeightImpact(selectedAlternative)}
    `;

    comparisonSection.style.display = 'block';
}

// Toggle ingredients display
function toggleIngredients(button) {
    const ingredientsSection = button.parentElement.nextElementSibling;
    if (ingredientsSection.style.display === 'none') {
        ingredientsSection.style.display = 'block';
        button.textContent = 'Hide Ingredients';
    } else {
        ingredientsSection.style.display = 'none';
        button.textContent = 'See Ingredients';
    }
}

// Helper functions
function getCalories(food) {
    return getNutrient(food, 'Energy') || 0;
}

function getNutrient(food, nutrientName) {
    if (!food.foodNutrients) return 0;
    
    // More comprehensive nutrient name matching
    const nutrient = food.foodNutrients.find(n => {
        if (!n.nutrientName) return false;
        const name = n.nutrientName.toLowerCase();
        const searchName = nutrientName.toLowerCase();
        
        // Direct matches
        if (name.includes(searchName)) return true;
        
        // Special cases for better matching
        if (searchName === 'energy' && (name.includes('energy') || name.includes('calorie'))) return true;
        if (searchName === 'protein' && name.includes('protein')) return true;
        if (searchName === 'carbohydrate' && (name.includes('carbohydrate') || name.includes('carb'))) return true;
        if (searchName === 'total lipid' && (name.includes('total lipid') || name.includes('fat, total'))) return true;
        if (searchName === 'fiber' && (name.includes('fiber') || name.includes('fibre'))) return true;
        if (searchName === 'sugars' && (name.includes('sugars') || name.includes('sugar'))) return true;
        if (searchName === 'sodium' && name.includes('sodium')) return true;
        if (searchName === 'calcium' && name.includes('calcium')) return true;
        if (searchName === 'iron' && name.includes('iron')) return true;
        if (searchName === 'vitamin c' && (name.includes('vitamin c') || name.includes('ascorbic'))) return true;
        if (searchName === 'vitamin a' && name.includes('vitamin a')) return true;
        if (searchName === 'potassium' && name.includes('potassium')) return true;
        
        return false;
    });
    
    if (nutrient && nutrient.value !== undefined && nutrient.value !== null) {
        // Handle very small values and round appropriately
        const value = parseFloat(nutrient.value);
        if (value < 0.1) return 0;
        if (value < 1) return Math.round(value * 10) / 10; // One decimal place
        return Math.round(value);
    }
    
    return 0;
}

function getIngredients(food) {
    if (food.ingredients) {
        return `<div class="ingredient-item">${food.ingredients}</div>`;
    }
    
    if (food.foodNutrients && food.foodNutrients.length > 0) {
        return '<div class="ingredient-item">Detailed ingredient information not available</div>';
    }
    
    return '<div class="ingredient-item">No ingredient information available</div>';
}

function getAlternativeWeightImpact(alternative) {
    const calories = getCalories(alternative);
    const originalCalories = getCalories(currentFood);
    const calorieSavings = originalCalories - calories;
    
    const userProfile = getUserProfile();
    
    // Calculate original food impact (daily consumption)
    const originalWeeklyWeight = getPersonalizedWeightImpact(originalCalories * 7, userProfile);
    const originalMonthlyWeight = getPersonalizedWeightImpact(originalCalories * 30, userProfile);
    
    // Calculate alternative food impact (daily consumption)
    const altWeeklyWeight = getPersonalizedWeightImpact(calories * 7, userProfile);
    const altMonthlyWeight = getPersonalizedWeightImpact(calories * 30, userProfile);
    
    // Calculate savings
    const weeklyImpact = getPersonalizedWeightImpact(calorieSavings * 7, userProfile);
    const monthlyImpact = getPersonalizedWeightImpact(calorieSavings * 30, userProfile);
    
    const impactType = calorieSavings > 0 ? 'loss' : 'gain';
    const impactClass = calorieSavings > 0 ? 'positive-highlight' : 'negative-highlight';
    const savingsSign = calorieSavings > 0 ? '-' : '+';
    
    return `
        <div class="timeline-section" style="margin-top: 20px;">
            <h4 style="color: #333; margin-bottom: 15px; text-align: center;">Weight Impact Comparison</h4>
            <p style="text-align: center; margin-bottom: 15px; color: #666; font-size: 0.9rem;">
                Daily consumption impact comparison
                ${userProfile.weight ? ' (personalized for your profile)' : ''}
            </p>
            
            <!-- Original Food Impact -->
            <div style="margin-bottom: 20px;">
                <h5 style="color: #333; margin-bottom: 10px; text-align: center; font-size: 1rem;">
                    Original: ${currentFood.description}
                </h5>
                <div class="timeline-grid">
                    <div class="timeline-item">
                        <div class="timeline-period">1 week daily</div>
                        <div class="timeline-weight negative-highlight">
                            +${originalWeeklyWeight.toFixed(1)}kg
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-period">1 month daily</div>
                        <div class="timeline-weight negative-highlight">
                            +${originalMonthlyWeight.toFixed(1)}kg
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-period">Calories</div>
                        <div class="timeline-weight" style="color: #666;">
                            ${originalCalories} cal
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Alternative Food Impact -->
            <div style="margin-bottom: 20px;">
                <h5 style="color: #333; margin-bottom: 10px; text-align: center; font-size: 1rem;">
                    Alternative: ${alternative.description}
                </h5>
                <div class="timeline-grid">
                    <div class="timeline-item">
                        <div class="timeline-period">1 week daily</div>
                        <div class="timeline-weight negative-highlight">
                            +${altWeeklyWeight.toFixed(1)}kg
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-period">1 month daily</div>
                        <div class="timeline-weight negative-highlight">
                            +${altMonthlyWeight.toFixed(1)}kg
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-period">Calories</div>
                        <div class="timeline-weight" style="color: #666;">
                            ${calories} cal
                        </div>
                    </div>
                </div>
            </div>
            
            ${calorieSavings !== 0 ? `
                         <!-- Savings Summary -->
             <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; border-left: 4px solid ${calorieSavings > 0 ? '#28a745' : '#dc3545'};">
                 <h5 style="color: #333; margin-bottom: 10px; text-align: center; font-size: 1rem;">
                     Your Savings by Switching
                 </h5>
                <div class="timeline-grid">
                    <div class="timeline-item">
                        <div class="timeline-period">1 week daily</div>
                        <div class="timeline-weight ${impactClass}">
                            ${savingsSign}${Math.abs(weeklyImpact).toFixed(1)}kg
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-period">1 month daily</div>
                        <div class="timeline-weight ${impactClass}">
                            ${savingsSign}${Math.abs(monthlyImpact).toFixed(1)}kg
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-period">Calorie savings</div>
                        <div class="timeline-weight ${impactClass}">
                            ${savingsSign}${Math.abs(calorieSavings)} cal
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    setTimeout(() => {
        error.style.display = 'none';
    }, 5000);
}

function hideError() {
    error.style.display = 'none';
}

// BMI and Profile Functions
function calculateBMI() {
    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value);
    
    if (weight && height && weight > 0 && height > 0) {
        const bmi = weight / ((height / 100) ** 2);
        const category = getBMICategory(bmi);
        const recommendation = getBMIRecommendation(category);
        
        bmiDisplay.innerHTML = `
            <div class="bmi-value">BMI: ${bmi.toFixed(1)}</div>
            <div class="bmi-category ${category.toLowerCase()}">${category}</div>
            <div class="bmi-recommendation">${recommendation}</div>
        `;
        bmiDisplay.style.display = 'block';
    } else {
        bmiDisplay.style.display = 'none';
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
        'Underweight': 'Consider gaining healthy weight through balanced nutrition',
        'Normal': 'Great! Maintain your healthy weight with balanced eating',
        'Overweight': 'Consider healthier food choices to reach optimal weight',
        'Obese': 'Focus on healthier alternatives to support weight management'
    };
    return recommendations[category] || '';
}

function getUserProfile() {
    return {
        weight: parseFloat(weightInput.value) || null,
        height: parseFloat(heightInput.value) || null,
        age: parseInt(ageInput.value) || null,
        gender: genderSelect.value || null,
        activity: activitySelect.value || 'moderate'
    };
}

function calculateDailyCalories(profile) {
    if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
        return null;
    }
    
    // Mifflin-St Jeor Equation
    let bmr;
    if (profile.gender === 'male') {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }
    
    // Activity multipliers
    const activityMultipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    };
    
    return bmr * (activityMultipliers[profile.activity] || 1.55);
}

function getPersonalizedWeightImpact(calorieSavings, userProfile) {
    if (!userProfile.weight) {
        // Use generic calculation
        return calorieSavings / 7700; // 7700 calories = 1 kg
    }
    
    // More personalized calculation based on user's daily calorie needs
    const dailyCalories = calculateDailyCalories(userProfile);
    if (dailyCalories) {
        // Consider user's daily calorie needs for more accurate estimation
        const percentageOfDailyCalories = calorieSavings / dailyCalories;
        const baseWeightChange = calorieSavings / 7700;
        
        // Adjust based on user's current weight (larger people lose weight faster initially)
        const weightFactor = userProfile.weight / 70; // 70kg as baseline
        return baseWeightChange * weightFactor;
    }
    
    return calorieSavings / 7700;
} 