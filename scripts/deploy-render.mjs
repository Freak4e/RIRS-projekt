// Deploy an immutable image built by the build job. Never build on Render.
const { RENDER_API_KEY, RENDER_SERVICE_ID, IMAGE_URL, APP_URL } = process.env
const runtime = Object.fromEntries(['DATABASE_URL', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'].map((key) => [key, process.env[key]]))
for (const [key, value] of Object.entries({ RENDER_API_KEY, RENDER_SERVICE_ID, IMAGE_URL, APP_URL, ...runtime })) {
  if (!value) throw new Error(`Missing production setting: ${key}`)
}
const base = 'https://api.render.com/v1'
async function api(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${RENDER_API_KEY}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Render API returned ${response.status}`)
  return response.json()
}
for (const [key, value] of Object.entries(runtime)) {
  await api(`/services/${RENDER_SERVICE_ID}/env-vars/${key}`, { method: 'PUT', body: JSON.stringify({ value }) })
}
const deployment = await api(`/services/${RENDER_SERVICE_ID}/deploys`, {
  method: 'POST', body: JSON.stringify({ imageUrl: IMAGE_URL }),
})
if (!deployment.id) throw new Error('Render did not return a deployment ID')
console.log(`Waiting for Render deployment ${deployment.id}`)
let live = false
for (let attempt = 0; attempt < 80; attempt++) {
  const result = await api(`/services/${RENDER_SERVICE_ID}/deploys/${deployment.id}`)
  console.log(`Deployment status: ${result.status}`)
  if (result.status === 'live') { live = true; break }
  if (['build_failed', 'update_failed', 'pre_deploy_failed', 'canceled', 'deactivated'].includes(result.status)) {
    throw new Error(`Deployment failed: ${result.status}`)
  }
  await new Promise((resolve) => setTimeout(resolve, 15_000))
}
if (!live) throw new Error('Deployment timed out')
const url = APP_URL.replace(/\/$/, '')
const health = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(60_000) })
if (!health.ok || (await health.json()).status !== 'ok') throw new Error('Public database health check failed')
const page = await fetch(url, { signal: AbortSignal.timeout(60_000) })
if (!page.ok || !(await page.text()).includes('<div id="root">')) throw new Error('Public frontend check failed')
console.log(`Application is available at ${url}`)
