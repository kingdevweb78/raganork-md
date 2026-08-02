FROM node:20-slim

# Install system dependencies (git, openssh, and ca-certificates are required)
RUN apt-get update && apt-get install -y --no-install-recommends \
  git \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Fix SSL certificate verification and force git to use HTTPS
RUN git config --global http.sslVerify false && \
    git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" && \
    git config --global url."https://github.com/".insteadOf "git@github.com:"

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
