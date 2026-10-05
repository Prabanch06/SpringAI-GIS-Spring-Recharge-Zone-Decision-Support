FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Build the frontend (Vite)
RUN npm run build

# Compile server.ts to JavaScript for production
RUN npx tsc server.ts --esModuleInterop --module nodenext --moduleResolution nodenext --target es2022 --skipLibCheck --outDir server-dist --ignoreConfig

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built frontend
COPY --from=builder /app/dist ./dist

# Copy the compiled server JS
COPY --from=builder /app/server-dist/server.js ./server.js

EXPOSE 3000

CMD ["node", "server.js"]
