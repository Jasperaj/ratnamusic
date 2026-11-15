# Daraz Product Data Process

## Important note

The Daraz product report used by Ratna Music was collected manually. Product details and image URLs were not downloaded or synchronized through an automated Daraz scraper.

The website does not automatically fetch, refresh, or monitor Daraz product pages.

## Manual process

For each product:

1. Open the product page on Daraz.
2. Manually copy the product information:
   - Product name
   - Category
   - Current price
   - Original price, if available
   - Description
   - Origin or material details
   - Stock information
   - Daraz product URL
   - Product image URL
3. Add or update the product in the Ratna Music Store Keeper product form.
4. Save the product to Supabase.
5. Confirm that the product page displays the details and that the image URL loads correctly.

## How the fields are stored

The website maps the product information as follows:

| Website field | Supabase column |
|---|---|
| Product name | `name` |
| Category | `category` |
| Current price | `price` |
| Original price | `original_price` |
| Description | `description` |
| Product image URL | `image_url` |
| Daraz link | `daraz_url` |
| Stock status | `in_stock` |
| Stock quantity | `stock` |
| Featured product | `featured` |

## Image URL notes

The product image URL is stored as a URL, not as an uploaded image file. Many current image URLs point to Daraz's image CDN.

This means:

- The image depends on the Daraz/CDN URL remaining available.
- Moving, deleting, or changing the Daraz image may break the website image.
- Image URLs should be checked after importing or editing products.
- The website should not be described as having downloaded or archived the Daraz images.

## Daraz link validation

The Store Keeper form requires a Daraz URL to begin with:

`https://`

When a valid `daraz_url` exists, the product detail page displays a **Buy from Daraz** link.

## Maintenance recommendation

When a Daraz product changes:

1. Recheck the Daraz page manually.
2. Update the price, details, stock, image URL, or Daraz URL in Store Keeper.
3. Open the Ratna Music product page.
4. Confirm the product information and image are correct.

For large-scale imports or regular updates, build and test a separate approved importer rather than assuming the current website performs automatic synchronization.
