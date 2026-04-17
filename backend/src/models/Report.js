const { v4: uuidv4 } = require("uuid");
const { pool, DB_DIALECT } = require("../config/database");

class Report {
  static async create(data) {
    const id = uuidv4();
    const { title, description, location, latitude, longitude, image_url } =
      data;

    try {
      if (DB_DIALECT === "postgres") {
        const query = `
          INSERT INTO reports (id, title, description, location, latitude, longitude, image_url, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
          RETURNING *
        `;
        const result = await pool.query(query, [
          id,
          title,
          description,
          location,
          latitude,
          longitude,
          image_url,
        ]);
        return result.rows[0];
      } else {
        const query = `
          INSERT INTO reports (id, title, description, location, latitude, longitude, image_url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `;
        const connection = await pool.getConnection();
        await connection.query(query, [
          id,
          title,
          description,
          location,
          latitude,
          longitude,
          image_url,
        ]);
        connection.release();
        return {
          id,
          title,
          description,
          location,
          latitude,
          longitude,
          image_url,
          status: "pending",
        };
      }
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      if (DB_DIALECT === "postgres") {
        const query = "SELECT * FROM reports ORDER BY created_at DESC";
        const result = await pool.query(query);
        return result.rows;
      } else {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
          "SELECT * FROM reports ORDER BY created_at DESC",
        );
        connection.release();
        return rows;
      }
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      if (DB_DIALECT === "postgres") {
        const query = "SELECT * FROM reports WHERE id = $1";
        const result = await pool.query(query, [id]);
        return result.rows[0];
      } else {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
          "SELECT * FROM reports WHERE id = ?",
          [id],
        );
        connection.release();
        return rows[0];
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      if (DB_DIALECT === "postgres") {
        const query = `
          UPDATE reports 
          SET status = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2 
          RETURNING *
        `;
        const result = await pool.query(query, [status, id]);
        return result.rows[0];
      } else {
        const connection = await pool.getConnection();
        await connection.query(
          "UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [status, id],
        );
        connection.release();
        return await this.findById(id);
      }
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      if (DB_DIALECT === "postgres") {
        const query = "DELETE FROM reports WHERE id = $1";
        await pool.query(query, [id]);
      } else {
        const connection = await pool.getConnection();
        await connection.query("DELETE FROM reports WHERE id = ?", [id]);
        connection.release();
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Report;
