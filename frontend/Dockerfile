# syntax=docker/dockerfile:1

# ---- Etapa de compilación ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Etapa de ejecución ----
FROM nginx:1.27-alpine

# La imagen oficial de nginx sustituye ${BACKEND_UPSTREAM} al arrancar.
ENV BACKEND_UPSTREAM=http://backend:8080
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
