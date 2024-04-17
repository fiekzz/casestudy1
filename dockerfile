FROM oven/bun

WORKDIR /app

COPY package.json .
COPY bun.lockb .
COPY prisma/schema.prisma prisma/schema.prisma

RUN bunx prisma generate

RUN bun install --production

COPY src src
COPY tsconfig.json .
# COPY public public

ENV NODE_ENV production
CMD ["bun", "src/index.ts"]

EXPOSE 3000