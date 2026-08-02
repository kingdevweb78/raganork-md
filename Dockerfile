FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Force npm to use HTTPS for all git operations
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"

COPY package.json ./
ENV npm_config_git_protocol=https
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
