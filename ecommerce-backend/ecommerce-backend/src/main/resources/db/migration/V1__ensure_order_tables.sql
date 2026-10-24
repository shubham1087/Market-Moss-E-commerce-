-- Idempotent schema check for the legacy checkout flow.
-- The app already provisions these tables via Hibernate, but this migration keeps the
-- database compatible if the order tables are missing on a fresh PostgreSQL instance.

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    status VARCHAR(255) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    total_amount NUMERIC(19,2) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    price NUMERIC(19,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(19,2) NOT NULL,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    product_id BIGINT NOT NULL REFERENCES products(id)
);
