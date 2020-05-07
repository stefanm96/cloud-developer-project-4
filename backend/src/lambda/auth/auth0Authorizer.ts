import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const cert = `-----BEGIN CERTIFICATE-----
MIIDBzCCAe+gAwIBAgIJN3vGqzb7eZaAMA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV
BAMTFnN0ZWZhbm1pLWRldi5hdXRoMC5jb20wHhcNMjAwNTA2MTEzODEwWhcNMzQw
MTEzMTEzODEwWjAhMR8wHQYDVQQDExZzdGVmYW5taS1kZXYuYXV0aDAuY29tMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzHd0feu2vnk2McFYVM4+1zaF
kXY/MQxIDjYpjRWwm6AZyaye2AkfSvHpp31Gv8hadhsTmMTMnIXqoJAUe5BmaskP
5OePs4N91gpdbk49jsHDuxGbc7A8R8WfAO6kSH3JCatIrS30/m4pTSFl7yxW7ww/
b50C6Ye8360TPJ7KefRvMpX1XYoqwteLHy2Df2omMZsVvbr/I4TPHE5kK10z+bhQ
xX9QGU68nB+bMpSEre3rA/t0hrn9UwKHgASaIyeYeeoM7i4Emlbv+kX5iC4vgu2t
hzZuDAfo8hofggSTFQPAtyEH6TQo8NZ1vLp3XaoIbmjpYVmhvttXAw9nlDehXwID
AQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBQkXWAVE6kb8RI+Nvos
G2/PxU/L3DAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBABxFkeFa
ThmynRRDhESmVyToB49ddZ1rjlCM7j9vf5WCD25oseN++5f/47ze5lEVp78R3or+
tJTJ66TAQl5CVsW51YpLyPDbOc3Jl1EwBi3cr/4+WYHbES/QZCXN7AiztNMZSxrl
lHsBgV9kP5M4/AZr6mMr0Z/Tw1ua3RLRrAdWT4XszNddYR/mrGC+K03Z36T7E4Y7
h4zIPYPGC0pQ/GoHahgyiTUWb6SVkS+hdwMJ42YUkT5So5qH8nDeUbf2fqGiOgkK
ce8KT37+bIUFdJH5en0GMI63AWJtwQANqLEgCTjT1GDGmTqcWYcH64c8VNd3LUJx
TJ22WG2LoJg94OU=
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  return new Promise(() => verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload)
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
