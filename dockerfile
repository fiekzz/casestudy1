FROM oven/bun

WORKDIR /app

COPY package.json .
COPY bun.lockb .
COPY prisma/schema.prisma prisma/schema.prisma
COPY .env .

RUN bun install --production
RUN bunx prisma generate

COPY src src
COPY tsconfig.json .
# COPY public public

ENV NODE_ENV production
# CMD ["bun", "src/index.ts"]
CMD ["bun", "dev"]

EXPOSE 3000