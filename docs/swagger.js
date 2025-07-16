// docs/swagger.js

const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "SMARTUR API",
    version: "1.0.0",
    description: "Documentación de la API de SMARTUR",
    contact: {
      name: "Equipo SMARTUR",
      email: "contacto@smartur.com"
    }
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Servidor local"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Juan Perez" },
          email: { type: "string", example: "juan@correo.com" }
        }
      }
    }
  },
  security: [
    { bearerAuth: [] }
  ],
  tags: [
    { name: "Usuarios", description: "Operaciones relacionadas con usuarios" }
  ],
  paths: {
    "/users": {
      get: {
        tags: ["Usuarios"],
        summary: "Obtiene todos los usuarios",
        responses: {
          200: {
            description: "Lista de usuarios",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" }
                }
              }
            }
          }
        }
      }
    }
  }
};

export default swaggerDocument; 