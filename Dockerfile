# Base image with Node.js and Chrome dependencies for Puppeteer
FROM ghcr.io/puppeteer/puppeteer:22.4.1

# Skip Chromium download since we used the puppeteer image which puts it in a specific location
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

# Copy root files
COPY package*.json ./

# Copy server and client folders
COPY server ./server
COPY client ./client

# Install dependencies
# We install inside server/ and client/
RUN cd server && npm install
RUN cd client && npm install

# Build the client
RUN cd client && npm run build

# Setup production server to serve client build
# (You might need to adjust server/index.js to serve static files from ../client/dist if not already doing so)
# For this Dockerfile, we will assume we run the API server and it serves the frontend, 
# OR we just run the server part. 
# best practice for this assignment: Run the server, and have server serve the 'dist' folder.

# Expose port
EXPOSE 3000

# Start the server
CMD [ "node", "server/index.js" ]
