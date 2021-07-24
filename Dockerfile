FROM node:16-alpine
RUN apk update
RUN apk add git

WORKDIR /usr/src/app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json ./

RUN yarn install

COPY . .

CMD [ "node", "." ]
