import { API_URL } from "../config/api";

/**
 * Budget Service
 * Handles API calls for the budgeting feature.
 */
export const fetchMonthlyBudgets = async (userId, month) => {
  try {
    const response = await fetch(
      `${API_URL}/budgets?user_id=${userId}&month=${month}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch budgets");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetchMonthlyBudgets:", error);
    throw error;
  }
};

export const setBudget = async (userId, categoryId, amount, month) => {
  try {
    const response = await fetch(`${API_URL}/budgets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        category_id: categoryId,
        amount: amount,
        month: month,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save budget");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in setBudget:", error);
    throw error;
  }
};

export const toggleRollover = async (categoryId, isRollover) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_URL}/categories/items/${categoryId}/rollover`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_rollover: isRollover,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to toggle rollover");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in toggleRollover:", error);
    throw error;
  }
};
