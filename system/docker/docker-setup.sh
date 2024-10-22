#!/bin/bash

# Build with help of (ehem I mean coomanding) CHatGPTv4

# Variables globals
TARGET=""
DOCKERFILE=""
REPO=""
USERNAME=""
VERSION=""
ARCHITECTURES="linux/amd64,linux/arm64"
VITE_API_URL=""

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

# Funció per configurar VITE_API_URL i crear el fitxer .env
setup_env() {
    if [ -z "$VITE_API_URL" ]; then
        echo "Introdueix URL del servidor (p.e. http://localhost:3000): "
        read VITE_API_URL
    fi
    echo "VITE_API_URL=$VITE_API_URL" > "$PACKAGE_PATH/.env"
    echo "Fitxer .env creat amb VITE_API_URL=$VITE_API_URL"
}

# Funció per eliminar el fitxer .env després del build
cleanup_env() {
    if [ -f "$PACKAGE_PATH/.env" ]; then
        rm "$PACKAGE_PATH/.env"
        echo "Fitxer .env eliminat."
    fi
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

    # Si estem treballant amb el client, configurem l'arxiu .env
    if [ "$TARGET" == "client" ]; then
        setup_env
    fi

    echo "Construint i pujant la imatge Docker $IMAGE_NAME utilitzant $DOCKERFILE..."
    
    docker buildx build -f $DOCKERFILE -t $IMAGE_NAME -t $LATEST_IMAGE --push --platform $ARCHITECTURES ../../

    if [ $? -ne 0 ]; then
        echo "Error durant la construcció i pujada de la imatge Docker"
        exit 1
    fi

    # Eliminar el fitxer .env després del build
    if [ "$TARGET" == "client" ]; then
        cleanup_env
    fi

    echo "Imatge $IMAGE_NAME (versió) i $LATEST_IMAGE (latest) pujades correctament."
}

# Funció per mostrar l'ajuda
show_help() {
    echo "Ús: $0 [opcions]"
    echo "Opcions:"
    echo "  -t  Especificar si s'usa el 'server' o 'client'"
    echo "  -u  Especificar el nom d'usuari de Docker Hub"
    echo "  -v  Especificar la URL del servidor de destí (p.e. http://localhost:3000)"
    echo "  -h  Mostrar aquesta ajuda"
}

# Processar les opcions necessàries
while getopts ":u:t:v:h" opt; do
    case $opt in
        u)
            USERNAME=$OPTARG
            ;;
        t)
            TARGET=$OPTARG
            ;;
        v)
            VITE_API_URL=$OPTARG
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

show_help
build_and_push_image
