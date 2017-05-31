FROM node:4.2.1

RUN npm install npm@2.8.3 -g

# Add package.json from the current build context (`.` is the repo) second
ADD ./package.json /shiva/package.json

# install, should will skip if no package.json change
WORKDIR /shiva
RUN npm install --production

# move the current build context (`.` is the repo) to /shiva
ADD . /shiva

# Define default command.
CMD /usr/local/bin/npm start
