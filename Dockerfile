FROM node:24

RUN mkdir -p /bot/db
WORKDIR /bot

COPY . /bot

RUN npm i
RUN npm run build

ENV DATABASE_PATH=/bot/db
VOLUME [ "/bot/db" ]

ENTRYPOINT [ "npm", "run", "register-and-start" ]
