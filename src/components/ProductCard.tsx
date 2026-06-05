import { IconPhoto } from '@tabler/icons-react';
import { assetUrl, formatMoney, type ApiRow } from '../utils/apiData';
import { StatusBadge } from './StatusBadge';

type Props = {
  product: ApiRow;
  onClick?: () => void;
};

export function ProductCard({ product, onClick }: Props) {
  const name = String(product.name ?? 'Untitled');
  const image = assetUrl(product.image);
  const price = formatMoney(product.price, product.sale_price);
  const sku = product.sku ? String(product.sku) : '';

  return (
    <div className="col-sm-6 col-lg-4 col-xl-3">
      <div
        className="card card-sm h-100 product-card"
        role={onClick ? 'button' : undefined}
        onClick={onClick}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {image ? (
          <span
            className="card-img-top img-responsive img-responsive-21x9"
            style={{ backgroundImage: `url(${image})` }}
          />
        ) : (
          <div className="card-img-top product-card-placeholder d-flex align-items-center justify-content-center">
            <IconPhoto size={40} stroke={1.25} className="text-secondary" />
          </div>
        )}
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
            <h3 className="card-title mb-0 text-truncate" title={name}>
              {name}
            </h3>
            <StatusBadge status={product.status} />
          </div>
          {product.short_description ? (
            <p className="text-secondary small text-truncate mb-2">
              {String(product.short_description)}
            </p>
          ) : null}
          <div className="d-flex align-items-center justify-content-between">
            <span className="h3 mb-0">{price}</span>
            {sku && <span className="text-secondary small">{sku}</span>}
          </div>
          {product.stock !== undefined && (
            <div className="text-secondary small mt-1">Stock: {String(product.stock)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
