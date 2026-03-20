# Secure Project Manager API

Backend Spring Boot con:

- JWT de corta vida en cookie HttpOnly
- refresh tokens rotatorios y revocables
- CSRF con cookie/header para SPA
- Spring Security + RBAC por rol y membresia de proyecto
- PostgreSQL + Flyway
- WebSocket seguro para chat de proyecto

## Arranque local

1. Levanta PostgreSQL.
2. Copia variables desde `.env.example`.
3. Ejecuta la app con Maven:

```powershell
mvn spring-boot:run
```

Credenciales demo sembradas:

- `valeria.ruiz@acme.dev`
- `SecurePass123!`

Para frontend en otro dominio, por ejemplo Vercel:

- `APP_SECURITY_SECURE_COOKIES=true`
- `APP_SECURITY_COOKIE_SAME_SITE=None`
- `APP_SECURITY_ALLOWED_ORIGIN_1=https://<tu-app>.vercel.app`

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/bootstrap`
- `POST /api/projects`
- `POST /api/tasks`
- `PATCH /api/tasks/{taskId}/status`
- `POST /api/events`
- `PUT /api/profile`
- `POST /api/messages`
- `GET /api/security/csrf`

## Chat realtime

Conectar a:

```text
ws://localhost:8080/ws/chat?projectId=<uuid>
```

Mensaje saliente:

```json
{"projectId":"<uuid>","text":"hola equipo"}
```
