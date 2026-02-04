import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FilePlus,
  X,
  Save,
  AlertCircle,
} from "lucide-react";
import {
  fetchCategories,
  createGroup,
  updateGroup,
  deleteGroup,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";

const CategoryManagementOrganism = () => {
  const [activeTab, setActiveTab] = useState("expense"); // 'expense' | 'income'
  const [data, setData] = useState({ expense: [], income: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [modalType, setModalType] = useState("item"); // 'group' | 'item'
  const [editingItem, setEditingItem] = useState(null); // The object being edited

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    group_id: "", // For items
    type: "expense",
  });

  // Accordion State
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await fetchCategories();
      setData(result);
      // result structure: { expense: [{id, name, subCategories: []}, ...], income: [ {id, name}... ] }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleOpenModal = (mode, type, item = null, parentGroupId = null) => {
    setModalMode(mode);
    setModalType(type);
    setEditingItem(item);

    setFormData({
      name: item ? item.name : "",
      group_id: parentGroupId || (item ? item.group_id : "") || "",
      type: activeTab,
    });

    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "group") {
        if (modalMode === "create") {
          await createGroup({ name: formData.name, type: formData.type });
        } else {
          await updateGroup(editingItem.id, { name: formData.name });
        }
      } else {
        // Item (Category)
        if (modalMode === "create") {
          await createCategory({
            name: formData.name,
            type: formData.type,
            group_id: formData.type === "expense" ? formData.group_id : null,
          });
        } else {
          await updateCategory(editingItem.id, {
            name: formData.name,
            group_id: formData.type === "expense" ? formData.group_id : null,
          });
        }
      }

      setIsModalOpen(false);
      loadCategories(); // Refresh
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      if (type === "group") {
        await deleteGroup(id);
      } else {
        await deleteCategory(id);
      }
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- RENDER HELPERS ---

  const renderExpenseTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Expense Groups</h3>
        <button
          onClick={() => handleOpenModal("create", "group")}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition shadow-sm"
        >
          <FolderPlus size={18} />
          <span>New Group</span>
        </button>
      </div>

      {data.expense.map((group) => (
        <div
          key={group.id}
          className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white"
        >
          <div
            className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition"
            onClick={() => toggleGroup(group.id)}
          >
            <div className="flex items-center gap-3">
              {expandedGroups[group.id] ? (
                <ChevronDown size={20} className="text-slate-400" />
              ) : (
                <ChevronRight size={20} className="text-slate-400" />
              )}
              <span className="font-semibold text-slate-800 text-lg">
                {group.name}
              </span>
              <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded-full">
                {group.subCategories?.length || 0}
              </span>
            </div>
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Add Sub Category Button */}
              <button
                onClick={() =>
                  handleOpenModal("create", "item", null, group.id)
                }
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full"
                title="Add Sub-Category"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => handleOpenModal("edit", "group", group)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
              >
                <Edit2 size={18} />
              </button>
              {!group.is_default && (
                <button
                  onClick={() => handleDelete("group", group.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          {expandedGroups[group.id] && (
            <div className="p-2 bg-white space-y-1">
              {group.subCategories && group.subCategories.length > 0 ? (
                group.subCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 ml-8 rounded-lg hover:bg-slate-50 border-l-2 border-transparent hover:border-emerald-400 transition"
                  >
                    <span className="text-slate-600">{cat.name}</span>
                    <div className="flex gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal("edit", "item", cat)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!cat.is_default && (
                        <button
                          onClick={() => handleDelete("item", cat.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm italic">
                  No sub-categories yet. Click + to add one.
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderIncomeTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700">
          Income Categories
        </h3>
        <button
          onClick={() => handleOpenModal("create", "item")}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
        >
          <FilePlus size={18} />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.income.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition"
          >
            <span className="font-semibold text-slate-700">{cat.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenModal("edit", "item", cat)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
              >
                <Edit2 size={16} />
              </button>
              {!cat.is_default && (
                <button
                  onClick={() => handleDelete("item", cat.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Manage Categories
          </h1>
          <p className="text-slate-500 text-sm">
            Organize your financial tracking structure
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit mb-8 border border-slate-200">
        <button
          onClick={() => setActiveTab("expense")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "expense"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "income"
              ? "bg-emerald-600 text-white shadow-sm" // Income usually Green
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Income
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          Loading categories...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : activeTab === "expense" ? (
        renderExpenseTab()
      ) : (
        renderIncomeTab()
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">
                {modalMode === "create" ? "Add" : "Edit"}{" "}
                {modalType === "group" ? "Group" : "Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder={`Enter ${modalType} name...`}
                />
              </div>

              {activeTab === "expense" && modalType === "item" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Group
                  </label>
                  <select
                    value={formData.group_id}
                    onChange={(e) =>
                      setFormData({ ...formData, group_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                    required
                  >
                    <option value="" disabled>
                      Select a Group
                    </option>
                    {data.expense.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementOrganism;
