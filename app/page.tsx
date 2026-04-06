// This backend is API-only. The frontend is served separately.
// See dropship-scout.jsx for the React frontend component.

export default function Home() {
  return (
    <main style={{ fontFamily: 'monospace', padding: '2rem', background: '#080814', color: '#fff', minHeight: '100vh' }}>
      <h1>Dropship Scout API</h1>
      <p style={{ color: '#aaa' }}>Backend is running. Available endpoints:</p>
      <ul style={{ color: '#7B2FBE', lineHeight: 2 }}>
        <li>POST /api/products/search</li>
        <li>GET|POST|DELETE /api/products/saved</li>
        <li>GET /api/products/export</li>
        <li>POST /api/shopify/push</li>
        <li>GET|POST|DELETE /api/shopify/credentials</li>
        <li>POST /api/shopify/validate</li>
        <li>GET /api/shopify/history</li>
        <li>GET /api/auth/session</li>
        <li>GET /api/analytics</li>
        <li>GET /api/cron/track</li>
      </ul>
    </main>
  )
}
