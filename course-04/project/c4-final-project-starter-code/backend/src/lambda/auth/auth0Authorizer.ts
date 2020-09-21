import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda';
import 'source-map-support/register';

import { verify, decode } from 'jsonwebtoken';
import { createLogger } from '../../utils/logger';
import Axios from 'axios';
import { Jwt } from '../../auth/Jwt';
import { JwtPayload } from '../../auth/JwtPayload';

const logger = createLogger('auth');
const jwksUrl = process.env.AUTH_0_JWKS_URL;

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
  const token = getToken(authHeader);
  const jwt: Jwt = decode(token, { complete: true }) as Jwt;
  const jwtKid = jwt.header.kid;
  let cert: string | Buffer;

  try {
    const jwks = await Axios.get(jwksUrl);
    const signingKey = jwks.data.keys.filter(k => k.kid === jwtKid)[0];

    if (!signingKey) {
      throw new Error(`Unable to find a signing key that matches '${jwtKid}'`);
    }
    const { x5c } = signingKey;

    cert = `-----BEGIN CERTIFICATE-----\n${x5c[0]}\n-----END CERTIFICATE-----`;
  } catch (error) {
    console.log('Error While getting Certificate : ', error);
  }

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

// import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
// import '../../../node_modules/source-map-support/register'

// import { verify,decode } from 'jsonwebtoken'
// import { createLogger } from '../../utils/logger'
// import Axios from 'axios'
// import { JwtPayload } from '../../auth/JwtPayload'
// import { Jwt } from '../../auth/Jwt'


// const logger = createLogger('auth')

// const jwksUrl = process.env.AUTH_0_JWKS_URL


// // let cachedCertificate: string

// export const handler = async (
//   event: CustomAuthorizerEvent
// ): Promise<CustomAuthorizerResult> => {
//   logger.info('Authorizing a user', event.authorizationToken)
//   try {
//     const jwtToken = await verifyToken(event.authorizationToken)
//     logger.info('User was authorized', jwtToken)

//     return {
//       principalId: jwtToken.sub,
//       policyDocument: {
//         Version: '2012-10-17',
//         Statement: [
//           {
//             Action: 'execute-api:Invoke',
//             Effect: 'Allow',
//             Resource: '*'
//           }
//         ]
//       }
//     }
//   } catch (e) {
//     logger.error('User not authorized', { error: e.message })

//     return {
//       principalId: 'user',
//       policyDocument: {
//         Version: '2012-10-17',
//         Statement: [
//           {
//             Action: 'execute-api:Invoke',
//             Effect: 'Deny',
//             Resource: '*'
//           }
//         ]
//       }
//     }
//   }
// }


// async function verifyToken(authHeader: string): Promise<JwtPayload> {
//   const token = getToken(authHeader)
//   const jwt: Jwt = decode(token, { complete: true }) as Jwt
//   // TODO: Implement token verification done
//   // You should implement it similarly to how it was implemented for the exercise for the lesson 5
//   // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
//   // return undefined
//   const { header } = jwt;
//   let key = await getSigningKey(jwksUrl, header.kid)
//   return verify(token, key.publicKey, { algorithms: ['RS256'] }) as JwtPayload
// }
//  function  getToken(authHeader: string): string {
//   if (!authHeader) throw new Error('No authentication header')
//   if (!authHeader.toLowerCase().startsWith('bearer '))
//     throw new Error('Invalid authentication header')
//   const split = authHeader.split(' ')
//   const token = split[1]
//   return token
// }
// const getSigningKey = async (jwkurl, kid) => {
//   let res = await Axios.get(jwkurl, {
//     headers: {
//       'Content-Type': 'application/json',
//       "Access-Control-Allow-Origin": "*",
//       'Access-Control-Allow-Credentials': true,
//     }
//   });
//   let keys  = res.data.keys;
//   // since the keys is an array its possible to have many keys in case of cycling.
//   const signingKeys = keys.filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signing
//       && key.kty === 'RSA' // We are only supporting RSA
//       && key.kid           // The `kid` must be present to be useful for later
//       && key.x5c && key.x5c.length // Has useful public keys (we aren't using n or e)
//     ).map(key => {
//       return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
//     });
//   const signingKey = signingKeys.find(key => key.kid === kid);
//   if(!signingKey){
//     throw new Error('Invalid signing keys')
//     logger.error("No signing keys found")
//   }
//   logger.info("Signing keys created successfully ", signingKey)
//   return signingKey
// };
// function certToPEM(cert) {
//   cert = cert.match(/.{1,64}/g).join('\n');
//   cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
//   return cert;
// }

