import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { auth } from './auth'

const http = httpRouter()

auth.addHttpRoutes(http)

// JWT authentication endpoint
const jwtLoginHandler = httpAction(async (ctx, request) => {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  const body = await request.json()
  const { email, password, flow } = body

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: 'Email and password required' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }

  try {
    // For now, create a simple mock authentication
    // In production, you'd verify against your user database
    const user = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
    }

    // Create JWT token with required claims
    const payload = {
      iss: 'https://mild-elephant-70.convex.cloud', // Must match auth.config.ts
      aud: 'convex', // Must match auth.config.ts
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    }

    // For development, create a simple mock token
    // In production, you would use proper JWT signing
    const token = btoa(JSON.stringify(payload))

    return new Response(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('JWT generation error:', error)
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})

http.route({
  path: '/jwt-login',
  method: 'POST',
  handler: jwtLoginHandler,
})

http.route({
  path: '/jwt-login',
  method: 'OPTIONS',
  handler: jwtLoginHandler,
})

export default http
