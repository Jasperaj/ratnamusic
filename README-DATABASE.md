# Database Structure and Data Flow

Ratna Music uses Supabase as its shared application database. The frontend is hosted from the GitHub repository and communicates with Supabase through the Supabase JavaScript client.

## Main tables

### `public.products`

Stores the catalog shown on the website.

Important columns:

- `id`: UUID primary key
- `name`: Product name
- `category`: Product category
- `price`: Current price
- `original_price`: Previous/original price
- `description`: Product description
- `image_url`: Product image URL
- `daraz_url`: Optional Daraz product URL
- `in_stock`: Availability flag
- `stock`: Numeric stock quantity
- `featured`: Whether the product is featured
- `badge`, `tag`, `origin`, `body`, `color`, `ne`: Additional catalog information
- `created_at`, `updated_at`: Timestamps

Products are publicly readable. Product inserts, updates, and deletes require an authenticated administrator.

### `public.orders`

Stores customer orders.

Important columns:

- `id`: UUID primary key
- `user_id`: Optional reference to `public.profiles.id`
- `customer_name`, `customer_email`, `customer_phone`
- `address`
- `items`: JSON order-line snapshot
- `subtotal`, `delivery_fee`, `total`
- `status`: `pending`, `confirmed`, `shipped`, `delivered`, or `cancelled`
- `payment_method`
- `notes`
- `created_at`, `updated_at`

Guests can create checkout orders. Order viewing and administration are restricted by row-level security.

### `public.profiles`

Stores customer profile information.

Important columns:

- `id`: UUID primary key and reference to `auth.users.id`
- `email`
- `name`
- `phone`
- `secondary_phone`
- `address`
- `landmark`
- `map_link`
- `is_admin`

Customers can access their own profile. Administrator status is stored in the database and is used for administrator policies.

### `public.social_posts`

Stores active social-media links shown on the website.

Important columns:

- `id`: UUID primary key
- `platform`: TikTok, Instagram, or Facebook
- `post_url`
- `caption`
- `active`
- `sort_order`
- `created_at`, `updated_at`

Public visitors can read active social posts. Only administrators can manage them.

## Relationships

```text
auth.users
    |
    | 1-to-1
    v
public.profiles
    |
    | 1-to-many through orders.user_id
    v
public.orders

public.products
    |
    | referenced by product IDs inside orders.items JSON
    v
order-line snapshots
```

The `orders.items` column stores a snapshot of product IDs, names, prices, and quantities at checkout. It is JSON data rather than a traditional foreign-key table, so old orders retain the information used at the time of purchase.

## Website data flow

### Catalog

```text
Supabase products
        |
        v
sbFetchProducts()
        |
        v
dbToProduct()
        |
        v
Store state
        |
        v
Home, category, product, and checkout pages
```

The frontend converts database names such as `image_url` and `daraz_url` into the JavaScript fields `image` and `darazUrl`.

### Orders

```text
Customer checkout
        |
        v
sbInsertOrder()
        |
        v
public.orders
        |
        v
Admin order management
```

After an order is saved, the website attempts to reduce the relevant product stock.

### Authentication

Supabase Auth manages sign-in sessions. The frontend uses the session to:

- Identify signed-in customers
- Load and save customer profiles
- Identify the administrator account
- Apply authenticated database operations

## Security and row-level security

All main public tables have Row Level Security enabled.

Current access model:

- Products: public read; administrator write
- Orders: guest insert; customers/admins read according to policy
- Profiles: users can manage their own profile
- Social posts: public read; administrator write

The public Supabase key is intended for frontend use. The Supabase service-role key must never be placed in the repository or browser code.

## Important operational notes

- The website depends on Supabase being reachable.
- Product image URLs are external URLs and can stop working if the source removes them.
- Catalog loading is independent from guest order visibility. A guest order permission error must not prevent public products from loading.
- Database schema changes should be documented and tested before deployment.
