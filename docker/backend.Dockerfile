FROM node:22-alpine

WORKDIR /app

# Копируем package-файлы и устанавливаем зависимости
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Копируем исходники
COPY backend/ ./backend/
COPY shared/ ./shared/

# NestJS dev-сервер
EXPOSE 3001
CMD ["npm", "run", "start:dev", "--prefix", "backend"]
