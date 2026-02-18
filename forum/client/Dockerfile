FROM node:18-alpine as build

WORKDIR /app/client

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app/client

RUN npm install -g serve

COPY --from=build /app/client/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
