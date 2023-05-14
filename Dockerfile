FROM node:lts-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx next build
EXPOSE 3000
CMD ["npx", "next", "start"]
