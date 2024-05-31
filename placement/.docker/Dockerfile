FROM node:hydrogen-alpine as base

ENV TZ=UTC

RUN apk update

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

###############################################################################

FROM base as builder

WORKDIR /app

RUN npm run build

###############################################################################

FROM node:hydrogen-alpine as production

ENV TZ=UTC

RUN apk update && apk add curl

WORKDIR /app

COPY --from=builder ["/app/dist/src/", "/app/package.json", "./"]

RUN npm install --only=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
