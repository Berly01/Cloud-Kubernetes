from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import jwt
import os

app = Flask(__name__)
CORS(app)

SECRET_KEY = os.environ.get('SECRET_KEY', 'tu_clave_secreta_super_segura_123')

# URLs de los microservicios
# URLs de los microservicios
LOGIN_SERVICE = os.environ.get('LOGIN_SERVICE', 'http://localhost:5001')
ENTRY_SERVICE = os.environ.get('ENTRY_SERVICE', 'http://localhost:5002')
SEARCH_SERVICE = os.environ.get('SEARCH_SERVICE', 'http://localhost:5003')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except:
        return None

# === LOGIN SERVICE ROUTES ===
@app.route('/api/login/register', methods=['POST'])
def register():
    response = requests.post(f'{LOGIN_SERVICE}/register', json=request.json)
    return jsonify(response.json()), response.status_code

@app.route('/api/login/login', methods=['POST'])
def login():
    response = requests.post(f'{LOGIN_SERVICE}/login', json=request.json)
    return jsonify(response.json()), response.status_code

# === ENTRY SERVICE ROUTES (WRITE) ===
@app.route('/api/entry/entries', methods=['POST'])
def create_entry():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token):
        return jsonify({'error': 'Token inválido'}), 401
    
    response = requests.post(
        f'{ENTRY_SERVICE}/entries',
        json=request.json,
        headers={'Authorization': f'Bearer {token}'}
    )
    return jsonify(response.json()), response.status_code

@app.route('/api/entry/entries/<int:entry_id>', methods=['PUT'])
def update_entry(entry_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token):
        return jsonify({'error': 'Token inválido'}), 401
    
    response = requests.put(
        f'{ENTRY_SERVICE}/entries/{entry_id}',
        json=request.json,
        headers={'Authorization': f'Bearer {token}'}
    )
    return jsonify(response.json()), response.status_code

@app.route('/api/entry/entries/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token):
        return jsonify({'error': 'Token inválido'}), 401
    
    response = requests.delete(
        f'{ENTRY_SERVICE}/entries/{entry_id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    return jsonify(response.json()), response.status_code

# === SEARCH SERVICE ROUTES (READ) ===
@app.route('/api/search/entries', methods=['GET'])
def get_entries():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token):
        return jsonify({'error': 'Token inválido'}), 401
    
    response = requests.get(
        f'{SEARCH_SERVICE}/entries',
        headers={'Authorization': f'Bearer {token}'}
    )
    return jsonify(response.json()), response.status_code

@app.route('/api/search/entries/date/<date>', methods=['GET'])
def search_by_date(date):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token):
        return jsonify({'error': 'Token inválido'}), 401
    
    response = requests.get(
        f'{SEARCH_SERVICE}/entries/date/{date}',
        headers={'Authorization': f'Bearer {token}'}
    )
    return jsonify(response.json()), response.status_code

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)