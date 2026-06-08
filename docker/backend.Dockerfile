FROM node:22-alpine

WORKDIR /app

# Копируем package-файлы и устанавливаем зависимости
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
RUN npm install

# Копируем исходники
COPY backend/ ./backend/
COPY shared/ ./shared/

# NestJS dev-сервер
EXPOSE 3001
CMD ["npm", "run", "start:dev", "-w", "backend"]
