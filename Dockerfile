# Builds the frontend (Vite) and the backend (Express) into a single image.
# The Express server serves the built frontend AND the /api routes, so this
# deploys as one service with one URL.

FROM node:20-alpine

WORKDIR /app

# --- Backend dependencies ---
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# --- Frontend dependencies + build ---
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend

# Same-origin API calls in production - Express serves both frontend and API
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN cd frontend && npm run build

# --- Backend source ---
COPY backend ./backend

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "backend/src/server.js"]
