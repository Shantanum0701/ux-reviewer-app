FROM ghcr.io/puppeteer/puppeteer:22.4.1

# 1. SWITCH TO ROOT IMMEDIATELY
USER root

# 2. Set environment variables to skip chromium download (we use the installed one)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# 3. Create app directory and ensure root owns it
WORKDIR /usr/src/app

# 4. Copy package files
COPY package*.json ./

# 5. Copy source folders
COPY server ./server
COPY client ./client

# 6. Install dependencies globally and locally as root
# Added --unsafe-perm to ensure scripts run as root without downgrading to 'nobody'
RUN cd server && npm install --unsafe-perm
RUN cd client && npm install --unsafe-perm

# 7. Build the client
RUN cd client && npm run build

# 8. Expose port
EXPOSE 3000

# 9. Start the server
CMD [ "node", "server/index.js" ]
