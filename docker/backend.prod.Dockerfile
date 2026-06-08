# Этап 1: Сборка бэкенда (NestJS)
FROM node:22-alpine as build

WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
RUN npm ci

COPY backend/ ./backend/
COPY shared/ ./shared/
RUN npm run build -w backend

# Этап 2: Минимальный production-образ
FROM node:22-alpine

WORKDIR /app

# Копируем package.json и устанавливаем ТОЛЬКО production-зависимости (без dev)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
RUN npm ci --omit=dev

# Копируем скомпилированный код
COPY --from=build /app/backend/dist ./backend/dist

# Настройки для production
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["node", "backend/dist/main"]
