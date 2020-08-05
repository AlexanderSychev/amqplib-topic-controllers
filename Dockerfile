FROM node:12.18.1-alpine3.12

# Create directories for application
RUN mkdir -p /opt/app/test-report

WORKDIR /opt/app

COPY dist /opt/app/dist
COPY src /opt/app/src
COPY node_modules /opt/app/node_modules
COPY package.json /opt/app
COPY jest.config.js /opt/app

CMD ["node", "dist/test-app"]
