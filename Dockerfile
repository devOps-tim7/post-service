FROM node:15-alpine as build
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build

FROM node:15-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/package*.json .
COPY --from=build /usr/src/app/ormconfig.js .
COPY --from=build /usr/src/app/build .
RUN npm install --only=prod
CMD node index.js