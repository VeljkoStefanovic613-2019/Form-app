FROM node:18-slim  

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (bcrypt works better on Debian-based images)
RUN npm install --production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3001

CMD ["npm", "start"]