// ######################
// const jwksUrl = process.env.AUTH_0_JWKS_URL

// import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
// import '../../businessLogic/node_modules/source-map-support/register'

// import { verify } from 'jsonwebtoken'
// import { createLogger } from '../../utils/logger'
// import Axios from 'axios'
// import { JwtPayload } from '../../auth/JwtPayload'



// // import { Jwt } from '../auth/Jwt'
// // import { JwtPayload } from '../../auth/JwtPayload'
// // import { verify, decode } from 'jsonwebtoken'
// // import * as util from 'util';


// const logger = createLogger('auth')

// const jwksUrl = process.env.AUTH_0_JWKS_URL
// // 

// let cachedCertificate: string

// export const handler = async (
//   event: CustomAuthorizerEvent
// ): Promise<CustomAuthorizerResult> => {
//   logger.info('Authorizing a user', event.authorizationToken)
//   try {
//     const jwtToken = await verifyToken(event.authorizationToken)
//     logger.info('User was authorized', jwtToken)

//     return {
//       principalId: jwtToken.sub,
//       policyDocument: {
//         Version: '2012-10-17',
//         Statement: [
//           {
//             Action: 'execute-api:Invoke',
//             Effect: 'Allow',
//             Resource: '*'
//           }
//         ]
//       }
//     }
//   } catch (e) {
//     logger.error('User not authorized', { error: e.message })

//     return {
//       principalId: 'user',
//       policyDocument: {
//         Version: '2012-10-17',
//         Statement: [
//           {
//             Action: 'execute-api:Invoke',
//             Effect: 'Deny',
//             Resource: '*'
//           }
//         ]
//       }
//     }
//   }
// }

// async function verifyToken(authHeader: string): Promise<JwtPayload> {
//   const token = getToken(authHeader)

//   const cert = await getCertificate()

//   logger.info(`Verifying token ${token}`)

//   return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
// }
// // async function verifyToken(authHeader: string): Promise<JwtPayload> {
// //   const token = getToken(authHeader)
// //   const response = await Axios.get(jwksUrl);
// //   const jwks = response.data;
// //   const keys:any[] = jwks.keys;
// //   logger.info("jwks - "+util.inspect(jwks, false, null, true));
// //   const jwt: Jwt = decode(token, { complete: true }) as Jwt
// //   const signingKey = keys.find(key => key.kid === jwt.header.kid);
// //   let certValue:string = signingKey.x5c[0];
    
// //   certValue = certValue.match(/{1,64}/g).join('\n');
// //   const finalCertKey:string = `-----BEGIN CERTIFICATE-----\n${certValue}\n-----END CERTIFICATE-----\n`;
// //   logger.info("finalCertKey - "+util.inspect(finalCertKey, false, null, true));
// //   let jwtPayload:JwtPayload = verify(token, finalCertKey, { algorithms: ['RS256'] }) as JwtPayload; 
// //   return jwtPayload;
// //   }
// // function getToken(authHeader: string): string {
// //   if (!authHeader) throw new Error('No authentication header')

// //   if (!authHeader.toLowerCase().startsWith('bearer '))
// //     throw new Error('Invalid authentication header')

// //   const split = authHeader.split(' ')
// //   const token = split[1]

// //   return token
// // }

// async function getCertificate(): Promise<string> {
//   if (cachedCertificate) return cachedCertificate

//   logger.info(`Fetching certificate from ${jwksUrl}`)

//   const response = await Axios.get(jwksUrl)
//   const keys = response.data.keys

//   if (!keys || !keys.length)
//     throw new Error('No JWKS keys found')

//   const signingKeys = keys.filter(
//     key => key.use === 'sig'
//            && key.kty === 'RSA'
//            && key.alg === 'RS256'
//            && key.n
//            && key.e
//            && key.kid
//            && (key.x5c && key.x5c.length)
//   )

//   if (!signingKeys.length)
//     throw new Error('No JWKS signing keys found')
  
//   // XXX: Only handles single signing key
//   const key = signingKeys[0]
//   const pub = key.x5c[0]  // public key

//   // Certificate found!
//   cachedCertificate = certToPEM(pub)

//   logger.info('Valid certificate found', cachedCertificate)

//   return cachedCertificate
// }

// function certToPEM(cert: string): string {
//   cert = cert.match(/.{1,64}/g).join('\n')
//   cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
//   return cert
// }