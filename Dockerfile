# Use una imagen ligera de nginx que ya sirve archivos estáticos
FROM nginx:alpine

# Metadata opcional sobre el mantenedor
LABEL maintainer="Argenis 20240916@itla.edu.do"

# El contenido del proyecto (index.html, css, js, images, musics) se copiará
# a la carpeta que nginx sirve por defecto: /usr/share/nginx/html
COPY . /usr/share/nginx/html

# Exponemos el puerto 80 (documentativo)
EXPOSE 80

# Comando por defecto para ejecutar nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
