const db = require("../config/db");

// Ensure accounts table exists
const initAccountsTable = () => {
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            type VARCHAR(50) DEFAULT 'Bank',
            icon VARCHAR(50) DEFAULT 'Landmark',
            initial_balance DECIMAL(15, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY idx_user_account_name (user_id, name)
        )
    `;
  db.query(createTableQuery, (err) => {
    if (err)
      console.error("❌ Failed to ensure accounts table exists:", err.message);
    else console.log("✅ Accounts table verified/created");
  });
};
initAccountsTable();

exports.getAccounts = (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ message: "User ID diperlukan" });

  const query = "SELECT * FROM accounts WHERE user_id = ? ORDER BY name ASC";
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error("Get Accounts Error:", err.message);
      return res
        .status(500)
        .json({ message: "Gagal mengambil data akun: " + err.message });
    }
    res.status(200).json({ data: results });
  });
};

exports.createAccount = (req, res) => {
  const { user_id, name, type, icon, initial_balance } = req.body;
  if (!user_id || !name)
    return res
      .status(400)
      .json({ message: "Data tidak lengkap (user_id dan nama diperlukan)" });

  console.log("Creating account for user:", user_id, "Name:", name);

  const query =
    "INSERT INTO accounts (user_id, name, type, icon, initial_balance) VALUES (?, ?, ?, ?, ?)";
  db.query(
    query,
    [user_id, name, type || "Bank", icon || "Landmark", initial_balance || 0],
    (err, result) => {
      if (err) {
        console.error("Create Account Error:", err.message);
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ message: "Nama akun sudah ada" });
        return res
          .status(500)
          .json({ message: "Gagal menambah akun: " + err.message });
      }
      res.status(201).json({
        message: "Akun berhasil ditambah",
        data: { id: result.insertId, ...req.body },
      });
    },
  );
};

exports.updateAccount = (req, res) => {
  const { id } = req.params;
  const { name, type, icon, initial_balance, user_id } = req.body;

  if (!id || !name)
    return res.status(400).json({ message: "Data tidak lengkap" });

  // Transaction to update account and related transactions
  db.getConnection((err, connection) => {
    if (err)
      return res.status(500).json({ message: "Database connection error" });

    connection.beginTransaction(async (err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: "Transaction error" });
      }

      try {
        // 1. Get old name
        const [oldAcc] = await connection
          .promise()
          .query("SELECT name FROM accounts WHERE id = ?", [id]);
        if (!oldAcc.length) throw new Error("Akun tidak ditemukan");
        const oldName = oldAcc[0].name;

        // 2. Update Account
        await connection
          .promise()
          .query(
            "UPDATE accounts SET name = ?, type = ?, icon = ?, initial_balance = ? WHERE id = ?",
            [name, type, icon, initial_balance, id],
          );

        // 3. Update Transactions (if name changed)
        if (oldName !== name) {
          await connection
            .promise()
            .query(
              "UPDATE transactions SET account = ? WHERE user_id = ? AND account = ?",
              [name, user_id, oldName],
            );
          await connection
            .promise()
            .query(
              "UPDATE transactions SET to_account = ? WHERE user_id = ? AND to_account = ?",
              [name, user_id, oldName],
            );
        }

        connection.commit((err) => {
          if (err) throw err;
          connection.release();
          res.status(200).json({ message: "Akun berhasil diupdate" });
        });
      } catch (error) {
        connection.rollback(() => {
          connection.release();
          console.error("Update Account Error:", error.message);
          res
            .status(500)
            .json({ message: error.message || "Gagal mengupdate akun" });
        });
      }
    });
  });
};

exports.deleteAccount = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "ID diperlukan" });

  const query = "DELETE FROM accounts WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Delete Account Error:", err.message);
      return res.status(500).json({ message: "Gagal menghapus akun" });
    }
    res.status(200).json({ message: "Akun berhasil dihapus" });
  });
};
