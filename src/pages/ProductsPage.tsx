import { useCallback, useEffect, useState } from 'react';
import { IconEdit, IconLayoutGrid, IconList, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { Alert } from '../components/Alert';
import { EntityFormModal } from '../components/EntityFormModal';
import { PageHeader } from '../components/PageHeader';
import { ProductCard } from '../components/ProductCard';
import { ProductVariantsEditor } from '../components/ProductVariantsEditor';
import { StatusBadge } from '../components/StatusBadge';
import { PRODUCT_FORM_FIELDS } from '../config/adminResources';
import { useApi } from '../context/ApiContext';
import { rowToForm, useLookupData } from '../hooks/useLookupData';
import { buildFormBody, buildMultipartBody, emptyFormFromFields } from '../utils/formBody';
import {
  assetUrl,
  formatMoney,
  rowText,
  unwrapList,
  type ApiRow,
} from '../utils/apiData';

type ViewMode = 'grid' | 'table';

export function ProductsPage() {
  const { request, config } = useApi();
  const { refresh: refreshLookups, parentById, categories } = useLookupData();
  const [products, setProducts] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const [editing, setEditing] = useState<ApiRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [variants, setVariants] = useState<ApiRow[]>([]);

  const categoryLabel = (id: unknown) => {
    const cat = categories.find((c) => c.id === Number(id));
    return cat?.name ?? (id ? String(id) : '—');
  };

  const parentCategoryLabel = (id: unknown) => {
    const parent = parentById(Number(id));
    return parent?.name ?? (id ? String(id) : '—');
  };

  const isFeatured = form.featured === 'true';

  const createDraftVariants = async (productId: number | string) => {
    for (const v of variants) {
      const body: Record<string, unknown> = {
        product_id: Number(productId),
        name: v.name,
        status: v.status ?? 'active',
        stock: v.stock !== undefined ? Number(v.stock) : 0,
      };
      if (v.sku) body.sku = v.sku;
      if (v.price !== undefined && v.price !== null && v.price !== '') body.price = Number(v.price);
      if (v.sale_price !== undefined && v.sale_price !== null && v.sale_price !== '') {
        body.sale_price = Number(v.sale_price);
      }
      const res = await request({ method: 'POST', path: '/product-variants', body });
      if (!res.ok) {
        setError((res.data as { message?: string })?.message ?? 'Product saved but a variant failed');
        return false;
      }
    }
    return true;
  };

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
    const next = emptyFormFromFields(PRODUCT_FORM_FIELDS);
    if (config.websiteId) next.website_id = config.websiteId;
    setForm(next);
    setImageFile(null);
    setVariants([]);
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
    setImageFile(null);
    setVariants([]);
    setShowForm(true);
    refreshLookups();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({});
    setImageFile(null);
    setVariants([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const body = buildFormBody(form, PRODUCT_FORM_FIELDS, isEdit, { skipImage: true });

    if (!body.website_id) {
      setSaving(false);
      setError('Please select a website');
      return;
    }

    const path = isEdit ? `/products/${editing?.id}` : '/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await request(
      imageFile
        ? { method, path, formData: buildMultipartBody(body, imageFile) }
        : { method, path, body }
    );
    setSaving(false);
    if (!res.ok) {
      setError((res.data as { message?: string })?.message ?? 'Could not save product');
      return;
    }

    if (!isEdit && isFeatured && variants.length > 0) {
      const created = (res.data as { data?: ApiRow })?.data;
      const newId = created?.id;
      if (newId !== undefined && newId !== null && newId !== '') {
        const ok = await createDraftVariants(newId as number | string);
        if (!ok) {
          load();
          return;
        }
      }
    }

    closeForm();
    load();
  };

  const handleDelete = async (row: ApiRow) => {
    const id = row.id;
    if (!id) return;

    const name = rowText(row, 'name');
    if (!confirm(`Delete "${name}"? This will permanently remove it from the database.`)) return;

    setDeletingId(id as number | string);
    setError('');
    setSuccess('');
    const res = await request({ method: 'DELETE', path: `/products/${id}` });
    setDeletingId(null);

    if (!res.ok) {
      const msg = (res.data as { message?: string })?.message ?? 'Could not delete product';
      setError(
        res.status === 401
          ? `${msg} — log in again and retry.`
          : msg
      );
      return;
    }

    setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
    setSuccess(`"${name}" was deleted from the database.`);
    if (String(selected?.id) === String(id)) setSelected(null);
    if (String(editing?.id) === String(id)) closeForm();
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
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
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
                            <div className="btn-list flex-nowrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openEdit(p)}
                              >
                                <IconEdit size={16} /> Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={deletingId === p.id}
                                onClick={() => handleDelete(p)}
                              >
                                <IconTrash size={16} /> Delete
                              </button>
                            </div>
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
                        <dd className="col-7">{categoryLabel(selected.category_id)}</dd>
                        <dt className="col-5">Parent category</dt>
                        <dd className="col-7">{parentCategoryLabel(selected.parent_category_id)}</dd>
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
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    disabled={deletingId === selected.id}
                    onClick={() => handleDelete(selected)}
                  >
                    <IconTrash size={18} className="me-1" />
                    {deletingId === selected.id ? 'Deleting…' : 'Delete'}
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
          imageFile={imageFile}
          setImageFile={setImageFile}
        >
          <ProductVariantsEditor
            enabled={isFeatured}
            productId={editing?.id as number | string | undefined}
            variants={variants}
            onChange={setVariants}
            onError={setError}
          />
        </EntityFormModal>
      )}
    </>
  );
}
