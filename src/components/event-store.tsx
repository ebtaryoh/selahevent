"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Sparkles,
  Download,
  Package,
  Check,
  QrCode,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { QRCodeSVG } from "qrcode.react";

export type StoreProduct = {
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
  isActive: boolean;
};

export function getColorHex(name: string): string | null {
  const c = name.toLowerCase();
  if (c.includes("black") || c.includes("midnight")) return "#18181b";
  if (c.includes("white") || c.includes("ivory") || c.includes("cream")) return "#fafafa";
  if (c.includes("cypress") || c.includes("olive") || c.includes("forest")) return "#1b4332";
  if (c.includes("green") || c.includes("emerald")) return "#15803d";
  if (c.includes("sand") || c.includes("desert") || c.includes("beige") || c.includes("tan") || c.includes("khaki")) return "#d4b996";
  if (c.includes("gold") || c.includes("brass") || c.includes("bronze")) return "#c08a2e";
  if (c.includes("navy") || c.includes("blue") || c.includes("royal")) return "#1e3a8a";
  if (c.includes("purple") || c.includes("violet")) return "#6b21a8";
  if (c.includes("burgundy") || c.includes("wine") || c.includes("crimson") || c.includes("red")) return "#991b1b";
  if (c.includes("brown") || c.includes("mahogany")) return "#78350f";
  if (c.includes("grey") || c.includes("gray") || c.includes("silver") || c.includes("heather")) return "#71717a";
  return null;
}

export function parseProductVariants(
  variants?: string[] | null,
  category?: string,
  productName?: string
) {
  const isApparel =
    category?.toLowerCase() === "apparel" ||
    /t-shirt|shirt|hoodie|polo|jersey|sweater/i.test(productName || "");

  if (!Array.isArray(variants) || variants.length === 0) {
    if (isApparel) {
      return {
        hasColorsAndSizes: false,
        isPureColors: false,
        colors: [],
        sizes: ["S", "M", "L", "XL", "2XL"],
        items: [],
        raw: ["S", "M", "L", "XL", "2XL"],
      };
    }
    return { hasColorsAndSizes: false, colors: [], sizes: [], items: [], raw: [] };
  }

  const items = variants.map((v) => {
    const delimiter = v.includes(" / ") ? " / " : v.includes(" - ") ? " - " : null;
    if (delimiter) {
      const [col, sz] = v.split(delimiter).map((s) => s.trim());
      return { raw: v, color: col, size: sz };
    }
    return { raw: v, color: null, size: null };
  });

  const hasTwoParts = items.every((i) => i.color && i.size);
  if (hasTwoParts) {
    const colors = Array.from(new Set(items.map((i) => i.color!)));
    const sizes = Array.from(new Set(items.map((i) => i.size!)));
    return { hasColorsAndSizes: true, colors, sizes, items, raw: variants };
  }

  const knownSizes = ["xs", "s", "m", "l", "xl", "2xl", "3xl", "small", "medium", "large"];
  const isAllSizes = variants.every((v) => knownSizes.includes(v.toLowerCase()));

  // If variants are only colors and the product is Apparel (like Come Alive T-shirt with ["midnight black", "leaf green"])
  if (isApparel && !isAllSizes) {
    const colors = variants;
    const sizes = ["S", "M", "L", "XL", "2XL"];
    const generatedItems: Array<{ raw: string; color: string; size: string }> = [];
    for (const c of colors) {
      for (const s of sizes) {
        generatedItems.push({ raw: `${c} / ${s}`, color: c, size: s });
      }
    }
    return {
      hasColorsAndSizes: true,
      colors,
      sizes,
      items: generatedItems,
      raw: variants,
    };
  }

  const hasColorMatches = variants.some((v) => getColorHex(v) !== null);

  return {
    hasColorsAndSizes: false,
    isPureColors: hasColorMatches,
    colors: hasColorMatches ? variants : [],
    sizes: isAllSizes ? variants : [],
    items: [],
    raw: variants,
  };
}

