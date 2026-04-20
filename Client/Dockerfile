FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

EXPOSE 5173

# Expose Vite to external ports
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]