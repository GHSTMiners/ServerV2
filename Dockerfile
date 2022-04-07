# Stage 1: Build application
FROM node:17.8-bullseye as builder

# Create a directory to hold your service and relevant modules with owner being node and define the working directory of your Docker container.
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

# Let us copy our package file into the working directory to make it the root directory from which we will install our dependency packages.
COPY package*.json ./

# Next we ensure that the package installer should never drop into user and group switching when installing our apps.
RUN npm config set unsafe-perm true

# Since we are all good let us, install our dependencies
RUN npm install -g typescript
RUN npm install -g ts-node
USER root
RUN npm install

# Copy our project into our working container and initiate build
COPY --chown=node:node . .
RUN npm run build

FROM node:17.8-bullseye-slim
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
COPY *.env ./
RUN chown -R node:node /home/node/app
USER node
RUN npm install --production
COPY --from=builder /home/node/app/build ./build
EXPOSE 2567
CMD [ "node", "build/src/index.js" ]