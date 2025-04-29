export default async function handler(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }

    const shop = process.env.SHOPIFY_SHOP_DOMAIN;
    const token = process.env.SHOPIFY_ADMIN_TOKEN;

    // Appel de l’API Shopify pour chercher un client via son email
    const url = `https://${shop}/admin/api/2025-04/customers/search.json?query=email:${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Error fetching customer', details: text });
    }

    const data = await response.json();
    const customer = data.customers && data.customers[0];

    if (!customer) {
      return res.status(200).json({ exists: false, shopifyOrderCount: 0 });
    }

    return res.status(200).json({
      exists: true,
      email: customer.email,
      shopifyOrderCount: customer.orders_count
    });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
