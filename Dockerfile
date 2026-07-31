FROM node:22-alpine
RUN apk add --no-cache git ffmpeg libwebp-tools python3 make g++
RUN git clone -b main https://github.com/kingdevweb78/raganork-md /app
WORKDIR /app
RUN mkdir -p temp
ENV TZ=America/Port-au-Prince
RUN npm install -g --force yarn
RUN yarn install
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "index.js"]