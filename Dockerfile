# Dockerfile (opción A)
FROM nginx:alpine

# instalar git
RUN apk add --no-cache git

# trabajar en el dir donde nginx sirve
WORKDIR /usr/share/nginx/html

# borrar los archivos default y luego clonar en el directorio actual
RUN rm -rf /usr/share/nginx/html/* \
 && git clone https://github.com/Ahernandez29/juego-espacial-js.git .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
