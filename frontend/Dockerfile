# Etapa 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias con npm install
RUN npm install

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar build al directorio de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Comando por defecto de Nginx
CMD ["nginx", "-g", "daemon off;"]