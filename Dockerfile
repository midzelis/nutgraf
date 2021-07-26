FROM node:16-alpine

RUN yarn global add nutgraf

CMD [ "nutgraf" ]
