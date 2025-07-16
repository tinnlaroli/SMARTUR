import User from "../Models/userModel.js";

class UserController {
  static async findAllUsers(req, res) {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createUser(req, res) {
    try {
      const { name, email, password, role_id } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Nombre, email y contraseña son requeridos"
        });
      }

      const user = await User.createUser({ name, email, password, role_id });
      res.status(201).json({
        message: "Usuario creado exitosamente",
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
          registered_at: user.registered_at
        }
      });
    } catch (error) {
      if (error.message === "El email ya está registrado") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const user = await User.updateUser(req.params.id, req.body);
      res.status(200).json({
        message: "Usuario actualizado exitosamente",
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
          registered_at: user.registered_at
        }
      });
    } catch (error) {
      if (error.message === "Usuario no encontrado") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "El email ya está registrado por otro usuario") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteUser(req, res) {
    try {
      const user = await User.deleteUser(req.params.id);
      res.json({
        message: "Usuario eliminado exitosamente",
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      if (error.message === "Usuario no encontrado") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son requeridos"
      });
    }

    try {
      const result = await User.login({ email, password });
      if (result.status === 200) {
        return res.status(200).json(result);
      }
      return res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error("Error en loginUser controller:", error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  }

  static async registerUser(req, res) {
    const { name, email, password, role_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Nombre, email y contraseña son requeridos"
      });
    }

    try {
      const result = await User.register({ name, email, password, role_id });
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Error en registerUser controller:", error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  }

  static async logoutUser(req, res) {
    try {
      const result = await User.logout();
      return res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error("Error en logoutUser controller:", error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  }

  static async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" });
      }

      const result = await User.verifyToken(token);
      if (result.status === 200) {
        return res.status(200).json(result);
      }
      return res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error("Error en verifyToken controller:", error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  }

  static async getUserForms(req, res) {
    try {
      const forms = await User.getUserForms(req.params.id);
      res.json(forms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getUserRecommendations(req, res) {
    try {
      const recommendations = await User.getUserRecommendations(req.params.id);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getUserHistory(req, res) {
    try {
      const history = await User.getUserHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getUserNotifications(req, res) {
    try {
      const notifications = await User.getUserNotifications(req.params.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markNotificationAsRead(req, res) {
    try {
      const { notification_id } = req.params;
      const user_id = req.params.id;

      const notification = await User.markNotificationAsRead(notification_id, user_id);
      if (!notification) {
        return res.status(404).json({ message: "Notificación no encontrada" });
      }

      res.json({
        message: "Notificación marcada como leída",
        notification
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default UserController;
