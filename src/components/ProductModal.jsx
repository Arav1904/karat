<<<<<<< HEAD
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import { CATEGORIES, SUBCATEGORY_MAP, GOLD_CARATS, DIAMOND_PURITIES } from '../lib/config';
import styles from './ProductModal.module.css';

// DB column names (actual Supabase schema):
// sku, name, gold_carat, weight, images (array), in_stock (boolean), sub_category, diamond_purity, material, occasion, stock_qty, price, description
=======
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Upload, Trash2, Calculator, Video, Image as ImageIcon } from 'lucide-react';
import {
  CATEGORIES, SUBCATEGORY_MAP, GOLD_CARATS, DIAMOND_PURITIES,
  SILVER_CATEGORIES, MAX_IMAGE_BYTES,
} from '../lib/config';
import { PLAN_LABELS, planKey, hasFeature as hasF } from '../lib/plans';
import PricingCalculator from './PricingCalculator';
import VideoUpload from './VideoUpload';
import styles from './ProductModal.module.css';

// DB column names (Supabase schema):
//   sku, name, category, sub_category, gold_carat, diamond_purity,
//   material, occasion, weight, price, stock_qty, description, in_stock,
//   images (array), primary_image_url, video_url (NEW), owner_id, is_current
//
// AI fields (ai_title, ai_description, etc.) are intentionally NOT
// referenced or sent — feature removed per Nikhil's spec #1.
>>>>>>> f2c6b0f (Initial commit)

const EMPTY_FORM = {
  sku: '', name: '', category: '', sub_category: '',
  gold_carat: '', diamond_purity: '', material: '', occasion: '',
  weight: '', price: '', stock_qty: 1,
  description: '', in_stock: true,
};

