# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .

# Aceitamos os argumentos, mas se o painel não os passar, 
# o comando abaixo tentará usar o que estiver no ambiente
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Forçamos a escrita das variáveis no momento do build
RUN VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    npm run build

# 2) Runtime stage
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
# Certifique-se de que o nome do arquivo abaixo é exatamente o que você salvou (nginx.config ou nginx.conf)
COPY nginx.config /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]