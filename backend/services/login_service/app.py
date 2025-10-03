from flask import Flask, request, jsonify
import mysql.connector
import bcrypt
import jwt
import os
from datetime import datetime, timedelta

app = Flask(__name__)

SECRET_KEY = os.environ.get('SECRET_KEY', 'tu_clave_secreta_super_segura_123')

def get_db():
    return mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=os.environ.get('DB_NAME', 'diary_db')
    )

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Usuario y contraseña requeridos'}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cursor.fetchone():
            return jsonify({'error': 'Usuario ya existe'}), 400
        
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        cursor.execute('INSERT INTO users (username, password) VALUES (%s, %s)', 
                      (username, hashed))
        db.commit()
        
        user_id = cursor.lastrowid
        token = jwt.encode({
            'user_id': user_id,
            'username': username,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({'token': token, 'username': username}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Usuario y contraseña requeridos'}), 400
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        token = jwt.encode({
            'user_id': user['id'],
            'username': user['username'],
            'exp': datetime.utcnow() + timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({'token': token, 'username': user['username']}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        db.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)