FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY .env.development .env

EXPOSE 8080

CMD ["node", "server.js"]