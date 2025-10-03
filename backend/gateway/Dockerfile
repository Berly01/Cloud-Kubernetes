FROM python:3.11-slim

WORKDIR /app

# Copiar requirements.txt desde el contexto (backend/)
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del gateway
COPY gateway/app.py .

# Exponer puerto
EXPOSE 5000

# Variable de entorno para Flask
ENV FLASK_APP=app.py

# Comando para ejecutar
CMD ["python", "app.py"]