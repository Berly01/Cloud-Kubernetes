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

@app.route('/entries', methods=['GET'])
def get_entries():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = verify_token(token)
    
    if not payload:
        return jsonify({'error': 'No autorizado'}), 401
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute(
            'SELECT id, title, content, date FROM entries WHERE user_id = %s ORDER BY date DESC',
            (payload['user_id'],)
        )
        entries = cursor.fetchall()
        
        for entry in entries:
            entry['date'] = entry['date'].strftime('%Y-%m-%d')
        
        return jsonify(entries), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/entries/date/<date>', methods=['GET'])
def search_by_date(date):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = verify_token(token)
    
    if not payload:
        return jsonify({'error': 'No autorizado'}), 401
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute(
            'SELECT id, title, content, date FROM entries WHERE user_id = %s AND date = %s ORDER BY date DESC',
            (payload['user_id'], date)
        )
        entries = cursor.fetchall()
        
        for entry in entries:
            entry['date'] = entry['date'].strftime('%Y-%m-%d')
        
        return jsonify(entries), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        db.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)