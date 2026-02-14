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
  Tag,
  Layers,
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
      loadCategories();
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

  const renderExpenseTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Layers className="text-sky-600" size={20} />
          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider text-xs">
            Expense Groups
          </h3>
        </div>
        <button
          onClick={() => handleOpenModal("create", "group")}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/20 dark:shadow-blue-900/20 transition-all active:scale-95"
        >
          <FolderPlus size={16} />
          <span>New Group</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {data.expense.map((group) => (
          <div
            key={group.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-sky-500/30 dark:hover:border-blue-500/30"
          >
            <div
              className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${expandedGroups[group.id] ? "bg-slate-50 dark:bg-slate-800/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-xl ${expandedGroups[group.id] ? "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"}`}
                >
                  {expandedGroups[group.id] ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-lg block">
                    {group.name}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {group.subCategories?.length || 0} Sub-Categories
                  </span>
                </div>
              </div>
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() =>
                    handleOpenModal("create", "item", null, group.id)
                  }
                  className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white rounded-2xl transition-all shadow-sm group"
                  title="Add Sub-Category"
                >
                  <Plus
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                </button>
                <button
                  onClick={() => handleOpenModal("edit", "group", group)}
                  className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 rounded-2xl transition-all"
                >
                  <Edit2 size={18} />
                </button>
                {!group.is_default && (
                  <button
                    onClick={() => handleDelete("group", group.id)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {expandedGroups[group.id] && (
              <div className="px-5 pb-5 pt-2 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
                {group.subCategories && group.subCategories.length > 0 ? (
                  group.subCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group flex items-center justify-between p-4 ml-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-sky-200 dark:hover:border-blue-800 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal("edit", "item", cat)}
                          className="p-2 text-slate-300 hover:text-sky-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        {!cat.is_default && (
                          <button
                            onClick={() => handleDelete("item", cat.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl ml-6">
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                      No sub-categories yet
                    </p>
                    <button
                      onClick={() =>
                        handleOpenModal("create", "item", null, group.id)
                      }
                      className="mt-3 text-sky-600 text-[10px] font-black uppercase tracking-widest hover:text-sky-700 transition-colors"
                    >
                      + Add First Sub-Category
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderIncomeTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Tag className="text-emerald-600 dark:text-emerald-400" size={20} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">
            Income Categories
          </h3>
        </div>
        <button
          onClick={() => handleOpenModal("create", "item")}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <FilePlus size={16} />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.income.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-500/30 dark:hover:border-emerald-500/20 transition-all group"
          >
            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                {cat.name}
              </span>
              <span className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">
                Income Source
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenModal("edit", "item", cat)}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-blue-400 rounded-xl transition-all"
              >
                <Edit2 size={16} />
              </button>
              {!cat.is_default && (
                <button
                  onClick={() => handleDelete("item", cat.id)}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all"
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 dark:bg-blue-900/20 border border-sky-200 dark:border-blue-800 rounded-full">
            <Tag size={12} className="text-sky-600 dark:text-blue-400" />
            <span className="text-[10px] font-black text-sky-600 dark:text-blue-400 uppercase tracking-widest">
              Structure
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Manage Categories
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
            Organize your income and expenses with a professional hierarchical
            structure.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-fit mb-10 border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setActiveTab("expense")}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
            activeTab === "expense"
              ? "bg-slate-900 dark:bg-blue-600 text-white shadow-lg"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <Layers
            size={14}
            className={activeTab === "expense" ? "text-sky-400" : ""}
          />
          Expenses
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
            activeTab === "income"
              ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <Tag size={14} />
          Income
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col h-64 items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <span className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">
            Syncing Data...
          </span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 text-rose-400 rounded-3xl border border-rose-500/20 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-3 bg-rose-500/20 dark:bg-rose-900/30 rounded-2xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="font-bold text-white dark:text-rose-100 uppercase tracking-wider text-xs mb-1">
              Error Occurred
            </p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      ) : activeTab === "expense" ? (
        renderExpenseTab()
      ) : (
        renderIncomeTab()
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-8 border-b border-white/5 bg-white/5">
              <div>
                <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest block mb-1">
                  Category Editor
                </span>
                <h3 className="font-black text-white text-xl tracking-tight">
                  {modalMode === "create" ? "Add New" : "Edit"}{" "}
                  {modalType === "group" ? "Group" : "Category"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                  placeholder={`Enter ${modalType} name...`}
                />
              </div>

              {activeTab === "expense" && modalType === "item" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Select Parent Group
                  </label>
                  <select
                    value={formData.group_id}
                    onChange={(e) =>
                      setFormData({ ...formData, group_id: e.target.value })
                    }
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all font-medium appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-slate-900">
                      Select a Group
                    </option>
                    {data.expense.map((g) => (
                      <option key={g.id} value={g.id} className="bg-slate-900">
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-3 px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
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
