# Base stage for dependencies and setup
FROM node:hydrogen-alpine as base

ENV TZ=UTC

RUN apk update

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

###############################################################################

# Builder stage for building the application
FROM base as builder

WORKDIR /app

RUN npm run build

###############################################################################

# Production stage
FROM node:hydrogen-alpine as production

ENV TZ=UTC

# Install kubectl and curl
RUN apk update && apk add --no-cache curl bash
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/

WORKDIR /app

# Copy built files and package.json from builder stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/
COPY --from=builder /app/tsconfig.json /app/

RUN npm install --only=production

EXPOSE 3000

CMD ["node", "dist/index.js"]


# docker build -t alazidis/lpa-controller:0.0.2 --file ./.docker/Dockerfile --target production placement --no-cache
# docker push alazidis/lpa-controller:0.0.2