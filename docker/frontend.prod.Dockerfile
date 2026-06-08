# Этап 1: Сборка фронтенда (React + Vite)
FROM node:22-alpine as build

WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
RUN npm ci

COPY frontend/ ./frontend/
COPY shared/ ./shared/
RUN npm run build -w frontend

# Этап 2: Раздача статики через Nginx
FROM nginx:alpine

# Копируем собранные файлы из предыдущего этапа
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Копируем наш кастомный конфиг Nginx
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
