# 🛡️ PassCheck — Password Analyzer & Leak Checker

Современное веб-приложение для анализа надежности паролей и проверки на наличие в базах утечек.

## ✨ Основные возможности

- **Локальный анализ** — проверка сложности пароля (энтропия, время взлома) целиком в браузере через [zxcvbn](https://github.com/zxcvbn-ts/zxcvbn)
- **k-Anonymity** — проверка утечек через API [HaveIBeenPwned](https://haveibeenpwned.com/API/v3#PwnedPasswords) без отправки пароля на сервер
- **Генератор паролей** — создание криптографически стойких паролей (`crypto.getRandomValues`)
- **Безопасность** — Helmet, Rate-limiting (10 req/s/IP), строгий CORS

## 🛠 Технологии

| Слой       | Стек                                              |
|------------|---------------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS 4        |
| Backend    | NestJS 11, Axios (с retry), Helmet, Throttler     |
| DevOps     | Docker, Docker Compose, Nginx                     |

---

## 📂 Структура проекта

```
.
├── frontend/                 # React/Vite приложение
│   ├── src/
│   │   ├── components/       # UI-компоненты (PasswordInput, StrengthMeter, ...)
│   │   ├── utils/            # Бизнес-логика (passwordAnalyzer, leakChecker)
│   │   ├── types.ts          # TypeScript-типы и интерфейсы
│   │   ├── App.tsx           # Главный компонент
│   │   ├── main.tsx          # Точка входа React
│   │   └── index.css         # Дизайн-система (Tailwind + кастомные стили)
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig*.json
│
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── health/           # Модуль healthcheck (GET /api/v1/health)
│   │   ├── leaks/            # Модуль проверки утечек (GET /api/v1/leaks/:prefix)
│   │   │   ├── dto/          # DTO-валидация входных параметров
│   │   │   ├── leaks.controller.ts
│   │   │   ├── leaks.service.ts
│   │   │   └── leaks.module.ts
│   │   ├── app.module.ts     # Корневой модуль (Throttler, LeaksModule, Health)
│   │   └── main.ts           # Точка входа (Helmet, CORS, ValidationPipe)
│   ├── test/                 # E2E-тесты
│   ├── package.json
│   └── tsconfig*.json
│
├── docker/                   # Docker-конфигурация
│   ├── backend.Dockerfile        # Backend dev
│   ├── backend.prod.Dockerfile   # Backend production (multi-stage)
│   ├── frontend.Dockerfile       # Frontend dev
│   ├── frontend.prod.Dockerfile  # Frontend production (multi-stage → Nginx)
│   └── nginx/
│       └── nginx.conf            # Nginx: раздача статики + проксирование /api
│
├── docker-compose.yml        # Dev-режим (hot-reload)
├── docker-compose.prod.yml   # Production-режим (Nginx + NestJS)
├── ARCHITECTURE.md           # Подробная техническая документация
└── README.md                 # ← вы здесь
```

---

## 🚀 Быстрый старт

### Требования

- **Docker Desktop** (рекомендуется) или **Node.js 22+**
- **Git** (для Windows: `git config --global core.autocrlf true`)

### Режим разработки (Docker)

```bash
git clone https://github.com/kraaack1337/PassCheck.git
cd PassCheck
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api/v1/health

Hot-reload включен — при сохранении кода страница обновляется автоматически.

### Режим разработки (без Docker)

**Терминал 1 — Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Терминал 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Приложение доступно на http://localhost (порт 80).

---

## 🔐 Как работает проверка утечек (k-Anonymity)

1. Пароль хешируется **SHA-1** прямо в браузере
2. На бэкенд отправляются только **первые 5 символов** хеша (prefix)
3. Бэкенд запрашивает [HIBP Range API](https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange) и возвращает список суффиксов
4. Браузер ищет совпадение локально

**Сервер никогда не знает ни пароль, ни полный хеш.**

## 📖 Документация

Подробная архитектура, схемы безопасности и настройки деплоя описаны в [ARCHITECTURE.md](ARCHITECTURE.md).
