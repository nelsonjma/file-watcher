########################################################
# Dockerfile to build an deno dev env for version 2.1.7
########################################################
# Base image is Ubuntu
FROM ubuntu:latest

ENV LANG C.UFT-8

RUN apt-get update -y && \
    apt-get install -y curl && \
    apt-get install -y build-essential \
    software-properties-common \
    curl \
    git \
    wget \
    zip \
    unzip \
    nano \
    sudo \
    xz-utils

# remove user ubuntu 
RUN touch /var/mail/ubuntu && \
    chown ubuntu /var/mail/ubuntu && \
    userdel -r ubuntu

# create local user
ARG UNAME
ARG UID
ARG GID
RUN groupadd -g $GID -o $UNAME && \
    useradd -m -u $UID -g $GID -o -s /bin/bash $UNAME && \
    mkdir -p /home/${UNAME} && \
    usermod -a -G sudo ${UNAME} && \
    echo "${UNAME} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers

USER $UNAME

WORKDIR /home/${UNAME}

RUN curl -fsSL https://deno.land/x/install/install.sh | sh && \
    export PATH=/home/xyon/.deno/bin:$PATH && \
    deno upgrade --version 2.1.7

WORKDIR /app

CMD 'bash'