#!/bin/bash

# Variables globals
COMPONENT=""
DOCKERFILE=""
REPO=""
USERNAME=""
VERSION=""
LOCAL_ARCHITECTURE=""
ARCHITECTURES=""
VITE_API_URL=""
TARGET=""

get_out() {
    local message=$1

    if [ "$message" = "" ]; then
        exit 0
    fi

    echo $message
    show_help
    exit 1
}

# Funció per obtenir la versió del package.json en la ruta especificada
get_version() {
    local path=$1
    VERSION=$(grep '"version":' "$path/package.json" | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')
    if [ -z "$VERSION" ]; then
        get_out "No s'ha trobat la versió al $path/package.json"
    fi
    echo "Versió trobada: $VERSION"
}

get_local_architecture() {
    ARCH=`uname -m`
    echo "Arquitectura trobada: $ARCH"

    if [ "$ARCH" = "x86_64" ]; then
        LOCAL_ARCHITECTURE="linux/amd64"
    fi

    if [ "$ARCH" = "armv7l" ]; then
        LOCAL_ARCHITECTURE="linux/arm/v7"
    fi

    if [ "$ARCH" = "aarch64" ]; then
        LOCAL_ARCHITECTURE="linux/arm64"
    fi

    if [ "$LOCAL_ARCHITECTURE" = "" ]; then
        get_out "Arquitectura $ARCH no suportada."
    fi
}

# Funció per definir quin Dockerfile i quin repositori utilitzar
select_component() {
    if [ -z "$COMPONENT" ]; then
        get_out "Falta el component (server/client)"
    fi

    if [ "$COMPONENT" == "server" ]; then
        DOCKERFILE="Dockerfile.server"
        REPO="wmm-server"
        PACKAGE_PATH="../../server"
    elif [ "$COMPONENT" == "client" ]; then
        DOCKERFILE="Dockerfile.client"
        REPO="wmm-client"
        PACKAGE_PATH="../../client"
    else
        get_out "Objectiu no vàlid. Tria 'server' o 'client'."
    fi

    get_version "$PACKAGE_PATH"
}

# Funció per eliminar el fitxer .env després del build
cleanup_env() {
    if [ -f "$PACKAGE_PATH/.env" ]; then
        rm "$PACKAGE_PATH/.env"
        echo "Fitxer .env eliminat."
    fi
}

# Funció per seleccionar entre Docker Hub i Local
select_target() {
    if [ -z "$TARGET" ]; then
        get_out "Falta el destí de les imatges (local/dockerhub)"
    fi
    if [ "$TARGET" != "local" ] && [ "$TARGET" != "dockerhub" ]; then
        get_out "Opció no vàlida. Tria 'local' o 'dockerhub'."
    fi
}

# Funció per seleccionar l'arquitectura
select_architecture() {
    if [ "$TARGET" = "dockerhub" ]; then
        ARCHITECTURES="linux/amd64,linux/arm64"
    elif [ "$TARGET" = "local" ]; then
        get_local_architecture
        ARCHITECTURES="$LOCAL_ARCHITECTURE"
    fi
}

# Funció per construir i, si s'ha seleccionat, pujar la imatge
build_and_push_image() {
    select_component
    select_target
    select_architecture

    if [ "$TARGET" == "dockerhub" ]; then
        if [ -z "$USERNAME" ]; then
            echo "Introdueix el teu usuari de Docker Hub: "
            read USERNAME
        fi

        IMAGE_NAME="$USERNAME/$REPO:$VERSION"
        LATEST_IMAGE="$USERNAME/$REPO:latest"

        echo "Iniciant sessió a Docker Hub..."
        read -sp "Introdueix la teva contrasenya de Docker Hub: " PASSWORD
        echo
        echo "$PASSWORD" | docker login --username "$USERNAME" --password-stdin

        if [ $? -ne 0 ]; then
            get_out "Error durant l'inici de sessió a Docker Hub"
        fi
    else
        IMAGE_NAME="$REPO:$VERSION"
        LATEST_IMAGE="$REPO:latest"
    fi

    echo "Construint la imatge Docker $IMAGE_NAME utilitzant $DOCKERFILE..."

    build_command="docker buildx build -f $DOCKERFILE -t $IMAGE_NAME -t $LATEST_IMAGE --platform $ARCHITECTURES ../../"
    if [ "$TARGET" == "dockerhub" ]; then
        build_command="$build_command --push"
    else
        build_command="$build_command --load"
    fi
    $build_command

    if [ $? -ne 0 ]; then
        get_out "Error durant la construcció de la imatge Docker"
    fi

    # Eliminar el fitxer .env després del build
    if [ "$COMPONENT" == "client" ]; then
        cleanup_env
    fi

    echo "Imatge $IMAGE_NAME construïda correctament."
    if [ "$TARGET" == "dockerhub" ]; then
        echo "Imatge $IMAGE_NAME (versió) i $LATEST_IMAGE (latest) pujades a Docker Hub."
    else
        echo "Imatge $IMAGE_NAME disponible localment."
    fi
}

# Funció per mostrar l'ajuda
show_help() {
    echo "Ús: $0 [opcions]"
    echo "Opcions:"
    echo "  -c  Especifica el component 'server' o 'client'"
    echo "  -t  Especifica el destí (local/dockerhub)"
    echo "  -u  Especifica el nom d'usuari de Docker Hub (només si -t dockerhub)"
    echo "  -v  Especifica la URL del servidor de wmm (només si -t client)"
    echo "        exemple: http://192.168.1.39:3000"
    echo "  -h  Mostrar aquesta ajuda"
}

# Processar les opcions necessàries
while getopts ":u:c:v:t:h" opt; do
    case $opt in
        u)
            USERNAME=$OPTARG
            ;;
        c)
            COMPONENT=$OPTARG
            ;;
        v)
            VITE_API_URL=$OPTARG
            ;;
        t)
            TARGET=$OPTARG
            ;;
        h)
            show_help
            exit 0
            ;;
        \?)
            get_out "Opció no vàlida: -$OPTARG" >&2
            ;;
        :)
            get_out "L'opció -$OPTARG requereix un argument." >&2
            ;;
    esac
done

build_and_push_image
