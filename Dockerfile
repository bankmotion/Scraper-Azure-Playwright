# FROM mcr.microsoft.com/playwright:v1.35.0-jammy
# WORKDIR /usr/src/app
# COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# RUN npm install --production --silent && mv node_modules ../
# COPY . .
# EXPOSE 3000

# CMD ["npm", "start"]

ARG APP_NAME=app
ARG APP_PATH=/opt/$APP_NAME
ARG NODE_VERSION=20

FROM node:$NODE_VERSION-slim AS base
ARG APP_NAME
ARG APP_PATH

# Set environment variables
ENV NODE_ENV=production

# Install essential tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && apt-get autoremove -y \
    && apt-get clean

# Create application directory
WORKDIR $APP_PATH

# Copy application files
COPY package*.json $APP_PATH/
COPY ./src ./src

# Install dependencies
RUN npm install

# Install Playwright and required browsers
RUN npm install -g playwright@1.48.2

RUN playwright install chromium

FROM base AS shell
ARG APP_NAME
ARG APP_PATH
WORKDIR $APP_PATH

# Copy the entire application for shell environment
COPY . $APP_PATH

# Ensure all dependencies are installed
RUN npm install

EXPOSE 3000

CMD ["npm", "start"]