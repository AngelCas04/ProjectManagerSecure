# Project Manager

Plataforma empresarial de gestion de proyectos colaborativos para equipos tecnologicos, con enfoque `Security by Design` y `Zero Trust Architecture`.

## Resumen

El proyecto esta dividido en cuatro capas principales:

- `frontend/react-app`: SPA en React para login, tablero Kanban, calendario, chat, perfil y panel de proyectos.
- `backend/spring-api`: API en Spring Boot con JWT, refresh tokens, CSRF, RBAC, PostgreSQL y WebSocket.
- `desktop/electron-app`: shell de escritorio en Electron con auto-update.
- `infra/terraform`: infraestructura AWS con VPC privada, EC2, RDS, ALB interno, API Gateway y S3.

## Arquitectura

Flujo general:

Usuario -> Aplicacion de escritorio o navegador -> Frontend React -> Backend Spring Boot -> PostgreSQL en AWS

En produccion actual:

- Frontend publicado en Vercel.
- Backend publicado en AWS con API Gateway HTTPS como entrada publica.
- RDS permanece privado dentro de la VPC.
- EC2 corre en subredes privadas.

## Modulos Funcionales

### Usuarios

- Registro
- Login
- Centro de ayuda en acceso y registro
- Perfil
- Roles

Roles actuales:

- `Administrador`
- `Miembro del proyecto`

### Proyectos

- Crear proyecto
- Invitar miembros
- Asignar roles
- Gestionar permisos

### Equipos

- Crear equipos
- Editar enfoque, visibilidad y ritmo
- Vincular proyectos a cada equipo
- Agregar y quitar integrantes

### Tareas

Estados Kanban:

- `TODO`
- `IN_PROGRESS`
- `DONE`

Campos principales:

- `id`
- `titulo`
- `descripcion`
- `prioridad`
- `estado`
- `fecha_limite`
- `usuario_asignado`
- `proyecto_id`

### Calendario

- Eventos
- Fechas de entrega
- Reuniones de equipo

### Chat

- Mensajeria en tiempo real con WebSocket en Spring Boot

### Historial

- Registro de cambios importantes del proyecto

## Seguridad

Controles ya aplicados:

- JWT de vida corta en cookies HttpOnly.
- Refresh tokens rotatorios.
- CSRF para SPA.
- CORS restringido a orígenes permitidos.
- Rate limiting en endpoints sensibles.
- Bloqueo temporal ante brute force.
- Sanitizacion de entradas.
- Proteccion contra SQL injection con JPA y consultas parametrizadas.
- PostgreSQL privado en RDS.
- EC2 sin IP publica.
- ALB interno detras de API Gateway.
- Secretos via variables de entorno e IaC, no hardcodeados.

Amenazas consideradas:

- SQL injection
- XSS
- CSRF
- RCE
- Brute force
- Session hijacking
- MITM
- Directory traversal
- Token theft
- Privilege escalation
- Broken authentication

## Despliegue Actual

- Frontend: [https://pm-collab-secure-20260319.vercel.app](https://pm-collab-secure-20260319.vercel.app)
- Backend: [https://6ri7gtw0uc.execute-api.us-east-1.amazonaws.com](https://6ri7gtw0uc.execute-api.us-east-1.amazonaws.com)

La base de datos RDS no es publica. Se accede por red privada y, para administracion local, mediante tunel SSM.

## Credenciales Demo

Usuario administrador:

- `valeria.ruiz@acme.dev`
- `SecurePass123!`

Otros usuarios semilla:

- `sofia.campos@acme.dev`
- `diego.lara@acme.dev`
- `angel@edu.sv`

## Estructura Del Repositorio

- [README.md](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/README.md)
- [backend/spring-api/README.md](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/backend/spring-api/README.md)
- [desktop/electron-app/README.md](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/desktop/electron-app/README.md)
- [infra/terraform/README.md](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/infra/terraform/README.md)

## Como Correr Localmente

### Frontend

```powershell
cd frontend/react-app
npm install
npm run dev
```

### Backend

```powershell
cd backend/spring-api
mvn spring-boot:run
```

### Desktop

```powershell
cd desktop/electron-app
npm install
npm run dev
```

### Base de Datos Local

```powershell
docker compose up -d
```

## Variables Importantes

Frontend:

- `VITE_API_URL`

Backend:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_SECURITY_JWT_SECRET`
- `APP_SECURITY_ALLOWED_ORIGIN_1`
- `APP_SECURITY_ALLOWED_ORIGIN_2`
- `APP_SECURITY_COOKIE_SAME_SITE`
- `APP_SECURITY_SECURE_COOKIES`

## Infraestructura AWS

Terraform crea:

- VPC con subredes publicas y privadas.
- NAT Gateway e Internet Gateway.
- ALB interno.
- HTTP API Gateway como entrada publica.
- EC2 en subred privada.
- RDS PostgreSQL privado.
- Bucket S3 para artefactos.
- KMS para cifrado.
- CloudWatch Logs y Flow Logs.

## Trazabilidad Tecnica

Referencias utiles:

- Frontend principal: [frontend/react-app/src/context/AppContext.jsx](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/frontend/react-app/src/context/AppContext.jsx)
- Cliente API: [frontend/react-app/src/services/api.js](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/frontend/react-app/src/services/api.js)
- Seguridad backend: [backend/spring-api/src/main/java/com/projectmanager/platform/security/SecurityConfig.java](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/backend/spring-api/src/main/java/com/projectmanager/platform/security/SecurityConfig.java)
- API de autenticacion: [backend/spring-api/src/main/java/com/projectmanager/platform/api/AuthController.java](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/backend/spring-api/src/main/java/com/projectmanager/platform/api/AuthController.java)
- Esquema SQL: [backend/spring-api/src/main/resources/db/migration/V1__init.sql](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/backend/spring-api/src/main/resources/db/migration/V1__init.sql)
- Terraform outputs: [infra/terraform/outputs.tf](/C:/Users/anshe/Downloads/ProjectManager-main/ProjectManager-main/infra/terraform/outputs.tf)

## Troubleshooting

### No inicia sesion

- Verifica que `VITE_API_URL` apunte al backend correcto.
- Asegura que el origen del frontend este en `APP_SECURITY_ALLOWED_ORIGIN_1`.
- Si usas Vercel, el backend debe aceptar cookies `SameSite=None` y `Secure=true`.
- Borra cookies antiguas del dominio si cambiaste tokens o entorno.

### `502 Bad Gateway`

- Normalmente es un problema de arranque del backend o de health check.
- Revisa el servicio `projectmanager` en la instancia EC2.
- Confirma que `GET /api/auth/health` responda `ok`.

### `pgAdmin` o acceso a RDS

- RDS no es publico.
- Usa tunel SSM hacia la EC2 privada.
- Luego conecta `pgAdmin` a `127.0.0.1:5432`.

### Terraform falla por backend

- Recompila el jar de Spring Boot.
- Verifica que el archivo exista en `backend/spring-api/target/spring-api-0.1.0.jar`.
- Ejecuta `terraform plan` y `terraform apply` nuevamente.

## Estado Del Proyecto

El proyecto ya incluye una base funcional para produccion y documentacion operativa. Si despues quieres, el siguiente paso natural es cerrar la parte de grupos de trabajo, pulir el flujo de login y endurecer mas la experiencia de escritorio y navegacion.
