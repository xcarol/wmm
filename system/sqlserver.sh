#!/bin/bash

# Funcions

function ajuda() {
  echo "**Comandes disponibles:**"
  echo ""
  echo "-h | --help: Mostra aquesta ajuda."
  echo "-u | --up: Inicia el servei."
  echo "-d | --down: Aturar el servei."
  echo "-r | --restart: Reinicia el servei."
  echo "-s | --status: Mostra l'estat del servei."
  echo ""
  echo "**Exemple d'ús:**"
  echo "$0 -u"
  echo "$0 -d"
  echo "$0 -r"
  echo "$0 -s"
  echo ""
  echo "AVIS! Si al executar aquest script apareix un error de docker indicant que no reconeix la commanda 'compose' cal instal·lat el paquet 'docker-compose-v2' amb apt-get."
}

function iniciar() {
  echo "Iniciant servei..."
  mkdir -p ./mysql
  docker compose -f ./docker/docker-compose.yml up -d db
  echo "Servei iniciat correctament."
}

function aturar() {
  echo "Aturant servei..."
  docker compose -f ./docker/docker-compose.yml down
  echo "Servei aturat correctament."
}

function reiniciar() {
  aturar
  iniciar
}

function estat() {
  echo "Mostrant l'estat del servei..."
  docker compose -f ./docker/docker-compose.yml ps
}

# Validació arguments

if [ $# -eq 0 ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  ajuda
  exit 0
fi

# Opcions

case "$1" in
  "-u" | "--up")
    iniciar
    ;;
  "-d" | "--down")
    aturar
    ;;
  "-r" | "--restart")
    reiniciar
    ;;
  "-s" | "--status")
    estat
    ;;
  *)
    echo "Opció no vàlida. Consulta la --help per a més informació."
    exit 1
    ;;
esac
