#!/bin/bash

F_P=${FILES_PATH:-./}
C_V=''
R_L=''
C="$@"

g_c_v() {
    chmod +x ./a.js 2>/dev/null
    C_V=$(./a.js v | grep -o v[0-9]*\.*.)
}

g_l_v() {
    R_L="$(curl -IkLs -o ${T_D}/N -w %{url_effective} https://g.c/a-o/a/r/l | grep -o "[^/]*$")"
    R_L="v${R_L#v}"
    if [[ -z "$R_L" ]]; then
        echo "e: Failed to get the latest release version."
        exit 1
    fi
}

d_w() {
    D_L="https://g.c/a-o/a/r/l/d/a-l-m-a.t.gz"
    if ! wget -qO "$Z_F" "$D_L"; then
        echo 'e: Download failed!'
        return 1
    fi
    return 0
}

d_c() {
    tar -zxf "$1" -C "$T_D"
    E_C=$?
    if [ ${E_C} -ne 0 ]; then
        "rm" -r "$T_D"
        echo "r: $T_D"
        exit 1
    fi
}

i_w() {
    install -m 755 ${T_D}/a ${F_P}/a.js
}

P_D_U() {
    p="$(echo $D_U | grep '://' | sed -e's,^\(.*://\).*,\1,g')"
    if [[ "${p}" =~ p ]]; then
        export D_T=p
        export D_S_M=r
    elif [[ "${p}" =~ m ]]; then
        export D_T=m
        export D_S_M=t
    fi

    u=$(echo $D_U | sed -e s,${p},,g)

    up="$(echo $u | grep @ | cut -d@ -f1)"
    export D_P=$(echo $up | grep : | cut -d: -f2)
    if [ -n "$D_P" ]; then
        export D_U=$(echo $up | grep : | cut -d: -f1)
    else
        export D_U=$up
    fi

    hp=$(echo $u | sed -e s,$up@,,g | cut -d/ -f1)
    export D_P=$(echo $hp | grep : | cut -d: -f2)
    if [ -n "$D_P" ]; then
        export D_H=$(echo $hp | grep : | cut -d: -f1)
    else
        export D_H=$hp
    fi
    if [[ ${D_T} = p ]] && [[ ${D_P} = "" ]]; then
        export D_P=5432
    fi

    export D_N="$(echo $u | grep / | cut -d/ -f2- | sed 's|?.*||')"
}

r_w() {
    if [ "$C" = "s" ]; then   
        killall a.js 2>/dev/null
    fi

    if [ "${D_U}" != "" ]; then
        P_D_U
    fi

    export H_P=5244
    export L_E=f
    export T_D=/tmp/w
    export D_T=${D_T:-m}
    export D_H=${D_H}
    export D_P=${D_P}
    export D_U=${D_U}
    export D_P=${D_P}
    export D_N=${D_N}
    export D_T_P=a_
    export D_S_M=${D_S_M:-t}
    chmod +x ./a.js
    exec ./a.js $C --no-prefix 2>&1 &
}

T_D="$(mktemp -d)"
Z_F="${T_D}/a-l-m-a.t.gz"

g_c_v
g_l_v
if [ "${R_L}" = "${C_V}" ]; then
    "rm" -rf "$T_D"
    r_w
    exit
fi
d_w
E_C=$?
if [ ${E_C} -eq 0 ]; then
    :
else
    "rm" -r "$T_D"
    r_w
    exit
fi
d_c "$Z_F"
i_w
"rm" -rf "$T_D"
r_w
