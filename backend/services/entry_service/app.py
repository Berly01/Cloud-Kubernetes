from flask import Flask, request, jsonify
import mysql.connector
import jwt
import os

app = Flask(__name__)

SECRET_KEY = os.environ.get('SECRET_KEY', 'tu_clave_secreta_super_segura_123')

def get_db():
    return mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=os.environ.get('DB_NAME', 'diary_db')
    )

def verify_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except:
        return None

@app.route('/entries', methods=['POST'])
def create_entry():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = verify_token(token)
    
    if not payload:
        return jsonify({'error': 'No autorizado'}), 401
    
    data = request.json
    title = data.get('title')
    content = data.get('content')
    date = data.get('date')
    
    if not title or not content or not date:
        return jsonify({'error': 'Datos incompletos'}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute(
            'INSERT INTO entries (user_id, title, content, date) VALUES (%s, %s, %s, %s)',
            (payload['user_id'], title, content, date)
        )
        db.commit()
        
        return jsonify({'message': 'Entrada creada', 'id': cursor.lastrowid}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/entries/<int:entry_id>', methods=['PUT'])
def update_entry(entry_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = verify_token(token)
    
    if not payload:
        return jsonify({'error': 'No autorizado'}), 401
    
    data = request.json
    title = data.get('title')
    content = data.get('content')
    date = data.get('date')
    
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('SELECT user_id FROM entries WHERE id = %s', (entry_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Entrada no encontrada'}), 404
        
        if result[0] != payload['user_id']:
            return jsonify({'error': 'No autorizado'}), 403
        
        cursor.execute(
            'UPDATE entries SET title = %s, content = %s, date = %s WHERE id = %s',
            (title, content, date, entry_id)
        )
        db.commit()
        
        return jsonify({'message': 'Entrada actualizada'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/entries/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = verify_token(token)
    
    if not payload:
        return jsonify({'error': 'No autorizado'}), 401
    
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('SELECT user_id FROM entries WHERE id = %s', (entry_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Entrada no encontrada'}), 404
        
        if result[0] != payload['user_id']:
            return jsonify({'error': 'No autorizado'}), 403
        
        cursor.execute('DELETE FROM entries WHERE id = %s', (entry_id,))
        db.commit()
        
        return jsonify({'message': 'Entrada eliminada'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        db.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)