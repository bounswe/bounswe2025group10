# Dockerfile
FROM node:latest

# Set working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./ 
RUN npm install

# Copy the rest of the code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start the Vite dev server
CMD ["npm", "run", "dev"]