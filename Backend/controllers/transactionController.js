const db = require("../config/db");
const notificationController = require("./notificationController");
const transactionService = require("../services/transactionService");

exports.createTransaction = async (req, res) => {
  try {
    const result = await transactionService.createTransaction(req.body);
    res.status(201).json({
      message: "Transaksi berhasil disimpan",
      data: result,
    });
  } catch (err) {
    console.error("Create Transaction Error:", err.message);
    res.status(500).json({ message: "Gagal menyimpan transaksi" });
  }
};

exports.getTransactions = (req, res) => {
  const {
    user_id,
    startDate,
    endDate,
    type,
    category,
    account,
    limit,
    search,
    sortBy,
    sortOrder,
    page,
  } = req.query;
  console.log("[DEBUG] getTransactions Params:", { category, account, type });

  if (!user_id) {
    return res.status(400).json({ message: "User ID diperlukan" });
  }

  let query = "SELECT * FROM transactions WHERE user_id = ?";
  let params = [user_id];

  // Search filter
  if (search) {
    query +=
      " AND (description LIKE ? OR category LIKE ? OR account LIKE ? OR payment_method LIKE ?)";
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (startDate && endDate) {
    query += " AND date BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  if (type && type !== "all") {
    query += " AND type = ?";
    params.push(type);
  }

  if (category) {
    if (category.includes(",")) {
      const cats = category.split(",");
      query += ` AND category IN (${cats.map(() => "?").join(",")})`;
      params.push(...cats);
    } else {
      query += " AND category = ?";
      params.push(category);
    }
  }

  if (account) {
    query += " AND account = ?";
    params.push(account);
  }

  if (req.query.status && req.query.status !== "all") {
    query += " AND status = ?";
    params.push(req.query.status);
  }

  // Sort
  const validSortKeys = [
    "date",
    "category",
    "description",
    "payment_method",
    "account",
    "status",
    "amount",
  ];
  const sortKey = validSortKeys.includes(sortBy) ? sortBy : "date";
  const direction = sortOrder === "asc" ? "ASC" : "DESC";
  query += ` ORDER BY ${sortKey} ${direction}, created_at DESC`;

  // Pagination
  if (limit) {
    const limitVal = parseInt(limit);
    const pageVal = parseInt(page) || 1;
    const offset = (pageVal - 1) * limitVal;
    query += " LIMIT ? OFFSET ?";
    params.push(limitVal, offset);
  }

  // Get total count for pagination metadata
  let countQuery =
    "SELECT COUNT(*) as total FROM transactions WHERE user_id = ?";
  let countParams = [user_id];
  if (search) {
    countQuery +=
      " AND (description LIKE ? OR category LIKE ? OR account LIKE ? OR payment_method LIKE ?)";
    countParams.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    );
  }
  if (startDate && endDate) {
    countQuery += " AND date BETWEEN ? AND ?";
    countParams.push(startDate, endDate);
  }
  if (type && type !== "all") {
    countQuery += " AND type = ?";
    countParams.push(type);
  }

  if (category) {
    if (category.includes(",")) {
      const cats = category.split(",");
      countQuery += ` AND category IN (${cats.map(() => "?").join(",")})`;
      countParams.push(...cats);
    } else {
      countQuery += " AND category = ?";
      countParams.push(category);
    }
  }

  if (account) {
    countQuery += " AND account = ?";
    countParams.push(account);
  }

  if (req.query.status && req.query.status !== "all") {
    countQuery += " AND status = ?";
    countParams.push(req.query.status);
  }

  db.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error("Count Transactions Error:", err);
      return res
        .status(500)
        .json({ message: "Gagal mengambil total data transaksi" });
    }

    const totalItems = countResult[0].total;

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Get Transactions Error:", err);
        return res
          .status(500)
          .json({ message: "Gagal mengambil data transaksi" });
      }

      res.status(200).json({
        message: "Data transaksi diambil",
        data: results,
        pagination: {
          totalItems,
          currentPage: parseInt(page) || 1,
          limit: limit ? parseInt(limit) : results.length,
          totalPages: limit ? Math.ceil(totalItems / parseInt(limit)) : 1,
        },
      });
    });
  });
};

exports.updateTransaction = (req, res) => {
  const { id } = req.params;
  const {
    date,
    type,
    category,
    amount,
    description,
    payment_method,
    account,
    to_account,
    status,
  } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Transaction ID is required" });
  }

  // Cast amount to Number for correct DB storage
  const numAmount = Number(amount);

  console.log(`[Update] Transaction ${id}:`, {
    date,
    type,
    category,
    numAmount,
    description,
    payment_method,
    account,
    to_account,
    status,
  });

  const query = `
        UPDATE transactions 
        SET date=?, type=?, category=?, amount=?, description=?, payment_method=?, account=?, to_account=?, status=? 
        WHERE id=?
    `;

  // Default values if not provided
  const val_payment = payment_method || "Cash";
  const val_account = account || "Cash Account";
  const val_to_account = to_account || null;
  const val_status = status || "done";

  db.query(
    query,
    [
      date,
      type,
      category,
      numAmount,
      description,
      val_payment,
      val_account,
      val_to_account,
      val_status,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("Update Transaction Error:", err);
        return res.status(500).json({ message: "Gagal mengupdate transaksi" });
      }

      if (result.affectedRows === 0) {
        console.warn(`[Update] Transaction ${id} not found`);
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      console.log(
        `[Update] Success: Transaction ${id} updated (Affected rows: ${result.affectedRows})`,
      );

      // Get user_id from request body for notification
      if (req.body.user_id) {
        const notifTitle = `Transaction Updated`;
        const notifMessage = `${category}: Rp ${numAmount.toLocaleString("id-ID")} has been updated`;
        notificationController.createNotification(
          req.body.user_id,
          "transaction_updated",
          notifTitle,
          notifMessage,
        );
      }

      // BROADCAST REAL-TIME UPDATE
      if (global.io) {
        console.log(`📢 Broadcasting transaction_updated event for ID: ${id}`);
        global.io.emit("transaction_updated", {
          type: "update",
          data: { id, user_id: req.body.user_id },
        });
      }

      res.status(200).json({
        message: "Transaksi berhasil diupdate",
        data: { id, ...req.body, amount: numAmount },
      });
    },
  );
};

exports.deleteTransaction = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Transaction ID is required" });
  }

  // First get transaction details for notification
  const getQuery =
    "SELECT user_id, category, amount FROM transactions WHERE id = ?";

  db.query(getQuery, [id], (err, transactions) => {
    if (err) {
      console.error("Get Transaction Error:", err);
      return res.status(500).json({ message: "Gagal menghapus transaksi" });
    }

    if (transactions.length === 0) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    const transaction = transactions[0];
    const deleteQuery = "DELETE FROM transactions WHERE id = ?";

    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error("Delete Transaction Error:", err);
        return res.status(500).json({ message: "Gagal menghapus transaksi" });
      }

      // Create notification
      const notifTitle = `Transaction Deleted`;
      const notifMessage = `${transaction.category}: Rp ${transaction.amount.toLocaleString("id-ID")} has been deleted`;
      notificationController.createNotification(
        transaction.user_id,
        "transaction_deleted",
        notifTitle,
        notifMessage,
      );

      // BROADCAST REAL-TIME UPDATE
      if (global.io) {
        console.log(
          `📢 Broadcasting transaction_updated event for deleted ID: ${id}`,
        );
        global.io.emit("transaction_updated", {
          type: "delete",
          data: { id, user_id: transaction.user_id },
        });
      }

      res.status(200).json({
        message: "Transaksi berhasil dihapus",
      });
    });
  });
};
