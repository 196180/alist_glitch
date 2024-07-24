#!/bin/bash

# ... (keep existing content)

PARSE_DB_URL() {
    # ... (keep existing content)
}

run_web() {
    if [ "$CMD" = "server" ]; then   
        killall app.js 2>/dev/null
    fi

    if [ "${DATABASE_URL}" != "" ]; then
        PARSE_DB_URL
    fi

    export HTTP_PORT=5244
    export LOG_ENABLE=false
    export TEMP_DIR=/tmp/web
    export DB_TYPE=mysql
    export DB_HOST=${DB_HOST}
    export DB_PORT=${DB_PORT}
    export DB_USER=${DB_USER}
    export DB_PASS=${DB_PASS}
    export DB_NAME=${DB_NAME}
    export DB_TABLE_PREFIX=alist_
    export DB_SSL_MODE=true
    chmod +x ./app.js
    exec ./app.js $CMD --no-prefix 2>&1 &
}

# ... (keep the rest of the content)
