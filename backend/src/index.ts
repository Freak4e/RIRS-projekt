import 'dotenv/config'
import { app } from './app'
import { getJwtSecret } from './auth/jwt'

getJwtSecret()
const port = Number(process.env.PORT ?? 3000)
app.listen(port, '0.0.0.0', () => {
  console.log(`Strežnik posluša na http://localhost:${port}`)
})
