FROM alpine:3.21

ARG PB_VERSION=0.39.9

RUN apk add --no-cache ca-certificates curl unzip su-exec \
  && curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -o /tmp/pocketbase.zip \
  && unzip /tmp/pocketbase.zip -d /pb \
  && rm /tmp/pocketbase.zip \
  && addgroup -S pocketbase \
  && adduser -S -G pocketbase -h /pb pocketbase \
  && mkdir -p /pb/pb_data /pb/pb_public /pb/pb_hooks /pb/pb_migrations /pb/template \
  && chown -R pocketbase:pocketbase /pb

WORKDIR /pb

COPY --chown=pocketbase:pocketbase index.html /pb/template/index.html
COPY --chown=pocketbase:pocketbase manifest.json sw.js /pb/pb_public/
COPY --chown=pocketbase:pocketbase icons /pb/pb_public/icons
COPY --chown=pocketbase:pocketbase pb_hooks /pb/pb_hooks
COPY --chown=pocketbase:pocketbase pb_migrations /pb/pb_migrations
COPY --chown=pocketbase:pocketbase docker-entrypoint.sh /pb/docker-entrypoint.sh

RUN chmod +x /pb/docker-entrypoint.sh

EXPOSE 8090

ENTRYPOINT ["/pb/docker-entrypoint.sh"]
