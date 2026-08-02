FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# Force git to use HTTPS instead of SSH (needed for npm git dependencies)
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" && git config --global url."https://github.com/".insteadOf "git@github.com:"

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
