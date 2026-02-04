import { API_URL } from "../config/api";

const getHeaders = () => {
  return {
    "Content-Type": "application/json",
    // Credentials include cookie automatically in fetch, headers might need Auth if not cookie
    // But App.jsx uses credentials: "include"
  };
};

export const fetchCategories = async () => {
  const response = await fetch(`${API_URL}/api/categories`, {
    method: "GET",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch categories");
  return await response.json();
};

export const createGroup = async (data) => {
  const response = await fetch(`${API_URL}/api/categories/groups`, {
    method: "POST",
    credentials: "include",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create group");
  return await response.json();
};

export const updateGroup = async (id, data) => {
  const response = await fetch(`${API_URL}/api/categories/groups/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update group");
  return await response.json();
};

export const deleteGroup = async (id) => {
  const response = await fetch(`${API_URL}/api/categories/groups/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete group");
  return true;
};

export const createCategory = async (data) => {
  const response = await fetch(`${API_URL}/api/categories/items`, {
    method: "POST",
    credentials: "include",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create category");
  return await response.json();
};

export const updateCategory = async (id, data) => {
  const response = await fetch(`${API_URL}/api/categories/items/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update category");
  return await response.json();
};

export const deleteCategory = async (id) => {
  const response = await fetch(`${API_URL}/api/categories/items/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete category");
  return true;
};
