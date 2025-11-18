# Bulk Product Tagging Setup

This guide explains how to set up and run the bulk product tagging script.

## Prerequisites

1. Shopify Admin API access token (starts with `shpat_`)
2. Your Shopify store domain (e.g., `your-store.myshopify.com`)

## Setup

1. **Add environment variables to `.env.local`**:

   Open `C:\ae\Adams Eden\adams-eden-website\.env.local` and add:

   ```env
   SHOPIFY_ADMIN_API_KEY=your-admin-api-key-here
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   ```

   Replace `your-store.myshopify.com` with your actual store domain.

2. **Verify your store domain**:
   
   If you already have `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` set in `.env.local`, the script will use that automatically.

## Usage

### Dry Run (Preview Changes)

First, always run in dry-run mode to preview what will be changed:

```bash
cd "C:\ae\Adams Eden\adams-eden-website"
node scripts/bulkTagProducts.mjs --dry-run
```

This will:
- Fetch all products
- Analyze each product
- Show you what tags would be added
- **Not make any changes**

### Limit Products (For Testing)

Test with a small number of products first:

```bash
node scripts/bulkTagProducts.mjs --dry-run --limit=10
```

### Apply Changes

Once you're satisfied with the preview, run without `--dry-run`:

```bash
node scripts/bulkTagProducts.mjs
```

**⚠️ Warning**: This will update tags on all products. Make sure you've reviewed the dry-run output first!

## How It Works

1. **Fetches all products** from Shopify (or limited number if `--limit` is used)
2. **Analyzes each product** based on:
   - Product title
   - Product description
   - Product type
   - Existing tags
3. **Suggests tags** based on category keywords:
   - Flowers → adds `flower`, `seed`, `annual` or `perennial`
   - Vegetables → adds `vegetable`, `seed`, and specific type (e.g., `tomato`)
   - Herbs → adds `herb`, `seed`
   - Houseplants → adds `houseplant`
   - Succulents → adds `succulent`
   - Supplies → adds `supply`
4. **Handles edge cases**:
   - Echinacea (herb vs flower)
   - Lavender (herb vs flower)
   - Sedum (flower vs succulent)
   - Begonia (annual vs houseplant)
5. **Updates products** with new tags (only adds missing tags, doesn't remove existing ones)

## Output

The script will show:
- Number of products fetched
- Number of products that need tags
- Total tags to be added
- Progress as it updates each product
- Final summary

## Troubleshooting

**Error: Missing environment variables**
- Make sure `SHOPIFY_ADMIN_API_KEY` and `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` are in `.env.local`
- Restart your terminal after adding them

**Error: Shopify API request failed**
- Check that your Admin API token is valid
- Verify your store domain is correct
- Make sure the token has permissions to read and update products

**Rate Limiting**
- The script includes a 500ms delay between requests to avoid rate limits
- If you hit rate limits, wait a few minutes and try again

## Notes

- The script **adds** tags but doesn't remove existing tags
- Tags are case-sensitive
- The script respects existing tags and only adds missing ones
- All products are analyzed, but only products needing new tags are updated

