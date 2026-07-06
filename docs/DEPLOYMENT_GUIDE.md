# Deployment Guide

This guide outlines how to take the project from a local development environment to a production server.

---

## 1. Production Architecture Overview
In a production environment, we do not use the built-in Flask or Vite development servers.
- **Frontend**: The React app is "built" into static HTML/CSS/JS files and served globally via a CDN or a web server like Nginx.
- **Backend**: Flask is served using a production WSGI server like Gunicorn, heavily reverse-proxied behind Nginx.
- **Database**: A managed MySQL instance (e.g., AWS RDS) is used for automated backups and high availability.

## 2. Frontend Deployment (React/Vite)

### Build the App
```bash
cd frontend
npm run build
```
This generates a `dist/` folder containing the highly optimized, minified production assets.

### Hosting Options
- **Vercel / Netlify**: You can connect your GitHub repository directly to Vercel. It will automatically run `npm run build` and host the `dist/` folder on a global CDN for free.
- **Nginx**: If hosting on your own VPS (Virtual Private Server), copy the `dist/` folder to `/var/www/html` and configure Nginx to route all traffic to `index.html`.

### Environment Variables
In production, ensure your `.env` file points to the live backend URL:
```
VITE_API_URL=https://api.finguard.ai/api/v1
```

## 3. Backend Deployment (Flask)

### Prepare the Server
1. Provision a Linux VPS (e.g., AWS EC2, DigitalOcean Droplet).
2. Install Python, pip, and Nginx.
3. Clone the repository and install requirements.

### Use Gunicorn
The built-in `flask run` server cannot handle concurrent requests. You must use Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 127.0.0.1:5000 run:app
```
*(This runs the app using 4 worker processes).*

### Nginx Reverse Proxy
Configure Nginx to listen on port 80 (HTTP) and 443 (HTTPS) and forward API requests to Gunicorn:
```nginx
server {
    listen 80;
    server_name api.finguard.ai;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Production Security Considerations
1. **HTTPS/SSL**: Use Let's Encrypt (`certbot`) to secure all traffic. JWTs sent over unencrypted HTTP can be easily intercepted.
2. **Secret Keys**: The `SECRET_KEY` and `JWT_SECRET_KEY` in your `.env` must be changed to long, cryptographically random strings.
3. **Database Security**: Ensure the MySQL database only accepts connections from the VPS IP address, not the public internet.
