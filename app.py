from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)

# USDA API configuration
USDA_API_KEY = 'jayygOe1dwH4efLj2H7BtSqesyZhgDhDMMPBeZkv'
USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search'

#Main route for the HTML page
@app.route('/')
def index():
    return render_template('index.html')
    
#API proxy route - handles food searches
@app.route('/api/usda_search')
def usda_search():
    """Search USDA FoodData Central API"""
    query = request.args.get('query', '')
    page_size = request.args.get('pageSize', 10)
    
    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400
    
    # USDA API parameters
    params = {
        'api_key': USDA_API_KEY,
        'query': query,
        'pageSize': page_size,
        'dataType': ['Foundation', 'SR Legacy'],  # Focus on reliable data
        'sortBy': 'dataType.keyword',
        'sortOrder': 'asc'
    }
    
    try:
        response = requests.get(USDA_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        print(f"USDA API error: {e}")
        return jsonify({'error': f'Failed to fetch data: {str(e)}'}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True) 