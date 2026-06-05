import { useCallback, useEffect, useState } from 'react';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useApi } from '../context/ApiContext';
import { formatMoney, rowText, unwrapList, type ApiRow } from '../utils/apiData';
import { StatusBadge } from './StatusBadge';

type VariantForm = {
  name: string;
  sku: string;
  price: string;
  sale_price: string;
  stock: string;
  status: string;
};

const emptyVariantForm = (): VariantForm => ({
  name: '',
  sku: '',
  price: '',
  sale_price: '',
  stock: '0',
  status: 'active',
});

type Props = {
  enabled: boolean;
  productId?: number | string | null;
  variants: ApiRow[];
  onChange: (variants: ApiRow[]) => void;
  onError?: (message: string) => void;
};

export function ProductVariantsEditor({
  enabled,
  productId,
  variants,
  onChange,
  onError,
}: Props) {
  const { request } = useApi();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApiRow | null>(null);
  const [form, setForm] = useState<VariantForm>(emptyVariantForm);

  const isPersisted = Boolean(productId);

  const load = useCallback(async () => {
    if (!enabled || !productId) return;
    setLoading(true);
    const res = await request({
      method: 'GET',
      path: '/product-variants',
      query: { product_id: productId },
    });
    setLoading(false);
    if (!res.ok) {
      onError?.((res.data as { message?: string })?.message ?? 'Failed to load variants');
      return;
    }
    const data = (res.data as { data?: unknown })?.data ?? res.data;
    onChange(unwrapList(data));
  }, [enabled, productId, request, onChange, onError]);

  useEffect(() => {
    if (isPersisted) load();
  }, [isPersisted, load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyVariantForm());
    setShowForm(true);
  };

  const openEdit = (row: ApiRow) => {
    setEditing(row);
    setForm({
      name: String(row.name ?? ''),
      sku: String(row.sku ?? ''),
      price: row.price !== null && row.price !== undefined ? String(row.price) : '',
      sale_price:
        row.sale_price !== null && row.sale_price !== undefined ? String(row.sale_price) : '',
      stock: row.stock !== null && row.stock !== undefined ? String(row.stock) : '0',
      status: String(row.status ?? 'active'),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyVariantForm());
  };

  const buildBody = () => {
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      status: form.status,
      stock: Number(form.stock || 0),
    };
    if (form.sku.trim()) body.sku = form.sku.trim();
    if (form.price.trim()) body.price = Number(form.price);
    if (form.sale_price.trim()) body.sale_price = Number(form.sale_price);
    if (isPersisted) body.product_id = Number(productId);
    return body;
  };

  const handleSave = async () => {
    if (form.name.trim().length < 2) {
      onError?.('Variant name must be at least 2 characters');
      return;
    }

    setSaving(true);
    const body = buildBody();

    if (isPersisted) {
      const path = editing ? `/product-variants/${editing.id}` : '/product-variants';
      const method = editing ? 'PUT' : 'POST';
      const res = await request({ method, path, body });
      setSaving(false);
      if (!res.ok) {
        onError?.((res.data as { message?: string })?.message ?? 'Could not save variant');
        return;
      }
      closeForm();
      load();
      return;
    }

    const draft: ApiRow = {
      ...body,
      id: editing?.id ?? `draft-${Date.now()}`,
      sku: form.sku.trim() || undefined,
    };
    if (editing) {
      onChange(variants.map((v) => (String(v.id) === String(editing.id) ? { ...v, ...draft } : v)));
    } else {
      onChange([...variants, draft]);
    }
    setSaving(false);
    closeForm();
  };

  const handleDelete = async (row: ApiRow) => {
    const name = rowText(row, 'name');
    if (!confirm(`Delete variant "${name}"?`)) return;

    if (isPersisted) {
      setDeletingId(row.id != null ? (row.id as number | string) : null);
      const res = await request({ method: 'DELETE', path: `/product-variants/${row.id}` });
      setDeletingId(null);
      if (!res.ok) {
        onError?.((res.data as { message?: string })?.message ?? 'Could not delete variant');
        return;
      }
      load();
      return;
    }

    onChange(variants.filter((v) => String(v.id) !== String(row.id)));
  };

  if (!enabled) return null;

  return (
    <div className="border rounded p-3 mb-3 bg-light">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-0">Product variants</h4>
          <small className="text-secondary">
            Sizes or options for this featured product
            {!isPersisted && ' — saved after you create the product'}
          </small>
        </div>
        <button type="button" className="btn btn-sm btn-primary" onClick={openCreate}>
          <IconPlus size={16} className="me-1" />
          Add variant
        </button>
      </div>

      {loading && <div className="text-secondary small py-2">Loading variants…</div>}

      {!loading && variants.length === 0 && !showForm && (
        <div className="text-secondary small py-2">No variants yet. Add one above.</div>
      )}

      {!loading && variants.length > 0 && (
        <div className="table-responsive mb-3">
          <table className="table table-sm table-vcenter mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="w-1" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={String(v.id)}>
                  <td>{rowText(v, 'name')}</td>
                  <td>{rowText(v, 'sku')}</td>
                  <td>{formatMoney(v.price, v.sale_price)}</td>
                  <td>{rowText(v, 'stock')}</td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td>
                    <div className="btn-list flex-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEdit(v)}
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={deletingId === v.id}
                        onClick={() => handleDelete(v)}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="card card-sm">
          <div className="card-body">
            <h5 className="card-title">{editing ? 'Edit variant' : 'New variant'}</h5>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label">Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Large, Medium"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">SKU</label>
                <input
                  className="form-control"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Sale price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.sale_price}
                  onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Stock</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-3 btn-list">
              <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : editing ? 'Update variant' : 'Add variant'}
              </button>
              <button type="button" className="btn btn-link btn-sm" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
