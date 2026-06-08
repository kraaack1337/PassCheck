# Этап 1: Сборка фронтенда (React + Vite)
FROM node:22-alpine as build

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Этап 2: Раздача статики через Nginx
FROM nginx:alpine

# Копируем собранные файлы из предыдущего этапа
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем наш кастомный конфиг Nginx
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
