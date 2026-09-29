FROM node:24-bookworm-slim

WORKDIR /app

RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma generate
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start:prod"]