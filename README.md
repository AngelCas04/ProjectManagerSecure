# Project Manager Secure

Plataforma de gestion de proyectos colaborativos pensada para equipos tecnicos que necesitan coordinar iniciativas, conversaciones, tareas y entregas desde un mismo espacio de trabajo.

Combina una experiencia moderna tipo workspace con tablero Kanban, calendario, chat por equipo, gestion de grupos, control de acceso por roles y un cliente de escritorio para Windows.

## Vista general

- Frontend en React con una interfaz enfocada en productividad, claridad y velocidad
- Backend en Java + Spring Boot con autenticacion segura, WebSocket y API para proyectos, tareas, grupos y chat
- Base de datos PostgreSQL para entornos privados de produccion
- Infraestructura cloud preparada para despliegue escalable
- Aplicacion de escritorio en Electron con instalador `.exe`

## Lo que incluye hoy

- Inicio de sesion y registro con experiencia mas amigable
- Panel de ayuda en acceso con preguntas y respuestas para usuarios
- Gestion de grupos de trabajo con enfoque, visibilidad y ritmo de operacion
- Proyectos y tareas con estados tipo Kanban
- Calendario para hitos, reuniones y fechas clave
- Chat de equipo con aislamiento por grupo
- Historial de actividad y base para auditoria
- Cliente de escritorio listo para Windows

## Seguridad incorporada

- Sesiones con cookies `HttpOnly`
- JWT de corta duracion y refresh controlado
- Proteccion CSRF
- Rate limiting y bloqueo temporal ante abuso
- Control de acceso por rol y pertenencia a equipo
- Validacion estricta de entrada en backend
- PostgreSQL pensado para red privada
- Electron endurecido con `sandbox` y `contextIsolation`

## Arquitectura

```text
Desktop App / Web App
        |
      React
        |
Spring Boot API + WebSocket
        |
   PostgreSQL
        |
     Cloud
```

## Descarga directa del instalador

[Descargar Project Manager Secure para Windows](https://www.mediafire.com/file/roxlo4s97rvs99m/Project+Manager+Secure-Setup-0.1.0.exe/file)

Guia paso a paso:
[INSTALL.md](INSTALL.md)

## Estructura del monorepo

```text
backend/spring-api        API segura con Spring Boot
frontend/react-app        Aplicacion web React
desktop/electron-app      Cliente de escritorio para Windows
infra/terraform           Infraestructura como codigo para nube privada
```

## Tecnologias

- React 18 + Vite
- Java 17 + Spring Boot 3
- Spring Security + WebSocket
- PostgreSQL
- Terraform
- Electron

## Puesta en marcha local

### 1. Clonar el proyecto

```bash
git clone <tu-repo>
cd ProjectManager-main
```

### 2. Levantar PostgreSQL

```bash
docker compose up -d
```

### 3. Configurar variables de entorno

Usa como base estos archivos:

- `frontend/react-app/.env.example`
- `backend/spring-api/.env.example`
- `desktop/electron-app/.env.example`

### 4. Iniciar el backend

```bash
cd backend/spring-api
mvn spring-boot:run
```

### 5. Iniciar el frontend

```bash
cd frontend/react-app
npm install
npm run dev
```

### 6. Ejecutar la app de escritorio en desarrollo

```bash
cd desktop/electron-app
npm install
npm run dev
```

## Credenciales de demostracion

- Usuario: `valeria.ruiz@acme.dev`
- Contrasena: `SecurePass123!`

## Documentacion adicional

- [DOCUMENTACION.md](DOCUMENTACION.md)
- [INSTALL.md](INSTALL.md)

## Estado del proyecto

El repositorio ya incluye la base funcional del producto, el frontend publicado, backend desplegable en infraestructura privada y el instalador de Windows generado. El siguiente paso natural es mantenerlo en GitHub para versionado, issues, releases y colaboracion.
