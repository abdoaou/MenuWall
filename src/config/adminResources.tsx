import type { ApiRow } from '../utils/apiData';
import { formatDate, rowText } from '../utils/apiData';
import { StatusBadge } from '../components/StatusBadge';
import { tenant } from './tenant';

export type FieldDef = {
  name: string;
  label: string;
  type?:
    | 'text'
    | 'number'
    | 'password'
    | 'textarea'
    | 'website'
    | 'website_filter'
    | 'category'
    | 'parent_category'
    | 'parent_category_readonly'
    | 'status'
    | 'status_product'
    | 'checkbox'
    | 'image';
  required?: boolean;
  optionalOnEdit?: boolean;
  showOn?: 'create' | 'edit' | 'both';
};

export type ColumnDef = {
  key: string;
  label: string;
  render?: (row: ApiRow) => React.ReactNode;
};

export type ResourceDef = {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  needsTenant?: boolean;
  columns: ColumnDef[];
  formFields: FieldDef[];
  canEdit?: boolean;
};

export const PRODUCT_FORM_FIELDS: FieldDef[] = [
  { name: 'website_id', label: 'Website', type: 'website', required: true },
  { name: 'parent_category_id', label: 'Parent category', type: 'parent_category' },
  { name: 'category_id', label: 'Category', type: 'category' },
  { name: 'name', label: 'Name', required: true },
  { name: 'slug', label: 'Slug' },
  { name: 'short_description', label: 'Short description', type: 'textarea' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'price', label: 'Price', type: 'number', required: true },
  { name: 'sale_price', label: 'Sale price', type: 'number' },
  { name: 'stock', label: 'Stock', type: 'number', required: true },
  { name: 'sku', label: 'SKU', required: true },
  { name: 'image', label: 'Product image', type: 'image' },
  { name: 'status', label: 'Status', type: 'status_product' },
  { name: 'featured', label: 'Featured product', type: 'checkbox' },
];

export function getProductFormFields(): FieldDef[] {
  if (!tenant.lockWebsite) return PRODUCT_FORM_FIELDS;
  return PRODUCT_FORM_FIELDS.filter((f) => f.type !== 'website');
}

export const ADMIN_RESOURCES: ResourceDef[] = [
  {
    id: 'categories',
    title: 'Categories',
    subtitle: 'Organize products into categories',
    path: '/categories',
    canEdit: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name', render: (r) => rowText(r, 'name') },
      { key: 'slug', label: 'Slug', render: (r) => rowText(r, 'slug') },
      { key: 'parent_id', label: 'Parent cat.', render: (r) => rowText(r, 'parent_id') },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { key: 'updated_at', label: 'Updated', render: (r) => formatDate(r.updated_at) },
    ],
    formFields: [
      { name: 'website_filter', label: 'Website', type: 'website_filter', required: true },
      { name: 'parent_id', label: 'Parent category', type: 'parent_category' },
      { name: 'name', label: 'Name', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'status' },
    ],
  },
  {
    id: 'parent-categories',
    title: 'Parent Categories',
    subtitle: 'Top-level groupings per website',
    path: '/parent-categories',
    canEdit: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name', render: (r) => rowText(r, 'name') },
      { key: 'website_id', label: 'Website', render: (r) => rowText(r, 'website_id') },
      { key: 'slug', label: 'Slug', render: (r) => rowText(r, 'slug') },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { key: 'updated_at', label: 'Updated', render: (r) => formatDate(r.updated_at) },
    ],
    formFields: [
      { name: 'website_id', label: 'Website', type: 'website', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'status' },
    ],
  },
  {
    id: 'websites',
    title: 'Websites',
    subtitle: 'Tenants / stores',
    path: '/websites',
    canEdit: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name', render: (r) => rowText(r, 'name') },
      { key: 'slug', label: 'Slug', render: (r) => rowText(r, 'slug') },
      { key: 'domain', label: 'Domain', render: (r) => rowText(r, 'domain') },
    ],
    formFields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'slug', label: 'Slug' },
    ],
  },
  {
    id: 'menus',
    title: 'Menus',
    subtitle: 'Requires website ID in the header',
    path: '/menus',
    needsTenant: true,
    canEdit: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name', render: (r) => rowText(r, 'name', 'title') },
      { key: 'slug', label: 'Slug', render: (r) => rowText(r, 'slug') },
      { key: 'updated_at', label: 'Updated', render: (r) => formatDate(r.updated_at) },
    ],
    formFields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'sort_order', label: 'Sort order', type: 'number' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Key-value settings per website',
    path: '/settings',
    needsTenant: true,
    canEdit: true,
    columns: [
      { key: 'key', label: 'Key', render: (r) => rowText(r, 'key', 'name') },
      {
        key: 'value',
        label: 'Value',
        render: (r) => (
          <code className="small">{String(r.value ?? r.value_json ?? '—').slice(0, 80)}</code>
        ),
      },
      { key: 'updated_at', label: 'Updated', render: (r) => formatDate(r.updated_at) },
    ],
    formFields: [
      { name: 'key', label: 'Key', required: true, showOn: 'create' },
      { name: 'value', label: 'Value (JSON or text)', type: 'textarea', required: true },
    ],
  },
  {
    id: 'api-keys',
    title: 'API Keys',
    subtitle: 'Keys for public API access',
    path: '/api-keys',
    needsTenant: true,
    canEdit: false,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name', render: (r) => rowText(r, 'name', 'label') },
      { key: 'key', label: 'API key' },
      { key: 'created_at', label: 'Created', render: (r) => formatDate(r.created_at) },
    ],
    formFields: [{ name: 'name', label: 'Name', required: true }],
  },
  {
    id: 'admins',
    title: 'Admins',
    subtitle: 'Admin user accounts',
    path: '/admins',
    canEdit: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'username', label: 'Username', render: (r) => rowText(r, 'username') },
      { key: 'email', label: 'Email', render: (r) => rowText(r, 'email') },
      { key: 'website_id', label: 'Website' },
    ],
    formFields: [
      { name: 'website_id', label: 'Website', type: 'website' },
      { name: 'username', label: 'Username', required: true },
      { name: 'email', label: 'Email', required: true },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        optionalOnEdit: true,
        showOn: 'both',
      },
    ],
  },
];

export function getAdminResources(): ResourceDef[] {
  if (!tenant.resourceIds) return ADMIN_RESOURCES;
  return ADMIN_RESOURCES.filter((r) => tenant.resourceIds!.includes(r.id));
}
