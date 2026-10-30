FROM node:24-bookworm-slim AS build

WORKDIR /opt/app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS production

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

WORKDIR /opt/app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/app/dist/config ./config
COPY --from=build /opt/app/database ./database
COPY --from=build /opt/app/public ./public
COPY --from=build /opt/app/dist/src ./src
COPY --from=build /opt/app/dist ./dist
COPY --from=build /opt/app/dist/build ./node_modules/@strapi/admin/dist/server/server/build

RUN mkdir -p .tmp \
    && chown -R node:node /opt/app

USER node

EXPOSE 1337

CMD ["npm", "run", "start"]