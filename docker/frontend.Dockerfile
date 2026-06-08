FROM node:22-alpine

WORKDIR /app

# Копируем package-файлы и устанавливаем зависимости
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
RUN npm install

# Копируем исходники
COPY frontend/ ./frontend/
COPY shared/ ./shared/

# Vite dev-сервер
EXPOSE 3000
CMD ["npm", "run", "dev", "-w", "frontend", "--", "--host", "0.0.0.0"]
