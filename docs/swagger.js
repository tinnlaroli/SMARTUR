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
          email: { type: "string", example: "juan@correo.com" },
          role_id: { type: "integer", example: 1 },
          registered_at: { type: "string", format: "date-time", example: "2025-07-16T10:30:00Z" }
        }
      },
      UserCreate: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Juan Perez" },
          email: { type: "string", example: "juan@correo.com" },
          password: { type: "string", example: "password123" },
          role_id: { type: "integer", example: 1 }
        }
      },
      UserUpdate: {
        type: "object",
        properties: {
          name: { type: "string", example: "Juan Perez" },
          email: { type: "string", example: "juan@correo.com" },
          role_id: { type: "integer", example: 1 }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Juan Perez" },
          email: { type: "string", example: "juan@correo.com" },
          password: { type: "string", example: "password123" },
          role_id: { type: "integer", example: 2 }
        }
      },
      RegisterResponse: {
        type: "object",
        properties: {
          status: { type: "integer", example: 201 },
          message: { type: "string", example: "Usuario registrado exitosamente" },
          user: { $ref: "#/components/schemas/User" },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "juan@correo.com" },
          password: { type: "string", example: "password123" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Login exitoso" },
          user: { $ref: "#/components/schemas/User" },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
        }
      },
      TokenResponse: {
        type: "object",
        properties: {
          valid: { type: "boolean", example: true },
          user: { $ref: "#/components/schemas/User" }
        }
      },
      Form: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Formulario de Satisfacción" },
          description: { type: "string", example: "Formulario para evaluar la satisfacción del usuario" },
          created_at: { type: "string", format: "date-time", example: "2025-07-16T10:30:00Z" }
        }
      },
      Recommendation: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Recomendación personalizada" },
          description: { type: "string", example: "Descripción de la recomendación" },
          created_at: { type: "string", format: "date-time", example: "2025-07-16T10:30:00Z" }
        }
      },
      History: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          action: { type: "string", example: "form_completed" },
          description: { type: "string", example: "Usuario completó formulario" },
          created_at: { type: "string", format: "date-time", example: "2025-07-16T10:30:00Z" }
        }
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Nueva recomendación" },
          message: { type: "string", example: "Tienes una nueva recomendación disponible" },
          is_read: { type: "boolean", example: false },
          created_at: { type: "string", format: "date-time", example: "2025-07-16T10:30:00Z" }
        }
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Error message" },
          error: { type: "string", example: "Detailed error description" }
        }
      },
      Success: {
        type: "object",
        properties: {
          message: { type: "string", example: "Operation successful" }
        }
      }
    }
  },
  security: [
    { bearerAuth: [] }
  ],
  tags: [
    { name: "Usuarios", description: "Operaciones relacionadas con usuarios" },
    { name: "Autenticación", description: "Operaciones de login, logout y verificación de tokens" },
    { name: "Formularios", description: "Operaciones relacionadas con formularios de usuario" },
    { name: "Recomendaciones", description: "Operaciones relacionadas con recomendaciones" },
    { name: "Historial", description: "Operaciones relacionadas con el historial de usuario" },
    { name: "Notificaciones", description: "Operaciones relacionadas con notificaciones" }
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
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Usuarios"],
        summary: "Crea un nuevo usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserCreate" }
            }
          }
        },
        responses: {
          201: {
            description: "Usuario creado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Usuario creado exitosamente" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          400: {
            description: "Datos inválidos o email ya registrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/users/{id}": {
      get: {
        tags: ["Usuarios"],
        summary: "Obtiene un usuario por ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID del usuario"
          }
        ],
        responses: {
          200: {
            description: "Usuario encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          },
          404: {
            description: "Usuario no encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      put: {
        tags: ["Usuarios"],
        summary: "Actualiza un usuario",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID del usuario"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserUpdate" }
            }
          }
        },
        responses: {
          200: {
            description: "Usuario actualizado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Usuario actualizado exitosamente" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          400: {
            description: "Email ya registrado por otro usuario",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          404: {
            description: "Usuario no encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Usuarios"],
        summary: "Elimina un usuario",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID del usuario"
          }
        ],
        responses: {
          200: {
            description: "Usuario eliminado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Usuario eliminado exitosamente" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          404: {
            description: "Usuario no encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/register": {
      post: {
        tags: ["Autenticación"],
        summary: "Registra un nuevo usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Usuario registrado exitosamente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterResponse" }
              }
            }
          },
          400: {
            description: "Datos inválidos o email ya registrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Inicia sesión de usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Login exitoso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          400: {
            description: "Datos inválidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          401: {
            description: "Credenciales inválidas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/logout": {
      post: {
        tags: ["Autenticación"],
        summary: "Cierra sesión de usuario",
        responses: {
          200: {
            description: "Logout exitoso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Success" }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/verify-token": {
      get: {
        tags: ["Autenticación"],
        summary: "Verifica la validez del token JWT",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Token válido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokenResponse" }
              }
            }
          },
          401: {
            description: "Token inválido o no proporcionado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/users/{id}/forms": {
      get: {
        tags: ["Formularios"],
        summary: "Obtiene los formularios de un usuario",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID del usuario"
          }
        ],
        responses: {
          200: {
            description: "Lista de formularios del usuario",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Form" }
                }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/users/{id}/recommendations": {
      get: {
        tags: ["Recomendaciones"],
        summary: "Obtiene las recomendaciones de un usuario",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID del usuario"
          }
        ],
        responses: {
          200: {
            description: "Lista de recomendaciones del usuario",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Recommendation" }
                }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/users/{id}/history": {
      get: {
        tags: ["Historial"],
        summary: "Obtiene el historial de un usuario",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID del usuario"
          }
        ],
        responses: {
          200: {
            description: "Historial del usuario",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/History" }
                }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/users/{id}/notifications": {
      get: {
        tags: ["Notificaciones"],
        summary: "Obtiene las notificaciones de un usuario",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID del usuario"
          }
        ],
        responses: {
          200: {
            description: "Lista de notificaciones del usuario",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Notification" }
                }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/users/{id}/notifications/{notification_id}/read": {
      put: {
        tags: ["Notificaciones"],
        summary: "Marca una notificación como leída",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID del usuario"
          },
          {
            name: "notification_id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID de la notificación"
          }
        ],
        responses: {
          200: {
            description: "Notificación marcada como leída",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Notificación marcada como leída" },
                    notification: { $ref: "#/components/schemas/Notification" }
                  }
                }
              }
            }
          },
          404: {
            description: "Notificación no encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Error del servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    }
  }
};

export default swaggerDocument; 