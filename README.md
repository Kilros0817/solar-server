# Nifty Royale API

Version : 2.0.0

## Setup

### Local dev environment

Database Setup

1. Install MongoDB on local machine
2. Create a database name "core-records"

Running server

1. cd into folder in terminal and run "npm i"
2. run "npm start

Server now running on <http://localhost:8000>

### Deploy with NGINX
server {
        client_max_body_size 64M;
        server_name tb.blockchain-buds.com;

        location / {
                proxy_pass             http://127.0.0.1:8085;
                proxy_read_timeout     60;
                proxy_connect_timeout  60;
                proxy_redirect         off;

                # Allow the use of websockets
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $http_host;
		proxy_set_header X-Real-IP $remote_addr;                
		proxy_cache_bypass $http_upgrade;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme; 
                proxy_set_header X-NginX-Proxy true;
        }


    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/tb.blockchain-buds.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/tb.blockchain-buds.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}
