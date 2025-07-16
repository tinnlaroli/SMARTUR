import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

class User {

  static async findAll() {
    const result = await pool.query(`
      SELECT u.user_id, u.name, u.email, u.role_id, u.registered_at, r.name as role_name 
      FROM "user" u 
      JOIN role r ON u.role_id = r.role_id
    `);
    return result.rows;
  }


  static async findById(user_id) {
    const result = await pool.query(`
      SELECT u.user_id, u.name, u.email, u.role_id, u.registered_at, r.name as role_name 
      FROM "user" u 
      JOIN role r ON u.role_id = r.role_id 
      WHERE u.user_id = $1
    `, [user_id]);
    return result.rows[0];
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const result = await pool.query(`
      SELECT u.user_id, u.name, u.email, u.password, u.role_id, u.registered_at, r.name as role_name 
      FROM "user" u 
      JOIN role r ON u.role_id = r.role_id 
      WHERE u.email = $1
    `, [email]);
    return result.rows[0];
  }


  static async createUser(data) {
    const { name, email, password, role_id = 2 } = data;
   
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error("El email ya está registrado");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(`
      INSERT INTO "user" (name, email, password, role_id) 
      VALUES ($1, $2, $3, $4) 
      RETURNING user_id, name, email, role_id, registered_at
    `, [name, email, hashedPassword, role_id || 2]);

    return result.rows[0];
  }

  // Método específico para registro de usuarios
  static async register(data) {
    const { name, email, password, role_id = 2 } = data;
   
    // Verificar si el usuario ya existe
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      return {
        status: 400,
        message: "El email ya está registrado"
      };
    }

    try {
      // Crear el usuario
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      const result = await pool.query(`
        INSERT INTO "user" (name, email, password, role_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING user_id, name, email, role_id, registered_at
      `, [name, email, hashedPassword, role_id || 2]);

      const newUser = result.rows[0];

      // Generar token JWT
      const token = jwt.sign(
        { 
          user_id: newUser.user_id, 
          email: newUser.email, 
          role_id: newUser.role_id 
        },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
      );

      return {
        status: 201,
        message: "Usuario registrado exitosamente",
        user: {
          id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
          role_id: newUser.role_id,
          registered_at: newUser.registered_at
        },
        token
      };
    } catch (error) {
      console.error("Error en registro:", error);
      return {
        status: 500,
        message: "Error interno del servidor"
      };
    }
  }


  static async updateUser(user_id, data) {
    const { name, email, password, role_id } = data;


    const existingUser = await this.findById(user_id);
    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    if (email && email !== existingUser.email) {
      const emailExists = await this.findByEmail(email);
      if (emailExists && emailExists.user_id !== user_id) {
        throw new Error("El email ya está registrado por otro usuario");
      }
    }

    let hashedPassword = existingUser.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const result = await pool.query(`
      UPDATE "user" 
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          password = $3,
          role_id = COALESCE($4, role_id)
      WHERE user_id = $5 
      RETURNING user_id, name, email, role_id, registered_at
    `, [name, email, hashedPassword, role_id, user_id]);

    return result.rows[0];
  }

  
  static async deleteUser(user_id) {
    const existingUser = await this.findById(user_id);
    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    const result = await pool.query(`
      DELETE FROM "user" 
      WHERE user_id = $1 
      RETURNING user_id, name, email
    `, [user_id]);

    return result.rows[0];
  }

  // Autenticación de usuario
  static async login(data) {
    const { email, password } = data;

    try {
      const user = await this.findByEmail(email);

      if (!user) {
        return { status: 400, message: "Usuario no encontrado" };
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return { status: 400, message: "Contraseña incorrecta" };
      }

      const token = jwt.sign(
        {
          id: user.user_id,
          email: user.email,
          role: user.role_name
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      return {
        status: 200,
        message: "Login exitoso",
        token,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role_name
        }
      };
    } catch (error) {
      console.error("Error en login:", error);
      return { status: 500, message: "Error del servidor" };
    }
  }

 
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await this.findById(decoded.id);

      if (!user) {
        return { status: 401, message: "Token inválido" };
      }

      return {
        status: 200,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role_name
        }
      };
    } catch (error) {
      return { status: 401, message: "Token inválido" };
    }
  }

  
  static async logout() {
    return {
      status: 200,
      message: "Logout exitoso"
    };
  }

 
  static async getUserForms(user_id) {
    const result = await pool.query(`
      SELECT * FROM form WHERE user_id = $1 ORDER BY response_date DESC
    `, [user_id]);
    return result.rows;
  }

 
  static async getUserRecommendations(user_id) {
    const result = await pool.query(`
      SELECT r.*, f.age, f.daily_budget, f.travel_days
      FROM recommendation r
      JOIN form f ON r.form_id = f.form_id
      WHERE r.user_id = $1 
      ORDER BY r.generated_at DESC
    `, [user_id]);
    return result.rows;
  }

  
  static async getUserHistory(user_id) {
    const result = await pool.query(`
      SELECT h.*, r.total_score, r.generated_at
      FROM history h
      JOIN recommendation r ON h.recommendation_id = r.recommendation_id
      WHERE h.user_id = $1 
      ORDER BY h.date DESC
    `, [user_id]);
    return result.rows;
  }

  static async getUserNotifications(user_id) {
    const result = await pool.query(`
      SELECT * FROM notification 
      WHERE user_id = $1 
      ORDER BY sent_at DESC
    `, [user_id]);
    return result.rows;
  }

  static async markNotificationAsRead(notification_id, user_id) {
    const result = await pool.query(`
      UPDATE notification 
      SET read = true 
      WHERE notification_id = $1 AND user_id = $2 
      RETURNING *
    `, [notification_id, user_id]);
    return result.rows[0];
  }
}

export default User;