#!/bin/bash

# Variables globals per gestionar quin Dockerfile usar i quin repositori usar
TARGET=""
DOCKERFILE=""
REPO=""
USERNAME=""
VERSION=""
ARCHITECTURES="linux/amd64,linux/arm64"

# Funció per obtenir la versió del package.json en la ruta especificada
get_version() {
    local path=$1
    VERSION=$(grep '"version":' "$path/package.json" | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')
    if [ -z "$VERSION" ]; then
        echo "No s'ha trobat la versió al $path/package.json"
        exit 1
    fi
    echo "Versió trobada: $VERSION"
}

# Funció per definir quin Dockerfile i quin repositori utilitzar
select_target() {
    if [ -z "$TARGET" ]; then
        echo "Selecciona l'objectiu (server/client): "
        read TARGET
    fi

    if [ "$TARGET" == "server" ]; then
        DOCKERFILE="Dockerfile.server"
        REPO="wmm-server"
        PACKAGE_PATH="../../server"
    elif [ "$TARGET" == "client" ]; then
        DOCKERFILE="Dockerfile.client"
        REPO="wmm-client"
        PACKAGE_PATH="../../client"
    else
        echo "Objectiu no vàlid. Tria 'server' o 'client'."
        exit 1
    fi

    echo "Operant amb $TARGET, utilitzant $DOCKERFILE i repositori $REPO."
    get_version "$PACKAGE_PATH"
}

# Funció per construir i pujar la imatge
build_and_push_image() {
    select_target

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
        echo "Error durant l'inici de sessió a Docker Hub"
        exit 1
    fi

    echo "Construint i pujant la imatge Docker $IMAGE_NAME utilitzant $DOCKERFILE..."
    
    # Construir la imatge amb buildx i especificar arquitectures
    docker buildx build -f $DOCKERFILE -t $IMAGE_NAME -t $LATEST_IMAGE --push --platform $ARCHITECTURES ../../

    if [ $? -ne 0 ]; then
        echo "Error durant la construcció i pujada de la imatge Docker"
        exit 1
    fi

    echo "Imatge $IMAGE_NAME (versió) i $LATEST_IMAGE (latest) pujades correctament."
}

# Funció per mostrar l'ajuda
show_help() {
    echo "Ús: ./build_and_push.sh [opció]"
    echo "Opcions:"
    echo "  -b  Construir i pujar la imatge Docker"
    echo "  -u  Especificar el nom d'usuari de Docker Hub"
    echo "  -i  Especificar la versió de la imatge"
    echo "  -t  Especificar si s'usa el 'server' o 'client'"
    echo "  -h  Mostrar aquesta ajuda"
}

# Primer processem les opcions necessàries
while getopts ":u:i:t:a:bh" opt; do
    case $opt in
        u)
            USERNAME=$OPTARG
            ;;
        i)
            VERSION=$OPTARG
            ;;
        t)
            TARGET=$OPTARG
            ;;
        b)
            ACTION="build"
            ;;
        h)
            show_help
            exit 0
            ;;
        \?)
            echo "Opció no vàlida: -$OPTARG" >&2
            show_help
            exit 1
            ;;
        :)
            echo "L'opció -$OPTARG requereix un argument." >&2
            show_help
            exit 1
            ;;
    esac
done

# Llavors executem l'acció corresponent
if [ "$ACTION" == "build" ]; then
    build_and_push_image
else
    show_help
fi
