#!/bin/bash

# Variables globals per gestionar quin Dockerfile usar i quin repositori usar
TARGET=""
DOCKERFILE=""
REPO=""

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
    echo "Selecciona l'objectiu (server/client): "
    read TARGET

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

# Funció per construir la imatge
build_image() {
    select_target
    echo "Introdueix el teu usuari de Docker Hub: "
    read USERNAME
    IMAGE_NAME="$USERNAME/$REPO:$VERSION"

    echo "Construint la imatge Docker $IMAGE_NAME utilitzant $DOCKERFILE..."
    docker build -f $DOCKERFILE -t $IMAGE_NAME .

    if [ $? -ne 0 ]; then
        echo "Error durant la construcció de la imatge Docker"
        exit 1
    fi

    # Etiquetar la imatge com a 'latest'
    LATEST_IMAGE="$USERNAME/$REPO:latest"
    echo "Etiquetant la imatge com a 'latest' ($LATEST_IMAGE)..."
    docker tag $IMAGE_NAME $LATEST_IMAGE

    if [ $? -ne 0 ]; then
        echo "Error durant l'etiquetatge de la imatge Docker com 'latest'"
        exit 1
    fi

    echo "Imatge $IMAGE_NAME (versió) i $LATEST_IMAGE (latest) construïdes correctament."
}

# Funció per fer el push de la imatge a Docker Hub
push_image() {
    select_target
    echo "Introdueix el teu usuari de Docker Hub: "
    read USERNAME
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

    echo "Pujant la imatge $IMAGE_NAME a Docker Hub..."
    docker push $IMAGE_NAME

    echo "Pujant la imatge $LATEST_IMAGE a Docker Hub..."
    docker push $LATEST_IMAGE

    if [ $? -ne 0 ]; then
        echo "Error durant el push de la imatge a Docker Hub"
        exit 1
    fi

    echo "Imatges $IMAGE_NAME (versió) i $LATEST_IMAGE (latest) pujades correctament."
    docker logout
}

# Funció per eliminar la imatge Docker
delete_image() {
    select_target
    echo "Introdueix el teu usuari de Docker Hub: "
    read USERNAME
    IMAGE_NAME="$USERNAME/$REPO:$VERSION"
    LATEST_IMAGE="$USERNAME/$REPO:latest"

    echo "Eliminant la imatge Docker $IMAGE_NAME i $LATEST_IMAGE localment..."
    docker rmi $IMAGE_NAME
    docker rmi $LATEST_IMAGE

    if [ $? -ne 0 ]; then
        echo "Error durant l'eliminació de les imatges Docker"
        exit 1
    fi

    echo "Imatges $IMAGE_NAME (versió) i $LATEST_IMAGE (latest) eliminades correctament."
}

# Funció per mostrar l'ajuda
show_help() {
    echo "Ús: ./build_and_push.sh [opció]"
    echo "Opcions:"
    echo "  -b  Construir la imatge Docker"
    echo "  -p  Fer push de la imatge a Docker Hub"
    echo "  -d  Eliminar la imatge Docker localment"
    echo "  -h  Mostrar aquesta ajuda"
}

# Gestionar les opcions
while getopts "bpdh" opt; do
    case $opt in
        b)
            build_image
            ;;
        p)
            push_image
            ;;
        d)
            delete_image
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
    esac
done

# Si no es proporciona cap opció, mostrar ajuda
if [ $OPTIND -eq 1 ]; then
    show_help
    exit 1
fi