<<<<<<< HEAD
export default function ProductModal({ product, allProducts, onSave, onClose, checkSKU }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [slotFiles, setSlotFiles]   = useState([null,null,null,null,null]);
  const [existingUrls, setExisting] = useState([null,null,null,null,null]);
  const [skuError, setSkuError] = useState('');
  const [saving, setSaving] = useState(false);
  const [regenAI, setRegenAI] = useState(false);
  const [subcats, setSubcats] = useState([]);
  const fileRefs = useRef([null,null,null,null,null]);
  const isEdit = !!product;
=======
export default function ProductModal({ product, store, onSave, onClose, checkSKU, planLimits }) {
  const [form, setForm]             = useState(EMPTY_FORM);
  const [slotFiles, setSlotFiles]   = useState([null,null,null,null,null]);
  const [existingUrls, setExisting] = useState([null,null,null,null,null]);
  const [videoFile, setVideoFile]   = useState(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState(null);
  const [skuError, setSkuError]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [subcats, setSubcats]       = useState([]);
  const [showCalc, setShowCalc]     = useState(false);
  const fileRefs = useRef([null,null,null,null,null]);
  const isEdit   = !!product;

  // Plan-based feature gates
  const planName    = planKey(store);
  const videoUnlocked = hasF(store, 'video_upload');
>>>>>>> f2c6b0f (Initial commit)

  useEffect(() => {
    if (product) {
      setForm({
<<<<<<< HEAD
        sku:           product.sku || '',
        name:          product.name || '',
        category:      product.category || '',
        sub_category:  product.sub_category || '',
        gold_carat:    product.gold_carat || '',
        diamond_purity:product.diamond_purity || '',
        material:      product.material || '',
        occasion:      product.occasion || '',
        weight:        product.weight || '',
        price:         product.price || '',
        stock_qty:     product.stock_qty ?? 1,
        description:   product.description || '',
        in_stock:      typeof product.in_stock === 'boolean' ? product.in_stock : true,
      });
      // Populate existing image slots from `images` column
=======
        sku:            product.sku            || '',
        name:           product.name           || '',
        category:       product.category       || '',
        sub_category:   product.sub_category   || '',
        gold_carat:     product.gold_carat     || '',
        diamond_purity: product.diamond_purity || '',
        material:       product.material       || '',
        occasion:       product.occasion       || '',
        weight:         product.weight         || '',
        price:          product.price          || '',
        stock_qty:      product.stock_qty ?? 1,
        description:    product.description    || '',
        in_stock:       typeof product.in_stock === 'boolean' ? product.in_stock : true,
      });
>>>>>>> f2c6b0f (Initial commit)
      const urls = Array.isArray(product.images) ? product.images : [];
      const existing = [null,null,null,null,null];
      urls.forEach((u, i) => { if (i < 5) existing[i] = u; });
      setExisting(existing);
      setSlotFiles([null,null,null,null,null]);
<<<<<<< HEAD
      if (product.category) {
        setSubcats(SUBCATEGORY_MAP[product.category] || []);
      }
=======
      setExistingVideoUrl(product.video_url || null);
      setVideoFile(null);
      if (product.category) setSubcats(SUBCATEGORY_MAP[product.category] || []);
>>>>>>> f2c6b0f (Initial commit)
    } else {
      setForm(EMPTY_FORM);
      setSlotFiles([null,null,null,null,null]);
      setExisting([null,null,null,null,null]);
<<<<<<< HEAD
    }
    setSkuError('');
    setRegenAI(false);
=======
      setExistingVideoUrl(null); setVideoFile(null);
      setSubcats([]);
    }
    setSkuError('');
    setShowCalc(false);
>>>>>>> f2c6b0f (Initial commit)
  }, [product]);

  const set = useCallback((key, val) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  const handleCategory = (cat) => {
    set('category', cat);
    set('sub_category', '');
    setSubcats(SUBCATEGORY_MAP[cat] || []);
<<<<<<< HEAD
=======
    // Auto-suggest a sensible Carat default when category is Silver
    if (SILVER_CATEGORIES.has(cat) && !/silver/i.test(form.gold_carat)) {
      set('gold_carat', '925 Silver (Sterling)');
    }
>>>>>>> f2c6b0f (Initial commit)
  };

  const handleSKUBlur = async (val) => {
    if (!val) return;
    const unique = await checkSKU(val, isEdit ? product.id : null);
    setSkuError(unique ? '' : 'SKU already exists — please use a different one');
  };

  const handleFile = (i, file) => {
    if (!file) return;
<<<<<<< HEAD
    const newFiles = [...slotFiles];
    newFiles[i] = file;
    setSlotFiles(newFiles);
    const newExisting = [...existingUrls];
    newExisting[i] = null;
    setExisting(newExisting);
=======
    if (file.size > MAX_IMAGE_BYTES) {
      alert(`Image too large (${(file.size/1024/1024).toFixed(1)} MB). Max 5 MB per image.`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const newFiles = [...slotFiles]; newFiles[i] = file; setSlotFiles(newFiles);
    const newExisting = [...existingUrls]; newExisting[i] = null; setExisting(newExisting);
>>>>>>> f2c6b0f (Initial commit)
  };

  const removeSlot = (i) => {
    const nf = [...slotFiles]; nf[i] = null; setSlotFiles(nf);
    const ne = [...existingUrls]; ne[i] = null; setExisting(ne);
  };

<<<<<<< HEAD
=======
  const previewSrc = (i) => {
    if (slotFiles[i]) return URL.createObjectURL(slotFiles[i]);
    return existingUrls[i] || null;
  };

  // Has any image at all?
  const imageCount = useMemo(
    () => slotFiles.filter(Boolean).length + existingUrls.filter(Boolean).length,
    [slotFiles, existingUrls]
  );

>>>>>>> f2c6b0f (Initial commit)
  const handleSubmit = async () => {
    if (!form.sku.trim())     return alert('SKU is required');
    if (!form.name.trim())    return alert('Item name is required');
    if (!form.category)       return alert('Category is required');
<<<<<<< HEAD
    if (!form.gold_carat)     return alert('Gold carat is required');
    if (!form.weight)         return alert('Weight is required');
    if (!form.price)          return alert('Price is required');
    if (skuError)             return alert('Fix SKU error first');
    setSaving(true);
    try {
      await onSave(
        { ...form, weight: Number(form.weight), price: Number(form.price), stock_qty: Number(form.stock_qty) || 1 },
        slotFiles,
        existingUrls,
        isEdit,
        regenAI
      );
=======
    if (!form.gold_carat)     return alert('Gold/Silver/Metal purity is required');
    if (!form.weight)         return alert('Weight is required');
    if (!form.price)          return alert('Price is required');
    if (skuError)             return alert('Fix the SKU error first');
    if (imageCount === 0)     return alert('At least one product image is required');

    setSaving(true);
    try {
      await onSave({
        form: {
          ...form,
          weight:    Number(form.weight),
          price:     Number(form.price),
          stock_qty: Number(form.stock_qty) || 1,
        },
        slotFiles,
        existingUrls,
        videoFile,
        existingVideoUrl,
        isEdit,
      });
>>>>>>> f2c6b0f (Initial commit)
    } catch(err) {
      alert('Save failed: ' + (err.message || 'Unknown'));
    } finally {
      setSaving(false);
    }
  };

<<<<<<< HEAD
  const previewSrc = (i) => {
    if (slotFiles[i]) return URL.createObjectURL(slotFiles[i]);
    return existingUrls[i] || null;
  };

=======
>>>>>>> f2c6b0f (Initial commit)
  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ animation: 'slideUp .2s ease' }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.body}>
          {/* ① Item Details */}
          <div className="sec-label">① Item Details</div>
          <div className="fg fg2">
            <div className="fld">
              <label className="lbl">SKU / Item Code <span className="req">*</span></label>
              <input
                className="inp"
                value={form.sku}
                onChange={e => set('sku', e.target.value.toUpperCase())}
                onBlur={e => handleSKUBlur(e.target.value)}
                placeholder="e.g. RNG001"
              />
              {skuError && <div className={styles.fieldError}>{skuError}</div>}
            </div>
            <div className="fld">
              <label className="lbl">Item Name <span className="req">*</span></label>
<<<<<<< HEAD
              <input className="inp" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Floral Kundan Ring" />
=======
              <input
                className="inp"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Floral Kundan Ring"
              />
>>>>>>> f2c6b0f (Initial commit)
            </div>
          </div>

          <div className="fg fg3" style={{ marginTop: 14 }}>
            <div className="fld">
              <label className="lbl">Category <span className="req">*</span></label>
              <select className="inp" value={form.category} onChange={e => handleCategory(e.target.value)}>
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="fld">
              <label className="lbl">Sub-category</label>
              <select className="inp" value={form.sub_category} onChange={e => set('sub_category', e.target.value)}>
                <option value="">{subcats.length ? 'Select…' : 'Select category first'}</option>
                {subcats.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="fld">
<<<<<<< HEAD
              <label className="lbl">Gold Carat <span className="req">*</span></label>
=======
              <label className="lbl">Metal Purity <span className="req">*</span></label>
>>>>>>> f2c6b0f (Initial commit)
              <select className="inp" value={form.gold_carat} onChange={e => set('gold_carat', e.target.value)}>
                <option value="">Select…</option>
                {GOLD_CARATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="fg fg3" style={{ marginTop: 14 }}>
            <div className="fld">
              <label className="lbl">Diamond Purity</label>
              <select className="inp" value={form.diamond_purity} onChange={e => set('diamond_purity', e.target.value)}>
                <option value="">None / N/A</option>
                {DIAMOND_PURITIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="fld">
              <label className="lbl">Stone / Material</label>
<<<<<<< HEAD
              <input className="inp" value={form.material} onChange={e => set('material', e.target.value)} placeholder="e.g. Kundan, Polki, Ruby" />
            </div>
            <div className="fld">
              <label className="lbl">Occasion</label>
              <input className="inp" value={form.occasion} onChange={e => set('occasion', e.target.value)} placeholder="e.g. Wedding, Festival" />
=======
              <input
                className="inp"
                value={form.material}
                onChange={e => set('material', e.target.value)}
                placeholder="e.g. Kundan, Polki, Ruby, Lab-grown Diamond"
              />
            </div>
            <div className="fld">
              <label className="lbl">Occasion</label>
              <input
                className="inp"
                value={form.occasion}
                onChange={e => set('occasion', e.target.value)}
                placeholder="e.g. Wedding, Festival"
              />
>>>>>>> f2c6b0f (Initial commit)
            </div>
          </div>

          <div className="fg fg3" style={{ marginTop: 14 }}>
            <div className="fld">
              <label className="lbl">Weight (grams) <span className="req">*</span></label>
<<<<<<< HEAD
              <input className="inp" type="number" step="0.01" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="e.g. 5.20" />
            </div>
            <div className="fld">
              <label className="lbl">Price (₹ INR) <span className="req">*</span></label>
              <input className="inp" type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 45000" />
            </div>
            <div className="fld">
              <label className="lbl">Stock Quantity</label>
              <input className="inp" type="number" min="0" value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="fld">
              <label className="lbl">Description / Notes for AI</label>
              <textarea className="inp" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Special details, craftsmanship notes, or context for the AI…" />
=======
              <input
                className="inp" type="number" step="0.01" min="0"
                value={form.weight} onChange={e => set('weight', e.target.value)}
                placeholder="e.g. 5.20"
              />
            </div>
            <div className="fld">
              <label className="lbl">
                Price (₹ INR) <span className="req">*</span>
                <button
                  type="button"
                  className={styles.calcLink}
                  onClick={() => setShowCalc(s => !s)}
                >
                  <Calculator size={11}/> {showCalc ? 'Hide calculator' : 'Calculate from gold rate'}
                </button>
              </label>
              <input
                className="inp" type="number" min="0"
                value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="e.g. 45000"
              />
            </div>
            <div className="fld">
              <label className="lbl">Stock Quantity</label>
              <input
                className="inp" type="number" min="0"
                value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic pricing calculator (collapsible) */}
          <PricingCalculator
            open={showCalc}
            weight={form.weight}
            carat={form.gold_carat}
            onApply={(total) => set('price', String(total))}
            onClose={() => setShowCalc(false)}
          />

          <div style={{ marginTop: 14 }}>
            <div className="fld">
              <label className="lbl">Description / Notes</label>
              <textarea
                className="inp"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                placeholder="Craftsmanship notes, certificate numbers, special features…"
              />
>>>>>>> f2c6b0f (Initial commit)
            </div>
          </div>

          {/* ② Images */}
<<<<<<< HEAD
          <div className="sec-label" style={{ marginTop: 20 }}>② Product Images (up to 5)</div>
=======
          <div className="sec-label" style={{ marginTop: 20 }}>
            <ImageIcon size={11} style={{verticalAlign: 'middle', marginRight: 4}}/> ② Product Images (up to 5) <span className="req">*</span>
          </div>
>>>>>>> f2c6b0f (Initial commit)
          <div className={styles.imgGrid}>
            {[0,1,2,3,4].map(i => {
              const src = previewSrc(i);
              return (
                <div key={i} className={styles.imgSlot}>
                  {src ? (
                    <>
                      <img src={src} alt="" className={styles.imgPreview} />
                      <button className={styles.imgRemove} onClick={() => removeSlot(i)} title="Remove">
                        <Trash2 size={12} />
                      </button>
                      {i === 0 && <span className={styles.imgPrimary}>Primary</span>}
                    </>
                  ) : (
                    <button className={styles.imgAdd} onClick={() => fileRefs.current[i]?.click()}>
                      <Upload size={16} strokeWidth={1.5} />
                      <span>{i === 0 ? 'Add cover' : 'Add photo'}</span>
                    </button>
                  )}
                  <input
                    ref={el => fileRefs.current[i] = el}
                    type="file"
<<<<<<< HEAD
                    accept="image/*"
=======
                    accept="image/jpeg,image/png,image/webp,image/*"
>>>>>>> f2c6b0f (Initial commit)
                    style={{ display: 'none' }}
                    onChange={e => handleFile(i, e.target.files?.[0])}
                  />
                </div>
              );
            })}
          </div>
          <p className={styles.imgNote}>
<<<<<<< HEAD
            First image is the primary photo sent to WhatsApp customers. Supported: JPG, PNG, WebP · Max 5 MB each.
          </p>

=======
            First image is the primary photo sent to WhatsApp customers. JPG, PNG, WebP · Max 5 MB each.
          </p>

          {/* ③ Video — Pro plan only */}
          <div className="sec-label" style={{ marginTop: 20 }}>
            <Video size={11} style={{verticalAlign: 'middle', marginRight: 4}}/> ③ Product Video (optional · max 10s)
            <span className={styles.proBadge}>{PLAN_LABELS[planName] || 'Trial'}</span>
          </div>
          <VideoUpload
            existingUrl={existingVideoUrl}
            pendingFile={videoFile}
            onFileSelect={setVideoFile}
            onRemoveExisting={() => setExistingVideoUrl(null)}
            locked={!videoUnlocked}
            lockedMessage={`Video uploads are unlocked on the Professional plan (and Trial). You're on the ${PLAN_LABELS[planName]} plan.`}
          />

>>>>>>> f2c6b0f (Initial commit)
          {/* Stock toggle */}
          <label className={styles.stockToggle}>
            <input
              type="checkbox"
              checked={form.in_stock === true}
              onChange={e => set('in_stock', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--navy)' }}
            />
            Mark as currently in stock
          </label>
<<<<<<< HEAD

          {/* Re-gen AI (edit only) */}
          {isEdit && (
            <div className={styles.regenRow}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={regenAI}
                  onChange={e => setRegenAI(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--navy)', marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={13} color="#C9A84C" /> Regenerate AI title &amp; description
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 3 }}>
                    By default, existing AI content is kept. Check this to generate fresh AI content using the updated details.
                  </div>
                </div>
              </label>
            </div>
          )}
=======
>>>>>>> f2c6b0f (Initial commit)
        </div>

        <div className={styles.footer}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-gold" onClick={handleSubmit} disabled={saving || !!skuError}>
            {saving ? (
              <><div className="spinner spinner-sm" /> Saving…</>
            ) : (
              isEdit ? 'Update Product' : 'Add Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
