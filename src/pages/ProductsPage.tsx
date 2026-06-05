import { useCallback, useEffect, useState } from 'react';
import { IconEdit, IconLayoutGrid, IconList, IconPlus, IconSearch } from '@tabler/icons-react';
import { Alert } from '../components/Alert';
import { EntityFormModal } from '../components/EntityFormModal';
import { PageHeader } from '../components/PageHeader';
import { ProductCard } from '../components/ProductCard';
import { StatusBadge } from '../components/StatusBadge';
import { PRODUCT_FORM_FIELDS } from '../config/adminResources';
import { useApi } from '../context/ApiContext';
import { rowToForm, useLookupData } from '../hooks/useLookupData';
import { buildFormBody, emptyFormFromFields } from '../utils/formBody';
import {
  assetUrl,
  formatMoney,
  rowText,
  unwrapList,
  type ApiRow,
} from '../utils/apiData';

type ViewMode = 'grid' | 'table';

export function ProductsPage() {
  const { request } = useApi();
  const { refresh: refreshLookups } = useLookupData();
  const [products, setProducts] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const [editing, setEditing] = useState<ApiRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(editing);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await request({
      method: 'GET',
      path: '/products',
      query: {
        page: 1,
        limit: 100,
        search: search || undefined,
        status: status || undefined,
      },
    });
    setLoading(false);
    if (!res.ok) {
      setError((res.data as { message?: string })?.message ?? 'Failed to load products');
      setProducts([]);
      return;
    }
    const data = (res.data as { data?: unknown })?.data ?? res.data;
    setProducts(unwrapList(data));
  }, [request, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyFormFromFields(PRODUCT_FORM_FIELDS));
    setShowForm(true);
    refreshLookups();
  };

  const openEdit = (row: ApiRow) => {
    setEditing(row);
    setSelected(null);
    const names = PRODUCT_FORM_FIELDS.map((f) => f.name);
    const next = rowToForm(row, names);
    if (row.featured !== undefined) {
      next.featured = row.featured ? 'true' : 'false';
    }
    setForm(next);
    setShowForm(true);
    refreshLookups();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({});
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const body = buildFormBody(form, PRODUCT_FORM_FIELDS, isEdit);

    if (!body.website_id) {
      setSaving(false);
      setError('Please select a website');
      return;
    }

    const path = isEdit ? `/products/${editing?.id}` : '/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await request({ method, path, body });
    setSaving(false);
    if (!res.ok) {
      setError((res.data as { message?: string })?.message ?? 'Could not save product');
      return;
    }
    closeForm();
    load();
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Browse and manage your product catalog"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <IconPlus size={18} className="me-1" />
            Add product
          </button>
        }
      />

      <div className="page-body">
        <div className="container-xl">
          <Alert type="danger" message={error} onClose={() => setError('')} />

          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-2 align-items-center">
                <div className="col-md-5">
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <IconSearch size={18} />
                    </span>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search products…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${view === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setView('grid')}
                    >
                      <IconLayoutGrid size={18} /> Cards
                    </button>
                    <button
                      type="button"
                      className={`btn ${view === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setView('table')}
                    >
                      <IconList size={18} /> Table
                    </button>
                  </div>
                  <span className="badge bg-blue-lt ms-2">{products.length} items</span>
                </div>
              </div>
            </div>
          </div>

          {loading && <div className="text-center text-secondary py-5">Loading products…</div>}

          {!loading && products.length === 0 && (
            <div className="empty">
              <div className="empty-title">No products yet</div>
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                Add product
              </button>
            </div>
          )}

          {!loading && products.length > 0 && view === 'grid' && (
            <div className="row row-cards">
              {products.map((p) => (
                <ProductCard key={String(p.id)} product={p} onClick={() => setSelected(p)} />
              ))}
            </div>
          )}

          {!loading && products.length > 0 && view === 'table' && (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-vcenter card-table table-hover">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th className="w-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const img = assetUrl(p.image);
                      return (
                        <tr key={String(p.id)}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {img ? (
                                <span
                                  className="avatar avatar-md"
                                  style={{ backgroundImage: `url(${img})` }}
                                />
                              ) : (
                                <span className="avatar avatar-md bg-secondary-lt">?</span>
                              )}
                              <div>
                                <div className="fw-medium">{rowText(p, 'name')}</div>
                                <div className="text-secondary small">{rowText(p, 'slug')}</div>
                              </div>
                            </div>
                          </td>
                          <td>{rowText(p, 'sku')}</td>
                          <td>{formatMoney(p.price, p.sale_price)}</td>
                          <td>{rowText(p, 'stock')}</td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEdit(p)}
                            >
                              <IconEdit size={16} /> Edit
                            </button>
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
      </div>

      {selected && !showForm && (
        <>
          <div className="modal modal-blur show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{rowText(selected, 'name')}</h5>
                  <button type="button" className="btn-close" onClick={() => setSelected(null)} />
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-5 mb-3">
                      {assetUrl(selected.image) ? (
                        <img src={assetUrl(selected.image)} alt="" className="img-fluid rounded" />
                      ) : (
                        <div className="bg-secondary-lt rounded p-5 text-center text-secondary">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="col-md-7">
                      <dl className="row mb-0">
                        <dt className="col-5">Price</dt>
                        <dd className="col-7">{formatMoney(selected.price, selected.sale_price)}</dd>
                        <dt className="col-5">SKU</dt>
                        <dd className="col-7">{rowText(selected, 'sku')}</dd>
                        <dt className="col-5">Category</dt>
                        <dd className="col-7">{rowText(selected, 'category_id')}</dd>
                        <dt className="col-5">Parent category</dt>
                        <dd className="col-7">{rowText(selected, 'parent_category_id')}</dd>
                        <dt className="col-5">Status</dt>
                        <dd className="col-7">
                          <StatusBadge status={selected.status} />
                        </dd>
                        <dt className="col-5">Description</dt>
                        <dd className="col-7">
                          {String(selected.description ?? selected.short_description ?? '—')}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>
                    Close
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => openEdit(selected)}>
                    <IconEdit size={18} className="me-1" />
                    Edit product
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setSelected(null)} />
        </>
      )}

      {showForm && (
        <EntityFormModal
          title={isEdit ? 'Edit product' : 'New product'}
          fields={PRODUCT_FORM_FIELDS}
          form={form}
          setForm={setForm}
          isEdit={isEdit}
          saving={saving}
          onClose={closeForm}
          onSave={handleSave}
          saveDisabled={!form.name || !form.sku || !form.website_id}
        />
      )}
    </>
  );
}