export function EventStore({
  eventId,
  eventSlug,
  eventTitle,
  currency,
  products,
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  currency: string;
  products: StoreProduct[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeModalProduct, setActiveModalProduct] = useState<StoreProduct | null>(null);

  // Checkout modal state
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (selectedCategory === "All") return true;
    return p.category === selectedCategory;
  });

  const openCheckout = (product: StoreProduct) => {
    setActiveModalProduct(product);
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const parsed = parseProductVariants(variants, product.category, product.name);

    if (parsed.hasColorsAndSizes && parsed.colors.length > 0) {
      const initColor = parsed.colors[0];
      const matchingSizes = parsed.items.filter((i) => i.color === initColor).map((i) => i.size!);
      const initSize = matchingSizes[0] || parsed.sizes[0] || "";
      setSelectedColor(initColor);
      setSelectedSize(initSize);
      setSelectedVariant(`${initColor} / ${initSize}`);
    } else {
      setSelectedColor("");
      setSelectedSize("");
      setSelectedVariant(variants[0] || "");
    }

    setQuantity(1);
    setOrderError(null);
    setCompletedOrder(null);
  };

  const closeCheckout = () => {
    setActiveModalProduct(null);
    setCompletedOrder(null);
    setOrderError(null);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalProduct) return;
    if (!customerName.trim() || !customerEmail.trim()) {
      setOrderError("Please provide your name and email address.");
      return;
    }

    setSubmitting(true);
    setOrderError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          items: [
            {
              productId: activeModalProduct.id,
              variant: selectedVariant || undefined,
              quantity,
            },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setOrderError(data.error || "Failed to process order. Please try again.");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Free item or instant confirmation
      setCompletedOrder(data);
    } catch {
      setOrderError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section id="store" className="py-20 border-t border-[rgba(232,211,166,0.12)] bg-[#071914] text-parchment relative">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brass font-semibold">
              <ShoppingBag size={14} /> Official Event Store &amp; Resources
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-2 text-white">
              Merchandise &amp; Materials
            </h2>
            <p className="mt-3 text-warm-300 max-w-xl text-sm leading-relaxed">
              Pre-order official conference shirts, study devotionals, and soaking audio recordings. Collect on-site at the Resource Desk or download instantly.
            </p>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-brass text-black shadow-md shadow-brass/20"
                      : "bg-white/5 text-warm-300 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const isDigital = product.type === "digital";
            const isOutOfStock = product.stockQuantity === 0;

            return (
              <div
                key={product.id}
                className="group flex flex-col rounded-2xl border border-[rgba(232,211,166,0.15)] bg-[rgba(13,38,31,0.7)] backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-brass/50 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1"
              >
                {/* Product Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-cypress/80 text-brass/40">
                      {isDigital ? <Download size={48} /> : <Package size={48} />}
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide uppercase backdrop-blur-md ${
                        isDigital
                          ? "bg-sky-950/80 text-sky-300 border border-sky-400/30"
                          : "bg-amber-950/80 text-amber-300 border border-amber-400/30"
                      }`}
                    >
                      {isDigital ? <Download size={11} /> : <Package size={11} />}
                      {isDigital ? "Instant Download" : "On-site Pickup"}
                    </span>
                  </div>

                  {product.stockQuantity > 0 && product.stockQuantity <= 10 && (
                    <div className="absolute bottom-3 right-3 rounded-md bg-red-950/90 border border-red-500/40 px-2 py-0.5 text-[0.65rem] font-bold text-red-200">
                      Only {product.stockQuantity} left!
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[0.72rem] uppercase tracking-wider text-brass font-medium">
                      {product.category}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-white mt-1 group-hover:text-brass-light transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-xs text-warm-300 line-clamp-2 leading-relaxed">
                      {product.description || "Official conference merchandise for this event."}
                    </p>

                    {/* Variants preview with color dots */}
                    {(() => {
                      const parsed = parseProductVariants(product.variants, product.category, product.name);
                      if (parsed.hasColorsAndSizes) {
                        return (
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[0.68rem] text-warm-400 font-medium">Colors:</span>
                              <div className="flex items-center gap-1.5">
                                {parsed.colors.map((c) => {
                                  const hex = getColorHex(c);
                                  return (
                                    <span
                                      key={c}
                                      title={c}
                                      className="h-3.5 w-3.5 rounded-full border border-white/20 inline-block shadow-sm"
                                      style={{ backgroundColor: hex || "#888" }}
                                    />
                                  );
                                })}
                                <span className="text-[0.68rem] text-warm-300 ml-1">
                                  {parsed.colors.length} colors
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {parsed.sizes.map((s) => (
                                <span
                                  key={s}
                                  className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.62rem] font-medium text-warm-300"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (Array.isArray(product.variants) && product.variants.length > 0) {
                        return (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {product.variants.slice(0, 4).map((v) => {
                              const hex = getColorHex(v);
                              return (
                                <span
                                  key={v}
                                  className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[0.65rem] text-warm-300"
                                >
                                  {hex && (
                                    <span
                                      className="h-2 w-2 rounded-full border border-white/30 inline-block"
                                      style={{ backgroundColor: hex }}
                                    />
                                  )}
                                  <span>{v}</span>
                                </span>
                              );
                            })}
                            {product.variants.length > 4 && (
                              <span className="text-[0.65rem] text-warm-500 self-center">
                                +{product.variants.length - 4} more
                              </span>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[0.65rem] text-warm-400 block uppercase tracking-wider">
                        Price
                      </span>
                      <span className="font-display text-xl font-bold text-brass-light">
                        {product.price === 0 ? "Free" : formatMoney(product.price, product.currency || currency)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openCheckout(product)}
                      disabled={isOutOfStock}
                      className={`btn !py-2 !px-4 !text-xs font-semibold cursor-pointer ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed bg-white/10 text-warm-400"
                          : "btn-brass !shadow-sm"
                      }`}
                    >
                      {isOutOfStock ? "Sold Out" : isDigital ? "Get Download" : "Pre-order"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout / Order Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-[rgba(232,211,166,0.3)] bg-[#0d261f] text-parchment shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2 text-brass text-sm font-semibold">
                <ShoppingBag size={16} />
                <span>{completedOrder ? "Order Confirmed" : "Pre-order Item"}</span>
              </div>
              <button
                type="button"
                onClick={closeCheckout}
                className="text-warm-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {completedOrder ? (
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brass/20 text-brass">
                    <Check size={28} />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    Order Received!
                  </h3>
                  <p className="text-sm text-warm-300 max-w-md mx-auto">
                    A confirmation voucher has been registered for <strong className="text-brass-light">{customerEmail}</strong>.
                  </p>

                  {/* Voucher Card */}
                  <div className="mx-auto max-w-xs rounded-xl border border-brass/40 bg-black/40 p-5 text-center shadow-inner">
                    <div className="text-xs uppercase tracking-widest text-warm-400 font-semibold mb-2">
                      Pickup Voucher
                    </div>
                    {completedOrder.orderItems?.[0]?.pickupVoucherCode && (
                      <>
                        <div className="mx-auto w-32 h-32 bg-white p-2 rounded-lg flex items-center justify-center my-3 shadow-md">
                          <QRCodeSVG
                            value={completedOrder.orderItems[0].pickupVoucherCode}
                            size={112}
                            level="M"
                          />
                        </div>
                        <div className="font-mono text-base font-bold text-brass tracking-wider">
                          {completedOrder.orderItems[0].pickupVoucherCode}
                        </div>
                        <p className="text-[0.7rem] text-warm-400 mt-2 leading-relaxed">
                          Show this code at the Resource Desk during {eventTitle} to collect your item.
                        </p>
                      </>
                    )}

                    {activeModalProduct.type === "digital" && activeModalProduct.downloadUrl && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <a
                          href={activeModalProduct.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-brass !w-full !py-2.5 !text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                        >
                          <Download size={14} /> Download Resource Now
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={closeCheckout}
                    className="btn btn-secondary !py-2 !px-6 text-xs mt-4"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrderSubmit} className="space-y-5">
                  {/* Item Summary Preview */}
                  <div className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                    {activeModalProduct.imageUrl ? (
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-black/30">
                        <img
                          src={activeModalProduct.imageUrl}
                          alt={activeModalProduct.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 rounded-lg items-center justify-center bg-cypress text-brass/50 shrink-0">
                        <Package size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.68rem] uppercase tracking-wider text-brass font-medium">
                        {activeModalProduct.category}
                      </div>
                      <h4 className="font-semibold text-white text-sm truncate">
                        {activeModalProduct.name}
                      </h4>
                      <div className="font-display font-bold text-brass-light text-base mt-1">
                        {activeModalProduct.price === 0
                          ? "Free"
                          : formatMoney(activeModalProduct.price, activeModalProduct.currency || currency)}
                      </div>
                    </div>
                  </div>

                  {/* Variant Selection (Multi-attribute Color & Size or Single Options) */}
                  {(() => {
                    const parsed = parseProductVariants(activeModalProduct.variants, activeModalProduct.category, activeModalProduct.name);
                    if (parsed.hasColorsAndSizes) {
                      return (
                        <div className="space-y-4">
                          {/* 1. Color Choice */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-semibold text-warm-300 uppercase tracking-wider">
                                1. Choose Color
                              </label>
                              <span className="text-xs font-bold text-brass-light capitalize">
                                {selectedColor}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {parsed.colors.map((c) => {
                                const hex = getColorHex(c);
                                const isSelected = selectedColor === c;
                                return (
                                  <button
                                    type="button"
                                    key={c}
                                    onClick={() => {
                                      setSelectedColor(c);
                                      const newVar = `${c} / ${selectedSize || parsed.sizes[0]}`;
                                      setSelectedVariant(newVar);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-brass bg-brass text-black shadow-md shadow-brass/20 font-bold"
                                        : "border-white/10 bg-white/5 text-warm-300 hover:border-white/30 hover:text-white"
                                    }`}
                                  >
                                    {hex && (
                                      <span
                                        className="h-3.5 w-3.5 rounded-full border border-black/30 shrink-0"
                                        style={{ backgroundColor: hex }}
                                      />
                                    )}
                                    <span>{c}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Size Choice */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-semibold text-warm-300 uppercase tracking-wider">
                                2. Choose Size
                              </label>
                              <span className="text-xs font-bold text-brass-light">{selectedSize}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {parsed.sizes.map((s) => {
                                const isSelected = selectedSize === s;
                                return (
                                  <button
                                    type="button"
                                    key={s}
                                    onClick={() => {
                                      setSelectedSize(s);
                                      const newVar = `${selectedColor || parsed.colors[0]} / ${s}`;
                                      setSelectedVariant(newVar);
                                    }}
                                    className={`min-w-[42px] px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-brass bg-brass text-black shadow-md shadow-brass/20 font-bold"
                                        : "border-white/10 bg-white/5 text-warm-300 hover:border-white/30 hover:text-white"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (Array.isArray(activeModalProduct.variants) && activeModalProduct.variants.length > 0) {
                      return (
                        <div>
                          <label className="block text-xs font-semibold text-warm-300 uppercase tracking-wider mb-2">
                            Select Option / Color
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {activeModalProduct.variants.map((v) => {
                              const hex = getColorHex(v);
                              const isSelected = selectedVariant === v;
                              return (
                                <button
                                  type="button"
                                  key={v}
                                  onClick={() => setSelectedVariant(v)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-brass bg-brass text-black font-bold"
                                      : "border-white/10 bg-white/5 text-warm-300 hover:border-white/30"
                                  }`}
                                >
                                  {hex && (
                                    <span
                                      className="h-3 w-3 rounded-full border border-black/30 shrink-0"
                                      style={{ backgroundColor: hex }}
                                    />
                                  )}
                                  <span>{v}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}

                  {/* Quantity Counter */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-warm-300 uppercase tracking-wider">
                      Quantity
                    </span>
                    <div className="flex items-center gap-3 border border-white/10 rounded-lg p-1 bg-white/5">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="h-7 w-7 flex items-center justify-center rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold px-2">{quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) =>
                            activeModalProduct.stockQuantity >= 0
                              ? Math.min(activeModalProduct.stockQuantity, q + 1)
                              : q + 1
                          )
                        }
                        disabled={activeModalProduct.stockQuantity >= 0 && quantity >= activeModalProduct.stockQuantity}
                        className="h-7 w-7 flex items-center justify-center rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div>
                      <label className="block text-xs font-semibold text-warm-300 mb-1">
                        Your Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Sister Deborah Adeyemi"
                        className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brass focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-warm-300 mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="deborah@example.com"
                        className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brass focus:outline-none"
                      />
                      <p className="text-[0.7rem] text-warm-500 mt-1">
                        Voucher code and receipt will be sent here.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-warm-300 mb-1">
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+234 800 000 0000"
                        className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brass focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-brass/10 border border-brass/25">
                    <span className="text-xs uppercase tracking-wider text-warm-300 font-semibold">
                      Total Payable
                    </span>
                    <span className="font-display text-xl font-bold text-brass-light">
                      {activeModalProduct.price === 0
                        ? "Free"
                        : formatMoney(
                            activeModalProduct.price * quantity,
                            activeModalProduct.currency || currency
                          )}
                    </span>
                  </div>

                  {orderError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/80 border border-red-500/30 text-red-200 text-xs">
                      <AlertCircle size={15} className="shrink-0 text-red-400" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-brass !w-full !py-3 font-semibold text-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Processing…
                        </>
                      ) : activeModalProduct.price > 0 ? (
                        <>
                          Proceed to Payment &rarr;
                        </>
                      ) : (
                        <>
                          Confirm &amp; Receive Voucher &rarr;
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
