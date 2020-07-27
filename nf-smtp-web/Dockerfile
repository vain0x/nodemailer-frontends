# 参考: <https://nodejs.org/de/docs/guides/nodejs-docker-webapp/>

# Node.js がインストール済みのコンテナ
# <https://hub.docker.com/_/node>
FROM node:14

WORKDIR /mnt/nf-smtp-web

# 依存パッケージをインストールする。
# (なるべくビルド時のキャッシュを利かせるため、必要なファイルだけコンテナに送る。)
COPY package.json package-lock.json ./
RUN npm ci

# ソースコードなどをコンテナに送る。残りの処理は ./prod-build を参照。
COPY . ./
RUN chmod +x ./prod-build ./prod-start ./setup && \
    ./prod-build

EXPOSE 8080

ENTRYPOINT [ "./prod-start" ]
