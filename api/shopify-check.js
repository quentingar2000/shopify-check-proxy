export default async function handler(req, res) {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId in query parameters' });
    }

    const shop = process.env.SHOPIFY_SHOP_DOMAIN; // e.g. ma-boutique.myshopify.com
    const token = process.env.SHOPIFY_ADMIN_TOKEN; // Your Shopify Admin API token

    // 1. Récupérer la commande depuis Shopify pour obtenir le customer_id
    const orderRes = await fetch(`https://${shop}/admin/api/2025-04/orders/${orderId}.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!orderRes.ok) {
      const text = await orderRes.text();
      return res.status(orderRes.status).json({ error: 'Error fetching order', details: text });
    }

    const orderData = await orderRes.json();
    const customerId = orderData.order?.customer?.id;

    if (!customerId) {
      return res.status(404).json({ error: 'Customer not found on order' });
    }

    // 2. Récupérer les infos du client via son ID
    const customerRes = await fetch(`https://${shop}/admin/api/2025-04/customers/${customerId}.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!customerRes.ok) {
      const text = await customerRes.text();
      return res.status(customerRes.status).json({ error: 'Error fetching customer', details: text });
    }

    const customerData = await customerRes.json();
    const ordersCount = customerData.customer?.orders_count;

    // 3. Retourner la donnée utile à ton script Shopify
    return res.status(200).json({ shopifyOrderCount: ordersCount });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
