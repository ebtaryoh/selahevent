"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Package,
  Download,
  CheckCircle2,
  Clock,
  QrCode,
  Tag,
  Pencil,
  Trash2,
  X,
  Loader2,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Filter,
} from "lucide-react";
import { formatMoney } from "@/lib/format";

export type DashboardProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: string;
  category: string;
  imageUrl?: string | null;
  stockQuantity: number;
  soldCount: number;
  downloadUrl?: string | null;
  variants?: string[] | null;
  requiresPickup?: boolean;
  allowAddonAtCheckout?: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string | Date;
};

export type DashboardOrderItem = {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  productType: string;
  variant?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  status: string;
  fulfillmentStatus: string;
  pickupVoucherCode: string;
  collectedAt?: string | Date | null;
  collectedByStaffName?: string | null;
  createdAt: string | Date;
};

export function DashboardProductsManager({
  eventId,
  eventTitle,
  currency,
  initialProducts,
  initialOrders,
  initialStats,
}: {
  eventId: string;
  eventTitle: string;
  currency: string;
  initialProducts: DashboardProduct[];
  initialOrders: DashboardOrderItem[];
  initialStats: {
    totalRevenue: number;
    totalSoldUnits: number;
    pendingPickups: number;
    activeProductsCount: number;
  };
}) {
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");
  const [products, setProducts] = useState<DashboardProduct[]>(initialProducts);
  const [orders, setOrders] = useState<DashboardOrderItem[]>(initialOrders);
  const [stats, setStats] = useState(initialStats);

  // Search & Filter
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "collected">("all");
  const [voucherInput, setVoucherInput] = useState("");
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  // Product Modal State (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DashboardProduct | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("0");
  const [formType, setFormType] = useState<"physical" | "digital">("physical");
  const [formCategory, setFormCategory] = useState("Merchandise");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formStock, setFormStock] = useState("-1");
  const [formDownloadUrl, setFormDownloadUrl] = useState("");
  const [formVariants, setFormVariants] = useState("");
  const [formAllowAddon, setFormAllowAddon] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);

  // Variant generator assistant
  const [builderColors, setBuilderColors] = useState("");
  const [builderSizes, setBuilderSizes] = useState("");
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);

  const handleGenerateCombinations = () => {
    const colors = builderColors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const sizes = builderSizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (colors.length === 0 && sizes.length === 0) return;

    if (colors.length > 0 && sizes.length > 0) {
      const combos: string[] = [];
      for (const c of colors) {
        for (const s of sizes) {
          combos.push(`${c} / ${s}`);
        }
      }
      setFormVariants(combos.join(", "));
      setGeneratedCount(combos.length);
    } else if (colors.length > 0) {
      setFormVariants(colors.join(", "));
      setGeneratedCount(colors.length);
    } else if (sizes.length > 0) {
      setFormVariants(sizes.join(", "));
      setGeneratedCount(sizes.length);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("0");
    setFormType("physical");
    setFormCategory("Merchandise");
    setFormImageUrl("");
    setFormStock("-1");
    setFormDownloadUrl("");
    setFormVariants("");
    setBuilderColors("");
    setBuilderSizes("");
    setFormAllowAddon(true);
    setFormIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: DashboardProduct) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDescription(p.description);
    setFormPrice(String(p.price));
    setFormType(p.type === "digital" ? "digital" : "physical");
    setFormCategory(p.category || "Merchandise");
    setFormImageUrl(p.imageUrl || "");
    setFormStock(String(p.stockQuantity));
    setFormDownloadUrl(p.downloadUrl || "");
    setFormVariants(Array.isArray(p.variants) ? p.variants.join(", ") : "");
    setFormAllowAddon(p.allowAddonAtCheckout !== false);
    setFormIsActive(p.isActive !== false);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Product name is required.");
      return;
    }

    setSavingProduct(true);
    setFormError(null);

    const variantsArray = formVariants
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      price: parseInt(formPrice, 10) || 0,
      currency,
      type: formType,
      category: formCategory,
      imageUrl: formImageUrl.trim() || null,
      stockQuantity: parseInt(formStock, 10) || -1,
      downloadUrl: formType === "digital" ? formDownloadUrl.trim() || null : null,
      variants: variantsArray,
      allowAddonAtCheckout: formAllowAddon,
      isActive: formIsActive,
      requiresPickup: formType === "physical",
    };

    try {
      if (editingProduct) {
        // PATCH
        const res = await fetch(`/api/events/${eventId}/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Update failed");

        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...data.product } : p))
        );
      } else {
        // POST
        const res = await fetch(`/api/events/${eventId}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Creation failed");

        setProducts((prev) => [data.product, ...prev]);
        setStats((prev) => ({
          ...prev,
          activeProductsCount: prev.activeProductsCount + (data.product.isActive ? 1 : 0),
        }));
      }

      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save product");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      alert("Failed to delete product.");
    }
  };

  const handleToggleActive = async (product: DashboardProduct) => {
    try {
      const newStatus = !product.isActive;
      const res = await fetch(`/api/events/${eventId}/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isActive: newStatus } : p))
        );
        setStats((prev) => ({
          ...prev,
          activeProductsCount: prev.activeProductsCount + (newStatus ? 1 : -1),
        }));
      }
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleFulfillOrder = async (orderItemId?: string, voucherCode?: string) => {
    setScanLoading(true);
    setScanMessage(null);

    try {
      const res = await fetch(`/api/events/${eventId}/orders/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId,
          voucherCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setScanMessage({ type: "error", text: data.error || "Fulfillment failed" });
        return;
      }

      setScanMessage({ type: "success", text: data.message });
      setVoucherInput("");

      setOrders((prev) =>
        prev.map((o) => (o.id === data.orderItem.id ? { ...o, ...data.orderItem } : o))
      );

      setStats((prev) => ({
        ...prev,
        pendingPickups: Math.max(0, prev.pendingPickups - 1),
      }));
    } catch {
      setScanMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setScanLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "pending" && o.fulfillmentStatus === "collected") return false;
    if (orderFilter === "collected" && o.fulfillmentStatus !== "collected") return false;

    if (!orderSearch.trim()) return true;
    const query = orderSearch.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(query) ||
      o.customerEmail.toLowerCase().includes(query) ||
      o.pickupVoucherCode.toLowerCase().includes(query) ||
      o.orderCode.toLowerCase().includes(query) ||
      o.productName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Metrics Strip */}
      <section className="grid gap-px overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-[rgba(22,19,17,0.1)] sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-paper p-5">
          <div className="text-[0.72rem] font-semibold text-warm-500 uppercase tracking-wider">
            Total Store Revenue
          </div>
          <div className="font-display text-2xl font-bold text-ink mt-2">
            {formatMoney(stats.totalRevenue, currency)}
          </div>
          <div className="text-xs text-warm-400 mt-1">From standalone orders &amp; ticket add-ons</div>
        </div>

        <div className="bg-paper p-5">
          <div className="text-[0.72rem] font-semibold text-warm-500 uppercase tracking-wider">
            Total Units Sold
          </div>
          <div className="font-display text-2xl font-bold text-ink mt-2">
            {stats.totalSoldUnits.toLocaleString()}
          </div>
          <div className="text-xs text-warm-400 mt-1">Confirmed merchandise &amp; materials</div>
        </div>

        <div className="bg-paper p-5">
          <div className="text-[0.72rem] font-semibold text-warm-500 uppercase tracking-wider">
            Pending Pickups
          </div>
          <div className="font-display text-2xl font-bold text-amber-600 mt-2">
            {stats.pendingPickups.toLocaleString()}
          </div>
          <div className="text-xs text-warm-400 mt-1">Physical items awaiting collection</div>
        </div>

        <div className="bg-paper p-5">
          <div className="text-[0.72rem] font-semibold text-warm-500 uppercase tracking-wider">
            Active Catalog Items
          </div>
          <div className="font-display text-2xl font-bold text-ink mt-2">
            {stats.activeProductsCount}
          </div>
          <div className="text-xs text-warm-400 mt-1">Visible on event store &amp; checkout</div>
        </div>
      </section>

      {/* Navigation Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "bg-cypress text-parchment shadow-sm"
                : "bg-paper text-warm-600 hover:text-ink hover:bg-warm-100"
            }`}
          >
            Product Catalog ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "orders"
                ? "bg-cypress text-parchment shadow-sm"
                : "bg-paper text-warm-600 hover:text-ink hover:bg-warm-100"
            }`}
          >
            Resource Desk &amp; Orders ({orders.length})
            {stats.pendingPickups > 0 && (
              <span className="h-5 px-1.5 rounded-full bg-amber-500 text-black text-[0.65rem] font-bold flex items-center justify-center">
                {stats.pendingPickups}
              </span>
            )}
          </button>
        </div>

        {activeTab === "catalog" && (
          <button
            type="button"
            onClick={openCreateModal}
            className="btn btn-primary cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Product / Resource
          </button>
        )}
      </div>

      {/* Tab 1: Product Catalog */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {products.length === 0 ? (
            <div className="card py-16 text-center flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-warm-200 text-warm-400 flex items-center justify-center mb-3">
                <ShoppingBag size={28} />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">No products yet</h3>
              <p className="text-warm-500 text-sm mt-1 max-w-md">
                Add merchandise (conference shirts, books, journals) or digital resources (soaking audio downloads) for your event attendees.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="btn btn-primary mt-6 cursor-pointer"
              >
                <Plus size={16} /> Create First Product
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const isDigital = p.type === "digital";
                return (
                  <div
                    key={p.id}
                    className={`card p-5 flex flex-col justify-between border transition-all ${
                      !p.isActive ? "opacity-60 bg-warm-50" : "bg-paper"
                    }`}
                  >
                    <div>
                      {/* Image & Type Badge */}
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black/10 mb-4">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-warm-300">
                            {isDigital ? <Download size={36} /> : <Package size={36} />}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <span
                            className={`pill text-[0.62rem] !py-0.5 !px-2 font-semibold ${
                              isDigital
                                ? "bg-sky-100 text-sky-800 border-sky-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {isDigital ? "Digital" : "Physical"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[0.68rem] uppercase font-bold text-warm-400">
                            {p.category}
                          </span>
                          <h4 className="font-display text-base font-semibold text-ink mt-0.5 line-clamp-1">
                            {p.name}
                          </h4>
                        </div>
                        <span className="font-display font-bold text-ink text-base shrink-0">
                          {p.price === 0 ? "Free" : formatMoney(p.price, p.currency || currency)}
                        </span>
                      </div>

                      <p className="text-xs text-warm-500 mt-2 line-clamp-2">
                        {p.description || "No description provided."}
                      </p>

                      {/* Stock & Sales Pill */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.72rem]">
                        <span className="bg-warm-100 text-warm-700 px-2 py-0.5 rounded font-semibold border border-warm-200">
                          Pre-ordered / Sold: <strong className="text-ink">{p.soldCount}</strong>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold border ${
                            p.stockQuantity === 0
                              ? "bg-red-100 text-red-800 border-red-300"
                              : p.stockQuantity > 0 && p.stockQuantity <= 10
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-warm-100 text-warm-700 border-warm-200"
                          }`}
                        >
                          Stock:{" "}
                          <strong className="text-ink">
                            {p.stockQuantity < 0
                              ? "Unlimited"
                              : p.stockQuantity === 0
                              ? "Sold Out (0 left)"
                              : `${p.stockQuantity} remaining`}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-4 border-t border-black/10 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        className={`text-xs font-semibold cursor-pointer px-2.5 py-1 rounded-full ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-warm-200 text-warm-600 hover:bg-warm-300"
                        }`}
                      >
                        {p.isActive ? "Active (Listed)" : "Hidden"}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-warm-500 hover:text-ink rounded-lg hover:bg-warm-100 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Resource Desk & Orders */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Quick Voucher Redemption Bar */}
          <div className="rounded-2xl border border-brass/40 bg-cypress text-parchment p-6 shadow-md">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brass-light">
                <QrCode size={16} /> Resource Desk Pickup Scanner / Code Entry
              </div>
              <h3 className="font-display text-xl font-bold mt-1 text-white">
                Redeem Attendee Pickup Voucher
              </h3>
              <p className="text-xs text-warm-300 mt-1">
                Enter the voucher code displayed on the attendee&apos;s digital pass or scan with camera to mark items as collected.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (voucherInput.trim()) handleFulfillOrder(undefined, voucherInput.trim());
                }}
                className="mt-4 flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="e.g. VCH-ABC1234"
                  className="font-mono text-sm uppercase px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-warm-500 focus:outline-none focus:border-brass flex-1"
                />
                <button
                  type="submit"
                  disabled={scanLoading || !voucherInput.trim()}
                  className="btn btn-brass !py-3 !px-6 text-sm font-semibold cursor-pointer shrink-0"
                >
                  {scanLoading ? <Loader2 size={16} className="animate-spin" /> : "Verify & Mark Collected"}
                </button>
              </form>

              {scanMessage && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                    scanMessage.type === "success"
                      ? "bg-emerald-950/80 text-emerald-200 border border-emerald-500/40"
                      : "bg-red-950/80 text-red-200 border border-red-500/40"
                  }`}
                >
                  {scanMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{scanMessage.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by attendee name, email, voucher, or order code..."
                className="input !pl-10 !text-xs !py-2.5 w-full bg-paper"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOrderFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  orderFilter === "all" ? "bg-ink text-parchment" : "bg-paper text-warm-600 hover:text-ink"
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  orderFilter === "pending"
                    ? "bg-amber-600 text-white"
                    : "bg-paper text-warm-600 hover:text-ink"
                }`}
              >
                Pending Pickups ({stats.pendingPickups})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter("collected")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  orderFilter === "collected"
                    ? "bg-emerald-700 text-white"
                    : "bg-paper text-warm-600 hover:text-ink"
                }`}
              >
                Collected
              </button>
            </div>
          </div>

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="card py-12 text-center text-warm-500 text-sm">
              No orders found matching your search.
            </div>
          ) : (
            <div className="card overflow-hidden p-0 border border-black/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-warm-100 text-warm-600 uppercase text-[0.68rem] font-semibold border-b border-black/10">
                    <tr>
                      <th className="p-4">Voucher / Order</th>
                      <th className="p-4">Attendee</th>
                      <th className="p-4">Item &amp; Option</th>
                      <th className="p-4">Qty</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 bg-paper">
                    {filteredOrders.map((o) => {
                      const isCollected = o.fulfillmentStatus === "collected";
                      const isDigital = o.productType === "digital";

                      return (
                        <tr key={o.id} className="hover:bg-warm-50 transition-colors">
                          <td className="p-4 font-mono font-medium text-ink">
                            <span className="block font-bold text-brass-deep">{o.pickupVoucherCode}</span>
                            <span className="text-[0.68rem] text-warm-400">{o.orderCode}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-ink block">{o.customerName}</span>
                            <span className="text-warm-500 text-[0.7rem] block">{o.customerEmail}</span>
                            {o.customerPhone && (
                              <span className="text-warm-400 text-[0.68rem] block">{o.customerPhone}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-ink block">{o.productName}</span>
                            {o.variant && (
                              <span className="text-[0.7rem] text-warm-500 bg-warm-100 px-1.5 py-0.5 rounded">
                                {o.variant}
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-ink">{o.quantity}</td>
                          <td className="p-4 font-semibold text-ink">
                            {formatMoney(o.totalPrice, currency)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`pill text-[0.65rem] !py-0.5 !px-2 font-semibold ${
                                isCollected
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : isDigital
                                  ? "bg-sky-100 text-sky-800 border-sky-300"
                                  : "bg-amber-100 text-amber-800 border-amber-300"
                              }`}
                            >
                              {isCollected
                                ? "Picked Up"
                                : isDigital
                                ? "Digital"
                                : "Awaiting Pickup"}
                            </span>
                            {isCollected && o.collectedByStaffName && (
                              <span className="block text-[0.65rem] text-warm-400 mt-1">
                                By {o.collectedByStaffName}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {!isCollected && !isDigital && (
                              <button
                                type="button"
                                onClick={() => handleFulfillOrder(o.id)}
                                className="btn btn-secondary !py-1 !px-3 !text-xs font-semibold cursor-pointer"
                              >
                                Mark Picked Up
                              </button>
                            )}
                            {isCollected && (
                              <span className="text-emerald-600 font-semibold text-xs flex items-center justify-end gap-1">
                                <CheckCircle2 size={13} /> Complete
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-paper text-ink shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-black/10">
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 bg-warm-50">
              <h3 className="font-display text-lg font-bold text-ink">
                {editingProduct ? "Edit Product / Resource" : "Create Event Product"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-warm-400 hover:text-ink p-1 rounded-lg hover:bg-warm-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-800 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-warm-600 mb-1">
                  Product / Resource Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Summit 2026 Commemorative T-Shirt"
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description for attendees..."
                  className="input text-xs w-full resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-warm-600 mb-1">Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="input text-xs w-full"
                  />
                  <span className="text-[0.68rem] text-warm-400 mt-0.5 block">0 for free distribution</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-600 mb-1">Product Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="input text-xs w-full"
                  >
                    <option value="physical">Physical (On-site Pickup)</option>
                    <option value="digital">Digital (Instant Download)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-warm-600 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="input text-xs w-full"
                  >
                    <option value="Merchandise">Merchandise</option>
                    <option value="Apparel">Apparel / T-Shirts</option>
                    <option value="Books">Books &amp; Manuals</option>
                    <option value="Audio & Media">Audio &amp; Media</option>
                    <option value="Resources">Resources</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-600 mb-1">
                    Stock Quantity (-1 for unlimited)
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="input text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-600 mb-1">
                  Product Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="input text-xs w-full"
                />
              </div>

              {formType === "physical" ? (
                <div className="space-y-4">
                  {/* Variant Generator Tool */}
                  <div className="rounded-xl border border-brass/30 bg-brass/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <Sparkles size={13} className="text-brass" /> Color &amp; Size Option Generator
                      </span>
                      <span className="text-[0.62rem] text-warm-500 font-medium bg-warm-200/70 px-2 py-0.5 rounded">
                        Helper Calculator · Populates list below
                      </span>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[0.68rem] font-semibold text-warm-600 mb-1">
                          Colors (Comma-separated)
                        </label>
                        <input
                          type="text"
                          value={builderColors}
                          onChange={(e) => setBuilderColors(e.target.value)}
                          placeholder="e.g. green, blue, red, black"
                          className="input !text-xs !py-1.5 w-full bg-paper"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.68rem] font-semibold text-warm-600 mb-1">
                          Sizes (Comma-separated)
                        </label>
                        <input
                          type="text"
                          value={builderSizes}
                          onChange={(e) => setBuilderSizes(e.target.value)}
                          placeholder="e.g. small, xl, xxl, xxxl"
                          className="input !text-xs !py-1.5 w-full bg-paper"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateCombinations}
                      className="btn btn-secondary !text-xs !py-2 !px-3 font-semibold cursor-pointer w-full flex items-center justify-center gap-1.5 !border-brass/40 text-brass-dark hover:bg-brass/10"
                    >
                      <Sparkles size={12} className="text-brass" /> Auto-Generate All Color &amp; Size Options ↓
                    </button>

                    {generatedCount !== null && (
                      <div className="text-[0.7rem] text-emerald-800 bg-emerald-100/80 border border-emerald-300 rounded-lg p-2 text-center font-semibold animate-in fade-in">
                        ✓ Success: Generated {generatedCount} combinations into the list below!
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-warm-700">
                        Final Variants / Options to Save
                      </label>
                      <span className="text-[0.62rem] text-brass font-bold uppercase tracking-wider">
                        ★ This is what gets saved &amp; shown to buyers
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formVariants}
                      onChange={(e) => {
                        setFormVariants(e.target.value);
                        setGeneratedCount(null);
                      }}
                      placeholder="e.g. Midnight Black / S, Midnight Black / M, Cypress Green / L..."
                      className="input text-xs w-full"
                    />
                    <span className="text-[0.68rem] text-warm-500 mt-1 block">
                      Attendees will be able to pick from whatever is in this box. You can edit, add, or delete any combination here before saving.
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-warm-600 mb-1">
                    Download File URL (ZIP, MP3, PDF)
                  </label>
                  <input
                    type="url"
                    value={formDownloadUrl}
                    onChange={(e) => setFormDownloadUrl(e.target.value)}
                    placeholder="https://example.com/downloads/album.zip"
                    className="input text-xs w-full"
                  />
                </div>
              )}

              <div className="pt-2 space-y-2 border-t border-black/10">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formAllowAddon}
                    onChange={(e) => setFormAllowAddon(e.target.checked)}
                    className="accent-cypress"
                  />
                  <span className="text-ink font-medium">Show as add-on during ticket registration</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="accent-cypress"
                  />
                  <span className="text-ink font-medium">Active and published in event store</span>
                </label>
              </div>

              <div className="pt-4 border-t border-black/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary !py-2 !px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="btn btn-primary !py-2 !px-5 text-xs font-semibold"
                >
                  {savingProduct ? <Loader2 size={14} className="animate-spin" /> : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
