#!/bin/bash

FP=${FILES_PATH:-./}
CV=''
RL=''
CMD="$@"

gcv() {
    chmod +x ./app.js 2>/dev/null
    CV=$(./app.js version | grep -o v[0-9]*\.*.)
}

glv() {
    RL="$(curl -IkLs -o ${TD}/NUL -w %{url_effective} https://github.com/alist-org/alist/releases/latest | grep -o "[^/]*$")"
    RL="v${RL#v}"
    if [[ -z "$RL" ]]; then
        echo "error: Failed to get the latest release version, please check your network."
        exit 1
    fi
}

dw() {
    DL="https://github.com/alist-org/alist/releases/latest/download/alist-linux-musl-amd64.tar.gz"
    if ! wget -qO "$ZF" "$DL"; then
        echo 'error: Download failed! Please check your network or try again.'
        return 1
    fi
    return 0
}

dc() {
    tar -zxf "$1" -C "$TD"
    EC=$?
    if [ ${EC} -ne 0 ]; then
        rm -r "$TD"
        echo "removed: $TD"
        exit 1
    fi
}

iw() {
    install -m 755 ${TD}/alist ${FP}/app.js
}

pdb() {
    proto="$(echo $DATABASE_URL | grep '://' | sed -e's,^\(.*://\).*,\1,g')"
    if [[ "${proto}" =~ postgres ]]; then
        export DB_TYPE=postgres
        export DB_SSL_MODE=require
    elif [[ "${proto}" =~ mysql ]]; then
        export DB_TYPE=mysql
        export DB_SSL_MODE=true
    fi

    url=$(echo $DATABASE_URL | sed -e s,${proto},,g)

    up="$(echo $url | grep @ | cut -d@ -f1)"
    export DB_PASS=$(echo $up | grep : | cut -d: -f2)
    if [ -n "$DB_PASS" ]; then
        export DB_USER=$(echo $up | grep : | cut -d: -f1)
    else
        export DB_USER=$up
    fi

    hp=$(echo $url | sed -e s,$up@,,g | cut -d/ -f1)
    export DB_PORT=$(echo $hp | grep : | cut -d: -f2)
    if [ -n "$DB_PORT" ]; then
        export DB_HOST=$(echo $hp | grep : | cut -d: -f1)
    else
        export DB_HOST=$hp
    fi
    if [[ ${DB_TYPE} = postgres ]] && [[ ${DB_PORT} = "" ]]; then
        export DB_PORT=5432
    fi

    export DB_NAME="$(echo $url | grep / | cut -d/ -f2- | sed 's|?.*||')"
}

rw() {
    if [ "$CMD" = "server" ]; then   
        killall app.js 2>/dev/null
    fi

    if [ "${DATABASE_URL}" != "" ]; then
        pdb
    fi

    export HTTP_PORT=5244
    export LOG_ENABLE=false
    export TEMP_DIR=/tmp/web
    export DB_TYPE=${DB_TYPE:-mysql}
    export DB_HOST=${DB_HOST}
    export DB_PORT=${DB_PORT}
    export DB_USER=${DB_USER}
    export DB_PASS=${DB_PASS}
    export DB_NAME=${DB_NAME}
    export DB_TABLE_PREFIX=alist_
    export DB_SSL_MODE=${DB_SSL_MODE:-true}
    chmod +x ./app.js
    exec ./app.js $CMD --no-prefix 2>&1 &
}

TD="$(mktemp -d)"
ZF="${TD}/alist-linux-musl-amd64.tar.gz"

gcv
glv
if [ "${RL}" = "${CV}" ]; then
    rm -rf "$TD"
    rw
    exit
fi
dw
EC=$?
if [ ${EC} -eq 0 ]; then
    :
else
    rm -r "$TD"
    rw
    exit
fi
dc "$ZF"
iw
rm -rf "$TD"
rw
