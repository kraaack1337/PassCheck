FROM node:22-alpine

WORKDIR /app

# Копируем package-файлы и устанавливаем зависимости
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Копируем исходники
COPY frontend/ ./

# Vite dev-сервер
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
