FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seed script
COPY seed-data.js ./

# Run seed script
CMD ["node", "seed-data.js"]
