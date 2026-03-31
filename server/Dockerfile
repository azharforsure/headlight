# Use the official Microsoft Playwright image which includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.48.0-noble

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server code
COPY . .

# Expose the default Hugging Face port
EXPOSE 7860

# Set environment variable for the app to listen on 7860
ENV PORT=7860

# Command to run the server
CMD ["node", "index.js"]
