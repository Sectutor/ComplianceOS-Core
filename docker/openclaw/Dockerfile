FROM node:22-alpine
WORKDIR /app
ENV OPENCLAW_PORT=18789
RUN apk add --no-cache curl
RUN npm i -g openclaw@latest
ENV PATH="/usr/local/share/npm-global/bin:${PATH}"
EXPOSE 18789
ENTRYPOINT ["sh", "-c"]
CMD ["openclaw gateway run --port ${OPENCLAW_PORT} --verbose"]

